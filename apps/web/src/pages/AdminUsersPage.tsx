/**
 * Admin Users Page
 * User management interface for administrators
 */

import { UserManagement } from '@/components/admin/UserManagement';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageLayout } from '@/components/PageLayout';

const AdminUsersPage = () => {
  return (
    <ErrorBoundary>
      <PageLayout
        title="User Management"
        subtitle="Manage users, roles, and permissions"
      >
        <div className="max-w-6xl mx-auto">
          <UserManagement />
        </div>
      </PageLayout>
    </ErrorBoundary>
  );
};

export default AdminUsersPage;
