/**
 * TeamMembersDialog Component
 * Modal dialog for managing team members
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, UserPlus, UserMinus } from 'lucide-react';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useUsers } from '@/hooks/useUsers';
import { useAddTeamMembers, useRemoveTeamMember } from '@/hooks/useTeams';
import { useToast } from '@/hooks/use-toast';
import type { TeamWithDetails } from '@/types/teams';
import type { User } from '@/types/users';

interface TeamMembersDialogProps {
  team: TeamWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamMembersDialog({
  team,
  open,
  onOpenChange,
}: TeamMembersDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const { toast } = useToast();

  // Fetch team members
  const {
    data: members = [],
    isLoading: isLoadingMembers,
  } = useTeamMembers(team?.id || '', open && !!team);

  // Fetch all active users for the dropdown
  const { data: usersData, isLoading: isLoadingUsers } = useUsers({
    status: 'active',
  });
  const allUsers = usersData?.pages.flatMap((page) => page.users) || [];

  // Filter out users who are already members
  const memberIds = new Set(members.map((m: User) => m.userId));
  const availableUsers = allUsers.filter((user) => !memberIds.has(user.userId));

  // Mutations
  const { mutate: addMembers, isPending: isAdding } = useAddTeamMembers();
  const { mutate: removeMember, isPending: isRemoving } = useRemoveTeamMember();

  const handleAddMember = () => {
    if (!team || !selectedUserId) return;

    addMembers(
      { teamId: team.id, userIds: [selectedUserId] },
      {
        onSuccess: () => {
          toast({
            title: 'Member added',
            description: 'User has been added to the team successfully.',
            variant: 'default',
          });
          setSelectedUserId('');
        },
        onError: (error: Error) => {
          let errorMessage = error.message;
          if (error.message.includes('USER_NOT_FOUND')) {
            errorMessage = 'The selected user was not found.';
          } else if (error.message.includes('TEAM_NOT_FOUND')) {
            errorMessage = 'Team not found.';
          } else if (error.message.includes('FORBIDDEN') || error.message.includes('403')) {
            errorMessage = 'You do not have permission to manage team members.';
          }

          toast({
            title: 'Failed to add member',
            description: errorMessage,
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleRemoveMember = (userId: string) => {
    if (!team) return;

    // Prevent removing the team manager
    if (team.managerId === userId) {
      toast({
        title: 'Cannot remove manager',
        description: 'The team manager cannot be removed from the team. Change the manager first.',
        variant: 'destructive',
      });
      return;
    }

    removeMember(
      { teamId: team.id, userId },
      {
        onSuccess: () => {
          toast({
            title: 'Member removed',
            description: 'User has been removed from the team successfully.',
            variant: 'default',
          });
        },
        onError: (error: Error) => {
          let errorMessage = error.message;
          if (error.message.includes('USER_NOT_FOUND')) {
            errorMessage = 'The user was not found.';
          } else if (error.message.includes('TEAM_NOT_FOUND')) {
            errorMessage = 'Team not found.';
          } else if (error.message.includes('MANAGER_IS_MEMBER')) {
            errorMessage = 'Cannot remove the team manager. Change the manager first.';
          } else if (error.message.includes('FORBIDDEN') || error.message.includes('403')) {
            errorMessage = 'You do not have permission to manage team members.';
          }

          toast({
            title: 'Failed to remove member',
            description: errorMessage,
            variant: 'destructive',
          });
        },
      }
    );
  };

  if (!team) return null;

  const isLoading = isLoadingMembers || isLoadingUsers;
  const canAddMember = selectedUserId && !isAdding;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Team Members</DialogTitle>
          <DialogDescription>
            Add or remove members for "{team.name}" (ID: {team.id})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Member Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Add Member</h3>
            <div className="flex gap-2">
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                disabled={isLoading || isAdding}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a user to add..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No available users
                    </div>
                  ) : (
                    availableUsers.map((user) => (
                      <SelectItem key={user.userId} value={user.userId}>
                        {user.name} ({user.userId})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddMember}
                disabled={!canAddMember}
                size="default"
              >
                {isAdding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Members List Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">
              Current Members ({members.length})
            </h3>

            {isLoadingMembers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No members in this team
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member: User) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{member.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {member.userId}
                        {member.userId === team.managerId && (
                          <span className="ml-2 text-blue-600 font-medium">
                            (Manager)
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.userId)}
                      disabled={isRemoving || member.userId === team.managerId}
                      title={
                        member.userId === team.managerId
                          ? 'Cannot remove team manager'
                          : 'Remove from team'
                      }
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
