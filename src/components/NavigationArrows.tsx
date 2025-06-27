
import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface NavigationArrowsProps {
  canScrollLeft: boolean;
  canScrollRight: boolean;
  onScrollLeft: () => void;
  onScrollRight: () => void;
}

export function NavigationArrows({ 
  canScrollLeft, 
  canScrollRight, 
  onScrollLeft, 
  onScrollRight 
}: NavigationArrowsProps) {
  return (
    <div className="flex items-center gap-1 border border-border rounded-md p-1 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all duration-200 group">
      <button
        onClick={onScrollLeft}
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
        onClick={onScrollRight}
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
  );
}
