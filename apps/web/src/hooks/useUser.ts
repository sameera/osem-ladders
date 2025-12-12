/**
 * User React Query Hook
 * Hook for fetching individual user data
 */

import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';
import type { User } from '@/types/users';

interface GetUserResponse {
  user: User;
}

/**
 * Hook for fetching a specific user by userId
 * @param userId - User ID (email) to fetch
 */
export function useUser(userId?: string) {
  const { get } = useApi();

  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      const response = await get<GetUserResponse>(`/growth/admin/users/${encodeURIComponent(userId)}`);

      if (!response.user) {
        throw new Error('User data not found in response');
      }

      return response.user;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: false, // Don't retry on 404
  });
}
