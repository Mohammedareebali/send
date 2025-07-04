import { Request, Response, NextFunction } from 'express';
import { RateLimiter } from './rate-limiter';
import { prometheus } from '../config/metrics';
import { createErrorResponse } from '../responses';
import { AppError } from '../errors';
import { LoggerService } from '../logging/logger.service';

const logger = new LoggerService({ serviceName: 'security' });

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
};

// Rate limiting middleware
export const rateLimit = (service: string) => {
  const limiter = RateLimiter.getInstance();

  return async (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const clientId = req.ip || req.headers['x-forwarded-for'] || 'unknown';

    try {
      const { isAllowed, remaining, resetTime } = await limiter.checkRateLimit(`${service}:${clientId}`);

      if (!isAllowed) {
        res.setHeader('X-RateLimit-Limit', limiter.maxRequests);
        res.setHeader('X-RateLimit-Remaining', remaining);
        res.setHeader('X-RateLimit-Reset', resetTime);
        prometheus.httpRequestsTotal.inc({
          service,
          method: req.method,
          status_code: '429'
        });
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
        });
      }

      res.setHeader('X-RateLimit-Limit', limiter.maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', resetTime);

      // Add response time tracking
      res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        prometheus.httpRequestDuration.observe(
          { service, method: req.method, status_code: res.statusCode.toString() },
          duration
        );
        prometheus.httpRequestsTotal.inc({
          service,
          method: req.method,
          status_code: res.statusCode.toString()
        });
      });

      next();
    } catch (error) {
      logger.error('Rate limit middleware error:', error);
      next();
    }
  };
};

// Request validation middleware
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.details[0].message
        });
      }
      next();
    } catch (error) {
      logger.error('Request validation error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to validate request'
      });
    }
  };
};

// Error handling middleware
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json(
      createErrorResponse(new AppError(err.message, 400))
    );
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json(
      createErrorResponse(new AppError('Invalid or missing authentication token', 401))
    );
  }

  res.status(500).json(createErrorResponse(err));
};
