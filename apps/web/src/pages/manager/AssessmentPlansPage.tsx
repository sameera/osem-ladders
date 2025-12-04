/**
 * Assessment Plans Page
 * Manager/admin page for assessment plan management
 */

import { AssessmentPlanManagement } from '@/components/manager/AssessmentPlanManagement';

export function AssessmentPlansPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Assessment Plans</h1>
        <p className="text-gray-600 mt-2">
          Create and manage career ladder frameworks for your teams
        </p>
      </div>

      <AssessmentPlanManagement />
    </div>
  );
}
