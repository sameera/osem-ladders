
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Competence } from '@/utils/model';
import { ScrollableTableContainer } from './ScrollableTableContainer';
import { TableHeader } from './TableHeader';
import { TableCell } from './TableCell';

interface LevelingTableProps {
  competencies: Competence[];
  selections: Record<string, number>;
  feedback: Record<string, Record<string, { evidence: string; nextLevelFeedback: string }>>;
  onSelectionChange: (competence: string, level: number, evidence: string, nextLevelFeedback: string) => void;
}

// Configurable tooltip text length limit
const TOOLTIP_TEXT_LIMIT = 200;

export function LevelingTable({ competencies, selections, feedback, onSelectionChange }: LevelingTableProps) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Get all unique levels across all competencies
  const allLevels = Array.from(
    new Set(competencies.flatMap(area => area.levels.map(level => level.level)))
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
            {competencies.map((competence, areaIndex) => (
              <tr key={competence.name} className={cn(
                "border-b border-border hover:bg-muted/30 transition-colors",
                areaIndex % 2 === 0 && "bg-muted/10"
              )}>
                <td className="py-4 px-6 font-medium text-foreground sticky left-0 z-10 bg-card">
                  {competence.name}
                </td>
                {allLevels.map((level, levelIndex) => {
                  const levelContent = competence.levels.find(l => l.level === level);
                  const isSelected = selections[competence.name] === level;
                  const cellFeedback = feedback[competence.name]?.[level];
                  
                  // Calculate gradient color based on position
                  const getHoverColor = (index: number, total: number) => {
                    const position = index / (total - 1); // 0 to 1
                    if (position <= 0.5) {
                      // Blue to Yellow (first half)
                      const ratio = position * 2; // 0 to 1
                      const r = Math.round(37 + (234 - 37) * ratio);   // 37 (blue) to 234 (yellow)
                      const g = Math.round(99 + (179 - 99) * ratio);   // 99 (blue) to 179 (yellow)
                      const b = Math.round(235 + (8 - 235) * ratio);   // 235 (blue) to 8 (yellow)
                      return `rgb(${r}, ${g}, ${b})`;
                    } else {
                      // Yellow to Purple (second half)
                      const ratio = (position - 0.5) * 2; // 0 to 1
                      const r = Math.round(234 + (147 - 234) * ratio); // 234 (yellow) to 147 (purple)
                      const g = Math.round(179 + (51 - 179) * ratio);  // 179 (yellow) to 51 (purple)
                      const b = Math.round(8 + (234 - 8) * ratio);     // 8 (yellow) to 234 (purple)
                      return `rgb(${r}, ${g}, ${b})`;
                    }
                  };
                  
                  const hoverColor = getHoverColor(levelIndex, allLevels.length);
                  
                  return (
                    <td 
                      key={level} 
                      className="py-2 px-1.5 h-24 align-top min-w-[300px]"
                    >
                      {levelContent ? (
                        <TableCell
                          levelContent={levelContent}
                          competence={competence}
                          level={level}
                          isSelected={isSelected}
                          onSelectionChange={onSelectionChange}
                          tooltipTextLimit={TOOLTIP_TEXT_LIMIT}
                          feedback={cellFeedback}
                          hoverColor={hoverColor}
                        />
                      ) : (
                        <div className="w-full h-full p-1 text-center text-muted-foreground flex items-center justify-center min-h-[80px]">
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
