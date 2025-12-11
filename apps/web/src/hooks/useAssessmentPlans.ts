/**
 * Assessment Plan React Query Hooks
 * Hooks for assessment plan data fetching and mutations with cache management
 */

import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import { useApi } from './useApi';
import { createAssessmentPlanApi } from '@/services/assessment-plan-api';
import type {
  AssessmentPlan,
  CreateAssessmentPlanInput,
  ListPlansQuery,
} from '@/types/assessments';

/**
 * Hook for fetching assessment plans for a specific team
 */
export function useAssessmentPlans(teamId?: string, query?: ListPlansQuery) {
  const api = useApi();
  const planApi = createAssessmentPlanApi(api);

  return useQuery({
    queryKey: ['assessmentPlans', teamId, query],
    queryFn: () => {
      if (!teamId) throw new Error('Team ID is required');
      return planApi.fetchPlans(teamId, query);
    },
    enabled: !!teamId,
    staleTime: 60 * 1000, // 1 minute cache
  });
}

/**
 * Hook for fetching a specific assessment plan by team and season
 */
export function useAssessmentPlan(teamId?: string, season?: string) {
  const api = useApi();
  const planApi = createAssessmentPlanApi(api);

  return useQuery({
    queryKey: ['assessmentPlan', teamId, season],
    queryFn: () => {
      if (!teamId || !season) throw new Error('Team ID and season are required');
      return planApi.fetchPlan(teamId, season);
    },
    enabled: !!teamId && !!season,
    staleTime: 60 * 1000, // 1 minute cache
  });
}

/**
 * Hook for creating or updating an assessment plan with cache invalidation
 */
export function useCreateAssessmentPlan() {
  const api = useApi();
  const planApi = createAssessmentPlanApi(api);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, input }: { teamId: string; input: CreateAssessmentPlanInput }) =>
      planApi.createOrUpdatePlan(teamId, input),
    onSuccess: (_, variables) => {
      // Invalidate plans list for the specific team
      queryClient.invalidateQueries({ queryKey: ['assessmentPlans', variables.teamId] });
      // Also invalidate the specific plan if it was an update
      queryClient.invalidateQueries({
        queryKey: ['assessmentPlan', variables.teamId, variables.input.season]
      });
    },
  });
}

/**
 * Hook for fetching assessment plans for multiple teams in parallel
 * @param teamIds - Array of team IDs to fetch plans for
 * @param query - Optional query parameters
 * @returns Aggregated plans, loading state, and per-team errors
 */
export function useMultiTeamAssessmentPlans(teamIds: string[], query?: ListPlansQuery) {
  const api = useApi();
  const planApi = createAssessmentPlanApi(api);

  const queries = useQueries({
    queries: teamIds.map((teamId) => ({
      queryKey: ['assessmentPlans', teamId, query],
      queryFn: () => planApi.fetchPlans(teamId, query),
      staleTime: 60 * 1000, // 1 minute cache
      // Don't fail the whole query if one team fails
      retry: 1,
    })),
  });

  // Aggregate results
  const allPlans = queries
    .filter((q) => q.isSuccess && q.data)
    .flatMap((q) => q.data as AssessmentPlan[])
    .sort((a, b) => b.createdAt - a.createdAt); // Most recent first

  // Check if any queries are still loading
  const isLoading = queries.some((q) => q.isLoading);

  // Collect errors from failed queries
  const errors = queries
    .filter((q) => q.isError)
    .map((q) => ({
      teamId: teamIds[queries.indexOf(q)],
      error: q.error as Error,
    }));

  return {
    plans: allPlans,
    isLoading,
    errors,
    isSuccess: queries.every((q) => q.isSuccess),
  };
}

/**
 * Hook for toggling assessment plan active status with cache invalidation
 */
export function useTogglePlanStatus() {
  const api = useApi();
  const planApi = createAssessmentPlanApi(api);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, season }: { teamId: string; season: string }) =>
      planApi.togglePlanStatus(teamId, season),
    onSuccess: (_, variables) => {
      // Invalidate plans list for the specific team
      queryClient.invalidateQueries({ queryKey: ['assessmentPlans', variables.teamId] });
      // Also invalidate the specific plan
      queryClient.invalidateQueries({
        queryKey: ['assessmentPlan', variables.teamId, variables.season]
      });
    },
  });
}
