/**
 * RoleEditor Component
 * Dialog for editing user roles with checkboxes
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useUpdateUserRoles } from '@/hooks/useUsers';
import { useToast } from '@/hooks/use-toast';
import type { User, UserRole } from '@/types/users';

interface RoleEditorProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleEditor({ user, open, onOpenChange }: RoleEditorProps) {
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(user.roles);
  const [showRemoveAllConfirmation, setShowRemoveAllConfirmation] = useState(false);
  const { mutate: updateRoles, isPending } = useUpdateUserRoles(user.userId);
  const { toast } = useToast();

  // Reset selected roles when user changes
  useEffect(() => {
    setSelectedRoles(user.roles);
  }, [user.roles, user.userId]);

  const handleRoleToggle = (role: UserRole) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSave = () => {
    // Check if removing all roles (T044)
    if (selectedRoles.length === 0 && user.roles.length > 0) {
      setShowRemoveAllConfirmation(true);
      return;
    }

    performUpdate();
  };

  const performUpdate = () => {
    updateRoles(
      { roles: selectedRoles },
      {
        onSuccess: () => {
          // T042: Success toast notification
          toast({
            title: 'Roles updated successfully',
            description: `${user.name}'s roles have been updated.`,
            variant: 'default',
          });
          onOpenChange(false);
        },
        onError: (error: Error) => {
          // T043: Error handling for 404 and 400
          let errorMessage = error.message;

          if (error.message.includes('USER_NOT_FOUND') || error.message.includes('404')) {
            errorMessage = 'User not found.';
          } else if (error.message.includes('INVALID_ROLE') || error.message.includes('400')) {
            errorMessage = 'Invalid role selection.';
          } else if (error.message.includes('FORBIDDEN') || error.message.includes('403')) {
            errorMessage = 'You do not have permission to update user roles.';
          }

          toast({
            title: 'Failed to update roles',
            description: errorMessage,
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleConfirmRemoveAll = () => {
    setShowRemoveAllConfirmation(false);
    performUpdate();
  };

  return (
    <>
      {/* Main Role Editor Dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User Roles</DialogTitle>
            <DialogDescription>
              Update role assignments for {user.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Roles</Label>
              <p className="text-sm text-muted-foreground">
                Users without selected roles will have default user-level access.
              </p>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-role-manager"
                    checked={selectedRoles.includes('manager')}
                    onCheckedChange={() => handleRoleToggle('manager')}
                    disabled={isPending}
                  />
                  <Label
                    htmlFor="edit-role-manager"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Manager - Can manage teams and create assessments
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-role-admin"
                    checked={selectedRoles.includes('admin')}
                    onCheckedChange={() => handleRoleToggle('admin')}
                    disabled={isPending}
                  />
                  <Label
                    htmlFor="edit-role-admin"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Admin - Can manage users and all system settings
                  </Label>
                </div>
              </div>
            </div>

            {selectedRoles.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 dark:bg-yellow-950/50 dark:border-yellow-800 rounded-md p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  This user will have default user-level access only.
                </p>
              </div>
            )}
          </div>

          {/* T041: Save/Cancel actions with loading state */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isPending}
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* T044: Confirmation dialog for removing all roles */}
      <AlertDialog
        open={showRemoveAllConfirmation}
        onOpenChange={setShowRemoveAllConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove all elevated roles?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to remove all elevated roles from {user.name}. They will
              default to standard user-level access with no special permissions.
              <br />
              <br />
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRemoveAll}>
              Yes, Remove All Roles
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
