/**
 * Admin Teams Page
 * Team management interface for administrators
 */

import { TeamManagement } from '@/components/admin/TeamManagement';
import { PageLayout } from '@/components/PageLayout';

const AdminTeamsPage = () => {
  return (
    <PageLayout
      title="Team Management"
      subtitle="Create and manage teams, assign managers, and organize team members"
    >
      <div className="max-w-6xl mx-auto">
        <TeamManagement />
      </div>
    </PageLayout>
  );
};

export default AdminTeamsPage;
