import { useLocalStorage } from './useLocalStorage';
import { AssessmentSelection } from '@/types/assessment';

function migrateOldSelections(oldData: any): AssessmentSelection[] {
  // If it's already an array, return as is
  if (Array.isArray(oldData)) {
    return oldData;
  }
  
  // If it's the old nested object format, migrate it
  if (oldData && typeof oldData === 'object') {
    const newSelections: AssessmentSelection[] = [];
    
    Object.entries(oldData).forEach(([categoryTitle, coreAreas]: [string, any]) => {
      if (coreAreas && typeof coreAreas === 'object') {
        Object.entries(coreAreas).forEach(([coreAreaName, level]: [string, any]) => {
          if (typeof level === 'number' && level > 0) {
            newSelections.push({
              id: `${categoryTitle}-${coreAreaName}`,
              categoryId: categoryTitle,
              coreAreaId: coreAreaName,
              level,
              evidence: '',
              nextLevelFeedback: ''
            });
          }
        });
      }
    });
    
    return newSelections;
  }
  
  // Return empty array for any other case
  return [];
}

export function useAssessmentState() {
  const [rawSelections, setRawSelections] = useLocalStorage<any>('leveling-selections', []);
  const [teamMemberName, setTeamMemberName] = useLocalStorage<string>('team-member-name', '');
  const [currentLevel, setCurrentLevel] = useLocalStorage<number>('current-level', 1);

  // Migrate and ensure selections is always an array
  const selections = migrateOldSelections(rawSelections);

  const setSelections = (newSelections: AssessmentSelection[]) => {
    setRawSelections(newSelections);
  };

  const addOrUpdateSelection = (selection: Omit<AssessmentSelection, 'id'>) => {
    const id = `${selection.categoryId}-${selection.coreAreaId}`;
    const newSelection = { ...selection, id };
    
    const currentSelections = migrateOldSelections(rawSelections);
    const existing = currentSelections.findIndex(s => s.categoryId === selection.categoryId && s.coreAreaId === selection.coreAreaId);
    
    if (existing >= 0) {
      const updated = [...currentSelections];
      updated[existing] = newSelection;
      setSelections(updated);
    } else {
      setSelections([...currentSelections, newSelection]);
    }
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