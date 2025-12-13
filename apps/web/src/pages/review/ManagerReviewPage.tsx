/**
 * Manager Review Page
 * Allows managers to complete assessment reviews for their team members
 * Accessible by manager only
 */

import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUser } from '@/hooks/useUser';
import { useManagerCheck } from '@/hooks/useManagerCheck';
import { useAssessmentPlans } from '@/hooks/useAssessmentPlans';
import { useAssessmentReport } from '@/hooks/useAssessmentReport';
import { AssessmentView } from '@/components/assessment/AssessmentView';
import { uiToApiFormat, apiToUiFormat } from '@/utils/assessmentTransformers';
import type { AssessmentReviewData } from '@/hooks/useAssessmentReviewLogic';
import { Loader2, AlertCircle } from 'lucide-react';

export default function ManagerReviewPage() {
  const { userId } = useParams<{ userId: string }>();

  // Fetch users and check access
  const { data: currentUser, isLoading: currentUserLoading } = useCurrentUser();
  const { data: targetUser, isLoading: targetUserLoading } = useUser(userId);
  const { isManager, isLoading: managerCheckLoading } = useManagerCheck(userId);

  // Fetch assessment plans for user's team
  const { data: plansResponse, isLoading: plansLoading } = useAssessmentPlans(
    targetUser?.team,
    { includeInactive: false }
  );

  // Get most recent active plan
  const activePlan = useMemo(() => {
    if (!plansResponse?.plans || plansResponse.plans.length === 0) return null;
    return plansResponse.plans
      .filter((p) => p.isActive)
      .sort((a, b) => b.createdAt - a.createdAt)[0];
  }, [plansResponse]);

  // Fetch or create assessment report
  const {
    report,
    isLoading: reportLoading,
    createReport,
    updateReport,
    submitReport,
  } = useAssessmentReport(userId, activePlan?.season, 'manager');

  // Loading states
  const isLoading =
    currentUserLoading ||
    targetUserLoading ||
    managerCheckLoading ||
    (targetUser?.team && plansLoading) ||
    reportLoading;

  // Show loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading assessment...</p>
        </div>
      </div>
    );
  }

  // Check access - only manager can access
  if (!isManager) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            Only managers can access this page.
          </p>
        </div>
      </div>
    );
  }

  // User not found
  if (!targetUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">User Not Found</h1>
          <p className="text-muted-foreground">
            The user you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  // No team assigned
  if (!targetUser.team) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">No Team Assigned</h1>
          <p className="text-muted-foreground">
            {targetUser.name} is not assigned to a team yet.
          </p>
        </div>
      </div>
    );
  }

  // No active plan
  if (!activePlan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">No Active Plans</h1>
          <p className="text-muted-foreground">
            No plans have been created yet for your team.
          </p>
        </div>
      </div>
    );
  }

  // Convert report data to UI format
  const initialData = report ? apiToUiFormat(report.responses) : undefined;

  // Save handler
  const handleSave = async (data: AssessmentReviewData) => {
    if (!currentUser || !userId) return;

    const apiData = {
      responses: uiToApiFormat(data.selections, data.feedback),
      status: data.status,
    };

    if (!report) {
      // Create new report
      await createReport({
        userId,
        assessmentId: activePlan.season,
        type: 'manager',
        assessorId: currentUser.userId,
        responses: apiData.responses,
      });
    } else {
      // Update existing report
      await updateReport(apiData);
    }
  };

  // Submit handler
  const handleSubmit = async (data: AssessmentReviewData) => {
    await handleSave(data);
    await submitReport();
  };

  return (
    <AssessmentView
      assessmentPlan={activePlan}
      assessmentType="manager"
      userName={targetUser.name}
      reviewerName={currentUser?.name || ''}
      initialData={initialData}
      onSave={handleSave}
      onSubmit={handleSubmit}
    />
  );
}
