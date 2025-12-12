/**
 * MyTeamsView Component
 * Main container for displaying manager's teams
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TeamSection } from './TeamSection';
import { useTeams } from '@/hooks/useTeams';
import { useApi } from '@/hooks/useApi';
import { useMultiTeamAssessmentPlans } from '@/hooks/useAssessmentPlans';
import type { User } from '@/types/users';
import type { ApiResponse } from '@/types/teams';
import type { AssessmentPlan } from '@/types/assessments';

export function MyTeamsView() {
  const { get } = useApi();

  // Fetch current user
  const { data: currentUser, isLoading: userLoading, error: userError } = useQuery<User>({
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

  // Fetch teams managed by current user
  const { data: teamsData, isLoading: teamsLoading, error: teamsError } = useTeams({
    managerId: currentUser?.userId,
    includeArchived: false, // Only show active teams
  });

  const teams = useMemo(() => {
    return teamsData?.pages.flatMap((page) => page.teams) || [];
  }, [teamsData]);

  // Extract team IDs for fetching assessment plans
  const teamIds = useMemo(() => teams.map(t => t.id), [teams]);

  // Fetch assessment plans for all teams
  const { plans: allPlans } = useMultiTeamAssessmentPlans(teamIds, {
    includeInactive: false
  });

  // Create map of teamId to most recent active plan
  const activePlansByTeam = useMemo(() => {
    const map = new Map<string, AssessmentPlan>();
    allPlans
      .filter(plan => plan.isActive)
      .forEach(plan => {
        const existing = map.get(plan.teamId);
        if (!existing || plan.createdAt > existing.createdAt) {
          map.set(plan.teamId, plan);
        }
      });
    return map;
  }, [allPlans]);

  // Loading state
  if (userLoading || teamsLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="text-gray-500 dark:text-gray-400 mt-4">Loading your teams...</p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (userError || teamsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load teams. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  // Empty state
  if (teams.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No teams assigned</h3>
          <p className="text-gray-500 dark:text-gray-400">
            You are not currently managing any teams.
            <br />
            Contact an administrator if you believe this is an error.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Success state with teams
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Managing {teams.length} team{teams.length !== 1 ? 's' : ''}
        </p>
      </div>
      {teams.map((team) => (
        <TeamSection key={team.id} team={team} activePlan={activePlansByTeam.get(team.id)} />
      ))}
    </div>
  );
}
