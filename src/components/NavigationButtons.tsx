
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Download } from 'lucide-react';

interface NavigationButtonsProps {
  currentScreen: number;
  totalScreens: number;
  isReportScreen: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmitAssessment: () => void;
}

export function NavigationButtons({
  currentScreen,
  totalScreens,
  isReportScreen,
  onPrevious,
  onNext,
  onSubmitAssessment
}: NavigationButtonsProps) {
  return (
    <div className="flex justify-between items-center mt-8">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentScreen === 0}
        className="flex items-center space-x-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Previous</span>
      </Button>

      <div className="text-sm text-muted-foreground">
        Screen {currentScreen + 1} of {totalScreens}
      </div>

      {isReportScreen ? (
        <Button
          onClick={onSubmitAssessment}
          className="flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Submit Assessment</span>
        </Button>
      ) : (
        <Button
          onClick={onNext}
          disabled={currentScreen === totalScreens - 1}
          className="flex items-center space-x-2"
        >
          <span>Next</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
