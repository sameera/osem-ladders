
import React from 'react';
import { Screen } from '@/utils/configParser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ReportProps {
  screens: Screen[];
  selections: Record<string, Record<string, number>>;
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

export function Report({ screens, selections }: ReportProps) {
  const screenLevels = screens.map(screen => {
    const screenSelections = selections[screen.title] || {};
    const values = Object.values(screenSelections).filter(val => val > 0);
    const median = calculateMedian(values);
    
    return {
      title: screen.title,
      median,
      levelName: levelNames[median as keyof typeof levelNames] || 'Not Assessed'
    };
  });

  const allMedianValues = screenLevels.map(s => s.median).filter(val => val > 0);
  const overallLevel = calculateMedian(allMedianValues);
  const overallLevelName = levelNames[overallLevel as keyof typeof levelNames] || 'Not Assessed';

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">Assessment Report</h2>
        <p className="text-muted-foreground">
          Your engineering level assessment based on the median values across all areas
        </p>
      </div>

      {/* Overall Level */}
      <Card className="border-2 border-primary">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Overall Level</CardTitle>
          <CardDescription>Median of all screen assessments</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex items-center justify-center">
            <span className="text-xl font-semibold">{overallLevelName}</span>
          </div>
        </CardContent>
      </Card>

      {/* Individual Screen Levels */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {screenLevels.map((screen, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-lg">{screen.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {screen.median > 0 ? (
                  <>Meeting the expectations at <strong>{screen.levelName}</strong> level.</>
                ) : (
                  'Not Assessed'
                )}
              </p>
            </CardContent>
          </Card>
        ))}
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
