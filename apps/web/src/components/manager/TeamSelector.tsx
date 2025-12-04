/**
 * TeamSelector Component
 * Reusable team dropdown with role-based filtering
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTeams } from '@/hooks/useTeams';
import { useApi } from '@/hooks/useApi';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { User } from '@/types/users';
import type { ApiResponse } from '@/types/teams';

interface TeamSelectorProps {
  value: string;
  onChange: (teamId: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function TeamSelector({
  value,
  onChange,
  disabled = false,
  placeholder = 'Select a team...',
}: TeamSelectorProps) {
  const { get } = useApi();

  // Fetch current user profile
  const { data: currentUser, isLoading: isLoadingUser } = useQuery<User>({
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

  const { data: teamsData, isLoading: isLoadingTeams } = useTeams({
    includeArchived: false,
  });

  // Get all active teams
  const allTeams = useMemo(() => {
    return teamsData?.pages.flatMap((page) => page.teams) || [];
  }, [teamsData]);

  // Filter teams based on user role
  const filteredTeams = useMemo(() => {
    if (!currentUser) return [];

    // Admins see all teams
    if (currentUser.roles.includes('admin')) {
      return allTeams;
    }

    // Managers see only teams they manage
    if (currentUser.roles.includes('manager')) {
      return allTeams.filter((team) => team.managerId === currentUser.userId);
    }

    // Default: no teams
    return [];
  }, [currentUser, allTeams]);

  const isLoading = isLoadingUser || isLoadingTeams;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 border rounded-md">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading teams...</span>
      </div>
    );
  }

  if (filteredTeams.length === 0) {
    return (
      <div className="px-3 py-2 text-sm text-gray-500 border rounded-md bg-gray-50">
        No teams available. {!currentUser?.roles.includes('admin') && 'You must be assigned as a manager to a team.'}
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger aria-label="Select team">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {filteredTeams.map((team) => (
          <SelectItem key={team.teamId} value={team.teamId}>
            {team.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
