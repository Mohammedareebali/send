import { AppError } from '../errors';

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export const createErrorResponse = (error: Error | AppError): ErrorResponse => {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.name,
        message: error.message
      }
    };
  }

  return {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  };
};

export const createValidationErrorResponse = (details: Record<string, string[]>): ErrorResponse => ({
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid input data',
    details
  }
});

export const createNotFoundErrorResponse = (resource: string): ErrorResponse => ({
  success: false,
  error: {
    code: 'NOT_FOUND',
    message: `${resource} not found`
  }
});

export const createUnauthorizedErrorResponse = (message: string = 'Unauthorized'): ErrorResponse => ({
  success: false,
  error: {
    code: 'UNAUTHORIZED',
    message
  }
}); 