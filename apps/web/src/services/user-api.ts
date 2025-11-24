/**
 * User API Client
 * Frontend service for user management API calls
 */

import type {
  User,
  CreateUserRequest,
  UpdateUserRolesRequest,
  ListUsersQuery,
  ListUsersResponse,
  UserResponse,
  GetUserResponse,
  DeactivateUserResponse
} from '../types/users';

export interface UserApiClient {
  fetchUsers: (query?: ListUsersQuery) => Promise<ListUsersResponse>;
  fetchUser: (userId: string) => Promise<User>;
  createUser: (request: CreateUserRequest) => Promise<User>;
  updateUserRoles: (userId: string, request: UpdateUserRolesRequest) => Promise<User>;
  deactivateUser: (userId: string) => Promise<DeactivateUserResponse>;
}

/**
 * Create user API client with authenticated fetch
 * @param apiFetch - Authenticated fetch function from useApi hook
 */
export function createUserApi(
  get: <T = any>(url: string) => Promise<T>,
  post: <T = any>(url: string, body?: any) => Promise<T>,
  patch: <T = any>(url: string, body?: any) => Promise<T>,
  del: <T = any>(url: string) => Promise<T>
): UserApiClient {
  const baseUrl = '/growth/admin/users';

  return {
    /**
     * Fetch paginated list of users with optional search and filters
     */
    async fetchUsers(query?: ListUsersQuery): Promise<ListUsersResponse> {
      const params = new URLSearchParams();

      if (query?.limit) {
        params.append('limit', query.limit.toString());
      }
      if (query?.nextToken) {
        params.append('nextToken', query.nextToken);
      }
      if (query?.search) {
        params.append('search', query.search);
      }
      if (query?.status) {
        params.append('status', query.status);
      }

      const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
      return get<ListUsersResponse>(url);
    },

    /**
     * Fetch single user by ID
     */
    async fetchUser(userId: string): Promise<User> {
      const response = await get<GetUserResponse>(`${baseUrl}/${encodeURIComponent(userId)}`);
      return response.user;
    },

    /**
     * Create a new user
     */
    async createUser(request: CreateUserRequest): Promise<User> {
      const response = await post<UserResponse>(baseUrl, request);
      return response.user;
    },

    /**
     * Update user roles
     */
    async updateUserRoles(userId: string, request: UpdateUserRolesRequest): Promise<User> {
      const response = await patch<UserResponse>(
        `${baseUrl}/${encodeURIComponent(userId)}`,
        request
      );
      return response.user;
    },

    /**
     * Deactivate user (soft delete)
     */
    async deactivateUser(userId: string): Promise<DeactivateUserResponse> {
      return del<DeactivateUserResponse>(`${baseUrl}/${encodeURIComponent(userId)}`);
    }
  };
}
