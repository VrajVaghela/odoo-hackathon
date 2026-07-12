import { Request, Response, NextFunction } from 'express';
import { DomainError } from '../shared/errors/index.js';

/**
 * Express error-handling middleware that catches all unhandled errors,
 * formatting DomainErrors as documented JSON responses and logging internal errors.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof DomainError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.field ? { field: err.field } : {})
      }
    });
    return;
  }

  // Technical log for unhandled errors
  console.error('[System Error]:', err);

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal server error occurred.'
    }
  });
}
