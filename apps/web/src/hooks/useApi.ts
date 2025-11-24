import { useAuth as useOidcAuth } from "react-oidc-context";
import { useCallback } from "react";

export interface ApiRequestOptions extends RequestInit {
    // Allow custom headers to be merged with auth headers
    headers?: HeadersInit;
}

export interface UseApiReturn {
    /**
     * Makes an authenticated API request with automatic Authorization header injection
     * @param url - The URL to fetch
     * @param options - Standard fetch options
     * @returns Promise with the fetch Response
     */
    apiCall: (url: string, options?: ApiRequestOptions) => Promise<Response>;

    /**
     * Convenience method for GET requests with JSON parsing
     */
    get: <T = any>(url: string, options?: ApiRequestOptions) => Promise<T>;

    /**
     * Convenience method for POST requests with JSON parsing
     */
    post: <T = any>(
        url: string,
        body?: any,
        options?: ApiRequestOptions
    ) => Promise<T>;

    /**
     * Convenience method for PUT requests with JSON parsing
     */
    put: <T = any>(
        url: string,
        body?: any,
        options?: ApiRequestOptions
    ) => Promise<T>;

    /**
     * Convenience method for PATCH requests with JSON parsing
     */
    patch: <T = any>(
        url: string,
        body?: any,
        options?: ApiRequestOptions
    ) => Promise<T>;

    /**
     * Convenience method for DELETE requests with JSON parsing
     */
    del: <T = any>(url: string, options?: ApiRequestOptions) => Promise<T>;

    /**
     * The current access token (useful for debugging or custom implementations)
     */
    accessToken: string | undefined;
}

/**
 * Custom hook for making authenticated API calls
 * Automatically adds the Authorization header with the user's access token
 *
 * @example
 * ```tsx
 * const { get, post } = useApi();
 *
 * // Simple GET request
 * const data = await get('/api/users');
 *
 * // POST with body
 * const result = await post('/api/users', { name: 'John' });
 * ```
 */
export function useApi(): UseApiReturn {
    const oidcAuth = useOidcAuth();
    const idToken = oidcAuth.user?.id_token;
    const baseUrl = import.meta.env.VITE_API_BASE_URL;

    const apiCall = useCallback(
        async (
            url: string,
            options: ApiRequestOptions = {}
        ): Promise<Response> => {
            if (!idToken) {
                throw new Error(
                    "No access token available. User may not be authenticated."
                );
            }

            // Merge custom headers with Authorization header
            const headers = new Headers(options.headers);
            headers.set("Authorization", `Bearer ${idToken}`);

            const response = await fetch(baseUrl + url, {
                ...options,
                headers,
            });

            return response;
        },
        [idToken]
    );

    const get = useCallback(
        async <T = any>(
            url: string,
            options: ApiRequestOptions = {}
        ): Promise<T> => {
            const response = await apiCall(url, {
                ...options,
                method: "GET",
            });

            if (!response.ok) {
                throw new Error(
                    `GET ${url} failed: ${response.status} ${response.statusText}`
                );
            }

            return response.json();
        },
        [apiCall]
    );

    const post = useCallback(
        async <T = any>(
            url: string,
            body?: any,
            options: ApiRequestOptions = {}
        ): Promise<T> => {
            const headers = new Headers(options.headers);

            // Set Content-Type to JSON if body is provided and not already set
            if (body !== undefined && !headers.has("Content-Type")) {
                headers.set("Content-Type", "application/json");
            }

            const response = await apiCall(url, {
                ...options,
                method: "POST",
                headers,
                body: body !== undefined ? JSON.stringify(body) : undefined,
            });

            if (!response.ok) {
                throw new Error(
                    `POST ${url} failed: ${response.status} ${response.statusText}`
                );
            }

            return response.json();
        },
        [apiCall]
    );

    const put = useCallback(
        async <T = any>(
            url: string,
            body?: any,
            options: ApiRequestOptions = {}
        ): Promise<T> => {
            const headers = new Headers(options.headers);

            // Set Content-Type to JSON if body is provided and not already set
            if (body !== undefined && !headers.has("Content-Type")) {
                headers.set("Content-Type", "application/json");
            }

            const response = await apiCall(url, {
                ...options,
                method: "PUT",
                headers,
                body: body !== undefined ? JSON.stringify(body) : undefined,
            });

            if (!response.ok) {
                throw new Error(
                    `PUT ${url} failed: ${response.status} ${response.statusText}`
                );
            }

            return response.json();
        },
        [apiCall]
    );

    const patch = useCallback(
        async <T = any>(
            url: string,
            body?: any,
            options: ApiRequestOptions = {}
        ): Promise<T> => {
            const headers = new Headers(options.headers);

            // Set Content-Type to JSON if body is provided and not already set
            if (body !== undefined && !headers.has("Content-Type")) {
                headers.set("Content-Type", "application/json");
            }

            const response = await apiCall(url, {
                ...options,
                method: "PATCH",
                headers,
                body: body !== undefined ? JSON.stringify(body) : undefined,
            });

            if (!response.ok) {
                throw new Error(
                    `PATCH ${url} failed: ${response.status} ${response.statusText}`
                );
            }

            return response.json();
        },
        [apiCall]
    );

    const del = useCallback(
        async <T = any>(
            url: string,
            options: ApiRequestOptions = {}
        ): Promise<T> => {
            const response = await apiCall(url, {
                ...options,
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error(
                    `DELETE ${url} failed: ${response.status} ${response.statusText}`
                );
            }

            // Handle empty responses (204 No Content)
            const text = await response.text();
            return text ? JSON.parse(text) : null;
        },
        [apiCall]
    );

    return {
        apiCall,
        get,
        post,
        put,
        patch,
        del,
        accessToken: idToken,
    };
}
