/**
 * UserRoleBadge Component
 * Visual badge display for user roles with color coding
 */

import { Badge } from '@/components/ui/badge';
import type { UserRole } from '@/types/users';

interface UserRoleBadgeProps {
  role: UserRole;
  className?: string;
}

/**
 * Display a single role badge with appropriate styling
 */
export function UserRoleBadge({ role, className }: UserRoleBadgeProps) {
  const variants: Record<UserRole, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    admin: { variant: 'destructive', label: 'Admin' },
    manager: { variant: 'default', label: 'Manager' },
  };

  const { variant, label } = variants[role];

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}

interface UserRolesBadgesProps {
  roles: UserRole[];
  className?: string;
}

/**
 * Display multiple role badges or a default user badge
 */
export function UserRolesBadges({ roles, className }: UserRolesBadgesProps) {
  if (!roles || roles.length === 0) {
    return (
      <Badge variant="outline" className={className}>
        User
      </Badge>
    );
  }

  return (
    <div className={`flex gap-1 flex-wrap ${className || ''}`}>
      {roles.map((role) => (
        <UserRoleBadge key={role} role={role} />
      ))}
    </div>
  );
}
