/**
 * Assessment View Component
 * Reusable assessment component for API-backed reviews
 */

import React from 'react';
import { ScreenContent } from '@/components/ScreenContent';
import { NavigationButtons } from '@/components/NavigationButtons';
import { AssessmentLayout } from '@/components/assessment/AssessmentLayout';
import { SaveStatusIndicator } from '@/components/assessment/SaveStatusIndicator';
import { WizardNavigation } from '@/components/WizardNavigation';
import { AppHeader } from '@/components/AppHeader';
import type { AssessmentPlan } from '@/types/assessments';
import type { AssessmentType } from '@/types/reports';
import { useAssessmentReviewLogic, type AssessmentReviewData } from '@/hooks/useAssessmentReviewLogic';

export interface AssessmentViewProps {
  /** Assessment plan with competency structure */
  assessmentPlan: AssessmentPlan;

  /** Type of assessment: self or manager */
  assessmentType: AssessmentType;

  /** Name of person being assessed */
  userName: string;

  /** Name of person doing the assessment */
  reviewerName: string;

  /** Initial data from existing report */
  initialData?: Partial<AssessmentReviewData>;

  /** Save handler called on auto-save */
  onSave: (data: AssessmentReviewData) => Promise<void>;

  /** Submit handler called on final submission */
  onSubmit?: (data: AssessmentReviewData) => Promise<void>;

  /** Read-only mode */
  readOnly?: boolean;
}

export function AssessmentView({
  assessmentPlan,
  assessmentType,
  userName,
  reviewerName,
  initialData,
  onSave,
  onSubmit,
  readOnly = false,
}: AssessmentViewProps) {
  const categories = assessmentPlan.planConfig;
  const allCategories = [...categories.map((c) => c.title), 'Report'];

  const {
    selections,
    feedback,
    wayForward,
    currentCategory,
    completedCategories,
    saveStatus,
    lastSavedAt,
    setCurrentCategory,
    setWayForward,
    handleNext,
    handlePrevious,
    handleSelectionChange,
    triggerManualSave,
  } = useAssessmentReviewLogic({
    categories,
    initialData,
    onSave,
    autoSaveInterval: 30000, // 30 seconds
  });

  const handleSubmitAssessment = async () => {
    if (onSubmit) {
      await triggerManualSave();
      await onSubmit({
        selections,
        feedback,
        wayForward,
        status: 'submitted',
      });
    }
  };

  const isReportScreen = currentCategory === categories.length;
  const currentCategoryData = !isReportScreen ? categories[currentCategory] : null;
  const currentSelections = currentCategoryData
    ? selections[currentCategoryData.title] || {}
    : {};
  const currentFeedback = currentCategoryData
    ? feedback[currentCategoryData.title] || {}
    : {};

  // Assessment type badge
  const assessmentTypeBadge = assessmentType === 'self' ? 'Self-Assessment' : 'Manager Review';

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title={userName}
        subtitle={`${assessmentTypeBadge} • ${assessmentPlan.name}`}
        onNewAssessment={() => {}} // Disabled for review mode
        onOpenAssessment={() => {}} // Disabled for review mode
      />

      {/* Save Status Bar */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Reviewer: <span className="font-medium text-foreground">{reviewerName}</span>
          </div>
          <SaveStatusIndicator
            status={saveStatus}
            lastSavedAt={lastSavedAt}
            onRetry={triggerManualSave}
          />
        </div>
      </div>

      <WizardNavigation
        screens={allCategories}
        currentScreen={currentCategory}
        onScreenChange={setCurrentCategory}
        completedScreens={new Set(completedCategories)}
      />

      <main className="container mx-auto px-4 py-8">
        <ScreenContent
          isReportScreen={isReportScreen}
          currentScreenData={currentCategoryData}
          screens={categories}
          selections={selections}
          currentSelections={currentSelections}
          currentFeedback={currentFeedback}
          feedback={feedback}
          onSelectionChange={handleSelectionChange}
          wayForward={wayForward}
          onWayForwardChange={setWayForward}
        />

        <NavigationButtons
          currentScreen={currentCategory}
          totalScreens={allCategories.length}
          isReportScreen={isReportScreen}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSubmitAssessment={onSubmit ? handleSubmitAssessment : undefined}
        />
      </main>
    </div>
  );
}
