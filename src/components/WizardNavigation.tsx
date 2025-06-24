
import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

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
  return (
    <nav className="w-full bg-card border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between overflow-x-auto">
          {screens.map((screen, index) => {
            const isActive = index === currentScreen;
            const isCompleted = completedScreens.has(index);
            const isClickable = true;

            return (
              <div key={index} className="flex items-center flex-shrink-0">
                <button
                  onClick={() => onScreenChange(index)}
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
