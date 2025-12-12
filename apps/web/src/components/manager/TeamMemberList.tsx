/**
 * TeamMemberList Component
 * Displays team members in a responsive table/card layout
 */

import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import type { User } from '@/types/users';

interface TeamMemberListProps {
  teamId: string;
  isExpanded: boolean;
}

export function TeamMemberList({ teamId, isExpanded }: TeamMemberListProps) {
  const { data: members, isLoading, error } = useTeamMembers(teamId, isExpanded);

  if (!isExpanded) return null;

  if (isLoading) {
    return (
      <div className="py-4 text-center border-t border-gray-200 dark:border-gray-700">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading members...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 px-4 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
        <p className="text-sm text-red-600 dark:text-red-400">Failed to load team members</p>
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <div className="py-4 text-center border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">No team members yet</p>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Email</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Roles</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {members.map((member) => (
              <tr key={member.userId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-3 text-sm">
                  <Link
                    to={`/user/${encodeURIComponent(member.userId)}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {member.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{member.userId}</td>
                <td className="px-4 py-3">
                  {member.roles.length > 0 ? (
                    <div className="flex gap-1">
                      {member.roles.map(role => (
                        <Badge key={role} variant="secondary">{role}</Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500">User</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={member.isActive ? 'default' : 'destructive'}>
                    {member.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
        {members.map((member) => (
          <div key={member.userId} className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <Link
                  to={`/user/${encodeURIComponent(member.userId)}`}
                  className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {member.name}
                </Link>
                <div className="text-sm text-gray-500 dark:text-gray-400">{member.userId}</div>
              </div>
              <Badge variant={member.isActive ? 'default' : 'destructive'}>
                {member.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            {member.roles.length > 0 && (
              <div className="flex gap-1 mt-2">
                {member.roles.map(role => (
                  <Badge key={role} variant="secondary">{role}</Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
