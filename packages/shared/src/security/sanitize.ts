import { Request, Response, NextFunction } from 'express';
import { prometheus } from '../prometheus';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

export const sanitizeRequest = () => {
  const sanitizationCounter = new prometheus.Counter({
    name: 'request_sanitization_total',
    help: 'Total number of request sanitizations',
    labelNames: ['type']
  });

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize query parameters
      if (req.query) {
        Object.keys(req.query).forEach(key => {
          if (typeof req.query[key] === 'string') {
            req.query[key] = purify.sanitize(req.query[key] as string);
            sanitizationCounter.inc({ type: 'query' });
          }
        });
      }

      // Sanitize body parameters
      if (req.body) {
        if (typeof req.body === 'object') {
          Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
              req.body[key] = purify.sanitize(req.body[key]);
              sanitizationCounter.inc({ type: 'body' });
            }
          });
        }
      }

      // Sanitize URL parameters
      if (req.params) {
        Object.keys(req.params).forEach(key => {
          if (typeof req.params[key] === 'string') {
            req.params[key] = purify.sanitize(req.params[key]);
            sanitizationCounter.inc({ type: 'params' });
          }
        });
      }

      next();
    } catch (error) {
      console.error('Sanitization error:', error);
      res.status(400).json({
        error: 'Bad Request',
        message: 'Failed to sanitize request data'
      });
    }
  };
};

// SQL injection prevention
export const preventSqlInjection = () => {
  const sqlInjectionCounter = new prometheus.Counter({
    name: 'sql_injection_attempts_total',
    help: 'Total number of SQL injection attempts',
    labelNames: ['type']
  });

  const sqlInjectionPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))union/i,
    /exec(\s|\+)+(s|x)p\w+/i,
    /insert|update|delete|drop|truncate|alter/i
  ];

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const checkForInjection = (value: string) => {
        return sqlInjectionPatterns.some(pattern => pattern.test(value));
      };

      // Check query parameters
      if (req.query) {
        Object.keys(req.query).forEach(key => {
          if (typeof req.query[key] === 'string' && checkForInjection(req.query[key] as string)) {
            sqlInjectionCounter.inc({ type: 'query' });
            throw new Error('SQL injection attempt detected in query parameters');
          }
        });
      }

      // Check body parameters
      if (req.body) {
        if (typeof req.body === 'object') {
          Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string' && checkForInjection(req.body[key])) {
              sqlInjectionCounter.inc({ type: 'body' });
              throw new Error('SQL injection attempt detected in body');
            }
          });
        }
      }

      // Check URL parameters
      if (req.params) {
        Object.keys(req.params).forEach(key => {
          if (typeof req.params[key] === 'string' && checkForInjection(req.params[key])) {
            sqlInjectionCounter.inc({ type: 'params' });
            throw new Error('SQL injection attempt detected in URL parameters');
          }
        });
      }

      next();
    } catch (error) {
      console.error('SQL injection prevention error:', error);
      res.status(400).json({
        error: 'Bad Request',
        message: 'Potential SQL injection attempt detected'
      });
    }
  };
}; 