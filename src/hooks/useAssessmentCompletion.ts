import { useMemo } from 'react';
import { Category, AssessmentSelection } from '@/types/assessment';

export function useAssessmentCompletion(
  categories: Category[],
  selections: AssessmentSelection[]
) {
  const completedCategories = useMemo(() => {
    const completed = new Set<number>();
    categories.forEach((category, index) => {
      const allSelected = category.coreAreas.every(area => 
        selections.some(s => s.categoryId === category.id && s.coreAreaId === area.id)
      );
      if (allSelected && category.coreAreas.length > 0) {
        completed.add(index);
      }
    });
    return completed;
  }, [selections, categories]);

  return completedCategories;
}