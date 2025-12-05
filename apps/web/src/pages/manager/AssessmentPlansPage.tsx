/**
 * Assessment Plans Page
 * Manager/admin page for assessment plan management
 */

import { AssessmentPlanManagement } from '@/components/manager/AssessmentPlanManagement';
import { PageLayout } from '@/components/PageLayout';

export function AssessmentPlansPage() {
  return (
    <PageLayout
      title="Assessment Plans"
      subtitle="Create and manage career ladder frameworks for your teams"
    >
      <div className="max-w-7xl mx-auto">
        <AssessmentPlanManagement />
      </div>
    </PageLayout>
  );
}
