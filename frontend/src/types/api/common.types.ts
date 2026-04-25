/**
 * Common API contract types (errors, meta).
 * Shared across auth, subscriptions, content, streaming for NestJS consistency.
 */

/** Standard API error response (e.g. 4xx, 5xx). */
export interface ApiErrorResponseDto {
  statusCode: number;
  error: string;
  message: string | string[];
  /** Optional validation details (e.g. class-validator). */
  details?: Record<string, string[]>;
}

/** Generic success envelope (optional; some endpoints return data directly). */
export interface ApiSuccessResponseDto<T> {
  data: T;
  meta?: Record<string, unknown>;
}
