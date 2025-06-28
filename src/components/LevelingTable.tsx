
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { CoreArea } from '@/utils/configParser';
import { ScrollableTableContainer } from './ScrollableTableContainer';
import { TableHeader } from './TableHeader';
import { TableCell } from './TableCell';

interface LevelingTableProps {
  coreAreas: CoreArea[];
  selections: Record<string, number>;
  feedback: Record<string, Record<string, { evidence: string; nextLevelFeedback: string }>>;
  onSelectionChange: (coreArea: string, level: number, evidence: string, nextLevelFeedback: string) => void;
}

// Configurable tooltip text length limit
const TOOLTIP_TEXT_LIMIT = 200;

export function LevelingTable({ coreAreas, selections, feedback, onSelectionChange }: LevelingTableProps) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Get all unique levels across all core areas
  const allLevels = Array.from(
    new Set(coreAreas.flatMap(area => area.levels.map(level => level.level)))
  ).sort((a, b) => a - b);

  const handleScrollStateChange = (canLeft: boolean, canRight: boolean) => {
    setCanScrollLeft(canLeft);
    setCanScrollRight(canRight);
  };

  return (
    <div className="relative">
      <ScrollableTableContainer onScrollStateChange={handleScrollStateChange}>
        <table className="w-full border-collapse bg-card rounded-lg shadow-sm">
          <TableHeader
            allLevels={allLevels}
            canScrollLeft={canScrollLeft}
            canScrollRight={canScrollRight}
            onScrollLeft={() => {}}
            onScrollRight={() => {}}
          />
          <tbody>
            {coreAreas.map((coreArea, areaIndex) => (
              <tr key={coreArea.name} className={cn(
                "border-b border-border hover:bg-muted/30 transition-colors",
                areaIndex % 2 === 0 && "bg-muted/10"
              )}>
                <td className="py-4 px-6 font-medium text-foreground sticky left-0 z-10 bg-card">
                  {coreArea.name}
                </td>
                {allLevels.map(level => {
                  const levelContent = coreArea.levels.find(l => l.level === level);
                  const isSelected = selections[coreArea.name] === level;
                  const cellFeedback = feedback[coreArea.name]?.[level];
                  
                  return (
                    <td key={level} className="py-2 px-2">
                      {levelContent ? (
                        <TableCell
                          levelContent={levelContent}
                          coreArea={coreArea}
                          level={level}
                          isSelected={isSelected}
                          onSelectionChange={onSelectionChange}
                          tooltipTextLimit={TOOLTIP_TEXT_LIMIT}
                          feedback={cellFeedback}
                        />
                      ) : (
                        <div className="w-full p-3 text-center text-muted-foreground">
                          —
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollableTableContainer>
    </div>
  );
}
