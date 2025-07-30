import { Screen } from '@/utils/configParser';
import { calculateMedian } from '@/utils/assessmentUtils';

export function useAssessmentFile() {
  const handleSubmitAssessment = (
    teamMemberName: string,
    currentLevel: number,
    screens: Screen[],
    selections: Record<string, Record<string, number>>,
    feedback: Record<string, Record<string, Record<string, { evidence: string; nextLevelFeedback: string }>>>
  ) => {
    const assessmentData = {
      assessee: teamMemberName,
      currentLevel: currentLevel,
      leveling: screens.reduce((acc, screen) => {
        const screenSelections = selections[screen.title] || {};
        const screenFeedback = feedback[screen.title] || {};
        const values = Object.values(screenSelections).filter(val => val > 0);
        const median = calculateMedian(values);
        
        acc[screen.title] = {
          level: median,
          notes: screen.coreAreas.reduce((noteAcc, coreArea) => {
            const level = screenSelections[coreArea.name];
            if (level !== undefined) {
              const levelFeedback = screenFeedback[coreArea.name]?.[level];
              noteAcc[coreArea.name] = {
                level: `L${level}`,
                evidence: levelFeedback?.evidence || '',
                advice: levelFeedback?.nextLevelFeedback || ''
              };
            }
            return noteAcc;
          }, {} as Record<string, any>)
        };
        
        return acc;
      }, {} as Record<string, any>)
    };

    // Download as JSON file
    const blob = new Blob([JSON.stringify(assessmentData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${teamMemberName.replace(/\s+/g, '_')}_assessment.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenAssessment = (
    data: any,
    setTeamMemberName: (name: string) => void,
    setCurrentLevel: (level: number) => void,
    setSelections: (selections: Record<string, Record<string, number>>) => void,
    setFeedback: (feedback: Record<string, Record<string, Record<string, { evidence: string; nextLevelFeedback: string }>>>) => void,
    setCurrentScreen: (screen: number) => void
  ) => {
    try {
      console.log('Loading assessment data:', data);
      
      if (!data.assessee || !data.leveling) {
        alert('Invalid assessment file format');
        return;
      }

      setTeamMemberName(data.assessee);
      if (data.currentLevel) {
        setCurrentLevel(data.currentLevel);
      }

      const newSelections: Record<string, Record<string, number>> = {};
      const newFeedback: Record<string, Record<string, Record<string, { evidence: string; nextLevelFeedback: string }>>> = {};

      Object.entries(data.leveling).forEach(([screenTitle, screenData]: [string, any]) => {
        console.log('Processing screen:', screenTitle, screenData);
        
        newSelections[screenTitle] = {};
        newFeedback[screenTitle] = {};

        if (screenData.notes) {
          Object.entries(screenData.notes).forEach(([coreArea, noteData]: [string, any]) => {
            console.log('Processing core area:', coreArea, noteData);
            
            let level: number;
            if (typeof noteData.level === 'number') {
              level = noteData.level;
            } else if (typeof noteData.level === 'string') {
              const levelStr = noteData.level.toString().replace(/^L/i, '');
              level = parseInt(levelStr, 10);
            } else {
              console.warn('Invalid level format for', coreArea, ':', noteData.level);
              return;
            }

            if (isNaN(level) || level < 1) {
              console.warn('Invalid level number for', coreArea, ':', level);
              return;
            }

            newSelections[screenTitle][coreArea] = level;
            
            if (!newFeedback[screenTitle][coreArea]) {
              newFeedback[screenTitle][coreArea] = {};
            }
            
            newFeedback[screenTitle][coreArea][level] = {
              evidence: noteData.evidence || '',
              nextLevelFeedback: noteData.advice || ''
            };
            
            console.log('Set selection:', screenTitle, coreArea, level);
          });
        }
      });

      console.log('Final selections:', newSelections);
      console.log('Final feedback:', newFeedback);

      setSelections(newSelections);
      setFeedback(newFeedback);
      
      setTimeout(() => {
        setCurrentScreen(0);
        console.log('Current selections after load:', newSelections);
        console.log('Current feedback after load:', newFeedback);
      }, 100);
      
    } catch (error) {
      console.error('Error loading assessment:', error);
      alert('Error loading assessment file');
    }
  };

  return {
    handleSubmitAssessment,
    handleOpenAssessment
  };
}