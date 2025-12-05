/**
 * ManagerSelector Component
 * Dropdown for selecting/unassigning team manager from users with manager role
 */

import { useState } from 'react';
import { useUsers } from '@/hooks/useUsers';
import { useUpdateTeamManager } from '@/hooks/useTeams';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { TeamWithDetails } from '@/types/teams';

interface ManagerSelectorProps {
  team: TeamWithDetails;
  onUpdate?: (managerId: string | null) => void;
}

export function ManagerSelector({ team, onUpdate }: ManagerSelectorProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch all active users
  const { data: usersData, isLoading: isLoadingUsers } = useUsers({
    status: 'active',
  });

  const { mutate: updateManager } = useUpdateTeamManager();

  // Get all managers (users with "manager" role)
  const users = usersData?.pages.flatMap((page) => page.users) || [];
  const managers = users.filter((user) => user.roles.includes('manager'));

  const handleManagerChange = (value: string) => {
    const newManagerId = value === 'none' ? null : value;
    setIsUpdating(true);

    updateManager(
      { teamId: team.id, managerId: newManagerId },
      {
        onSuccess: () => {
          // T052: Success toast notification
          toast({
            title: 'Team manager updated',
            description: newManagerId
              ? `${managers.find((m) => m.userId === newManagerId)?.name} is now the manager of ${team.name}`
              : `Manager removed from ${team.name}`,
            variant: 'default',
          });
          setIsUpdating(false);
          onUpdate?.(newManagerId);
        },
        onError: (error: Error) => {
          setIsUpdating(false);

          // T050: Handle INVALID_MANAGER_ROLE error
          // T051: Handle MANAGER_DEACTIVATED error
          let errorMessage = error.message;

          if (error.message.includes('INVALID_MANAGER_ROLE')) {
            errorMessage = 'The selected user does not have manager role.';
          } else if (error.message.includes('MANAGER_DEACTIVATED')) {
            errorMessage = 'The selected user is deactivated and cannot be assigned as manager.';
          } else if (error.message.includes('MANAGER_NOT_FOUND')) {
            errorMessage = 'The selected manager was not found.';
          } else if (error.message.includes('TEAM_NOT_FOUND')) {
            errorMessage = 'Team not found.';
          } else if (error.message.includes('FORBIDDEN') || error.message.includes('403')) {
            errorMessage = 'You do not have permission to update team managers.';
          }

          toast({
            title: 'Failed to update manager',
            description: errorMessage,
            variant: 'destructive',
          });
        },
      }
    );
  };

  if (isLoadingUsers) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Loading managers...</span>
      </div>
    );
  }

  return (
    <Select
      value={team.managerId || 'none'}
      onValueChange={handleManagerChange}
      disabled={isUpdating}
    >
      <SelectTrigger className="w-full md:w-[200px]">
        <SelectValue placeholder="Select manager" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="italic text-gray-500">None</span>
        </SelectItem>
        {managers.map((manager) => (
          <SelectItem key={manager.userId} value={manager.userId}>
            {manager.name}
          </SelectItem>
        ))}
        {managers.length === 0 && (
          <div className="px-2 py-1.5 text-sm text-gray-500">
            No managers available
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
