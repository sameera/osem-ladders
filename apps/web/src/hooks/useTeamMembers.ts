/**
 * Team Members React Query Hook
 * Hook for fetching team members with cache management
 */

import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';
import { createTeamApi } from '@/services/team-api';
import type { User } from '@/types/users';

/**
 * Hook for fetching team members
 * @param teamId - The team ID to fetch members for
 * @param enabled - Whether to enable the query (default: true)
 */
export function useTeamMembers(teamId: string, enabled: boolean = true) {
  const api = useApi();
  const teamApi = createTeamApi(api);

  return useQuery<User[]>({
    queryKey: ['teamMembers', teamId],
    queryFn: () => teamApi.fetchTeamMembers(teamId),
    enabled: enabled && !!teamId,
    staleTime: 60 * 1000, // 1 minute cache per constitution
  });
}
