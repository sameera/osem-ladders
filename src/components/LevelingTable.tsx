
import React from 'react';
import { cn } from '@/lib/utils';
import { CoreArea } from '@/utils/configParser';

interface LevelingTableProps {
  coreAreas: CoreArea[];
  selections: Record<string, number>;
  onSelectionChange: (coreArea: string, level: number) => void;
}

export function LevelingTable({ coreAreas, selections, onSelectionChange }: LevelingTableProps) {
  // Get all unique levels across all core areas
  const allLevels = Array.from(
    new Set(coreAreas.flatMap(area => area.levels.map(level => level.level)))
  ).sort((a, b) => a - b);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-card rounded-lg shadow-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-4 px-6 font-semibold text-foreground bg-muted/50">
              Core Area
            </th>
            {allLevels.map(level => (
              <th key={level} className="text-center py-4 px-4 font-semibold text-foreground bg-muted/50 min-w-[200px]">
                L{level}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {coreAreas.map((coreArea, areaIndex) => (
            <tr key={coreArea.name} className={cn(
              "border-b border-border hover:bg-muted/30 transition-colors",
              areaIndex % 2 === 0 && "bg-muted/10"
            )}>
              <td className="py-4 px-6 font-medium text-foreground">
                {coreArea.name}
              </td>
              {allLevels.map(level => {
                const levelContent = coreArea.levels.find(l => l.level === level);
                const isSelected = selections[coreArea.name] === level;
                
                return (
                  <td key={level} className="py-2 px-2">
                    {levelContent ? (
                      <button
                        onClick={() => onSelectionChange(coreArea.name, level)}
                        className={cn(
                          "w-full text-left p-3 rounded-md border transition-all duration-200",
                          "hover:border-primary hover:shadow-md",
                          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                          isSelected 
                            ? "border-primary bg-primary/10 text-primary shadow-md" 
                            : "border-border bg-background hover:bg-accent"
                        )}
                      >
                        <div className="text-sm leading-relaxed">
                          {levelContent.content}
                        </div>
                      </button>
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
    </div>
  );
}
