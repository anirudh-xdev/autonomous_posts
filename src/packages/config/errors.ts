/**
 * Standard Application Error Hierarchy
 * Distinguishes validation, external API, rate-limit, and operational errors
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(message: string, statusCode = 500, isOperational = true, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly errors?: unknown;

  constructor(message: string, errors?: unknown) {
    super(message, 400, true, { errors });
    this.errors = errors;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` with id '${id}'` : ''} not found`, 404);
  }
}

export class ExternalApiError extends AppError {
  public readonly service: string;

  constructor(service: string, message: string, statusCode = 502, context?: Record<string, unknown>) {
    super(`External API Error [${service}]: ${message}`, statusCode, true, { service, ...context });
    this.service = service;
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfterSeconds?: number;

  constructor(service: string, retryAfterSeconds?: number) {
    super(
      `Rate limit exceeded for ${service}${retryAfterSeconds ? `, retry after ${retryAfterSeconds}s` : ''}`,
      429,
      true,
      { service, retryAfterSeconds }
    );
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class QualityGateError extends AppError {
  public readonly violations: string[];

  constructor(message: string, violations: string[]) {
    super(message, 422, true, { violations });
    this.violations = violations;
  }
}
