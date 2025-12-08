/**
 * TeamManagement Component
 * Main container for team management features
 */

import { useState } from 'react';
import { TeamTable } from './TeamTable';
import { TeamEditDialog } from './TeamEditDialog';
import { useTeams } from '@/hooks/useTeams';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus } from 'lucide-react';
import type { TeamWithDetails } from '@/types/teams';

export function TeamManagement() {
  // Unified dialog state
  const [selectedTeam, setSelectedTeam] = useState<TeamWithDetails | null>(null);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);

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

  const handleCreateTeam = () => {
    setSelectedTeam(null);
    setIsTeamDialogOpen(true);
  };

  const handleEditTeam = (team: TeamWithDetails) => {
    setSelectedTeam(team);
    setIsTeamDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Create Team Button */}
      <div className="flex justify-end">
        <Button onClick={handleCreateTeam}>
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </div>

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
        onEditTeam={handleEditTeam}
        emptyMessage={
          searchInput || statusFilter !== 'active'
            ? 'No teams match your search criteria'
            : 'No teams created yet'
        }
      />

      {/* Team Dialog (handles both Create and Edit modes) */}
      <TeamEditDialog
        team={selectedTeam}
        open={isTeamDialogOpen}
        onOpenChange={setIsTeamDialogOpen}
      />
    </div>
  );
}
