/**
 * AssessmentPlanManagement Component
 * Main container for assessment plan management features
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AssessmentPlanForm } from './AssessmentPlanForm';
import { AssessmentPlanTable } from './AssessmentPlanTable';
import { useCreateAssessmentPlan, useMultiTeamAssessmentPlans } from '@/hooks/useAssessmentPlans';
import { useTeams } from '@/hooks/useTeams';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import type { CreateAssessmentPlanInput } from '@/types/assessments';
import type { User } from '@/types/users';
import type { ApiResponse } from '@/types/teams';

export function AssessmentPlanManagement() {
  const { mutate: createPlan, isPending, error } = useCreateAssessmentPlan();
  const { toast } = useToast();
  const [formError, setFormError] = useState<Error | null>(null);
  const { get } = useApi();

  // Fetch current user profile
  const { data: currentUser } = useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await get<ApiResponse<User>>('/users/me');
      if (!response.data) {
        throw new Error('User data not found in response');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const { data: teamsData } = useTeams({ includeArchived: false });

  // Get all teams the user has access to
  const allTeams = useMemo(() => {
    return teamsData?.pages.flatMap((page) => page.teams) || [];
  }, [teamsData]);

  // Filter teams based on user role
  const accessibleTeams = useMemo(() => {
    if (!currentUser) return [];

    if (currentUser.roles.includes('admin')) {
      return allTeams;
    }

    if (currentUser.roles.includes('manager')) {
      return allTeams.filter((team) => team.managerId === currentUser.userId);
    }

    return [];
  }, [currentUser, allTeams]);

  // Fetch all plans for accessible teams
  const teamIds = useMemo(() => accessibleTeams.map(t => t.id), [accessibleTeams]);
  const {
    plans: allPlans,
    isLoading: isLoadingPlans,
    errors: planErrors
  } = useMultiTeamAssessmentPlans(teamIds);

  const handleCreatePlan = (data: { teamId: string; input: CreateAssessmentPlanInput }) => {
    setFormError(null);

    createPlan(data, {
      onSuccess: (newPlan) => {
        toast({
          title: 'Assessment plan created successfully',
          description: `${newPlan.name} has been created for ${newPlan.teamId}.`,
          variant: 'default',
        });
      },
      onError: (err: Error) => {
        let errorMessage = err.message;

        if (err.message.includes('INVALID_PLAN_CONFIG')) {
          errorMessage = 'Invalid plan configuration. Each category must have at least one competency, and each competency must have at least one expectation.';
        } else if (err.message.includes('409')) {
          errorMessage = 'A plan already exists for this team and season.';
        } else if (err.message.includes('TEAM_NOT_FOUND')) {
          errorMessage = 'Selected team does not exist.';
        } else if (err.message.includes('FORBIDDEN') || err.message.includes('403')) {
          errorMessage = 'You do not have permission to create plans for this team.';
        } else if (err.message.includes('UNAUTHORIZED') || err.message.includes('401')) {
          errorMessage = 'Authentication required. Please log in again.';
        }

        setFormError(new Error(errorMessage));

        toast({
          title: 'Failed to create plan',
          description: errorMessage,
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Plan Creation Form */}
      <AssessmentPlanForm
        onSubmit={handleCreatePlan}
        isLoading={isPending}
        error={formError}
      />

      {/* Plan List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Assessment Plans</h2>
          <div className="text-sm text-gray-500">
            {accessibleTeams.length} team{accessibleTeams.length !== 1 ? 's' : ''} accessible
          </div>
        </div>

        {/* Show errors for teams that failed to load */}
        {planErrors.length > 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> Could not load plans for {planErrors.length} team{planErrors.length !== 1 ? 's' : ''}
              {planErrors.length <= 3 && `: ${planErrors.map(e => e.teamId).join(', ')}`}
            </p>
          </div>
        )}

        {/* Assessment Plans Table */}
        <AssessmentPlanTable
          plans={allPlans}
          isLoading={isLoadingPlans}
          emptyMessage={
            accessibleTeams.length === 0
              ? "You don't have access to any teams. Contact an administrator to be added to a team."
              : "No assessment plans found. Create your first plan using the form above."
          }
          onEdit={() => {
            // React Query cache will auto-invalidate on mutation
          }}
        />
      </div>
    </div>
  );
}
