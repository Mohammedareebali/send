import { createClient } from 'redis';
import { prometheus } from '../prometheus';

export class RedisCache {
  private static instance: RedisCache;
  private client: ReturnType<typeof createClient>;
  private connected: boolean = false;

  // Metrics
  private cacheHits = new prometheus.Counter({
    name: 'redis_cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['operation']
  });

  private cacheMisses = new prometheus.Counter({
    name: 'redis_cache_misses_total',
    help: 'Total number of cache misses',
    labelNames: ['operation']
  });

  private cacheErrors = new prometheus.Counter({
    name: 'redis_cache_errors_total',
    help: 'Total number of cache errors',
    labelNames: ['operation']
  });

  private constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            return new Error('Max reconnection attempts reached');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error', err);
      this.cacheErrors.inc({ operation: 'connection' });
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
      this.connected = true;
    });

    this.client.on('reconnecting', () => {
      console.log('Redis Client Reconnecting');
      this.connected = false;
    });
  }

  public static getInstance(): RedisCache {
    if (!RedisCache.instance) {
      RedisCache.instance = new RedisCache();
    }
    return RedisCache.instance;
  }

  public async connect(): Promise<void> {
    if (!this.connected) {
      await this.client.connect();
    }
  }

  public async get(key: string): Promise<string | null> {
    try {
      const value = await this.client.get(key);
      if (value !== null) {
        this.cacheHits.inc({ operation: 'get' });
      } else {
        this.cacheMisses.inc({ operation: 'get' });
      }
      return value;
    } catch (error) {
      this.cacheErrors.inc({ operation: 'get' });
      console.error('Redis get error:', error);
      return null;
    }
  }

  public async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
      this.cacheHits.inc({ operation: 'set' });
    } catch (error) {
      this.cacheErrors.inc({ operation: 'set' });
      console.error('Redis set error:', error);
    }
  }

  public async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
      this.cacheHits.inc({ operation: 'del' });
    } catch (error) {
      this.cacheErrors.inc({ operation: 'del' });
      console.error('Redis del error:', error);
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const exists = await this.client.exists(key);
      this.cacheHits.inc({ operation: 'exists' });
      return exists === 1;
    } catch (error) {
      this.cacheErrors.inc({ operation: 'exists' });
      console.error('Redis exists error:', error);
      return false;
    }
  }

  public async ttl(key: string): Promise<number> {
    try {
      const ttl = await this.client.ttl(key);
      this.cacheHits.inc({ operation: 'ttl' });
      return ttl;
    } catch (error) {
      this.cacheErrors.inc({ operation: 'ttl' });
      console.error('Redis ttl error:', error);
      return -2; // Key doesn't exist
    }
  }

  public async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.quit();
      this.connected = false;
    }
  }
} 