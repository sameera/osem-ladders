/**
 * Assessment Plan React Query Hooks
 * Hooks for assessment plan data fetching and mutations with cache management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
