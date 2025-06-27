
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
  return (
    <thead>
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
        {allLevels.map((level) => (
          <th key={level} className="text-center py-4 px-4 font-semibold text-foreground bg-muted min-w-[200px]">
            L{level}
          </th>
        ))}
      </tr>
    </thead>
  );
}
