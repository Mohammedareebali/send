import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import { AppError } from '@shared/errors';

export const validateRequest = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      throw new AppError(400, JSON.stringify({ message: 'Validation failed', errors }));
    }

    next();
  };
}; 