import React, { useState, useMemo } from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ScreenContent } from '@/components/ScreenContent';
import { NavigationButtons } from '@/components/NavigationButtons';
import { parseConfig, Screen } from '@/utils/configParser';
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
  
  const screens: Screen[] = useMemo(() => parseConfig(configMarkdown), []);
  const allScreens = useMemo(() => [...screens.map(s => s.title), 'Report'], [screens]);
  
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

  const {
    currentScreen,
    setCurrentScreen,
    handleNext,
    handlePrevious,
    resetNavigation
  } = useAssessmentNavigation(allScreens.length);

  const completedScreens = useAssessmentCompletion(screens, selections);
  const { handleSubmitAssessment, handleOpenAssessment } = useAssessmentFile();
  
  // Check if we need to show the team member prompt
  const showTeamMemberPrompt = !teamMemberName && Object.keys(selections).length === 0;

  const isReportScreen = currentScreen === screens.length;
  const currentScreenData = !isReportScreen ? screens[currentScreen] : null;
  const currentSelections = currentScreenData ? selections[currentScreenData.title] || {} : {};
  const currentFeedback = currentScreenData ? feedback[currentScreenData.title] || {} : {};

  // Debug logging to help troubleshoot
  console.log('Current state:', {
    currentScreen,
    isReportScreen,
    currentScreenData: currentScreenData?.title,
    selectionsKeys: Object.keys(selections),
    feedbackKeys: Object.keys(feedback),
    currentSelections,
    currentFeedback
  });

  const handleTeamMemberSubmit = (name: string, level?: number) => {
    setTeamMemberName(name);
    if (level !== undefined) {
      setCurrentLevel(level);
    }
  };

  const handleSelectionChange = (coreArea: string, level: number, evidence: string, nextLevelFeedback: string) => {
    if (!currentScreenData) return;
    
    setSelections(prev => ({
      ...prev,
      [currentScreenData.title]: {
        ...prev[currentScreenData.title],
        [coreArea]: level
      }
    }));

    setFeedback(prev => ({
      ...prev,
      [currentScreenData.title]: {
        ...prev[currentScreenData.title],
        [coreArea]: {
          ...prev[currentScreenData.title]?.[coreArea],
          [level]: { evidence, nextLevelFeedback }
        }
      }
    }));
  };

  const handleSubmitAssessmentClick = () => {
    handleSubmitAssessment(teamMemberName, currentLevel, screens, selections, feedback);
    setShowNewAssessmentPrompt(true);
  };

  const handleNewAssessmentRequest = () => {
    // Check if there are any selections made
    const hasSelections = Object.keys(selections).length > 0 && 
      Object.values(selections).some(screenSelections => 
        Object.keys(screenSelections).length > 0
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
      setCurrentScreen
    );
  };

  if (screens.length === 0) {
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
        completedScreens={completedScreens}
        onNewAssessment={handleNewAssessmentRequest}
        onOpenAssessment={handleOpenAssessmentFile}
        onScreenChange={setCurrentScreen}
      >
        <ScreenContent
          isReportScreen={isReportScreen}
          currentScreenData={currentScreenData}
          screens={screens}
          selections={selections}
          currentSelections={currentSelections}
          currentFeedback={currentFeedback}
          feedback={feedback}
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
