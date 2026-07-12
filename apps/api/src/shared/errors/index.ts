/**
 * Base class for all domain-specific errors in the application.
 * Maps to standard HTTP status codes and API error response shapes.
 */
export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 422,
    public readonly field?: string
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

/**
 * 401 Unauthorized - Missing or invalid credentials/session.
 */
export class AuthenticationError extends DomainError {
  constructor(message: string = 'Authentication required.') {
    super('UNAUTHORIZED', message, 401);
  }
}

/**
 * 403 Forbidden - Authenticated but lacks required role or scope.
 */
export class AuthorizationError extends DomainError {
  constructor(message: string = 'Access denied.') {
    super('FORBIDDEN', message, 403);
  }
}

/**
 * 404 Not Found - Resource does not exist.
 */
export class ResourceNotFoundError extends DomainError {
  constructor(message: string = 'Resource not found.') {
    super('NOT_FOUND', message, 404);
  }
}

/**
 * 409 Conflict - Resource state conflict (e.g. duplicate key or active dispatch constraint).
 */
export class ConflictError extends DomainError {
  constructor(message: string, field?: string) {
    super('CONFLICT', message, 409, field);
  }
}

/**
 * 422 Unprocessable Entity - Business rule violation (e.g. cargo weight limit exceeded).
 */
export class BusinessRuleViolationError extends DomainError {
  constructor(code: string, message: string, field?: string) {
    super(code, message, 422, field);
  }
}

/**
 * 422 Unprocessable Entity - Basic request body shape or field value errors.
 */
export class ValidationError extends DomainError {
  constructor(message: string, field?: string) {
    super('VALIDATION_ERROR', message, 422, field);
  }
}
