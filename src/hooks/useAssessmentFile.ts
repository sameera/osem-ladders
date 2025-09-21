import { Category } from '@/utils/model';
import { calculateMedian } from '@/utils/assessmentUtils';

export function useAssessmentFile() {
  const handleSubmitAssessment = (
    teamMemberName: string,
    currentLevel: number,
    categories: Category[],
    selections: Record<string, Record<string, number>>,
    feedback: Record<string, Record<string, Record<string, { evidence: string; nextLevelFeedback: string }>>>,
    wayForward?: string
  ) => {
    const assessmentData = {
      assessee: teamMemberName,
      currentLevel: currentLevel,
      wayForward: wayForward || "",
      leveling: categories.reduce((acc, category) => {
        const categorySelections = selections[category.title] || {};
        const categoryFeedback = feedback[category.title] || {};
        const values = Object.values(categorySelections).filter(val => val > 0);
        const median = calculateMedian(values);
        
        acc[category.title] = {
          level: median,
          notes: category.competencies.reduce((noteAcc, competence) => {
            const level = categorySelections[competence.name];
            if (level !== undefined) {
              const levelFeedback = categoryFeedback[competence.name]?.[level];
              noteAcc[competence.name] = {
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
    setCurrentScreen: (screen: number) => void,
    setWayForward?: (wayForward: string) => void
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
      if (data.wayForward && setWayForward) {
        setWayForward(data.wayForward);
      }

      const newSelections: Record<string, Record<string, number>> = {};
      const newFeedback: Record<string, Record<string, Record<string, { evidence: string; nextLevelFeedback: string }>>> = {};

      Object.entries(data.leveling).forEach(([categoryTitle, categoryData]: [string, any]) => {
        console.log('Processing category:', categoryTitle, categoryData);
        
        newSelections[categoryTitle] = {};
        newFeedback[categoryTitle] = {};

        if (categoryData.notes) {
          Object.entries(categoryData.notes).forEach(([competence, noteData]: [string, any]) => {
            console.log('Processing competence:', competence, noteData);
            
            let level: number;
            if (typeof noteData.level === 'number') {
              level = noteData.level;
            } else if (typeof noteData.level === 'string') {
              const levelStr = noteData.level.toString().replace(/^L/i, '');
              level = parseInt(levelStr, 10);
            } else {
              console.warn('Invalid level format for', competence, ':', noteData.level);
              return;
            }

            if (isNaN(level) || level < 1) {
              console.warn('Invalid level number for', competence, ':', level);
              return;
            }

            newSelections[categoryTitle][competence] = level;
            
            if (!newFeedback[categoryTitle][competence]) {
              newFeedback[categoryTitle][competence] = {};
            }
            
            newFeedback[categoryTitle][competence][level] = {
              evidence: noteData.evidence || '',
              nextLevelFeedback: noteData.advice || ''
            };
            
            console.log('Set selection:', categoryTitle, competence, level);
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