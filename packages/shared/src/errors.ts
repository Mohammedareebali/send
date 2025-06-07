import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import { createErrorResponse } from './responses/error';

/**
 * Generic application error which includes an HTTP status code and
 * optional machine readable code. Controllers should throw this error
 * to signal expected failures (e.g. validation or not found).
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 400, code = 'APP_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Express error handling middleware that normalises application errors and
 * hides unexpected details from the client.  It logs the error and returns a
 * consistent JSON structure using {@link createErrorResponse}.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error('Unhandled error', err);

  const status = err instanceof AppError ? err.statusCode : 500;
  res.status(status).json(createErrorResponse(err));
};

export default AppError;
