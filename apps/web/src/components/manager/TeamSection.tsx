/**
 * TeamSection Component
 * Collapsible team card with expandable member list
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TeamMemberList } from './TeamMemberList';
import type { TeamWithDetails } from '@/types/teams';

interface TeamSectionProps {
  team: TeamWithDetails;
}

export function TeamSection({ team }: TeamSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            )}
            <div>
              <CardTitle className="text-lg">{team.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                  {team.id}
                </code>
                {!team.isActive && (
                  <Badge variant="destructive">Archived</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">
              {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <TeamMemberList teamId={team.id} isExpanded={isExpanded} />
      </CardContent>
    </Card>
  );
}
