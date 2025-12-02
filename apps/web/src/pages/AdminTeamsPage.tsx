/**
 * Admin Teams Page
 * Team management interface for administrators
 */

import { TeamManagement } from '@/components/admin/TeamManagement';

const AdminTeamsPage = () => {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
        <p className="text-gray-600 mt-2">Create and manage teams, assign managers, and organize team members</p>
      </div>

      <TeamManagement />
    </div>
  );
};

export default AdminTeamsPage;
