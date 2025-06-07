import { Request, Response, NextFunction } from 'express';
import { logger } from '@shared/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  // Handle unexpected errors
  logger.error('Unexpected error:', err);
  return res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
}; 