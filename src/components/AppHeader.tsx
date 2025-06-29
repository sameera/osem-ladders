
import React from 'react';
import { AppMenuBar } from '@/components/AppMenuBar';
import { ThemeToggle } from '@/components/ThemeToggle';

interface AppHeaderProps {
  teamMemberName: string;
  onNewAssessment: () => void;
}

export function AppHeader({ teamMemberName, onNewAssessment }: AppHeaderProps) {
  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {teamMemberName ? `${teamMemberName}'s Progression Plan` : 'Engineer Ladder'}
            </h1>
            <p className="text-muted-foreground">
              Achievements and Growth Opportunities
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <AppMenuBar onNewAssessment={onNewAssessment} />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
