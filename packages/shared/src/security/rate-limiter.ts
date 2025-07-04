import Redis from 'ioredis';
import { prometheus } from '../config/metrics';
import { LoggerService } from '../logging/logger.service';

const logger = new LoggerService({ serviceName: 'security' });

export class RateLimiter {
  private static instance: RateLimiter;
  private client: Redis;
  private windowMs: number;
  public readonly maxRequests: number;

  private constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });

    this.windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'); // 1 minute
    this.maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

    // Export metrics to Prometheus
    this.exportMetrics();
  }

  private exportMetrics() {
    setInterval(() => {
      // Export metrics every minute
      this.client.keys('rate_limit:*').then(keys => {
        keys.forEach(key => {
          const service = key.split(':')[1];
          this.client.get(key).then(value => {
            const remaining = parseInt(value || '0');
            prometheus.rateLimitRemaining.set({ service }, remaining);
          });
        });
      });
    }, 60000);
  }

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  public async checkRateLimit(key: string): Promise<{
    isAllowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const redisKey = `rate_limit:${key}`;
    const now = Date.now();
    const windowStart = now - this.windowMs;

    try {
      const pipeline = this.client.pipeline();
      pipeline.zremrangebyscore(redisKey, 0, windowStart);
      pipeline.zcard(redisKey);
      pipeline.zadd(redisKey, now.toString(), now.toString());
      pipeline.expire(redisKey, Math.ceil(this.windowMs / 1000));

      const results = await pipeline.exec();
      if (!results) {
        throw new Error('Failed to execute rate limit check');
      }

      const currentCount = results[1][1] as number;
      const remaining = Math.max(0, this.maxRequests - currentCount);
      const resetTime = now + this.windowMs;

      if (currentCount >= this.maxRequests) {
        const service = key.split(':')[0];
        prometheus.rateLimitHitsTotal.inc({ service });
      }

      return {
        isAllowed: currentCount < this.maxRequests,
        remaining,
        resetTime,
      };
    } catch (error) {
      logger.error('Rate limit check failed:', error);
      // Fail open in case of Redis errors
      return {
        isAllowed: true,
        remaining: this.maxRequests,
        resetTime: now + this.windowMs,
      };
    }
  }

  public async resetRateLimit(key: string): Promise<void> {
    const redisKey = `rate_limit:${key}`;
    await this.client.del(redisKey);
  }

  public async close(): Promise<void> {
    await this.client.quit();
  }
} 