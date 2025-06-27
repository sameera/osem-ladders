
import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CoreArea } from '@/utils/configParser';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LevelingTableProps {
  coreAreas: CoreArea[];
  selections: Record<string, number>;
  onSelectionChange: (coreArea: string, level: number) => void;
}

export function LevelingTable({ coreAreas, selections, onSelectionChange }: LevelingTableProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });

  // Get all unique levels across all core areas
  const allLevels = Array.from(
    new Set(coreAreas.flatMap(area => area.levels.map(level => level.level)))
  ).sort((a, b) => a - b);

  // Check scroll position and update arrow visibility
  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth
      );
    }
  };

  // Handle scroll navigation
  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollTo({
        left: container.scrollLeft - scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollTo({
        left: container.scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Handle drag scrolling
  const handleMouseDown = (e: React.MouseEvent) => {
    const container = scrollContainerRef.current;
    if (container) {
      setIsDragging(true);
      setDragStart({
        x: e.pageX - container.offsetLeft,
        scrollLeft: container.scrollLeft
      });
      container.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    
    e.preventDefault();
    const container = scrollContainerRef.current;
    const x = e.pageX - container.offsetLeft;
    const walk = (x - dragStart.x) * 2; // Scroll speed multiplier
    container.scrollLeft = dragStart.scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
    }
  };

  // Set up scroll event listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScrollPosition();
      container.addEventListener('scroll', checkScrollPosition);
      
      // Set initial cursor
      container.style.cursor = 'grab';
      
      return () => {
        container.removeEventListener('scroll', checkScrollPosition);
      };
    }
  }, []);

  return (
    <div className="relative flex items-center">
      {/* Left Navigation Arrow */}
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "h-10 w-10 rounded-full shadow-md bg-background/90 backdrop-blur-sm border-2 transition-all duration-200 mr-4 flex-shrink-0",
          canScrollLeft 
            ? "opacity-100 hover:scale-110 hover:shadow-lg" 
            : "opacity-30 pointer-events-none"
        )}
        onClick={scrollLeft}
        disabled={!canScrollLeft}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      {/* Scrollable Table Container */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto scrollbar-hide select-none flex-1"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <table className="w-full border-collapse bg-card rounded-lg shadow-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-4 px-6 font-semibold text-foreground bg-muted sticky left-0 z-20 min-w-[200px]">
                Core Area
              </th>
              {allLevels.map(level => (
                <th key={level} className="text-center py-4 px-4 font-semibold text-foreground bg-muted min-w-[200px]">
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
                <td className="py-4 px-6 font-medium text-foreground sticky left-0 z-10 bg-card">
                  {coreArea.name}
                </td>
                {allLevels.map(level => {
                  const levelContent = coreArea.levels.find(l => l.level === level);
                  const isSelected = selections[coreArea.name] === level;
                  
                  return (
                    <td key={level} className="py-2 px-2">
                      {levelContent ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectionChange(coreArea.name, level);
                          }}
                          className={cn(
                            "w-full text-left p-3 rounded-md border transition-all duration-200",
                            "hover:border-primary hover:shadow-md",
                            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                            isSelected 
                              ? "border-primary bg-primary/10 text-primary shadow-md" 
                              : "border-border bg-background hover:bg-accent",
                            "cursor-pointer"
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

      {/* Right Navigation Arrow */}
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "h-10 w-10 rounded-full shadow-md bg-background/90 backdrop-blur-sm border-2 transition-all duration-200 ml-4 flex-shrink-0",
          canScrollRight 
            ? "opacity-100 hover:scale-110 hover:shadow-lg" 
            : "opacity-30 pointer-events-none"
        )}
        onClick={scrollRight}
        disabled={!canScrollRight}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
