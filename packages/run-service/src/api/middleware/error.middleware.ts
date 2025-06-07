import { Request, Response, NextFunction } from 'express';
import { logger } from '@shared/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: err.message,
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
  });
}; 
