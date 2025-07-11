
import React from 'react';
import { Screen } from '@/utils/configParser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadarChartComponent } from '@/components/RadarChart';

interface ReportProps {
  screens: Screen[];
  selections: Record<string, Record<string, number>>;
  feedback: Record<string, Record<string, Record<string, { evidence: string; nextLevelFeedback: string }>>>;
  currentLevel: number;
}

const levelNames = {
  1: 'Software Engineer I',
  2: 'Software Engineer II',
  3: 'Senior Software Engineer I',
  4: 'Senior Software Engineer II',
  5: 'Staff Engineer',
  6: 'Senior Staff Engineer',
  7: 'Principal Engineer'
};

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  } else {
    return sorted[mid];
  }
}

function getPerformanceStatus(assessedLevel: number, currentLevel: number): string {
  if (assessedLevel === currentLevel) return "Meets Expectations";
  if (assessedLevel > currentLevel) return "Exceeds Expectations";
  return "Needs Improvement";
}

function getPerformanceColor(status: string): string {
  switch (status) {
    case "Exceeds Expectations": return "text-green-600";
    case "Meets Expectations": return "text-blue-600";
    case "Needs Improvement": return "text-orange-600";
    default: return "text-muted-foreground";
  }
}

export function Report({ screens, selections, feedback, currentLevel }: ReportProps) {
  const screenLevels = screens.map(screen => {
    const screenSelections = selections[screen.title] || {};
    const values = Object.values(screenSelections).filter(val => val > 0);
    const median = calculateMedian(values);
    
    return {
      title: screen.title,
      median,
      levelName: levelNames[median as keyof typeof levelNames] || 'Not Assessed',
      coreAreas: screen.coreAreas
    };
  });

  const allMedianValues = screenLevels.map(s => s.median).filter(val => val > 0);
  const overallLevel = calculateMedian(allMedianValues);
  const overallPerformance = overallLevel > 0 ? getPerformanceStatus(overallLevel, currentLevel) : 'Not Assessed';
  const currentLevelName = levelNames[currentLevel as keyof typeof levelNames] || 'Unknown Level';

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">Assessment Report</h2>
        <p className="text-muted-foreground">
          Performance assessment for current level: {currentLevelName}
        </p>
      </div>

      {/* Overall Performance */}
      <Card className="border-2 border-primary">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Overall Performance</CardTitle>
          <CardDescription>Based on median assessment across all areas</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex items-center justify-center">
            <span className={`text-xl font-semibold ${getPerformanceColor(overallPerformance)}`}>
              {overallPerformance}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Screen Breakdown */}
      <div className="space-y-6">
        {screenLevels.map((screen, index) => {
          const screenSelections = selections[screen.title] || {};
          const screenFeedback = feedback[screen.title] || {};
          const screenPerformance = screen.median > 0 ? getPerformanceStatus(screen.median, currentLevel) : 'Not Assessed';
          
          return (
            <Card key={index} className="w-full">
              <CardHeader>
                <CardTitle className="text-xl">{screen.title}</CardTitle>
                <CardDescription>
                  {screen.median > 0 ? (
                    <span className={getPerformanceColor(screenPerformance)}>
                      <strong>{screenPerformance}</strong> for current level
                    </span>
                  ) : (
                    'Not Assessed'
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Radar Chart */}
                <div className="mb-6">
                  <RadarChartComponent
                    title={screen.title}
                    data={screen.coreAreas.map(coreArea => ({
                      coreArea: coreArea.name,
                      actual: screenSelections[coreArea.name] || 0,
                      expected: currentLevel
                    }))}
                  />
                </div>

                {/* Detailed feedback for assessed areas */}
                {screen.coreAreas.map((coreArea, areaIndex) => {
                  const selectedLevel = screenSelections[coreArea.name];
                  const areaFeedback = screenFeedback[coreArea.name]?.[selectedLevel];
                  
                  if (!selectedLevel || !areaFeedback) return null;
                  
                  const selectedLevelContent = coreArea.levels.find(l => l.level === selectedLevel);
                  
                  return (
                    <div key={areaIndex} className="border-l-4 border-primary/20 pl-4 space-y-3">
                      <h4 className="font-semibold text-lg">{coreArea.name}</h4>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">L{selectedLevel}</span> - {selectedLevelContent?.content || 'Level content'}
                        </p>
                        
                        {areaFeedback.evidence && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Your achievements at this level:</p>
                            <p className="text-sm bg-muted/50 p-3 rounded-md">{areaFeedback.evidence}</p>
                          </div>
                        )}
                        
                        {areaFeedback.nextLevelFeedback && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">What next level could look like:</p>
                            <p className="text-sm bg-muted/50 p-3 rounded-md">{areaFeedback.nextLevelFeedback}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Levels are calculated using the median value of all assessed areas within each screen</p>
            <p>• Overall level is the median of all individual screen levels</p>
            <p>• Areas not assessed are excluded from calculations</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
