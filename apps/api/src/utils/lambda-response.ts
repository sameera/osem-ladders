import type { APIGatewayProxyResult } from 'aws-lambda';
import type { ApiResponse, ApiError } from '../types/index.js';

/**
 * Create a successful API response
 */
export function successResponse<T>(
  data: T,
  statusCode = 200
): APIGatewayProxyResult {
  const response: ApiResponse<T> = {
    success: true,
    data
  };

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify(response)
  };
}

/**
 * Create an error API response
 */
export function errorResponse(
  error: ApiError,
  statusCode = 400
): APIGatewayProxyResult {
  const response: ApiResponse = {
    success: false,
    error
  };

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify(response)
  };
}

/**
 * Common error builders
 */
export const errors = {
  notFound: (resource: string, id: string): ApiError => ({
    code: 'NOT_FOUND',
    message: `${resource} not found`,
    details: { id }
  }),

  badRequest: (message: string, details?: Record<string, unknown>): ApiError => ({
    code: 'BAD_REQUEST',
    message,
    details
  }),

  unauthorized: (message = 'Unauthorized'): ApiError => ({
    code: 'UNAUTHORIZED',
    message
  }),

  forbidden: (message = 'Forbidden'): ApiError => ({
    code: 'FORBIDDEN',
    message
  }),

  conflict: (message: string, details?: Record<string, unknown>): ApiError => ({
    code: 'CONFLICT',
    message,
    details
  }),

  internal: (message = 'Internal server error'): ApiError => ({
    code: 'INTERNAL_ERROR',
    message
  }),

  validationError: (
    message: string,
    details?: Record<string, unknown>
  ): ApiError => ({
    code: 'VALIDATION_ERROR',
    message,
    details
  })
};