import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ENV } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  code?: number | string;
  keyValue?: Record<string, any>;
  errors?: any;
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND',
  });
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 1. Zod Schema Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed for request data',
      code: 'VALIDATION_ERROR',
      errors: formattedErrors,
    });
    return;
  }

  // 2. MongoDB Duplicate Key Error (E11000)
  if (err.code === 11000 || (err.message && err.message.includes('E11000 duplicate key error'))) {
    const duplicatedField = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
    const duplicatedValue = err.keyValue ? err.keyValue[duplicatedField] : '';

    res.status(409).json({
      success: false,
      message: `A record with this ${duplicatedField} ('${duplicatedValue}') already exists.`,
      code: 'DUPLICATE_KEY_ERROR',
      field: duplicatedField,
    });
    return;
  }

  // 3. Mongoose CastError (Invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: 'Invalid resource identifier format.',
      code: 'INVALID_ID',
    });
    return;
  }

  // 4. JWT Authorization Errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: err.name === 'TokenExpiredError' ? 'Session expired. Please sign in again.' : 'Invalid authentication token.',
      code: 'AUTH_TOKEN_ERROR',
    });
    return;
  }

  // 5. Explicit HTTP Status Errors
  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred.';

  // Log server errors for observability
  if (statusCode >= 500) {
    console.error(`[UnhandledError] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    code: err.code || 'INTERNAL_ERROR',
    stack: !ENV.IS_PRODUCTION ? err.stack : undefined,
  });
}
