/**
 * Manager Check Hook
 * Determines if current user is the manager of a target user
 */

import { useMemo } from 'react';
import { useCurrentUser } from './useCurrentUser';
import { useUserMeta } from './useUserMeta';
import { useTeamAsMember } from './useTeams';

/**
 * Hook to check if current user is the manager of the specified user
 */
export function useManagerCheck(userId?: string) {
  const { data: currentUser } = useCurrentUser();
  const { data: targetUser } = useUserMeta(userId);
  const { data: targetTeam, error: teamError } = useTeamAsMember(targetUser?.team || '');

  const isManager = useMemo(() => {
    if (!currentUser || !targetUser || !targetUser.team || !targetTeam) {
      return false;
    }

    // Check if current user is the manager of the target user's team
    return targetTeam.managerId === currentUser.userId;
  }, [currentUser, targetUser, targetTeam]);

  const isLoading = !currentUser || (userId && (!targetUser || (targetUser.team && !targetTeam)));

  return {
    isManager,
    isLoading,
    currentUser,
    targetUser,
    targetTeam,
    error: teamError,
  };
}
