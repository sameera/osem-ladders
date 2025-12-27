/**
 * React Query Client Configuration
 * Centralized configuration with smart retry logic
 */

import { QueryClient } from '@tanstack/react-query';
import { isClientError, isServerError, isNetworkError } from '@/services/errors';

/**
 * Smart retry function for React Query
 *
 * Retry logic:
 * - Never retries 4xx client errors (400-499) - these indicate client/application issues that won't be fixed by retrying
 * - Always retries 5xx server errors (500-599) - these may be transient server issues
 * - Always retries network errors - connection issues may be temporary
 * - Retries unknown errors defensively - better to retry than fail immediately
 * - Maximum 3 retry attempts for retryable errors
 *
 * @param failureCount - Number of times the request has failed (0-indexed)
 * @param error - The error that occurred
 * @returns true if the request should be retried, false otherwise
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  // Don't retry client errors (4xx) - these won't be fixed by retrying
  // Examples: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict
  if (isClientError(error)) {
    return false;
  }

  // Retry server errors (5xx) up to 3 times - these may be transient
  // Examples: 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable
  if (isServerError(error)) {
    return failureCount < 3;
  }

  // Retry network errors up to 3 times - connection issues may be temporary
  // Examples: Network timeout, DNS resolution failure, connection refused
  if (isNetworkError(error)) {
    return failureCount < 3;
  }

  // For unknown errors, retry up to 3 times (defensive approach)
  // This handles cases where the error doesn't match our known error types
  return failureCount < 3;
}

/**
 * Exponential backoff delay for retries
 *
 * Retry delays:
 * - 1st retry: 1 second
 * - 2nd retry: 2 seconds
 * - 3rd retry: 4 seconds
 *
 * @param attemptIndex - The retry attempt number (0 for first retry, 1 for second, etc.)
 * @returns Delay in milliseconds before the next retry
 */
function retryDelay(attemptIndex: number): number {
  // Exponential backoff: 1s, 2s, 4s, etc., capped at 30s
  return Math.min(1000 * 2 ** attemptIndex, 30000);
}

/**
 * Configured QueryClient instance with smart retry logic
 * This client is used throughout the application for all React Query operations
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      retryDelay,
      // Keep other default behaviors
      staleTime: 0,
      refetchOnWindowFocus: true,
    },
  },
});
