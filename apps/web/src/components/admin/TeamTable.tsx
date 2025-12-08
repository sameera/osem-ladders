/**
 * TeamTable Component
 * Displays teams in a responsive table format with details
 */

import { TeamBadge } from './TeamBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Pencil } from 'lucide-react';
import type { TeamWithDetails } from '@/types/teams';

interface TeamTableProps {
  teams: TeamWithDetails[];
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  emptyMessage?: string;
  onEditTeam?: (team: TeamWithDetails) => void;
}

export function TeamTable({
  teams,
  isLoading = false,
  isFetchingNextPage = false,
  hasNextPage = false,
  onLoadMore,
  emptyMessage = 'No teams found',
  onEditTeam,
}: TeamTableProps) {
  // T040: Loading skeleton
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" aria-hidden="true" />
          <p className="text-muted-foreground mt-4" role="status" aria-live="polite">Loading teams...</p>
        </CardContent>
      </Card>
    );
  }

  // T041: Empty state
  if (teams.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          {/* T034/T039/T049: Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full" aria-label="Team management table">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Team ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Team Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Manager
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {teams.map((team) => (
                  <tr
                    key={team.id}
                    className={`hover:bg-muted/50 transition-colors ${
                      !team.isActive ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-foreground">
                        {team.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">
                        {team.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-muted-foreground">
                        {team.managerName || <span className="italic">None</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">
                        {team.memberCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <TeamBadge isActive={team.isActive} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {/* Edit button */}
                        {onEditTeam && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditTeam(team)}
                            aria-label={`Edit team ${team.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* T034/T039/T049: Mobile Card View */}
          <div className="md:hidden divide-y divide-border" role="list" aria-label="Team list">
            {teams.map((team) => (
              <div
                key={team.id}
                className={`p-4 ${!team.isActive ? 'opacity-60' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium text-foreground">{team.name}</div>
                    <div className="text-sm font-mono text-muted-foreground mt-1">
                      {team.id}
                    </div>
                  </div>
                  <TeamBadge isActive={team.isActive} />
                </div>
                <div className="space-y-2 mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Manager:</span>
                    <span className="text-sm text-foreground">
                      {team.managerName || <span className="italic">None</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Members:</span>
                    <span className="text-sm text-foreground">{team.memberCount}</span>
                  </div>
                </div>
                {/* Actions section for mobile */}
                {onEditTeam && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditTeam(team)}
                      className="w-full"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Team
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* T038: Load More Button for Infinite Scroll */}
      {hasNextPage && (
        <div className="flex justify-center">
          <button
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
