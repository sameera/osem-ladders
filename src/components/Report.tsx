import React, { useState, useMemo } from 'react';
import { Category } from '@/utils/model';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadarChartComponent } from '@/components/RadarChart';
import { HorizontalLevelChart } from '@/components/HorizontalLevelChart';
import { MapPin } from 'lucide-react';
interface ReportProps {
  screens: Category[];
  selections: Record<string, Record<string, number>>;
  feedback: Record<string, Record<string, Record<string, {
    evidence: string;
    nextLevelFeedback: string;
  }>>>;
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
function getPerformanceStatus(assessedLevel: number, baselineLevel: number): string {
  if (assessedLevel === 0) return "Not Assessed";
  if (assessedLevel === baselineLevel) return "100% achieved";
  if (assessedLevel < baselineLevel) {
    const percentage = Math.round((assessedLevel / baselineLevel) * 100);
    return `${percentage}% progress towards the goal`;
  } else {
    const percentage = Math.round(((assessedLevel - baselineLevel) / baselineLevel) * 100);
    return `${percentage}% above the goal`;
  }
}
function getPerformanceColor(status: string): string {
  if (status.includes("above the goal")) return "text-green-600";
  if (status.includes("100% achieved")) return "text-blue-600";
  if (status.includes("progress towards")) return "text-orange-600";
  return "text-muted-foreground";
}
const levelOptions = [
  { value: 1, label: "SE1 - Software Engineer I" },
  { value: 2, label: "SE2 - Software Engineer II" },
  { value: 3, label: "SE3 - Senior Software Engineer I" },
  { value: 4, label: "SE4 - Senior Software Engineer II" },
  { value: 5, label: "SE5 - Staff Engineer" },
  { value: 6, label: "SE6 - Senior Staff Engineer" },
  { value: 7, label: "SE7 - Principal Engineer" },
];

export function Report({
  screens,
  selections,
  feedback
}: ReportProps) {
  const [viewType, setViewType] = useState<'radar' | 'line'>('radar');
  const categoryLevels = screens.map(category => {
    const categorySelections = selections[category.title] || {};
    const values = Object.values(categorySelections).filter(val => val > 0);
    const median = calculateMedian(values);
    return {
      title: category.title,
      median,
      levelName: levelNames[median as keyof typeof levelNames] || 'Not Assessed',
      coreAreas: category.coreAreas
    };
  });
  
  const allMedianValues = categoryLevels.map(c => c.median).filter(val => val > 0);
  const overallLevel = calculateMedian(allMedianValues);
  
  // Calculate default baseline (one level above overall assessed level)
  const defaultBaseline = useMemo(() => {
    return overallLevel > 0 ? Math.min(overallLevel + 1, 7) : 2;
  }, [overallLevel]);
  
  const [baselineLevel, setBaselineLevel] = useState<number>(defaultBaseline);
  
  // Update baseline when overall level changes
  React.useEffect(() => {
    if (overallLevel > 0) {
      setBaselineLevel(Math.min(overallLevel + 1, 7));
    }
  }, [overallLevel]);
  
  const overallPerformance = overallLevel > 0 ? getPerformanceStatus(overallLevel, baselineLevel) : 'Not Assessed';
  const baselineLevelName = levelNames[baselineLevel as keyof typeof levelNames] || 'Unknown Level';
  return <div className="space-y-6" data-report-content>
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">Assessment Report</h2>
        <p className="text-muted-foreground">
          Performance assessment against baseline level
        </p>
      </div>

      {/* Baseline Level Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Baseline Level</CardTitle>
          <CardDescription>Select the baseline level to compare performance against</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="baseline-level" className="text-sm font-medium">
              Baseline Level
            </Label>
            <Select value={baselineLevel.toString()} onValueChange={(value) => setBaselineLevel(parseInt(value))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select baseline level" />
              </SelectTrigger>
              <SelectContent>
                {levelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-muted rounded-lg p-1">
          <Button variant={viewType === 'radar' ? 'default' : 'ghost'} size="sm" onClick={() => setViewType('radar')} className="rounded-md">
            Radar View
          </Button>
          <Button variant={viewType === 'line' ? 'default' : 'ghost'} size="sm" onClick={() => setViewType('line')} className="rounded-md">
            Line View
          </Button>
        </div>
      </div>

      {/* Overall Performance */}
      <Card className="border-2 border-primary">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Overall Performance</CardTitle>
          <CardDescription>Based on median assessment across all areas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <span className={`text-xl font-semibold ${getPerformanceColor(overallPerformance)}`}>
              {overallPerformance}
            </span>
          </div>
          
          {/* Overall Chart without legend */}
          <div className="mb-6">
            {viewType === 'radar' ? <RadarChartComponent title="Overall Performance Summary" data={categoryLevels.map(category => ({
            coreArea: category.title,
            actual: category.median,
            expected: baselineLevel
          }))} showLegend={false} /> : <HorizontalLevelChart title="Overall Performance Summary" data={categoryLevels.map(category => ({
            coreArea: category.title,
            actual: category.median,
            expected: baselineLevel
          }))} showLegend={false} />}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categoryLevels.map((category, index) => {
        const categorySelections = selections[category.title] || {};
        const categoryFeedback = feedback[category.title] || {};
        const categoryPerformance = category.median > 0 ? getPerformanceStatus(category.median, baselineLevel) : 'Not Assessed';
        return <Card key={index} className="w-full">
              <CardHeader>
                <CardTitle className="text-xl">{category.title}</CardTitle>
                
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Chart without legend */}
                <div className="mb-6">
                  {viewType === 'radar' ? <RadarChartComponent title={category.title} data={category.coreAreas.map(coreArea => ({
                coreArea: coreArea.name,
                actual: categorySelections[coreArea.name] || 0,
                expected: baselineLevel
              }))} showLegend={false} /> : <HorizontalLevelChart title={category.title} data={category.coreAreas.map(coreArea => ({
                coreArea: coreArea.name,
                actual: categorySelections[coreArea.name] || 0,
                expected: baselineLevel
              }))} showLegend={false} />}
                </div>

                {/* Detailed feedback for assessed areas */}
                {category.coreAreas.map((coreArea, areaIndex) => {
              const selectedLevel = categorySelections[coreArea.name];
              const areaFeedback = categoryFeedback[coreArea.name]?.[selectedLevel];
              if (!selectedLevel || !areaFeedback) return null;
              const selectedLevelContent = coreArea.levels.find(l => l.level === selectedLevel);
              return;
            })}
              </CardContent>
            </Card>;
      })}
      </div>

      {/* Chart Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Chart Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground/60" />
              <span className="text-sm">Expected Level</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-green-500" />
              <span className="text-sm">Actual Level (Above Expected)</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-red-500" />
              <span className="text-sm">Actual Level (Below Expected)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Levels are calculated using the median value of all assessed areas within each category</p>
            <p>• Overall level is the median of all individual category levels</p>
            <p>• Areas not assessed are excluded from calculations</p>
          </div>
        </CardContent>
      </Card>

      {/* User Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle>Your Assessment Comments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {categoryLevels.map((category) => {
            const categoryFeedback = feedback[category.title] || {};
            const hasAnyFeedback = Object.keys(categoryFeedback).some(coreAreaName => 
              Object.keys(categoryFeedback[coreAreaName] || {}).length > 0
            );
            
            if (!hasAnyFeedback) return null;

            return (
              <div key={category.title} className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">{category.title}</h3>
                {category.coreAreas.map((coreArea) => {
                  const areaFeedback = categoryFeedback[coreArea.name];
                  if (!areaFeedback || Object.keys(areaFeedback).length === 0) return null;

                  return (
                    <div key={coreArea.name} className="ml-4 space-y-3">
                      <h4 className="text-lg font-medium text-foreground">{coreArea.name}</h4>
                      {Object.entries(areaFeedback).map(([level, comments]) => (
                        <div key={level} className="ml-4 space-y-2">
                          {comments.evidence && (
                            <div>
                              <h5 className="text-sm font-medium text-muted-foreground mb-1">What you are doing well</h5>
                              <p className="text-sm text-foreground">{comments.evidence}</p>
                            </div>
                          )}
                          {comments.nextLevelFeedback && (
                            <div>
                              <h5 className="text-sm font-medium text-muted-foreground mb-1">What you can do better</h5>
                              <p className="text-sm text-foreground">{comments.nextLevelFeedback}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>;
}