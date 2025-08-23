
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
        {allLevels.map((level) => {
          const getRepeatedEmoji = (emoji: string, count: number) => {
            const maxCount = Math.min(count, 3);
            return (
              <span className="inline-flex items-center">
                {Array.from({ length: maxCount }, (_, i) => (
                  <span 
                    key={i} 
                    className="drop-shadow-md"
                    style={i > 0 ? { marginLeft: '-0.75em' } : {}}
                  >
                    {emoji}
                  </span>
                ))}
              </span>
            );
          };

          const getHeaderContent = (level: number) => {
            if (level === 6) return "🤘";
            if (level === 7) return "🤘🤘";
            
            const rocks = level === 1 || level === 2 ? level : level - 1;
            const stars = level - 2;
            
            return (
              <span className="flex items-center justify-center gap-2">
                {getRepeatedEmoji("🪨", rocks)}
                {stars > 0 && getRepeatedEmoji("🌟", stars)}
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
