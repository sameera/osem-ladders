/**
 * AssessmentPlanManagement Component
 * Main container for assessment plan management features
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { EditPlanDialog } from './EditPlanDialog';
import { AssessmentPlanTable } from './AssessmentPlanTable';
import { useMultiTeamAssessmentPlans } from '@/hooks/useAssessmentPlans';
import { useTeams } from '@/hooks/useTeams';
import { useApi } from '@/hooks/useApi';
import type { User } from '@/types/users';
import type { ApiResponse } from '@/types/teams';

export function AssessmentPlanManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
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

  return (
    <div className="space-y-6">
      {/* Plan List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Assessment Plans</h2>
          <div className="flex items-center gap-3">
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Assessment Plan
            </Button>
            <div className="text-sm text-gray-500">
              {accessibleTeams.length} team{accessibleTeams.length !== 1 ? 's' : ''} accessible
            </div>
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
              : "No assessment plans found. Click 'New Assessment Plan' to create one."
          }
          onEdit={() => {
            // React Query cache will auto-invalidate on mutation
          }}
        />
      </div>

      {/* Create Plan Dialog */}
      <EditPlanDialog
        mode="create"
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onEdit={() => {
          // React Query cache will auto-invalidate on mutation in EditPlanDialog
        }}
      />
    </div>
  );
}
