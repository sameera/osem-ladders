// Re-export all types from a central location
export * from './users.js';
export * from './teams.js';
export * from './assessments.js';
export * from './reports.js';

/**
 * Common API response types
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Pagination types
 */
export interface PaginatedResponse<T> {
  items: T[];
  nextToken?: string;
  count: number;
}

export interface PaginationParams {
  limit?: number;
  nextToken?: string;
}