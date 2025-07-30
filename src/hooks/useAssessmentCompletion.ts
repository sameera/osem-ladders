import { useMemo } from 'react';
import { Screen } from '@/utils/configParser';

export function useAssessmentCompletion(
  screens: Screen[],
  selections: Record<string, Record<string, number>>
) {
  const completedScreens = useMemo(() => {
    const completed = new Set<number>();
    screens.forEach((screen, index) => {
      const screenSelections = selections[screen.title] || {};
      const allSelected = screen.coreAreas.every(area => 
        screenSelections[area.name] !== undefined
      );
      if (allSelected && screen.coreAreas.length > 0) {
        completed.add(index);
      }
    });
    return completed;
  }, [selections, screens]);

  return completedScreens;
}