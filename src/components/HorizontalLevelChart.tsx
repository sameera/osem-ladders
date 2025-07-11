import React from 'react';
import { MapPin } from 'lucide-react';

interface HorizontalLevelChartProps {
  title: string;
  data: Array<{
    coreArea: string;
    actual: number;
    expected: number;
  }>;
}

export function HorizontalLevelChart({ title, data }: HorizontalLevelChartProps) {
  const levels = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-center text-foreground">{title}</h3>
      
      {data.map((item, index) => {
        if (item.actual === 0) return null; // Skip unassessed areas
        
        const isAboveExpected = item.actual > item.expected;
        const isBelowExpected = item.actual < item.expected;
        const lineColor = isAboveExpected ? '#22c55e' : isBelowExpected ? '#ef4444' : '#3b82f6';
        const minLevel = Math.min(item.actual, item.expected);
        const maxLevel = Math.max(item.actual, item.expected);
        
        return (
          <div key={index} className="space-y-2">
            <div className="text-sm font-medium text-foreground">{item.coreArea}</div>
            
            <div className="relative">
              {/* Horizontal line background */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted transform -translate-y-1/2" />
              
              {/* Thick colored line between current and actual */}
              {item.actual !== item.expected && (
                <div 
                  className="absolute top-1/2 h-1 transform -translate-y-1/2 rounded-full"
                  style={{
                    backgroundColor: lineColor,
                    left: `${((minLevel - 1) / 6) * 100}%`,
                    width: `${((maxLevel - minLevel) / 6) * 100}%`
                  }}
                />
              )}
              
              {/* Level dots */}
              <div className="relative flex justify-between items-center h-8">
                {levels.map((level) => (
                  <div key={level} className="relative flex flex-col items-center">
                    {/* Base vertical line */}
                    <div className="w-0.5 h-4 bg-muted-foreground/30" />
                    
                    {/* Expected level marker (MapPin) */}
                    {level === item.expected && (
                      <MapPin className="absolute -top-1 w-4 h-4 text-muted-foreground/60" />
                    )}
                    
                    {/* Actual level marker (MapPin icon) */}
                    {level === item.actual && (
                      <MapPin 
                        className="absolute -top-1 w-4 h-4 shadow-sm"
                        style={{ color: lineColor }}
                      />
                    )}
                    
                    {/* Level number */}
                    <span className="text-xs text-muted-foreground mt-3">{level}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Legend */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-muted-foreground/60" />
                  <span>Expected (Level {item.expected})</span>
                </div>
              <div className="flex items-center gap-1">
                <MapPin 
                  className="w-3 h-3"
                  style={{ color: lineColor }}
                />
                <span>Actual (Level {item.actual})</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}