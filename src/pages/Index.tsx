import React, { useState, useMemo } from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ScreenContent } from '@/components/ScreenContent';
import { NavigationButtons } from '@/components/NavigationButtons';
import { parseConfig,  } from '@/utils/configParser';
import { useAssessmentState } from '@/hooks/useAssessmentState';
import { useAssessmentNavigation } from '@/hooks/useAssessmentNavigation';
import { useAssessmentCompletion } from '@/hooks/useAssessmentCompletion';
import { useAssessmentFile } from '@/hooks/useAssessmentFile';
import { AssessmentPrompts } from '@/components/assessment/AssessmentPrompts';
import { AssessmentLayout } from '@/components/assessment/AssessmentLayout';
import configMarkdown from '@/data/config.md?raw';
import { Category } from "@/utils/model";

function AppContent() {
  const [showNewAssessmentPrompt, setShowNewAssessmentPrompt] = useState(false);
  const [showConfirmNewAssessment, setShowConfirmNewAssessment] = useState(false);
  
  const categories: Category[] = useMemo(() => parseConfig(configMarkdown), []);
  const allCategories = useMemo(() => [...categories.map(c => c.title), 'Report'], [categories]);
  
  // Custom hooks
  const {
    selections,
    setSelections,
    feedback,
    setFeedback,
    teamMemberName,
    setTeamMemberName,
    currentLevel,
    setCurrentLevel,
    resetAssessment
  } = useAssessmentState();

  // Way forward state
  const [wayForward, setWayForward] = useState<string>("");

  const {
    currentScreen: currentCategory,
    setCurrentScreen: setCurrentCategory,
    handleNext,
    handlePrevious,
    resetNavigation
  } = useAssessmentNavigation(allCategories.length);

  const completedCategories = useAssessmentCompletion(categories, selections);
  const { handleSubmitAssessment, handleOpenAssessment } = useAssessmentFile();
  
  // Check if we need to show the team member prompt
  const showTeamMemberPrompt = !teamMemberName && Object.keys(selections).length === 0;

  const isReportScreen = currentCategory === categories.length;
  const currentCategoryData = !isReportScreen ? categories[currentCategory] : null;
  const currentSelections = currentCategoryData ? selections[currentCategoryData.title] || {} : {};
  const currentFeedback = currentCategoryData ? feedback[currentCategoryData.title] || {} : {};

  // Debug logging to help troubleshoot
  console.log('Current state:', {
    currentCategory,
    isReportScreen,
    currentCategoryData: currentCategoryData?.title,
    selectionsKeys: Object.keys(selections),
    feedbackKeys: Object.keys(feedback),
    currentSelections,
    currentFeedback
  });

  const handleTeamMemberSubmit = (name: string) => {
    setTeamMemberName(name);
  };

  const handleSelectionChange = (coreArea: string, level: number, evidence: string, nextLevelFeedback: string) => {
    if (!currentCategoryData) return;
    
    setSelections(prev => ({
      ...prev,
      [currentCategoryData.title]: {
        ...prev[currentCategoryData.title],
        [coreArea]: level
      }
    }));

    setFeedback(prev => ({
      ...prev,
      [currentCategoryData.title]: {
        ...prev[currentCategoryData.title],
        [coreArea]: {
          ...prev[currentCategoryData.title]?.[coreArea],
          [level]: { evidence, nextLevelFeedback }
        }
      }
    }));
  };

  const handleSubmitAssessmentClick = () => {
    handleSubmitAssessment(teamMemberName, currentLevel, categories, selections, feedback, wayForward);
    setShowNewAssessmentPrompt(true);
  };

  const handleNewAssessmentRequest = () => {
    // Check if there are any selections made
    const hasSelections = Object.keys(selections).length > 0 && 
      Object.values(selections).some(categorySelections => 
        Object.keys(categorySelections).length > 0
      );

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
    setWayForward("");
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
      setFeedback,
      setCurrentCategory,
      setWayForward
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
        allScreens={allCategories}
        currentScreen={currentCategory}
        completedScreens={completedCategories}
        onNewAssessment={handleNewAssessmentRequest}
        onOpenAssessment={handleOpenAssessmentFile}
        onScreenChange={setCurrentCategory}
      >
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
