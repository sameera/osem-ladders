
import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WizardNavigationProps {
  screens: string[];
  currentScreen: number;
  onScreenChange: (screen: number) => void;
  completedScreens: Set<number>;
}

export function WizardNavigation({ 
  screens, 
  currentScreen, 
  onScreenChange, 
  completedScreens 
}: WizardNavigationProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });

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
      const scrollAmount = container.clientWidth * 0.5;
      container.scrollTo({
        left: container.scrollLeft - scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.5;
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
    const walk = (x - dragStart.x) * 2;
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

  // Set up scroll event listener and resize observer
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScrollPosition();
      container.addEventListener('scroll', checkScrollPosition);
      
      // Set initial cursor
      container.style.cursor = 'grab';
      
      // Check on window resize
      const handleResize = () => {
        checkScrollPosition();
      };
      window.addEventListener('resize', handleResize);
      
      return () => {
        container.removeEventListener('scroll', checkScrollPosition);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [screens]);

  return (
    <nav className="w-full bg-card border-b border-border relative">
      <div className="container mx-auto px-4 py-4 relative">
        {/* Left Navigation Arrow */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full shadow-md bg-background/90 backdrop-blur-sm border-2 transition-all duration-200",
            canScrollLeft 
              ? "opacity-100 hover:scale-110 hover:shadow-lg" 
              : "opacity-0 pointer-events-none"
          )}
          onClick={scrollLeft}
          disabled={!canScrollLeft}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Right Navigation Arrow */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full shadow-md bg-background/90 backdrop-blur-sm border-2 transition-all duration-200",
            canScrollRight 
              ? "opacity-100 hover:scale-110 hover:shadow-lg" 
              : "opacity-0 pointer-events-none"
          )}
          onClick={scrollRight}
          disabled={!canScrollRight}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <div 
          ref={scrollContainerRef}
          className="flex items-center justify-between overflow-x-auto scrollbar-hide select-none px-8"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {screens.map((screen, index) => {
            const isActive = index === currentScreen;
            const isCompleted = completedScreens.has(index);
            const isClickable = true;

            return (
              <div key={index} className="flex items-center flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onScreenChange(index);
                  }}
                  disabled={!isClickable}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive && "bg-primary text-primary-foreground shadow-md",
                    isCompleted && !isActive && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                    !isClickable && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium",
                    isActive && "bg-primary-foreground text-primary",
                    isCompleted && !isActive && "bg-green-500 text-white",
                    !isActive && !isCompleted && "bg-muted text-muted-foreground"
                  )}>
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className="font-medium whitespace-nowrap">{screen}</span>
                </button>
                
                {index < screens.length - 1 && (
                  <div className="w-8 h-px bg-border mx-2 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
