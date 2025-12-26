/**
 * Team Management React Query Hooks
 * Hooks for team data fetching and mutations with cache management
 */

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { createTeamApi } from '@/services/team-api';
import type {
  Team,
  CreateTeamRequest,
  UpdateTeamRequest,
  ListTeamsQuery,
} from '@/types/teams';

/**
 * T014: Hook for fetching team list with infinite scroll support
 */
export function useTeams(query?: ListTeamsQuery) {
  const api = useApi();
  const teamApi = createTeamApi(api);

  return useInfiniteQuery({
    queryKey: ['teams', query],
    queryFn: async () => {
      const response = await teamApi.fetchTeams(query);
      return response;
    },
    getNextPageParam: () => undefined, // No pagination yet, will add in Phase 4
    initialPageParam: undefined,
    staleTime: 60 * 1000, // 1 minute cache per constitution
  });
}

/**
 * T015: Hook for fetching a single team by ID (admin endpoint)
 */
export function useTeam(teamId: string) {
  const api = useApi();
  const teamApi = createTeamApi(api);

  return useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamApi.fetchTeam(teamId),
    enabled: !!teamId,
    staleTime: 60 * 1000, // 1 minute cache
  });
}

/**
 * Hook for fetching a single team by ID (non-admin endpoint)
 * Accessible by team members, managers, or admins
 */
export function useTeamAsMember(teamId: string) {
  const api = useApi();
  const teamApi = createTeamApi(api);

  return useQuery({
    queryKey: ['teamMember', teamId],
    queryFn: () => teamApi.fetchTeamAsMember(teamId),
    enabled: !!teamId,
    staleTime: 60 * 1000, // 1 minute cache
  });
}

/**
 * T016: Hook for creating a new team with cache invalidation
 */
export function useCreateTeam() {
  const api = useApi();
  const teamApi = createTeamApi(api);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateTeamRequest) => teamApi.createTeam(request),
    onSuccess: () => {
      // Invalidate team list queries to refetch with new team
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

/**
 * Hook for updating team details with cache invalidation
 */
export function useUpdateTeam() {
  const api = useApi();
  const teamApi = createTeamApi(api);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, request }: { teamId: string; request: UpdateTeamRequest }) =>
      teamApi.updateTeam(teamId, request),
    onSuccess: () => {
      // Invalidate team list queries to refetch with updated team
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

/**
 * T047: Hook for updating team manager with cache invalidation
 */
export function useUpdateTeamManager() {
  const api = useApi();
  const teamApi = createTeamApi(api);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, managerId }: { teamId: string; managerId: string | null }) =>
      teamApi.updateTeamManager(teamId, managerId),
    onSuccess: () => {
      // Invalidate team list queries to refetch with updated manager
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

/**
 * Hook for adding members to team with cache invalidation
 */
export function useAddTeamMembers() {
  const api = useApi();
  const teamApi = createTeamApi(api);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, userIds }: { teamId: string; userIds: string[] }) =>
      teamApi.addTeamMembers(teamId, userIds),
    onSuccess: (_, { teamId }) => {
      // Invalidate team details, team list, and team members
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['teamMembers', teamId] });
    },
  });
}

/**
 * Hook for removing member from team with cache invalidation
 */
export function useRemoveTeamMember() {
  const api = useApi();
  const teamApi = createTeamApi(api);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      teamApi.removeTeamMember(teamId, userId),
    onSuccess: (_, { teamId }) => {
      // Invalidate team details, team list, and team members
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['teamMembers', teamId] });
    },
  });
}
