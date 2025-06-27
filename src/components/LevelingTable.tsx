import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CoreArea } from '@/utils/configParser';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MarkdownRenderer } from './MarkdownRenderer';

interface LevelingTableProps {
  coreAreas: CoreArea[];
  selections: Record<string, number>;
  onSelectionChange: (coreArea: string, level: number) => void;
}

// Configurable tooltip text length limit
const TOOLTIP_TEXT_LIMIT = 200;

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

  const shouldShowDialog = (description: string) => {
    return description.length > TOOLTIP_TEXT_LIMIT;
  };

  const getTruncatedDescription = (description: string) => {
    if (description.length <= TOOLTIP_TEXT_LIMIT) {
      return description;
    }
    return description.substring(0, TOOLTIP_TEXT_LIMIT) + '...';
  };

  const renderCellContent = (levelContent: any, coreArea: CoreArea, level: number) => {
    const isSelected = selections[coreArea.name] === level;
    const hasDescription = levelContent.description && levelContent.description.trim();
    
    const cellButton = (
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
    );

    if (!hasDescription) {
      return cellButton;
    }

    const needsDialog = shouldShowDialog(levelContent.description);
    const truncatedDescription = getTruncatedDescription(levelContent.description);

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {cellButton}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-sm p-3">
            <div className="space-y-2">
              <MarkdownRenderer 
                content={truncatedDescription}
                className="text-sm"
              />
              {needsDialog && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="mt-2">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Full Description
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>{levelContent.content}</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="mt-4 max-h-[60vh]">
                      <MarkdownRenderer 
                        content={levelContent.description}
                        className="text-sm leading-relaxed pr-4"
                      />
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="relative">
      {/* Scrollable Table Container */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto scrollbar-hide select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <table className="w-full border-collapse bg-card rounded-lg shadow-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-4 px-6 font-semibold text-foreground bg-muted sticky left-0 z-20 min-w-[200px] relative">
                <div className="flex items-center justify-between">
                  <span>Core Area</span>
                  <div className="flex items-center gap-1 border border-border rounded-md p-1 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all duration-200 group">
                    <button
                      onClick={scrollLeft}
                      disabled={!canScrollLeft}
                      className={cn(
                        "p-1 rounded transition-all duration-200",
                        canScrollLeft 
                          ? "text-foreground hover:text-primary hover:bg-primary/10 hover:scale-110" 
                          : "text-muted-foreground/50 cursor-not-allowed"
                      )}
                    >
                      <ArrowLeft className="h-3 w-3" />
                    </button>
                    <button
                      onClick={scrollRight}
                      disabled={!canScrollRight}
                      className={cn(
                        "p-1 rounded transition-all duration-200",
                        canScrollRight 
                          ? "text-foreground hover:text-primary hover:bg-primary/10 hover:scale-110" 
                          : "text-muted-foreground/50 cursor-not-allowed"
                      )}
                    >
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </th>
              {allLevels.map((level) => (
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
                  
                  return (
                    <td key={level} className="py-2 px-2">
                      {levelContent ? (
                        renderCellContent(levelContent, coreArea, level)
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
    </div>
  );
}
