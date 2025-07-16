import { useLocalStorage } from './useLocalStorage';

export function useAssessmentState() {
  const [selections, setSelections] = useLocalStorage<Record<string, Record<string, number>>>('leveling-selections', {});
  const [feedback, setFeedback] = useLocalStorage<Record<string, Record<string, Record<string, { evidence: string; nextLevelFeedback: string }>>>>('leveling-feedback', {});
  const [teamMemberName, setTeamMemberName] = useLocalStorage<string>('team-member-name', '');
  const [currentLevel, setCurrentLevel] = useLocalStorage<number>('current-level', 1);

  const resetAssessment = () => {
    setSelections({});
    setFeedback({});
    setTeamMemberName('');
    setCurrentLevel(1);
  };

  return {
    selections,
    setSelections,
    feedback,
    setFeedback,
    teamMemberName,
    setTeamMemberName,
    currentLevel,
    setCurrentLevel,
    resetAssessment
  };
}