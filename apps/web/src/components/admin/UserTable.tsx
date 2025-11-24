/**
 * UserTable Component
 * Displays users in a table format with columns for email, name, roles, team, and status
 */

import { useState } from 'react';
import { UserRolesBadges } from './UserRoleBadge';
import { RoleEditor } from './RoleEditor';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Edit, UserX } from 'lucide-react';
import { useDeactivateUser } from '@/hooks/useUsers';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/types/users';

interface UserTableProps {
  users: User[];
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  emptyMessage?: string;
}

export function UserTable({
  users,
  isLoading = false,
  isFetchingNextPage = false,
  hasNextPage = false,
  onLoadMore,
  emptyMessage = 'No users found',
}: UserTableProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<User | null>(null);
  const { mutate: deactivateUser, isPending: isDeactivating } = useDeactivateUser();
  const { toast } = useToast();

  // T051-T055: Handle user deactivation with confirmation and error handling
  const handleDeactivate = () => {
    if (!deactivatingUser) return;

    deactivateUser(deactivatingUser.userId, {
      onSuccess: () => {
        // T055: Success toast with user email
        toast({
          title: 'User deactivated',
          description: `${deactivatingUser.name} (${deactivatingUser.userId}) has been deactivated.`,
          variant: 'default',
        });
        setDeactivatingUser(null);
      },
      onError: (error: Error) => {
        // T052-T054: Error handling for different scenarios
        let errorMessage = error.message;

        if (error.message.includes('SELF_DEACTIVATION')) {
          errorMessage = 'You cannot deactivate your own account.';
        } else if (error.message.includes('USER_IS_MANAGER')) {
          errorMessage = error.message.split(': ')[1] || 'This user manages one or more teams. Please reassign teams before deactivating.';
        } else if (error.message.includes('ALREADY_INACTIVE')) {
          errorMessage = 'This user is already deactivated.';
        } else if (error.message.includes('USER_NOT_FOUND') || error.message.includes('404')) {
          errorMessage = 'User not found.';
        } else if (error.message.includes('FORBIDDEN') || error.message.includes('403')) {
          errorMessage = 'You do not have permission to deactivate users.';
        }

        toast({
          title: 'Failed to deactivate user',
          description: errorMessage,
          variant: 'destructive',
        });
      },
    });
  };

  // Empty state
  if (!isLoading && users.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" aria-hidden="true" />
          <p className="text-gray-500 mt-4" role="status" aria-live="polite">Loading users...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full" aria-label="User management table">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr
                    key={user.userId}
                    className={`hover:bg-gray-50 transition-colors ${
                      !user.isActive ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.userId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <UserRolesBadges roles={user.roles} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {user.team || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.isActive ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                          Inactive
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingUser(user)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit Roles
                        </Button>
                        {/* T050: Deactivate button (only for active users) */}
                        {user.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeactivatingUser(user)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200" role="list" aria-label="User list">
            {users.map((user) => (
              <div
                key={user.userId}
                className={`p-4 ${!user.isActive ? 'opacity-60' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {user.userId}
                    </div>
                  </div>
                  {user.isActive ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                      Inactive
                    </Badge>
                  )}
                </div>
                <div className="space-y-2 mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Roles:</span>
                    <UserRolesBadges roles={user.roles} />
                  </div>
                  {user.team && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Team:</span>
                      <span className="text-sm text-gray-700">{user.team}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingUser(user)}
                    className="w-full"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Roles
                  </Button>
                  {/* T050: Deactivate button (mobile view, only for active users) */}
                  {user.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeactivatingUser(user)}
                      className="w-full text-red-600 hover:text-red-800 border-red-200 hover:bg-red-50"
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Deactivate
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Editor Dialog */}
      {editingUser && (
        <RoleEditor
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
        />
      )}

      {/* T051: Confirmation dialog for deactivation */}
      <AlertDialog
        open={!!deactivatingUser}
        onOpenChange={(open) => !open && setDeactivatingUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate {deactivatingUser?.name} ({deactivatingUser?.userId})?
              This will prevent them from logging in, but their historical data will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={isDeactivating}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeactivating ? 'Deactivating...' : 'Yes, Deactivate User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Load More Button for Infinite Scroll */}
      {hasNextPage && (
        <div className="flex justify-center">
          <button
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFetchingNextPage ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading more...
              </span>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
