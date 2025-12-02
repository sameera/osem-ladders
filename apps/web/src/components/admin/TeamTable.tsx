/**
 * TeamTable Component
 * Displays teams in a responsive table format with details
 */

import { TeamBadge } from './TeamBadge';
import { ManagerSelector } from './ManagerSelector';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { TeamWithDetails } from '@/types/teams';

interface TeamTableProps {
  teams: TeamWithDetails[];
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  emptyMessage?: string;
}

export function TeamTable({
  teams,
  isLoading = false,
  isFetchingNextPage = false,
  hasNextPage = false,
  onLoadMore,
  emptyMessage = 'No teams found',
}: TeamTableProps) {
  // T040: Loading skeleton
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" aria-hidden="true" />
          <p className="text-gray-500 mt-4" role="status" aria-live="polite">Loading teams...</p>
        </CardContent>
      </Card>
    );
  }

  // T041: Empty state
  if (teams.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">{emptyMessage}</p>
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
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manager
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teams.map((team) => (
                  <tr
                    key={team.teamId}
                    className={`hover:bg-gray-50 transition-colors ${
                      !team.isActive ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">
                        {team.teamId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {team.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {team.managerName || <span className="italic">None</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {team.memberCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <TeamBadge isActive={team.isActive} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* T049: Manager selector */}
                      <ManagerSelector team={team} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* T034/T039/T049: Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200" role="list" aria-label="Team list">
            {teams.map((team) => (
              <div
                key={team.teamId}
                className={`p-4 ${!team.isActive ? 'opacity-60' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium text-gray-900">{team.name}</div>
                    <div className="text-sm font-mono text-gray-500 mt-1">
                      {team.teamId}
                    </div>
                  </div>
                  <TeamBadge isActive={team.isActive} />
                </div>
                <div className="space-y-2 mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Manager:</span>
                    <span className="text-sm text-gray-700">
                      {team.managerName || <span className="italic">None</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Members:</span>
                    <span className="text-sm text-gray-700">{team.memberCount}</span>
                  </div>
                </div>
                {/* T049: Manager selector for mobile */}
                <div className="mt-4">
                  <label className="text-xs text-gray-500 block mb-1">Assign Manager</label>
                  <ManagerSelector team={team} />
                </div>
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
