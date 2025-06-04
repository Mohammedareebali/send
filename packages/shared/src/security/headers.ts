import { Request, Response, NextFunction } from 'express';
import { prometheus } from '../prometheus';

export const securityHeadersMiddleware = () => {
  const securityHeadersCounter = new prometheus.Counter({
    name: 'security_headers_total',
    help: 'Total number of security headers applied',
    labelNames: ['header']
  });

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Content Security Policy
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;"
      );
      securityHeadersCounter.inc({ header: 'Content-Security-Policy' });

      // X-Content-Type-Options
      res.setHeader('X-Content-Type-Options', 'nosniff');
      securityHeadersCounter.inc({ header: 'X-Content-Type-Options' });

      // X-Frame-Options
      res.setHeader('X-Frame-Options', 'DENY');
      securityHeadersCounter.inc({ header: 'X-Frame-Options' });

      // X-XSS-Protection
      res.setHeader('X-XSS-Protection', '1; mode=block');
      securityHeadersCounter.inc({ header: 'X-XSS-Protection' });

      // Strict-Transport-Security
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      securityHeadersCounter.inc({ header: 'Strict-Transport-Security' });

      // Referrer-Policy
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      securityHeadersCounter.inc({ header: 'Referrer-Policy' });

      // Permissions-Policy
      res.setHeader(
        'Permissions-Policy',
        'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
      );
      securityHeadersCounter.inc({ header: 'Permissions-Policy' });

      // Cache-Control
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      securityHeadersCounter.inc({ header: 'Cache-Control' });

      // Pragma
      res.setHeader('Pragma', 'no-cache');
      securityHeadersCounter.inc({ header: 'Pragma' });

      // Expires
      res.setHeader('Expires', '0');
      securityHeadersCounter.inc({ header: 'Expires' });

      next();
    } catch (error) {
      console.error('Security headers error:', error);
      next();
    }
  };
}; 