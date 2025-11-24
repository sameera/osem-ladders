/**
 * Admin Users Page
 * User management interface for administrators
 */

import { UserManagement } from '@/components/admin/UserManagement';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const AdminUsersPage = () => {
  return (
    <ErrorBoundary>
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage users, roles, and permissions</p>
        </div>

        <UserManagement />
      </div>
    </ErrorBoundary>
  );
};

export default AdminUsersPage;
