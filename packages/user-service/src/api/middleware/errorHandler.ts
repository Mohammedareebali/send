import { Request, Response, NextFunction } from 'express';
import { createErrorResponse } from '@shared/responses';
import { AppError as SharedAppError } from '@shared/errors';

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
  if (err instanceof AppError || err instanceof SharedAppError) {
    const status = (err as any).statusCode;
    return res.status(status).json(createErrorResponse(err));
  }

  // Handle unexpected errors
  console.error('Unexpected error:', err);
  return res.status(500).json(createErrorResponse(err));
};
