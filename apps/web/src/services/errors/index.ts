/**
 * API Error Classes and Utilities
 * Public API for error handling
 */

// Export all error classes
export { ApiError, NetworkError, type ApiErrorParams } from "./base";

export {
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    InternalServerError,
    UnknownApiError,
} from "./http-errors";

// Export type guards
export {
    isApiError,
    isNetworkError,
    isBadRequestError,
    isUnauthorizedError,
    isForbiddenError,
    isNotFoundError,
    isConflictError,
    isInternalServerError,
    isAuthenticationError,
    isClientError,
    isServerError,
    getErrorMessage,
    getErrorCode,
} from "./type-guards";

import {
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    InternalServerError,
    UnknownApiError,
} from "./http-errors";

/**
 * Error response body structure from API
 */
interface ErrorResponseBody {
    success?: boolean;
    error?: {
        code?: string;
        message?: string;
    };
    message?: string;
    code?: string;
    details?: Record<string, unknown>;
}

/**
 * Factory function to create appropriate error from HTTP response
 * This is the main entry point for useApi hook
 */
export async function createErrorFromResponse(
    response: Response,
    url: string,
    method: string
): Promise<
    | BadRequestError
    | UnauthorizedError
    | ForbiddenError
    | NotFoundError
    | ConflictError
    | InternalServerError
    | UnknownApiError
> {
    const statusCode = response.status;
    let errorBody: ErrorResponseBody | null = null;
    let errorMessage: string;
    let errorCode: string | undefined;
    let details: Record<string, unknown> | undefined;

    // Try to parse error response body
    try {
        const text = await response.text();
        if (text) {
            errorBody = JSON.parse(text);
        }
    } catch {
        // Ignore parse errors, use default message
    }

    // Extract error information from response body
    if (errorBody) {
        // Handle Teams API format: { success: false, error: { code, message } }
        if (errorBody.error) {
            errorMessage = errorBody.error.message || response.statusText;
            errorCode = errorBody.error.code;
        }
        // Handle Users API format: { error: "CODE", message: "...", details: {...} }
        else if (errorBody.message) {
            errorMessage = errorBody.message;
            errorCode = errorBody.code;
            details = errorBody.details;
        }
        // Fallback
        else {
            errorMessage = `${method} ${url} failed: ${statusCode} ${response.statusText}`;
        }
    } else {
        errorMessage = `${method} ${url} failed: ${statusCode} ${response.statusText}`;
    }

    // Common params for all errors
    const baseParams = {
        message: errorMessage,
        url,
        method,
        errorCode,
        details,
        responseBody: errorBody,
    };

    // Map status code to specific error class
    switch (statusCode) {
        case 400:
            return new BadRequestError(baseParams);
        case 401:
            return new UnauthorizedError(baseParams);
        case 403:
            return new ForbiddenError(baseParams);
        case 404:
            return new NotFoundError(baseParams);
        case 409:
            return new ConflictError(baseParams);
        case 500:
            return new InternalServerError(baseParams);
        default:
            return new UnknownApiError({ ...baseParams, statusCode });
    }
}
