
import React from 'react';
import { LevelingTable } from '@/components/LevelingTable';
import { Report } from '@/components/Report';
import { Category, AssessmentSelection } from '@/types/assessment';

interface ScreenContentProps {
  isReportScreen: boolean;
  currentCategoryData: Category | null;
  categories: Category[];
  selections: AssessmentSelection[];
  onSelectionChange: (categoryId: string, coreAreaId: string, level: number, evidence: string, nextLevelFeedback: string) => void;
  currentLevel: number;
}

export function ScreenContent({
  isReportScreen,
  currentCategoryData,
  categories,
  selections,
  onSelectionChange,
  currentLevel
}: ScreenContentProps) {
  if (isReportScreen) {
    return <Report categories={categories} selections={selections} currentLevel={currentLevel} />;
  }

  if (!currentCategoryData) {
    return null;
  }

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          {currentCategoryData.title}
        </h2>
        <p className="text-muted-foreground">
          Select the appropriate level for each core area. Click on any cell to make your selection.
        </p>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <LevelingTable
          category={currentCategoryData}
          selections={selections}
          onSelectionChange={onSelectionChange}
        />
      </div>
    </>
  );
}
