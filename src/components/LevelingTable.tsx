import React, { useState } from 'react';
import { TableHeader } from '@/components/TableHeader';
import { TableCell } from '@/components/TableCell';
import { Category, AssessmentSelection } from '@/types/assessment';
import { ScrollableTableContainer } from '@/components/ScrollableTableContainer';

const TOOLTIP_TEXT_LIMIT = 200;

interface LevelingTableProps {
  category: Category;
  selections: AssessmentSelection[];
  onSelectionChange: (categoryId: string, coreAreaId: string, level: number, evidence: string, nextLevelFeedback: string) => void;
}

export function LevelingTable({ category, selections, onSelectionChange }: LevelingTableProps) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const handleScrollStateChange = (canLeft: boolean, canRight: boolean) => {
    setCanScrollLeft(canLeft);
    setCanScrollRight(canRight);
  };

  const allLevels = Array.from(new Set(category.coreAreas.flatMap(area => area.levels.map(level => level.level)))).sort((a, b) => a - b);

  return (
    <div className="relative">
      <ScrollableTableContainer onScrollStateChange={handleScrollStateChange}>
        <table className="w-full border-collapse">
          <TableHeader
            allLevels={allLevels}
            canScrollLeft={canScrollLeft}
            canScrollRight={canScrollRight}
            onScrollLeft={() => {}}
            onScrollRight={() => {}}
          />
          <tbody>
            {category.coreAreas.map((coreArea, index) => {
              const selection = selections.find(s => s.categoryId === category.id && s.coreAreaId === coreArea.id);
              
              return (
                <tr key={index} className="border-b border-border">
                  <td className="p-4 font-medium text-foreground border-r border-border bg-muted/50 min-w-48 max-w-48">
                    <div className="truncate" title={coreArea.name}>
                      {coreArea.name}
                    </div>
                  </td>
                  {allLevels.map((level) => {
                    const levelContent = coreArea.levels.find(l => l.level === level);
                    const isSelected = selection?.level === level;
                    
                    return (
                      <TableCell
                        key={level}
                        level={level}
                        content={levelContent?.content || ''}
                        description={levelContent?.description}
                        isSelected={isSelected}
                        evidence={selection?.evidence || ''}
                        nextLevelFeedback={selection?.nextLevelFeedback || ''}
                        onSelect={(evidence, nextLevelFeedback) => onSelectionChange(category.id, coreArea.id, level, evidence, nextLevelFeedback)}
                        tooltipTextLimit={TOOLTIP_TEXT_LIMIT}
                      />
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </ScrollableTableContainer>
    </div>
  );
}