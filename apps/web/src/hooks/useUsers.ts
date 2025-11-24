/**
 * React Query Hooks for User Management
 * Custom hooks for managing user data with caching and optimistic updates
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { useApi } from './useApi';
import { createUserApi } from '../services/user-api';
import type {
  User,
  CreateUserRequest,
  UpdateUserRolesRequest,
  ListUsersQuery,
  ListUsersResponse
} from '../types/users';

// Query keys for cache management
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: ListUsersQuery) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

/**
 * Hook: Fetch paginated list of users with infinite scroll
 * Cache TTL: 1 minute (per constitution)
 */
export function useUsers(query?: Omit<ListUsersQuery, 'nextToken'>) {
  const { get, post, patch, del } = useApi();
  const userApi = createUserApi(get, post, patch, del);

  return useInfiniteQuery({
    queryKey: userKeys.list(query || {}),
    queryFn: ({ pageParam }) =>
      userApi.fetchUsers({
        ...query,
        nextToken: pageParam
      }),
    getNextPageParam: (lastPage) => lastPage.nextToken || undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 60000, // 1 minute cache per constitution
  });
}

/**
 * Hook: Fetch single user by ID
 */
export function useUser(userId: string) {
  const { get, post, patch, del } = useApi();
  const userApi = createUserApi(get, post, patch, del);

  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => userApi.fetchUser(userId),
    enabled: !!userId,
    staleTime: 60000, // 1 minute cache
  });
}

/**
 * Hook: Create new user with optimistic updates
 */
export function useCreateUser() {
  const queryClient = useQueryClient();
  const { get, post, patch, del } = useApi();
  const userApi = createUserApi(get, post, patch, del);

  return useMutation({
    mutationFn: (request: CreateUserRequest) => userApi.createUser(request),
    onSuccess: (newUser) => {
      // Invalidate all user lists to refetch with new user
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      // Set the new user in cache
      queryClient.setQueryData(userKeys.detail(newUser.userId), newUser);
    },
  });
}

/**
 * Hook: Update user roles with optimistic updates and rollback
 */
export function useUpdateUserRoles(userId: string) {
  const queryClient = useQueryClient();
  const { get, post, patch, del } = useApi();
  const userApi = createUserApi(get, post, patch, del);

  return useMutation({
    mutationFn: (request: UpdateUserRolesRequest) =>
      userApi.updateUserRoles(userId, request),
    onMutate: async (request) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.detail(userId) });
      await queryClient.cancelQueries({ queryKey: userKeys.lists() });

      // Snapshot previous values
      const previousUser = queryClient.getQueryData(userKeys.detail(userId));
      const previousLists = queryClient.getQueriesData({ queryKey: userKeys.lists() });

      // Optimistically update user detail
      if (previousUser) {
        queryClient.setQueryData(userKeys.detail(userId), {
          ...(previousUser as User),
          roles: request.roles,
          updatedAt: Date.now()
        });
      }

      // Optimistically update user in lists
      queryClient.setQueriesData(
        { queryKey: userKeys.lists() },
        (old: InfiniteData<ListUsersResponse> | undefined) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              users: page.users.map(u =>
                u.userId === userId
                  ? { ...u, roles: request.roles, updatedAt: Date.now() }
                  : u
              )
            }))
          };
        }
      );

      return { previousUser, previousLists };
    },
    onError: (err, request, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.detail(userId), context.previousUser);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

/**
 * Hook: Deactivate user with cache invalidation
 */
export function useDeactivateUser() {
  const queryClient = useQueryClient();
  const { get, post, patch, del } = useApi();
  const userApi = createUserApi(get, post, patch, del);

  return useMutation({
    mutationFn: (userId: string) => userApi.deactivateUser(userId),
    onSuccess: (result) => {
      // Update user in cache to mark as inactive
      queryClient.setQueryData(
        userKeys.detail(result.userId),
        (old: User | undefined) => {
          if (!old) return old;
          return {
            ...old,
            isActive: false,
            updatedAt: result.deactivatedAt
          };
        }
      );

      // Update user in lists
      queryClient.setQueriesData(
        { queryKey: userKeys.lists() },
        (old: InfiniteData<ListUsersResponse> | undefined) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              users: page.users.map(u =>
                u.userId === result.userId
                  ? { ...u, isActive: false, updatedAt: result.deactivatedAt }
                  : u
              )
            }))
          };
        }
      );

      // Invalidate to refetch
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
