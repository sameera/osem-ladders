
import React from 'react';
import { NavigationArrows } from './NavigationArrows';

interface TableHeaderProps {
  allLevels: number[];
  canScrollLeft: boolean;
  canScrollRight: boolean;
  onScrollLeft: () => void;
  onScrollRight: () => void;
}

export function TableHeader({ 
  allLevels, 
  canScrollLeft, 
  canScrollRight, 
  onScrollLeft, 
  onScrollRight 
}: TableHeaderProps) {
  // Define level ranges for each category
  const getSectionForLevel = (level: number) => {
    if (level <= 2) return 'solid';
    if (level <= 5) return 'shining';
    return 'iconic';
  };

  // Group levels by section
  const levelsBySection = allLevels.reduce((acc, level) => {
    const section = getSectionForLevel(level);
    if (!acc[section]) acc[section] = [];
    acc[section].push(level);
    return acc;
  }, {} as Record<string, number[]>);

  return (
    <thead>
      {/* Section headers row */}
      <tr className="border-b border-border/50">
        <th className="sticky left-0 z-20 bg-muted"></th>
        {levelsBySection.solid && (
          <th 
            colSpan={levelsBySection.solid.length} 
            className="text-center py-3 px-4 font-bold text-lg text-foreground bg-muted border-r border-border/30"
          >
            <span className="text-slate-600 dark:text-slate-300">Solid</span>
          </th>
        )}
        {levelsBySection.shining && (
          <th 
            colSpan={levelsBySection.shining.length} 
            className="text-center py-3 px-4 font-bold text-lg text-foreground bg-muted border-r border-border/30"
          >
            <span className="text-amber-600 dark:text-amber-400">Shining</span>
          </th>
        )}
        {levelsBySection.iconic && (
          <th 
            colSpan={levelsBySection.iconic.length} 
            className="text-center py-3 px-4 font-bold text-lg text-foreground bg-muted"
          >
            <span className="text-purple-600 dark:text-purple-400">Iconic</span>
          </th>
        )}
      </tr>
      
      {/* Level headers row */}
      <tr className="border-b border-border">
        <th className="text-left py-4 px-6 font-semibold text-foreground bg-muted sticky left-0 z-20 min-w-[200px] relative">
          <div className="flex items-center justify-between">
            <span>Core Area</span>
            <NavigationArrows
              canScrollLeft={canScrollLeft}
              canScrollRight={canScrollRight}
              onScrollLeft={onScrollLeft}
              onScrollRight={onScrollRight}
            />
          </div>
        </th>
        {allLevels.map((level) => {
          const getHeaderContent = (level: number) => {
            if (level === 6) return "🤘";
            if (level === 7) return "🤘🤘";
            
            const rocks = level === 1 || level === 2 ? level : level - 1;
            const stars = level - 2;
            
            return (
              <span>
                🪨 <span className="text-muted-foreground">x {rocks}</span>
                {stars > 0 && (
                  <>
                    {"  "}🌟 <span className="text-muted-foreground">x {stars}</span>
                  </>
                )}
              </span>
            );
          };
          
          return (
            <th key={level} className="text-center py-4 px-4 font-semibold text-foreground bg-muted min-w-[200px]">
              {getHeaderContent(level)}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
