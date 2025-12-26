
import React from 'react';
import { AppMenuBar } from '@/components/AppMenuBar';
import { ThemeToggle } from '@/components/ThemeToggle';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <AppMenuBar />
            <div>
              {subtitle && (
                <p className="text-sm text-muted-foreground">
                  {subtitle}
                </p>
              )}
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
