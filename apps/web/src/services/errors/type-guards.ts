/**
 * Type Guards for Error Handling
 * Runtime type checking for custom error classes
 */

import { ApiError, NetworkError } from "./base";
import {
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    InternalServerError,
} from "./http-errors";

/**
 * Check if error is any ApiError
 */
export function isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
}

/**
 * Check if error is a NetworkError
 */
export function isNetworkError(error: unknown): error is NetworkError {
    return error instanceof NetworkError;
}

/**
 * Check if error is a BadRequestError (400)
 */
export function isBadRequestError(error: unknown): error is BadRequestError {
    return error instanceof BadRequestError;
}

/**
 * Check if error is an UnauthorizedError (401)
 */
export function isUnauthorizedError(
    error: unknown
): error is UnauthorizedError {
    return error instanceof UnauthorizedError;
}

/**
 * Check if error is a ForbiddenError (403)
 */
export function isForbiddenError(error: unknown): error is ForbiddenError {
    return error instanceof ForbiddenError;
}

/**
 * Check if error is a NotFoundError (404)
 */
export function isNotFoundError(error: unknown): error is NotFoundError {
    return error instanceof NotFoundError;
}

/**
 * Check if error is a ConflictError (409)
 */
export function isConflictError(error: unknown): error is ConflictError {
    return error instanceof ConflictError;
}

/**
 * Check if error is an InternalServerError (500)
 */
export function isInternalServerError(
    error: unknown
): error is InternalServerError {
    return error instanceof InternalServerError;
}

/**
 * Check if error is authentication-related (401 or 403)
 */
export function isAuthenticationError(
    error: unknown
): error is UnauthorizedError | ForbiddenError {
    return isUnauthorizedError(error) || isForbiddenError(error);
}

/**
 * Check if error is a client error (4xx)
 */
export function isClientError(error: unknown): error is ApiError {
    return isApiError(error) && error.statusCode >= 400 && error.statusCode < 500;
}

/**
 * Check if error is a server error (5xx)
 */
export function isServerError(error: unknown): error is ApiError {
    return isApiError(error) && error.statusCode >= 500 && error.statusCode < 600;
}

/**
 * Extract error message safely from any error type
 */
export function getErrorMessage(error: unknown): string {
    if (isApiError(error)) {
        return error.message;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

/**
 * Extract error code safely from any error type
 */
export function getErrorCode(error: unknown): string | undefined {
    if (isApiError(error)) {
        return error.errorCode;
    }
    return undefined;
}
