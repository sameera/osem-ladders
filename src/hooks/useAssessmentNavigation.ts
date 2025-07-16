import { useState } from 'react';

export function useAssessmentNavigation(totalScreens: number) {
  const [currentScreen, setCurrentScreen] = useState(0);

  const handleNext = () => {
    if (currentScreen < totalScreens - 1) {
      setCurrentScreen(currentScreen + 1);
    }
  };

  const handlePrevious = () => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    }
  };

  const resetNavigation = () => {
    setCurrentScreen(0);
  };

  return {
    currentScreen,
    setCurrentScreen,
    handleNext,
    handlePrevious,
    resetNavigation
  };
}