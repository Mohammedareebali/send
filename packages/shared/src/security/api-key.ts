import { prometheus } from '../prometheus';
import { RedisCache } from '../cache/redis';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

export interface ApiKey {
  key: string;
  name: string;
  description?: string;
  createdAt: Date;
  expiresAt: Date;
  lastUsedAt?: Date;
  isActive: boolean;
  scopes: string[];
}

interface ApiKeyValidation {
  valid: boolean;
  message?: string;
  userId?: string;
  scopes?: string[];
}

export class ApiKeyService {
  private static instance: ApiKeyService;
  private cache: RedisCache;
  private prisma: PrismaClient;

  private constructor() {
    this.cache = RedisCache.getInstance();
    this.prisma = new PrismaClient();
  }

  public static getInstance(): ApiKeyService {
    if (!ApiKeyService.instance) {
      ApiKeyService.instance = new ApiKeyService();
    }
    return ApiKeyService.instance;
  }

  public async generateApiKey(name: string, scopes: string[], description?: string, expiresInDays: number = 90): Promise<ApiKey> {
    const key = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);

    const apiKey: ApiKey = {
      key,
      name,
      description,
      createdAt: now,
      expiresAt,
      isActive: true,
      scopes
    };

    await this.cache.set(`api_key:${key}`, JSON.stringify(apiKey), expiresInDays * 24 * 60 * 60);

    // Track metrics
    prometheus.httpRequestsTotal.inc({ 
      method: 'POST', 
      route: 'api-key/generate', 
      status_code: '200' 
    });

    return apiKey;
  }

  public async rotateApiKey(oldKey: string, name: string, scopes: string[], description?: string, expiresInDays: number = 90): Promise<ApiKey> {
    // Generate new key
    const newKey = await this.generateApiKey(name, scopes, description, expiresInDays);

    // Mark old key as inactive
    const oldApiKey = await this.getApiKey(oldKey);
    if (oldApiKey) {
      oldApiKey.isActive = false;
      await this.cache.set(`api_key:${oldKey}`, JSON.stringify(oldApiKey), 7 * 24 * 60 * 60); // Keep for 7 days
    }

    // Track metrics
    prometheus.httpRequestsTotal.inc({ 
      method: 'POST', 
      route: 'api-key/rotate', 
      status_code: '200' 
    });

    return newKey;
  }

  public async getApiKey(key: string): Promise<ApiKey | null> {
    const cached = await this.cache.get(`api_key:${key}`);
    if (!cached) {
      return null;
    }

    const apiKey: ApiKey = JSON.parse(cached as string);

    // Check if key is expired
    if (new Date(apiKey.expiresAt) < new Date()) {
      apiKey.isActive = false;
      await this.cache.set(`api_key:${key}`, JSON.stringify(apiKey), 7 * 24 * 60 * 60); // Keep for 7 days
      return null;
    }

    // Update last used timestamp
    apiKey.lastUsedAt = new Date();
    await this.cache.set(`api_key:${key}`, JSON.stringify(apiKey), Math.ceil((new Date(apiKey.expiresAt).getTime() - Date.now()) / 1000));

    return apiKey;
  }

  public async revokeApiKey(key: string): Promise<void> {
    const apiKey = await this.getApiKey(key);
    if (apiKey) {
      apiKey.isActive = false;
      await this.cache.set(`api_key:${key}`, JSON.stringify(apiKey), 7 * 24 * 60 * 60); // Keep for 7 days

      // Track metrics
      prometheus.httpRequestsTotal.inc({ 
        method: 'POST', 
        route: 'api-key/revoke', 
        status_code: '200' 
      });
    }
  }

  public async validateApiKey(key: string, requiredScopes: string[] = [], ip?: string): Promise<ApiKeyValidation> {
    try {
      // Check cache first
      const cachedKey = await this.cache.get(`api_key:${key}`);
      if (cachedKey) {
        const { userId, scopes, active } = JSON.parse(cachedKey as string);
        if (!active) {
          prometheus.httpRequestsTotal.inc({ 
            method: 'GET', 
            route: 'api-key/validate', 
            status_code: '401' 
          });
          return { valid: false, message: 'API key is inactive' };
        }
        if (requiredScopes.length > 0 && !requiredScopes.every(scope => scopes.includes(scope))) {
          prometheus.httpRequestsTotal.inc({ 
            method: 'GET', 
            route: 'api-key/validate', 
            status_code: '403' 
          });
          return { valid: false, message: 'Insufficient scopes' };
        }
        prometheus.httpRequestsTotal.inc({ 
          method: 'GET', 
          route: 'api-key/validate', 
          status_code: '200' 
        });
        return { valid: true, userId, scopes };
      }

      // Check database
      const apiKey = await this.prisma.apiKey.findUnique({
        where: { key },
        include: { user: true }
      });

      if (!apiKey) {
        prometheus.httpRequestsTotal.inc({ 
          method: 'GET', 
          route: 'api-key/validate', 
          status_code: '404' 
        });
        return { valid: false, message: 'API key not found' };
      }

      if (!apiKey.active) {
        prometheus.httpRequestsTotal.inc({ 
          method: 'GET', 
          route: 'api-key/validate', 
          status_code: '401' 
        });
        return { valid: false, message: 'API key is inactive' };
      }

      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        prometheus.httpRequestsTotal.inc({ 
          method: 'GET', 
          route: 'api-key/validate', 
          status_code: '401' 
        });
        return { valid: false, message: 'API key has expired' };
      }

      if (requiredScopes.length > 0 && !requiredScopes.every(scope => apiKey.scopes.includes(scope))) {
        prometheus.httpRequestsTotal.inc({ 
          method: 'GET', 
          route: 'api-key/validate', 
          status_code: '403' 
        });
        return { valid: false, message: 'Insufficient scopes' };
      }

      // Cache the key
      await this.cache.set(
        `api_key:${key}`,
        JSON.stringify({
          userId: apiKey.userId,
          scopes: apiKey.scopes,
          active: apiKey.active
        }),
        3600 // Cache for 1 hour
      );

      prometheus.httpRequestsTotal.inc({ 
        method: 'GET', 
        route: 'api-key/validate', 
        status_code: '200' 
      });
      return { valid: true, userId: apiKey.userId, scopes: apiKey.scopes };
    } catch (error) {
      prometheus.httpRequestsTotal.inc({ 
        method: 'GET', 
        route: 'api-key/validate', 
        status_code: '500' 
      });
      return { valid: false, message: 'Error validating API key' };
    }
  }

  public async listApiKeys(): Promise<ApiKey[]> {
    // In a real implementation, this would query a database
    // For now, we'll return an empty array
    return [];
  }
} 