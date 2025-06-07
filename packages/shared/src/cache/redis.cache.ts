import Redis from 'redis';

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export class RedisCache {
  private static instance: RedisCache;
  private client: Redis.RedisClientType;

  private constructor(config: CacheConfig) {
    this.client = Redis.createClient({
      socket: {
        host: config.host,
        port: config.port
      },
      password: config.password,
      database: config.db
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.connect().catch(console.error);
  }

  public static getInstance(config?: CacheConfig): RedisCache {
    if (!RedisCache.instance) {
      const envConfig: CacheConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB, 10) : undefined
      };

      RedisCache.instance = new RedisCache(config || envConfig);
    }
    return RedisCache.instance;
  }

  public async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  public async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.setEx(key, ttlSeconds, stringValue);
    } else {
      await this.client.set(key, stringValue);
    }
  }

  public async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  public async increment(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  public async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  public async close(): Promise<void> {
    await this.client.quit();
  }
} 