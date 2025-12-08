/**
 * TeamEditDialog Component
 * Modal dialog for editing team details
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TeamForm } from './TeamForm';
import { useUpdateTeam, useUpdateTeamManager, useCreateTeam } from '@/hooks/useTeams';
import { useToast } from '@/hooks/use-toast';
import type { TeamWithDetails, CreateTeamRequest, UpdateTeamRequest } from '@/types/teams';

interface TeamEditDialogProps {
  team?: TeamWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamEditDialog({
  team,
  open,
  onOpenChange,
}: TeamEditDialogProps) {
  const mode = team ? 'edit' : 'create';
  const { mutate: createTeam, isPending: isCreating, error: createError } = useCreateTeam();
  const { mutate: updateTeam, isPending: isUpdatingTeam, error: teamError } = useUpdateTeam();
  const { mutate: updateManager, isPending: isUpdatingManager, error: managerError } = useUpdateTeamManager();
  const { toast } = useToast();

  const isLoading = isCreating || isUpdatingTeam || isUpdatingManager;
  const mutationError = createError || teamError || managerError;

  const handleNameError = (error: Error) => {
    let errorMessage = error.message;

    if (error.message.includes('TEAM_NOT_FOUND')) {
      errorMessage = 'Team no longer exists.';
    } else if (error.message.includes('INVALID_TEAM_NAME')) {
      errorMessage = error.message.split(': ')[1] || error.message;
    } else if (error.message.includes('FORBIDDEN') || error.message.includes('403')) {
      errorMessage = 'You do not have permission to edit teams.';
    } else if (error.message.includes('UNAUTHORIZED') || error.message.includes('401')) {
      errorMessage = 'Authentication required. Please log in again.';
    }

    toast({
      title: 'Failed to update team name',
      description: errorMessage,
      variant: 'destructive',
    });
  };

  const handleManagerError = (error: Error, afterNameUpdate: boolean) => {
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

    const title = afterNameUpdate
      ? 'Team name updated, but manager change failed'
      : 'Failed to update manager';

    const description = afterNameUpdate
      ? `The team name was successfully updated, but the manager change failed: ${errorMessage}. You can try again by editing the team.`
      : errorMessage;

    toast({
      title,
      description,
      variant: 'destructive',
    });

    // If name was updated, close dialog (partial success)
    // If only manager update failed, keep dialog open for retry
    if (afterNameUpdate) {
      onOpenChange(false);
    }
  };

  const handleCreateSubmit = (data: CreateTeamRequest) => {
    createTeam(data, {
      onSuccess: (newTeam) => {
        toast({
          title: 'Team created successfully',
          description: `${newTeam.name} (${newTeam.id}) has been created.`,
          variant: 'default',
        });
        onOpenChange(false);
      },
      onError: (err: Error) => {
        // Parse error messages (TEAM_EXISTS, MANAGER_NOT_FOUND, INVALID_MANAGER_ROLE, etc.)
        let errorMessage = err.message;
        if (err.message.includes('TEAM_EXISTS') || err.message.includes('409')) {
          errorMessage = 'A team with this ID already exists. Please choose a different team ID.';
        } else if (err.message.includes('MANAGER_NOT_FOUND')) {
          errorMessage = 'The selected manager no longer exists.';
        } else if (err.message.includes('INVALID_MANAGER_ROLE')) {
          errorMessage = 'The selected user does not have manager role.';
        } else if (err.message.includes('MANAGER_DEACTIVATED')) {
          errorMessage = 'The selected manager is deactivated and cannot be assigned.';
        } else if (err.message.includes('INVALID_TEAM_ID') || err.message.includes('INVALID_TEAM_NAME') || err.message.includes('400')) {
          errorMessage = err.message.split(': ')[1] || err.message;
        } else if (err.message.includes('FORBIDDEN') || err.message.includes('403')) {
          errorMessage = 'You do not have permission to create teams.';
        } else if (err.message.includes('UNAUTHORIZED') || err.message.includes('401')) {
          errorMessage = 'Authentication required. Please log in again.';
        }

        toast({
          title: 'Failed to create team',
          description: errorMessage,
          variant: 'destructive',
        });
      },
    });
  };

  const handleEditSubmit = (data: CreateTeamRequest) => {
    // Detect what changed
    const nameChanged = data.name !== team.name;
    const managerChanged = (data.managerId || null) !== (team.managerId || null);

    // If nothing changed, just close
    if (!nameChanged && !managerChanged) {
      toast({
        title: 'No changes detected',
        description: 'No updates were made.',
        variant: 'default',
      });
      onOpenChange(false);
      return;
    }

    // Helper to handle manager update
    const handleManagerUpdate = (afterNameUpdate = false) => {
      const newManagerId = data.managerId || null;

      updateManager(
        { teamId: team.id, managerId: newManagerId },
        {
          onSuccess: () => {
            toast({
              title: afterNameUpdate ? 'Team fully updated' : 'Manager updated successfully',
              description: newManagerId
                ? `${data.name} manager has been updated.`
                : `Manager removed from ${data.name}.`,
              variant: 'default',
            });
            onOpenChange(false);
          },
          onError: (error: Error) => {
            handleManagerError(error, afterNameUpdate);
          },
        }
      );
    };

    // If both changed, update name first, then manager
    if (nameChanged && managerChanged) {
      const updateRequest: UpdateTeamRequest = { name: data.name };

      updateTeam(
        { teamId: team.id, request: updateRequest },
        {
          onSuccess: () => {
            // Name succeeded, now update manager
            handleManagerUpdate(true);
          },
          onError: (error: Error) => {
            handleNameError(error);
          },
        }
      );
      return;
    }

    // If only name changed
    if (nameChanged) {
      const updateRequest: UpdateTeamRequest = { name: data.name };

      updateTeam(
        { teamId: team.id, request: updateRequest },
        {
          onSuccess: (updatedTeam) => {
            toast({
              title: 'Team updated successfully',
              description: `${updatedTeam.name} has been updated.`,
              variant: 'default',
            });
            onOpenChange(false);
          },
          onError: (error: Error) => {
            handleNameError(error);
          },
        }
      );
      return;
    }

    // If only manager changed
    if (managerChanged) {
      handleManagerUpdate(false);
    }
  };

  const handleSubmit = (data: CreateTeamRequest) => {
    if (mode === 'create') {
      handleCreateSubmit(data);
    } else {
      handleEditSubmit(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Team' : 'Edit Team'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new team with a manager'
              : `Update details for "${team.name}" (ID: ${team.id})`}
          </DialogDescription>
        </DialogHeader>

        {mode === 'edit' && team && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Current Manager:</strong> {team.managerName || <span className="italic">None</span>}
            </p>
            <p className="text-sm text-blue-800 mt-1">
              <strong>Members:</strong> {team.memberCount}
              {team.memberCount > 0 && ' (member management coming in future update)'}
            </p>
          </div>
        )}

        <TeamForm
          mode={mode}
          initialData={mode === 'edit' ? team : undefined}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={mutationError}
        />
      </DialogContent>
    </Dialog>
  );
}
