
import React, { useState, useEffect, useMemo } from 'react';
import { WizardNavigation } from '@/components/WizardNavigation';
import { LevelingTable } from '@/components/LevelingTable';
import { Report } from '@/components/Report';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ThemeProvider } from '@/components/ThemeProvider';
import { parseConfig, Screen } from '@/utils/configParser';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import configMarkdown from '@/data/config.md?raw';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [selections, setSelections] = useLocalStorage<Record<string, Record<string, number>>>('leveling-selections', {});
  
  const screens: Screen[] = useMemo(() => parseConfig(configMarkdown), []);
  const allScreens = useMemo(() => [...screens.map(s => s.title), 'Report'], [screens]);
  
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

  const handleSelectionChange = (coreArea: string, level: number) => {
    if (!currentScreenData) return;
    
    setSelections(prev => ({
      ...prev,
      [currentScreenData.title]: {
        ...prev[currentScreenData.title],
        [coreArea]: level
      }
    }));
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

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all selections? This cannot be undone.')) {
      setSelections({});
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
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Engineer Leveling System</h1>
              <p className="text-muted-foreground">Assess and track engineering skill levels</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="text-destructive hover:text-destructive"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset All
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <WizardNavigation
        screens={allScreens}
        currentScreen={currentScreen}
        onScreenChange={setCurrentScreen}
        completedScreens={completedScreens}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isReportScreen ? (
          <Report screens={screens} selections={selections} />
        ) : currentScreenData ? (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                {currentScreenData.title}
              </h2>
              <p className="text-muted-foreground">
                Select the appropriate level for each core area. Click on any cell to make your selection.
              </p>
            </div>

            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <LevelingTable
                coreAreas={currentScreenData.coreAreas}
                selections={currentSelections}
                onSelectionChange={handleSelectionChange}
              />
            </div>
          </>
        ) : null}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentScreen === 0}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          <div className="text-sm text-muted-foreground">
            Screen {currentScreen + 1} of {allScreens.length}
          </div>

          <Button
            onClick={handleNext}
            disabled={currentScreen === allScreens.length - 1}
            className="flex items-center space-x-2"
          >
            <span>Next</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
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
