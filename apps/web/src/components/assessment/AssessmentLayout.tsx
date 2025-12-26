import React from 'react';
import { AppHeader } from '@/components/AppHeader';
import { WizardNavigation } from '@/components/WizardNavigation';

interface AssessmentLayoutProps {
  teamMemberName: string;
  allScreens: string[];
  currentScreen: number;
  completedScreens: Set<number>;
  onScreenChange: (screen: number) => void;
  children: React.ReactNode;
}

export function AssessmentLayout({
  teamMemberName,
  allScreens,
  currentScreen,
  completedScreens,
  onScreenChange,
  children
}: AssessmentLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title={teamMemberName}
        subtitle={import.meta.env.VITE_BRANDING_APP_NAME || 'Career Growth Plan'}
      />

      <WizardNavigation
        screens={allScreens}
        currentScreen={currentScreen}
        onScreenChange={onScreenChange}
        completedScreens={completedScreens}
      />

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}