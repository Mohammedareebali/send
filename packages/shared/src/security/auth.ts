import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prometheus } from '../prometheus';
import { RedisCache } from '../cache/redis';
import { LoggerService } from '../logging/logger.service';

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  apiKeyHeader: string;
}

export interface User {
  id: string;
  roles: string[];
  [key: string]: any;
}

declare module 'express' {
  interface Request {
    user?: User;
  }
}

export class AuthService {
  private static instance: AuthService;
  private cache: RedisCache;
  public config: AuthConfig;
  private logger = new LoggerService({ serviceName: 'security' });

  private constructor() {
    this.cache = RedisCache.getInstance();
    this.config = {
      jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
      apiKeyHeader: process.env.API_KEY_HEADER || 'x-api-key'
    };
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public generateToken(payload: object): string {
    const options: SignOptions = {
      expiresIn: parseInt(this.config.jwtExpiresIn) || 3600
    };
    return jwt.sign(payload, this.config.jwtSecret, options);
  }

  public verifyToken(token: string): User {
    return jwt.verify(token, this.config.jwtSecret) as User;
  }

  public async validateApiKey(apiKey: string): Promise<boolean> {
    const cacheKey = `api_key:${apiKey}`;
    const cached = await this.cache.get(cacheKey);
    
    if (cached !== null) {
      return cached === 'valid';
    }

    const validKeys = (process.env.VALID_API_KEYS || '').split(',');
    const isValid = validKeys.includes(apiKey);
    
    await this.cache.set(cacheKey, isValid ? 'valid' : 'invalid', 3600);
    return isValid;
  }

  public async revokeApiKey(apiKey: string): Promise<void> {
    const cacheKey = `api_key:${apiKey}`;
    await this.cache.set(cacheKey, 'invalid', 3600);
  }
}

// Authentication middleware
export const authenticate = (options: { requireApiKey?: boolean } = {}) => {
  const authService = AuthService.getInstance();
  const authCounter = new prometheus.Counter({
    name: 'auth_attempts_total',
    help: 'Total number of authentication attempts',
    labelNames: ['method', 'success']
  });

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (options.requireApiKey) {
        const apiKey = req.headers[authService.config.apiKeyHeader.toLowerCase()] as string;
        if (!apiKey) {
          authCounter.inc({ method: 'api_key', success: 'false' });
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'API key is required'
          });
        }

        const isValid = await authService.validateApiKey(apiKey);
        if (!isValid) {
          authCounter.inc({ method: 'api_key', success: 'false' });
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid API key'
          });
        }

        authCounter.inc({ method: 'api_key', success: 'true' });
        return next();
      }

      const authHeader = req.headers.authorization;
      if (!authHeader) {
        authCounter.inc({ method: 'jwt', success: 'false' });
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authorization header is required'
        });
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        authCounter.inc({ method: 'jwt', success: 'false' });
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Token is required'
        });
      }

      try {
        const decoded = authService.verifyToken(token);
        req.user = decoded;
        authCounter.inc({ method: 'jwt', success: 'true' });
        next();
      } catch (error) {
        authCounter.inc({ method: 'jwt', success: 'false' });
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid token'
        });
      }
    } catch (error) {
      this.logger.error('Authentication error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Authentication failed'
      });
    }
  };
};

// Role-based access control middleware
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'User roles not found'
      });
    }

    const hasRole = roles.some(role => req.user!.roles.includes(role));
    if (!hasRole) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
}; 