import { useMemo } from 'react';
import { Category } from '@/utils/configParser';

export function useAssessmentCompletion(
  categories: Category[],
  selections: Record<string, Record<string, number>>
) {
  const completedCategories = useMemo(() => {
    const completed = new Set<number>();
    categories.forEach((category, index) => {
      const categorySelections = selections[category.title] || {};
      const allSelected = category.coreAreas.every(area => 
        categorySelections[area.name] !== undefined
      );
      if (allSelected && category.coreAreas.length > 0) {
        completed.add(index);
      }
    });
    return completed;
  }, [selections, categories]);

  return completedCategories;
}