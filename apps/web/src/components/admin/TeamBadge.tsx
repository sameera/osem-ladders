/**
 * TeamBadge Component
 * Badge for displaying team status (active/archived)
 */

import { Badge } from '@/components/ui/badge';

interface TeamBadgeProps {
  isActive: boolean;
}

export function TeamBadge({ isActive }: TeamBadgeProps) {
  if (isActive) {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800">
        Active
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
      Archived
    </Badge>
  );
}
