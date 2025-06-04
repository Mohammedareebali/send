import { Request, Response, NextFunction } from 'express';
import { prometheus } from '../prometheus';
import { Schema } from 'joi';
import { Counter } from 'prom-client';

export interface ValidationError {
  field: string;
  message: string;
}

export class ValidationService {
  private static instance: ValidationService;
  private validationCounter:Counter<string>;

  private constructor() {
    this.validationCounter = new Counter({
      name: 'request_validations_total',
      help: 'Total number of request validations',
      labelNames: ['valid']
    });
  }

  public static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  public validateRequest(schema: Schema, options: { abortEarly?: boolean } = {}) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const { error, value } = schema.validate(req.body, {
          abortEarly: options.abortEarly ?? false,
          stripUnknown: true
        });

        if (error) {
          const validationErrors: ValidationError[] = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }));

          this.validationCounter.inc({ valid: 'false' });

          return res.status(400).json({
            error: 'Validation Error',
            message: 'Invalid request data',
            details: validationErrors
          });
        }

        // Replace request body with validated and sanitized data
        req.body = value;

        this.validationCounter.inc({ valid: 'true' });
        next();
      } catch (error) {
        console.error('Validation error:', error);
        this.validationCounter.inc({ valid: 'false' });
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to validate request'
        });
      }
    };
  }

  public validateQuery(schema: Schema, options: { abortEarly?: boolean } = {}) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const { error, value } = schema.validate(req.query, {
          abortEarly: options.abortEarly ?? false,
          stripUnknown: true
        });

        if (error) {
          const validationErrors: ValidationError[] = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }));

          this.validationCounter.inc({ valid: 'false' });

          return res.status(400).json({
            error: 'Validation Error',
            message: 'Invalid query parameters',
            details: validationErrors
          });
        }

        // Replace query parameters with validated and sanitized data
        req.query = value;

        this.validationCounter.inc({ valid: 'true' });
        next();
      } catch (error) {
        console.error('Validation error:', error);
        this.validationCounter.inc({ valid: 'false' });
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to validate query parameters'
        });
      }
    };
  }

  public validateParams(schema: Schema, options: { abortEarly?: boolean } = {}) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const { error, value } = schema.validate(req.params, {
          abortEarly: options.abortEarly ?? false,
          stripUnknown: true
        });

        if (error) {
          const validationErrors: ValidationError[] = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }));

          this.validationCounter.inc({ valid: 'false' });

          return res.status(400).json({
            error: 'Validation Error',
            message: 'Invalid URL parameters',
            details: validationErrors
          });
        }

        // Replace URL parameters with validated and sanitized data
        req.params = value;

        this.validationCounter.inc({ valid: 'true' });
        next();
      } catch (error) {
        console.error('Validation error:', error);
        this.validationCounter.inc({ valid: 'false' });
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to validate URL parameters'
        });
      }
    };
  }
} 