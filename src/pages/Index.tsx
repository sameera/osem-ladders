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
  const [currentLevel, setCurrentLevel] = useLocalStorage<number>('current-level', 1);
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
      currentLevel: currentLevel,
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
    setCurrentLevel(1);
    setCurrentScreen(0);
    setShowNewAssessmentPrompt(false);
  };

  const handleCancelNewAssessment = () => {
    setShowNewAssessmentPrompt(false);
  };

  const handleOpenAssessment = (data: any) => {
    try {
      console.log('Loading assessment data:', data);
      
      if (!data.assessee || !data.leveling) {
        alert('Invalid assessment file format');
        return;
      }

      // Set the team member name and current level
      setTeamMemberName(data.assessee);
      if (data.currentLevel) {
        setCurrentLevel(data.currentLevel);
      }

      // Convert the leveling data back to the format used by the app
      const newSelections: Record<string, Record<string, number>> = {};
      const newFeedback: Record<string, Record<string, Record<string, { evidence: string; nextLevelFeedback: string }>>> = {};

      Object.entries(data.leveling).forEach(([screenTitle, screenData]: [string, any]) => {
        console.log('Processing screen:', screenTitle, screenData);
        
        newSelections[screenTitle] = {};
        newFeedback[screenTitle] = {};

        if (screenData.notes) {
          Object.entries(screenData.notes).forEach(([coreArea, noteData]: [string, any]) => {
            console.log('Processing core area:', coreArea, noteData);
            
            // Parse level more robustly
            let level: number;
            if (typeof noteData.level === 'number') {
              level = noteData.level;
            } else if (typeof noteData.level === 'string') {
              // Handle both "L1" format and plain number strings
              const levelStr = noteData.level.toString().replace(/^L/i, '');
              level = parseInt(levelStr, 10);
            } else {
              console.warn('Invalid level format for', coreArea, ':', noteData.level);
              return;
            }

            if (isNaN(level) || level < 1) {
              console.warn('Invalid level number for', coreArea, ':', level);
              return;
            }

            newSelections[screenTitle][coreArea] = level;
            
            if (!newFeedback[screenTitle][coreArea]) {
              newFeedback[screenTitle][coreArea] = {};
            }
            
            newFeedback[screenTitle][coreArea][level] = {
              evidence: noteData.evidence || '',
              nextLevelFeedback: noteData.advice || ''
            };
            
            console.log('Set selection:', screenTitle, coreArea, level);
          });
        }
      });

      console.log('Final selections:', newSelections);
      console.log('Final feedback:', newFeedback);

      // Force update by setting data and then ensuring we're on the first screen
      setSelections(newSelections);
      setFeedback(newFeedback);
      
      // Add a small delay to ensure state updates have propagated
      setTimeout(() => {
        setCurrentScreen(0);
        console.log('Current selections after load:', newSelections);
        console.log('Current feedback after load:', newFeedback);
      }, 100);
      
    } catch (error) {
      console.error('Error loading assessment:', error);
      alert('Error loading assessment file');
    }
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
        onOpenAssessment={handleOpenAssessment}
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
          feedback={feedback}
          onSelectionChange={handleSelectionChange}
          currentLevel={currentLevel}
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
