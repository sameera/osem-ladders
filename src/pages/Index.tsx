import React, { useState, useMemo } from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ScreenContent } from '@/components/ScreenContent';
import { NavigationButtons } from '@/components/NavigationButtons';
import { parseConfig } from '@/utils/configParser';
import { Category } from '@/types/assessment';
import { useAssessmentState } from '@/hooks/useAssessmentState';
import { useAssessmentNavigation } from '@/hooks/useAssessmentNavigation';
import { useAssessmentCompletion } from '@/hooks/useAssessmentCompletion';
import { useAssessmentFile } from '@/hooks/useAssessmentFile';
import { AssessmentPrompts } from '@/components/assessment/AssessmentPrompts';
import { AssessmentLayout } from '@/components/assessment/AssessmentLayout';
import configMarkdown from '@/data/config.md?raw';

function AppContent() {
  const [showNewAssessmentPrompt, setShowNewAssessmentPrompt] = useState(false);
  const [showConfirmNewAssessment, setShowConfirmNewAssessment] = useState(false);
  
  const categories: Category[] = useMemo(() => parseConfig(configMarkdown), []);
  const allScreens = useMemo(() => [...categories.map(c => c.title), 'Report'], [categories]);
  
  // Custom hooks
  const {
    selections,
    setSelections,
    addOrUpdateSelection,
    teamMemberName,
    setTeamMemberName,
    currentLevel,
    setCurrentLevel,
    resetAssessment
  } = useAssessmentState();

  const {
    currentScreen,
    setCurrentScreen,
    handleNext,
    handlePrevious,
    resetNavigation
  } = useAssessmentNavigation(allScreens.length);

  const completedCategories = useAssessmentCompletion(categories, selections);
  const { handleSubmitAssessment, handleOpenAssessment } = useAssessmentFile();
  
  // Check if we need to show the team member prompt
  const showTeamMemberPrompt = !teamMemberName && selections.length === 0;

  const isReportScreen = currentScreen === categories.length;
  const currentCategoryData = !isReportScreen ? categories[currentScreen] : null;

  const handleTeamMemberSubmit = (name: string, level?: number) => {
    setTeamMemberName(name);
    if (level !== undefined) {
      setCurrentLevel(level);
    }
  };

  const handleSelectionChange = (categoryId: string, coreAreaId: string, level: number, evidence: string, nextLevelFeedback: string) => {
    addOrUpdateSelection({
      categoryId,
      coreAreaId,
      level,
      evidence,
      nextLevelFeedback
    });
  };

  const handleSubmitAssessmentClick = () => {
    handleSubmitAssessment(teamMemberName, currentLevel, categories, selections);
    setShowNewAssessmentPrompt(true);
  };

  const handleNewAssessmentRequest = () => {
    const hasSelections = selections.length > 0;

    if (hasSelections) {
      setShowConfirmNewAssessment(true);
    } else {
      handleStartNewAssessment();
    }
  };

  const handleConfirmNewAssessment = () => {
    setShowConfirmNewAssessment(false);
    handleStartNewAssessment();
  };

  const handleCancelConfirmNewAssessment = () => {
    setShowConfirmNewAssessment(false);
  };

  const handleStartNewAssessment = () => {
    resetAssessment();
    resetNavigation();
    setShowNewAssessmentPrompt(false);
  };

  const handleCancelNewAssessment = () => {
    setShowNewAssessmentPrompt(false);
  };

  const handleOpenAssessmentFile = (data: any) => {
    handleOpenAssessment(
      data,
      setTeamMemberName,
      setCurrentLevel,
      setSelections,
      setCurrentScreen
    );
  };

  if (categories.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Loading...</h1>
          <p className="text-muted-foreground">Parsing configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AssessmentPrompts
        showTeamMemberPrompt={showTeamMemberPrompt}
        showConfirmNewAssessment={showConfirmNewAssessment}
        showNewAssessmentPrompt={showNewAssessmentPrompt}
        onTeamMemberSubmit={handleTeamMemberSubmit}
        onConfirmNewAssessment={handleConfirmNewAssessment}
        onCancelConfirmNewAssessment={handleCancelConfirmNewAssessment}
        onStartNewAssessment={handleStartNewAssessment}
        onCancelNewAssessment={handleCancelNewAssessment}
      />
      
      <AssessmentLayout
        teamMemberName={teamMemberName}
        allScreens={allScreens}
        currentScreen={currentScreen}
        completedScreens={completedCategories}
        onNewAssessment={handleNewAssessmentRequest}
        onOpenAssessment={handleOpenAssessmentFile}
        onScreenChange={setCurrentScreen}
      >
        <ScreenContent
          isReportScreen={isReportScreen}
          currentCategoryData={currentCategoryData}
          categories={categories}
          selections={selections}
          onSelectionChange={handleSelectionChange}
          currentLevel={currentLevel}
        />

        <NavigationButtons
          currentScreen={currentScreen}
          totalScreens={allScreens.length}
          isReportScreen={isReportScreen}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSubmitAssessment={handleSubmitAssessmentClick}
        />
      </AssessmentLayout>
    </>
  );
}

const Index = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default Index;