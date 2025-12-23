/**
 * Base API Error Types and Classes
 * Foundation for all API error handling
 */

/**
 * Parameters for constructing an ApiError
 */
export interface ApiErrorParams {
    message: string;
    statusCode: number;
    url: string;
    method: string;
    errorCode?: string;
    details?: Record<string, unknown>;
    responseBody?: unknown;
}

/**
 * Base class for all API errors
 * Extends Error with structured API error information
 */
export class ApiError extends Error {
    readonly statusCode: number;
    readonly errorCode?: string;
    readonly details?: Record<string, unknown>;
    readonly url: string;
    readonly method: string;
    readonly responseBody?: unknown;

    constructor(params: ApiErrorParams) {
        super(params.message);
        this.name = "ApiError";
        this.statusCode = params.statusCode;
        this.errorCode = params.errorCode;
        this.details = params.details;
        this.url = params.url;
        this.method = params.method;
        this.responseBody = params.responseBody;

        // Maintains proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    /**
     * Returns a developer-friendly string representation
     */
    toString(): string {
        const parts = [
            `${this.name}: ${this.message}`,
            `  Status: ${this.statusCode}`,
            `  Method: ${this.method}`,
            `  URL: ${this.url}`,
        ];

        if (this.errorCode) {
            parts.push(`  Error Code: ${this.errorCode}`);
        }

        return parts.join("\n");
    }
}

/**
 * Network errors (fetch failures, timeouts, etc.)
 */
export class NetworkError extends ApiError {
    constructor(
        params: Omit<ApiErrorParams, "statusCode"> & { statusCode?: number }
    ) {
        super({
            ...params,
            statusCode: params.statusCode || 0,
        });
        this.name = "NetworkError";
    }
}
