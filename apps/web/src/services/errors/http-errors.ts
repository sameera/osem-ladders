/**
 * HTTP Status-Specific Error Classes
 * One class per HTTP error status code
 */

import { ApiError, type ApiErrorParams } from "./base";

/**
 * 400 Bad Request - Client sent invalid data
 */
export class BadRequestError extends ApiError {
    constructor(params: Omit<ApiErrorParams, "statusCode">) {
        super({ ...params, statusCode: 400 });
        this.name = "BadRequestError";
    }
}

/**
 * 401 Unauthorized - Authentication required or failed
 */
export class UnauthorizedError extends ApiError {
    constructor(params: Omit<ApiErrorParams, "statusCode">) {
        super({ ...params, statusCode: 401 });
        this.name = "UnauthorizedError";
    }
}

/**
 * 403 Forbidden - Authenticated but insufficient permissions
 */
export class ForbiddenError extends ApiError {
    constructor(params: Omit<ApiErrorParams, "statusCode">) {
        super({ ...params, statusCode: 403 });
        this.name = "ForbiddenError";
    }
}

/**
 * 404 Not Found - Resource does not exist
 */
export class NotFoundError extends ApiError {
    constructor(params: Omit<ApiErrorParams, "statusCode">) {
        super({ ...params, statusCode: 404 });
        this.name = "NotFoundError";
    }
}

/**
 * 409 Conflict - Resource already exists or state conflict
 */
export class ConflictError extends ApiError {
    constructor(params: Omit<ApiErrorParams, "statusCode">) {
        super({ ...params, statusCode: 409 });
        this.name = "ConflictError";
    }
}

/**
 * 500 Internal Server Error - Server-side error
 */
export class InternalServerError extends ApiError {
    constructor(params: Omit<ApiErrorParams, "statusCode">) {
        super({ ...params, statusCode: 500 });
        this.name = "InternalServerError";
    }
}

/**
 * Unknown/Unhandled HTTP Status Code
 */
export class UnknownApiError extends ApiError {
    constructor(params: ApiErrorParams) {
        super(params);
        this.name = "UnknownApiError";
    }
}
