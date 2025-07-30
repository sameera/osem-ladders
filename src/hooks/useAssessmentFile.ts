import { Category, AssessmentSelection } from '@/types/assessment';
import { calculateMedian } from '@/utils/assessmentUtils';

export function useAssessmentFile() {
  const handleSubmitAssessment = (
    teamMemberName: string,
    currentLevel: number,
    categories: Category[],
    selections: AssessmentSelection[]
  ) => {
    const assessmentData = {
      teamMember: teamMemberName,
      assessmentDate: new Date().toISOString(),
      currentLevel,
      categories: categories.map(category => {
        const categorySelections = selections.filter(s => s.categoryId === category.id);
        const levels = categorySelections.map(s => s.level).filter(level => level > 0);
        
        return {
          id: category.id,
          name: category.title,
          medianLevel: levels.length > 0 ? calculateMedian(levels) : 0,
          coreAreas: category.coreAreas.map(area => {
            const selection = selections.find(s => s.categoryId === category.id && s.coreAreaId === area.id);
            return {
              id: area.id,
              name: area.name,
              selectedLevel: selection?.level || 0,
              evidence: selection?.evidence || '',
              nextLevelFeedback: selection?.nextLevelFeedback || ''
            };
          })
        };
      }),
      metadata: {
        version: '2.0',
        exportedAt: new Date().toISOString()
      }
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
    setSelections: (selections: AssessmentSelection[]) => void,
    setCurrentScreen: (screen: number) => void
  ) => {
    try {
      console.log('Loading assessment data:', data);
      
      if (!data.teamMember && !data.assessee) {
        alert('Invalid assessment file format');
        return;
      }

      // Parse selections from the assessment data
      const newSelections: AssessmentSelection[] = [];

      if (data.categories && Array.isArray(data.categories)) {
        data.categories.forEach((category: any) => {
          if (category.coreAreas && Array.isArray(category.coreAreas)) {
            category.coreAreas.forEach((coreArea: any) => {
              if (coreArea.selectedLevel && coreArea.selectedLevel > 0) {
                const selection: AssessmentSelection = {
                  id: `${category.id || category.name}-${coreArea.id || coreArea.name}`,
                  categoryId: category.id || category.name,
                  coreAreaId: coreArea.id || coreArea.name,
                  level: coreArea.selectedLevel,
                  evidence: coreArea.evidence || (coreArea.feedback?.evidence) || '',
                  nextLevelFeedback: coreArea.nextLevelFeedback || (coreArea.feedback?.nextLevelFeedback) || ''
                };
                newSelections.push(selection);
              }
            });
          }
        });
      } else if (data.leveling) {
        // Handle legacy format
        Object.entries(data.leveling).forEach(([categoryTitle, categoryData]: [string, any]) => {
          if (categoryData.notes) {
            Object.entries(categoryData.notes).forEach(([coreArea, noteData]: [string, any]) => {
              let level: number;
              if (typeof noteData.level === 'number') {
                level = noteData.level;
              } else if (typeof noteData.level === 'string') {
                const levelStr = noteData.level.toString().replace(/^L/i, '');
                level = parseInt(levelStr, 10);
              } else {
                return;
              }

              if (isNaN(level) || level < 1) {
                return;
              }

              const selection: AssessmentSelection = {
                id: `${categoryTitle}-${coreArea}`,
                categoryId: categoryTitle,
                coreAreaId: coreArea,
                level,
                evidence: noteData.evidence || '',
                nextLevelFeedback: noteData.advice || ''
              };
              newSelections.push(selection);
            });
          }
        });
      }

      // Update state
      setTeamMemberName(data.teamMember || data.assessee || '');
      setCurrentLevel(data.currentLevel || 1);
      setSelections(newSelections);
      
      setTimeout(() => {
        setCurrentScreen(0);
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