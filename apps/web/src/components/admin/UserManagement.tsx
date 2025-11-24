/**
 * UserManagement Component
 * Main container for user management features
 */

import { useState, useMemo } from 'react';
import { UserForm } from './UserForm';
import { UserTable } from './UserTable';
import { useCreateUser, useUsers } from '@/hooks/useUsers';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import type { CreateUserRequest, UserStatus } from '@/types/users';

export function UserManagement() {
  const { mutate: createUser, isPending, error } = useCreateUser();
  const { toast } = useToast();
  const [formError, setFormError] = useState<Error | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus>('all');

  // Debounce search query (300ms as per T030)
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch users with search and filter
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useUsers({
    search: debouncedSearch || undefined,
    status: statusFilter,
  });

  // Flatten pages into single array
  const users = useMemo(() => {
    return data?.pages.flatMap(page => page.users) ?? [];
  }, [data]);

  const handleCreateUser = (data: CreateUserRequest) => {
    setFormError(null);

    createUser(data, {
      onSuccess: (newUser) => {
        toast({
          title: 'User created successfully',
          description: `${newUser.name} (${newUser.email}) has been added to the system.`,
          variant: 'default',
        });
      },
      onError: (err: Error) => {
        // Parse error message for better UX
        let errorMessage = err.message;

        if (err.message.includes('USER_EXISTS') || err.message.includes('409')) {
          errorMessage = 'A user with this email address already exists.';
        } else if (err.message.includes('INVALID_EMAIL') || err.message.includes('400')) {
          errorMessage = 'Invalid email address format.';
        } else if (err.message.includes('FORBIDDEN') || err.message.includes('403')) {
          errorMessage = 'You do not have permission to create users.';
        } else if (err.message.includes('UNAUTHORIZED') || err.message.includes('401')) {
          errorMessage = 'Authentication required. Please log in again.';
        }

        setFormError(new Error(errorMessage));

        toast({
          title: 'Failed to create user',
          description: errorMessage,
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* User Creation Form */}
      <UserForm
        onSubmit={handleCreateUser}
        isLoading={isPending}
        error={formError}
      />

      {/* User List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">All Users</h2>
          <div className="text-sm text-gray-500">
            {users.length} user{users.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search Input (T030 - with 300ms debounce) */}
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium">
              Search Users
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                aria-label="Search users by name or email"
              />
            </div>
          </div>

          {/* Status Filter (T032) */}
          <div className="space-y-2">
            <Label htmlFor="status-filter" className="text-sm font-medium">
              Filter by Status
            </Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as UserStatus)}>
              <SelectTrigger id="status-filter" aria-label="Filter users by status">
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* User Table with Infinite Scroll (T031, T033, T034, T035) */}
        <UserTable
          users={users}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          onLoadMore={() => fetchNextPage()}
          emptyMessage={
            debouncedSearch
              ? `No users found matching "${debouncedSearch}"`
              : 'No users found'
          }
        />
      </div>
    </div>
  );
}
