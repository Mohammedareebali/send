import { Request, Response, NextFunction } from 'express';
import { createErrorResponse } from '@shared/responses';
import { AppError } from '@shared/errors';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res
      .status(400)
      .json(createErrorResponse(new AppError(err.message, 400)));
  }

  if (err.name === 'UnauthorizedError') {
    return res
      .status(401)
      .json(createErrorResponse(new AppError(err.message, 401)));
  }

  res.status(500).json(createErrorResponse(err));
};
