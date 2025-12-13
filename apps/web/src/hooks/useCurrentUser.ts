/**
 * Current User Hook
 * Fetches the current logged-in user from /users/me
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useApi } from './useApi';
import type { User } from '@/types/users';

interface GetUserMeResponse {
  data?: User;
  user?: User;
}

/**
 * Hook to fetch the current logged-in user
 */
export function useCurrentUser() {
  const { isAuthenticated } = useAuth();
  const { get } = useApi();

  return useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await get<GetUserMeResponse>('/users/me');

      // Handle both response formats: { data: User } or { user: User }
      const user = response.data || response.user;

      if (!user) {
        throw new Error('User data not found in response');
      }

      return user;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}
