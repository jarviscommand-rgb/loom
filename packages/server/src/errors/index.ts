// ============================================================
// LOOM — Custom Error Classes
//
// Typed error hierarchy for structured error handling
// across the application.
// ============================================================

/** Base error class for all LOOM errors. */
export class LoomError extends Error {
  /** Machine-readable error code. */
  readonly code: string;
  /** HTTP status code for API responses. */
  readonly statusCode: number;
  /** Additional error context. */
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'LoomError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  /** Serialize for API responses. */
  toJSON(): Record<string, unknown> {
    return {
      error: this.name,
      code: this.code,
      message: this.message,
      ...(this.details ? { details: this.details } : {}),
    };
  }
}

/** Thrown when narrative extraction fails. */
export class ExtractionError extends LoomError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'EXTRACTION_FAILED', 500, details);
    this.name = 'ExtractionError';
  }
}

/** Thrown when input validation fails. */
export class ValidationError extends LoomError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

/** Thrown when rate limit is exceeded. */
export class RateLimitError extends LoomError {
  constructor(message = 'Too many requests, please try again later') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
    this.name = 'RateLimitError';
  }
}

/** Thrown when a graph operation fails. */
export class GraphError extends LoomError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'GRAPH_ERROR', 500, details);
    this.name = 'GraphError';
  }
}

/** Thrown when dream/future scenario generation fails. */
export class DreamGenerationError extends LoomError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'DREAM_GENERATION_FAILED', 500, details);
    this.name = 'DreamGenerationError';
  }
}

/** Thrown when auto-research topic ingestion fails. */
export class ResearchError extends LoomError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'RESEARCH_FAILED', 500, details);
    this.name = 'ResearchError';
  }
}
