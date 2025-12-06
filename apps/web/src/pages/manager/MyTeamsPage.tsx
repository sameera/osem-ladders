/**
 * My Teams Page
 * Manager page for viewing and managing team members
 */

import { PageLayout } from '@/components/PageLayout';
import { MyTeamsView } from '@/components/manager/MyTeamsView';

export function MyTeamsPage() {
  return (
    <PageLayout
      title="My Teams"
      subtitle="View and manage members of teams you lead"
    >
      <div className="max-w-6xl mx-auto">
        <MyTeamsView />
      </div>
    </PageLayout>
  );
}
