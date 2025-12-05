/**
 * TeamManagement Component
 * Main container for team management features
 */

import { useState } from 'react';
import { TeamForm } from './TeamForm';
import { TeamTable } from './TeamTable';
import { useTeams, useCreateTeam } from '@/hooks/useTeams';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import type { CreateTeamRequest } from '@/types/teams';

export function TeamManagement() {
  const { mutate: createTeam, isPending, error } = useCreateTeam();
  const { toast } = useToast();
  const [formError, setFormError] = useState<Error | null>(null);

  // T035: Search state with debounce (300ms)
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  // T036: Status filter state
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');

  // T037: Fetch teams with search and filter parameters
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useTeams({
    search: debouncedSearch || undefined,
    includeArchived: statusFilter === 'all' || statusFilter === 'archived',
  });

  const teams = data?.pages.flatMap((page) => page.teams) || [];

  const handleCreateTeam = (data: CreateTeamRequest) => {
    setFormError(null);

    createTeam(data, {
      onSuccess: (newTeam) => {
        // T028: Success toast notification
        toast({
          title: 'Team created successfully',
          description: `${newTeam.name} (${newTeam.id}) has been created.`,
          variant: 'default',
        });

        // T029: Form will be cleared by parent (handled in TeamForm via key reset)
      },
      onError: (err: Error) => {
        // T026: Parse error message for duplicate team ID (409)
        // T027: Parse error message for validation failures (400)
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
          // Use the error message from the server (already user-friendly)
          errorMessage = err.message.split(': ')[1] || err.message;
        } else if (err.message.includes('FORBIDDEN') || err.message.includes('403')) {
          errorMessage = 'You do not have permission to create teams.';
        } else if (err.message.includes('UNAUTHORIZED') || err.message.includes('401')) {
          errorMessage = 'Authentication required. Please log in again.';
        }

        setFormError(new Error(errorMessage));

        toast({
          title: 'Failed to create team',
          description: errorMessage,
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Team Creation Form */}
      <TeamForm
        onSubmit={handleCreateTeam}
        isLoading={isPending}
        error={formError}
      />

      {/* T035/T036: Search and Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* T035: Search Input */}
        <div className="space-y-2">
          <Label htmlFor="search">Search Teams</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              type="text"
              placeholder="Search by team ID or name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* T036: Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status-filter">Status</Label>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
            <SelectTrigger id="status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="archived">Archived Only</SelectItem>
              <SelectItem value="all">All Teams</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* T038: Team List Table */}
      <TeamTable
        teams={teams}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        onLoadMore={() => fetchNextPage()}
        emptyMessage={
          searchInput || statusFilter !== 'active'
            ? 'No teams match your search criteria'
            : 'No teams created yet'
        }
      />
    </div>
  );
}
