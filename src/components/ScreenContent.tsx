
import React from 'react';
import { LevelingTable } from '@/components/LevelingTable';
import { Report } from '@/components/Report';
import { Screen } from '@/utils/configParser';

interface ScreenContentProps {
  isReportScreen: boolean;
  currentScreenData: Screen | null;
  screens: Screen[];
  selections: Record<string, Record<string, number>>;
  currentSelections: Record<string, number>;
  currentFeedback: Record<string, Record<string, { evidence: string; nextLevelFeedback: string }>>;
  feedback: Record<string, Record<string, Record<string, { evidence: string; nextLevelFeedback: string }>>>;
  onSelectionChange: (coreArea: string, level: number, evidence: string, nextLevelFeedback: string) => void;
  currentLevel: number;
}

export function ScreenContent({
  isReportScreen,
  currentScreenData,
  screens,
  selections,
  currentSelections,
  currentFeedback,
  feedback,
  onSelectionChange,
  currentLevel
}: ScreenContentProps) {
  if (isReportScreen) {
    return <Report screens={screens} selections={selections} feedback={feedback} currentLevel={currentLevel} />;
  }

  if (!currentScreenData) {
    return null;
  }

  return (
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
          feedback={currentFeedback}
          onSelectionChange={onSelectionChange}
        />
      </div>
    </>
  );
}
