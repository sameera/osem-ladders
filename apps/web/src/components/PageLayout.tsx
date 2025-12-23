import React from 'react';
import { AppHeader } from '@/components/AppHeader';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function PageLayout({ title, subtitle, children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader title={title} subtitle={subtitle} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
