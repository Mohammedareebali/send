import { Request, Response, NextFunction } from 'express';
import { prometheus } from '@shared/prometheus';
import { logger } from '../services/logging.service';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Track metrics
  prometheus.httpRequestsTotal.inc({
    method: req.method,
    route: req.path,
    status_code: '500'
  });

  // Send error response
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
}; 