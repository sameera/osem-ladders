/**
 * Assessment Report React Query Hook
 * Hook for assessment report data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { createAssessmentReportApi } from '@/services/assessment-report-api';
import type {
  AssessmentType,
  CreateReportInput,
  UpdateReportInput,
} from '@/types/reports';

/**
 * Hook for fetching and managing an assessment report
 */
export function useAssessmentReport(
  userId?: string,
  assessmentId?: string,
  type?: AssessmentType
) {
  const api = useApi();
  const reportApi = createAssessmentReportApi(api);
  const queryClient = useQueryClient();

  const reportId = userId && assessmentId && type ? `${userId}|${assessmentId}|${type}` : undefined;

  // Fetch existing report
  const { data: report, isLoading, error } = useQuery({
    queryKey: ['assessmentReport', userId, assessmentId, type],
    queryFn: async () => {
      if (!reportId) throw new Error('Report ID parameters are required');
      return await reportApi.fetchReport(reportId);
    },
    enabled: !!reportId,
    staleTime: 60 * 1000, // 1 minute
  });

  // Create report mutation
  const createMutation = useMutation({
    mutationFn: async (input: CreateReportInput) => {
      return await reportApi.createReport(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['assessmentReport', userId, assessmentId, type],
      });
    },
  });

  // Update report mutation
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateReportInput) => {
      if (!reportId) throw new Error('Report ID is required');
      return await reportApi.updateReport(reportId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['assessmentReport', userId, assessmentId, type],
      });
    },
  });

  // Submit report mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!reportId) throw new Error('Report ID is required');
      return await reportApi.submitReport(reportId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['assessmentReport', userId, assessmentId, type],
      });
    },
  });

  return {
    report,
    isLoading,
    error,
    createReport: createMutation.mutateAsync,
    updateReport: updateMutation.mutateAsync,
    submitReport: submitMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isSubmitting: submitMutation.isPending,
  };
}
