/**
 * ManagerSelectorInput Component
 * Form input component for selecting a manager during team creation
 */

import { useUsers } from '@/hooks/useUsers';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface ManagerSelectorInputProps {
  value: string;
  onChange: (managerId: string) => void;
  error?: string;
  disabled?: boolean;
}

export function ManagerSelectorInput({
  value,
  onChange,
  error,
  disabled = false,
}: ManagerSelectorInputProps) {
  // Fetch all active users
  const { data: usersData, isLoading: isLoadingUsers } = useUsers({
    status: 'active',
  });

  // Get all managers (users with "manager" role)
  const users = usersData?.pages.flatMap((page) => page.users) || [];
  const managers = users.filter((user) => user.roles.includes('manager'));

  // Loading state
  if (isLoadingUsers) {
    return (
      <div className="space-y-2">
        <Label htmlFor="managerId" className="text-sm font-medium">
          Team Manager <span className="text-red-500">*</span>
        </Label>
        <div className="flex items-center gap-2 text-sm text-gray-500 p-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading managers...</span>
        </div>
      </div>
    );
  }

  // Empty state - no managers available
  if (managers.length === 0) {
    return (
      <div className="space-y-2">
        <Label htmlFor="managerId" className="text-sm font-medium">
          Team Manager <span className="text-red-500">*</span>
        </Label>
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
          <p className="text-sm text-amber-800">
            No managers available. Please create a user with the manager role before creating teams.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="managerId" className="text-sm font-medium">
        Team Manager <span className="text-red-500">*</span>
      </Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          id="managerId"
          className={error ? 'border-red-500' : ''}
        >
          <SelectValue placeholder="Select a manager" />
        </SelectTrigger>
        <SelectContent>
          {managers.map((manager) => (
            <SelectItem key={manager.userId} value={manager.userId}>
              {manager.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm text-red-500" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}
