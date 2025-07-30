import { useLocalStorage } from './useLocalStorage';
import { AssessmentSelection } from '@/types/assessment';

export function useAssessmentState() {
  const [selections, setSelections] = useLocalStorage<AssessmentSelection[]>('leveling-selections', []);
  const [teamMemberName, setTeamMemberName] = useLocalStorage<string>('team-member-name', '');
  const [currentLevel, setCurrentLevel] = useLocalStorage<number>('current-level', 1);

  const addOrUpdateSelection = (selection: Omit<AssessmentSelection, 'id'>) => {
    const id = `${selection.categoryId}-${selection.coreAreaId}`;
    const newSelection = { ...selection, id };
    
    setSelections(prev => {
      const existing = prev.findIndex(s => s.categoryId === selection.categoryId && s.coreAreaId === selection.coreAreaId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newSelection;
        return updated;
      } else {
        return [...prev, newSelection];
      }
    });
  };

  const getSelectionForCoreArea = (categoryId: string, coreAreaId: string): AssessmentSelection | undefined => {
    return selections.find(s => s.categoryId === categoryId && s.coreAreaId === coreAreaId);
  };

  const resetAssessment = () => {
    setSelections([]);
    setTeamMemberName('');
    setCurrentLevel(1);
  };

  return {
    selections,
    setSelections,
    addOrUpdateSelection,
    getSelectionForCoreArea,
    teamMemberName,
    setTeamMemberName,
    currentLevel,
    setCurrentLevel,
    resetAssessment
  };
}