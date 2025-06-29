
import React, { useState, useEffect, useMemo } from 'react';
import { WizardNavigation } from '@/components/WizardNavigation';
import { ThemeProvider } from '@/components/ThemeProvider';
import { TeamMemberPrompt } from '@/components/TeamMemberPrompt';
import { AppHeader } from '@/components/AppHeader';
import { ScreenContent } from '@/components/ScreenContent';
import { NavigationButtons } from '@/components/NavigationButtons';
import { parseConfig, Screen } from '@/utils/configParser';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import configMarkdown from '@/data/config.md?raw';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [selections, setSelections] = useLocalStorage<Record<string, Record<string, number>>>('leveling-selections', {});
  const [feedback, setFeedback] = useLocalStorage<Record<string, Record<string, Record<string, { evidence: string; nextLevelFeedback: string }>>>>('leveling-feedback', {});
  const [teamMemberName, setTeamMemberName] = useLocalStorage<string>('team-member-name', '');
  const [showNewAssessmentPrompt, setShowNewAssessmentPrompt] = useState(false);
  const [showConfirmNewAssessment, setShowConfirmNewAssessment] = useState(false);
  
  const screens: Screen[] = useMemo(() => parseConfig(configMarkdown), []);
  const allScreens = useMemo(() => [...screens.map(s => s.title), 'Report'], [screens]);
  
  // Check if we need to show the team member prompt
  const showTeamMemberPrompt = !teamMemberName && Object.keys(selections).length === 0;
  
  // Track completed screens (screens where all core areas have selections)
  const completedScreens = useMemo(() => {
    const completed = new Set<number>();
    screens.forEach((screen, index) => {
      const screenSelections = selections[screen.title] || {};
      const allSelected = screen.coreAreas.every(area => 
        screenSelections[area.name] !== undefined
      );
      if (allSelected && screen.coreAreas.length > 0) {
        completed.add(index);
      }
    });
    return completed;
  }, [selections, screens]);

  const isReportScreen = currentScreen === screens.length;
  const currentScreenData = !isReportScreen ? screens[currentScreen] : null;
  const currentSelections = currentScreenData ? selections[currentScreenData.title] || {} : {};
  const currentFeedback = currentScreenData ? feedback[currentScreenData.title] || {} : {};

  const handleTeamMemberSubmit = (name: string) => {
    setTeamMemberName(name);
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

  const calculateMedian = (values: number[]): number => {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
    } else {
      return sorted[mid];
    }
  };

  const handleSubmitAssessment = () => {
    const assessmentData = {
      assessee: teamMemberName,
      leveling: screens.reduce((acc, screen) => {
        const screenSelections = selections[screen.title] || {};
        const screenFeedback = feedback[screen.title] || {};
        const values = Object.values(screenSelections).filter(val => val > 0);
        const median = calculateMedian(values);
        
        acc[screen.title] = {
          level: median,
          notes: screen.coreAreas.reduce((noteAcc, coreArea) => {
            const level = screenSelections[coreArea.name];
            if (level !== undefined) {
              const levelFeedback = screenFeedback[coreArea.name]?.[level];
              noteAcc[coreArea.name] = {
                level: `L${level}`,
                evidence: levelFeedback?.evidence || '',
                advice: levelFeedback?.nextLevelFeedback || ''
              };
            }
            return noteAcc;
          }, {} as Record<string, any>)
        };
        
        return acc;
      }, {} as Record<string, any>)
    };

    // Download as JSON file
    const blob = new Blob([JSON.stringify(assessmentData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${teamMemberName.replace(/\s+/g, '_')}_assessment.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Show new assessment prompt
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
    setSelections({});
    setFeedback({});
    setTeamMemberName('');
    setCurrentScreen(0);
    setShowNewAssessmentPrompt(false);
  };

  const handleCancelNewAssessment = () => {
    setShowNewAssessmentPrompt(false);
  };

  const handleNext = () => {
    if (currentScreen < allScreens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    }
  };

  const handlePrevious = () => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    }
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
    <div className="min-h-screen bg-background">
      <TeamMemberPrompt
        isOpen={showTeamMemberPrompt}
        onSubmit={handleTeamMemberSubmit}
      />
      
      {/* Confirmation prompt for new assessment */}
      <TeamMemberPrompt
        isOpen={showConfirmNewAssessment}
        onSubmit={handleConfirmNewAssessment}
        onCancel={handleCancelConfirmNewAssessment}
        title="Start New Assessment"
        submitText="Yes, Start New"
        cancelText="Cancel"
        showCancel={true}
      />
      
      {/* New Assessment Prompt */}
      <TeamMemberPrompt
        isOpen={showNewAssessmentPrompt}
        onSubmit={handleStartNewAssessment}
        onCancel={handleCancelNewAssessment}
        title="Start New Assessment"
        submitText="Start New Assessment"
        cancelText="Keep Current Assessment"
        showCancel={true}
      />
      
      {/* Header */}
      <AppHeader 
        teamMemberName={teamMemberName}
        onNewAssessment={handleNewAssessmentRequest}
      />

      {/* Navigation */}
      <WizardNavigation
        screens={allScreens}
        currentScreen={currentScreen}
        onScreenChange={setCurrentScreen}
        completedScreens={completedScreens}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <ScreenContent
          isReportScreen={isReportScreen}
          currentScreenData={currentScreenData}
          screens={screens}
          selections={selections}
          currentSelections={currentSelections}
          currentFeedback={currentFeedback}
          onSelectionChange={handleSelectionChange}
        />

        {/* Navigation Buttons */}
        <NavigationButtons
          currentScreen={currentScreen}
          totalScreens={allScreens.length}
          isReportScreen={isReportScreen}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSubmitAssessment={handleSubmitAssessment}
        />
      </main>
    </div>
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
