import { Request, Response, NextFunction } from 'express';
import { prometheus } from '../prometheus';
import { RedisCache } from '../cache/redis.cache';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  blockDuration: number;
}

export class IpRateLimiter {
  private static instance: IpRateLimiter;
  public readonly windowMs: number;
  public readonly maxRequests: number;
  public readonly cache: RedisCache;
  public readonly config: RateLimitConfig;

  constructor(
    config: RateLimitConfig = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      blockDuration: 60 * 1000 // 1 minute
    },
    cache: RedisCache
  ) {
    this.config = config;
    this.windowMs = config.windowMs;
    this.maxRequests = config.maxRequests;
    this.cache = cache;
  }

  public static getInstance(config?: RateLimitConfig, cache?: RedisCache): IpRateLimiter {
    if (!IpRateLimiter.instance) {
      if (!cache) {
        throw new Error('Redis cache is required for first initialization');
      }
      IpRateLimiter.instance = new IpRateLimiter(config, cache);
    }
    return IpRateLimiter.instance;
  }

  public async checkRateLimit(ip: string): Promise<boolean> {
    const key = `rate_limit:${ip}`;
    const current = await this.cache.get<number>(key) || 0;

    if (current >= this.maxRequests) {
      prometheus.httpRequestsTotal.inc({
        method: 'RATE_LIMIT',
        route: 'rate_limiter',
        status_code: 429
      });
      return false;
    }

    await this.cache.set(key, current + 1, this.windowMs);
    return true;
  }

  public async resetRateLimit(ip: string): Promise<void> {
    const key = `rate_limit:${ip}`;
    await this.cache.del(key);
  }
}

// Middleware to enforce IP-based rate limiting
export const ipRateLimitMiddleware = (config?: RateLimitConfig) => {
  const rateLimiter = IpRateLimiter.getInstance(config, RedisCache.getInstance());

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip || 'unknown';
      const result = await rateLimiter.checkRateLimit(ip);

      if (!result) {
        res.setHeader('X-RateLimit-Limit', rateLimiter.config.maxRequests);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() + rateLimiter.config.windowMs / 1000));

        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
          retryAfter: Math.ceil(rateLimiter.config.windowMs / 1000)
        });
      }

      const current = await rateLimiter.cache.get<number>(`rate_limit:${ip}`) || 0;
      res.setHeader('X-RateLimit-Limit', rateLimiter.config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', rateLimiter.config.maxRequests - current);
      res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() + rateLimiter.config.windowMs / 1000));

      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      next();
    }
  };
}; 