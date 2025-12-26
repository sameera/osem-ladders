/**
 * TypeScript type definitions for User Management API
 * Feature: 004-user-management
 * Generated from: users.openapi.yaml
 *
 * These types are shared between frontend (apps/web) and backend (apps/api)
 * to ensure type safety across the API boundary.
 */

// ============================================================================
// Domain Types
// ============================================================================

/**
 * Valid elevated role values.
 * Users without these roles have default user-level access.
 */
export type UserRole = 'manager' | 'admin';

/**
 * User activation status filter options
 */
export type UserStatus = 'active' | 'inactive' | 'all';

// ============================================================================
// Entity Types
// ============================================================================

/**
 * User entity (matches DynamoDB Users table schema)
 */
export interface User {
  /** User's email address (immutable, serves as userId) */
  userId: string;

  /** User's full name */
  name: string;

  /** Elevated roles assigned to user (empty array = default user access) */
  roles: UserRole[];

  /** Team ID user belongs to (null if no team assigned) */
  team?: string | null;

  /** User activation status (false = deactivated/soft deleted) */
  isActive: boolean;

  /** Unix milliseconds timestamp of creation */
  createdAt: number;

  /** Unix milliseconds timestamp of last update */
  updatedAt: number;

  /** Email of admin who created this user */
  createdBy: string;
}

/**
 * User metadata (subset of User for authenticated access)
 * Used for non-admin routes that need basic user information
 */
export interface UserMeta {
  /** User's email address (immutable, serves as userId) */
  userId: string;

  /** User's full name */
  name: string;

  /** Elevated roles assigned to user (empty array = default user access) */
  roles: UserRole[];

  /** User activation status (false = deactivated/soft deleted) */
  isActive: boolean;

  /** Team ID user belongs to (null if no team assigned) */
  team?: string | null;
}

// ============================================================================
// API Request Types
// ============================================================================

/**
 * Request body for POST /admin/users
 */
export interface CreateUserRequest {
  /** User's email address (will become userId) */
  email: string;

  /** User's full name */
  name: string;

  /** Optional elevated roles (defaults to [] if omitted) */
  roles?: UserRole[];

  /** Optional team ID to assign user to */
  team?: string;
}

/**
 * Request body for PATCH /admin/users/:userId
 */
export interface UpdateUserRolesRequest {
  /** New roles array (can be empty for default user access) */
  roles: UserRole[];
}

/**
 * Query parameters for GET /admin/users
 */
export interface ListUsersQuery {
  /** Maximum number of users to return per page (default: 100, max: 500) */
  limit?: number;

  /** Pagination token from previous response */
  nextToken?: string;

  /** Search query to filter by name or email */
  search?: string;

  /** Filter by activation status (default: "all") */
  status?: UserStatus;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Response for GET /admin/users
 */
export interface ListUsersResponse {
  /** Array of users */
  users: User[];

  /** Token for fetching next page (null if no more pages) */
  nextToken?: string | null;
}

/**
 * Response for POST /admin/users and PATCH /admin/users/:userId
 */
export interface UserResponse {
  /** The created or updated user */
  user: User;
}

/**
 * Response for GET /admin/users/:userId
 */
export interface GetUserResponse {
  /** The requested user */
  user: User;
}

/**
 * Response for GET /users/:userId
 */
export interface GetUserMetaResponse {
  /** The requested user metadata */
  user: UserMeta;
}

/**
 * Response for DELETE /admin/users/:userId
 */
export interface DeactivateUserResponse {
  /** Email of deactivated user */
  userId: string;

  /** Unix milliseconds timestamp of deactivation */
  deactivatedAt: number;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Machine-readable error codes
 */
export type ErrorCode =
  // Validation errors (HTTP 400)
  | 'INVALID_EMAIL'
  | 'INVALID_NAME'
  | 'INVALID_ROLE'
  | 'USER_EXISTS'
  // Business rule violations (HTTP 400)
  | 'SELF_DEACTIVATION'
  | 'USER_IS_MANAGER'
  | 'ALREADY_INACTIVE'
  // Authorization errors (HTTP 403)
  | 'FORBIDDEN'
  // Not found errors (HTTP 404)
  | 'USER_NOT_FOUND'
  // Authentication errors (HTTP 401)
  | 'UNAUTHORIZED'
  // Server errors (HTTP 500)
  | 'INTERNAL_SERVER_ERROR';

/**
 * Standard API error response structure
 */
export interface ApiError {
  /** Machine-readable error code */
  error: ErrorCode;

  /** Human-readable error message */
  message: string;

  /** Optional additional context for the error */
  details?: Record<string, unknown>;
}

// ============================================================================
// Validation Helpers (for shared validation logic)
// ============================================================================

/**
 * Email validation regex (RFC 5322 simplified)
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Maximum email length per RFC 5321
 */
export const MAX_EMAIL_LENGTH = 254;

/**
 * Maximum name length
 */
export const MAX_NAME_LENGTH = 255;

/**
 * Valid role values (for runtime validation)
 */
export const VALID_ROLES: readonly UserRole[] = ['manager', 'admin'] as const;

/**
 * Default pagination limit
 */
export const DEFAULT_PAGE_LIMIT = 100;

/**
 * Maximum pagination limit
 */
export const MAX_PAGE_LIMIT = 500;

// ============================================================================
// Type Guards (for runtime type checking)
// ============================================================================

/**
 * Type guard to check if a string is a valid UserRole
 */
export function isValidRole(value: string): value is UserRole {
  return VALID_ROLES.includes(value as UserRole);
}

/**
 * Type guard to check if a value is a valid User object
 */
export function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const user = value as Record<string, unknown>;

  return (
    typeof user.userId === 'string' &&
    typeof user.name === 'string' &&
    Array.isArray(user.roles) &&
    user.roles.every((r) => typeof r === 'string' && isValidRole(r)) &&
    (user.team === undefined || user.team === null || typeof user.team === 'string') &&
    typeof user.isActive === 'boolean' &&
    typeof user.createdAt === 'number' &&
    typeof user.updatedAt === 'number' &&
    typeof user.createdBy === 'string'
  );
}

/**
 * Type guard to check if a value is a valid ApiError
 */
export function isApiError(value: unknown): value is ApiError {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const error = value as Record<string, unknown>;

  return typeof error.error === 'string' && typeof error.message === 'string';
}

// ============================================================================
// HTTP Status Codes (for reference)
// ============================================================================

/**
 * HTTP status codes used by the User Management API
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type HttpStatusCode = (typeof HttpStatus)[keyof typeof HttpStatus];
