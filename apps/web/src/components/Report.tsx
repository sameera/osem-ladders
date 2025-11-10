import React, { useState, useMemo } from "react";
import { Category } from "@/data/model";
import { parseLevels } from "@/utils/configParser";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadarChartComponent } from "@/components/RadarChart";
import { HorizontalLevelChart } from "@/components/HorizontalLevelChart";
import { MapPin } from "lucide-react";
import levelsMarkdown from "@/data/levels.md?raw";
interface ReportProps {
    screens: Category[];
    selections: Record<string, Record<string, number>>;
    feedback: Record<
        string,
        Record<
            string,
            Record<
                string,
                {
                    evidence: string;
                    nextLevelFeedback: string;
                }
            >
        >
    >;
    wayForward?: string;
    onWayForwardChange?: (wayForward: string) => void;
}
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
function getPerformanceStatus(
    evaluatedLevel: number,
    baselineLevel: number
): string {
    if (evaluatedLevel === 0) return "Not evaluated";
    if (evaluatedLevel === baselineLevel) return "100% achieved";
    if (evaluatedLevel < baselineLevel) {
        const percentage = Math.round((evaluatedLevel / baselineLevel) * 100);
        return `${percentage}% progress towards the goal`;
    } else {
        const percentage = Math.round(
            ((evaluatedLevel - baselineLevel) / baselineLevel) * 100
        );
        return `${percentage}% above the goal`;
    }
}
function getPerformanceColor(status: string): string {
    if (status.includes("above the goal")) return "text-green-600";
    if (status.includes("100% achieved")) return "text-blue-600";
    if (status.includes("progress towards")) return "text-orange-600";
    return "text-muted-foreground";
}
export function Report({
    screens,
    selections,
    feedback,
    wayForward = "",
    onWayForwardChange,
}: ReportProps) {
    const [viewType, setViewType] = useState<"radar" | "line">("radar");
    const levelNames = useMemo(() => parseLevels(levelsMarkdown), []);
    const levelOptions = useMemo(
        () =>
            [1, 2, 3, 4, 5, 6, 7].map((value) => ({
                value,
                label: levelNames[value],
            })),
        [levelNames]
    );
    const categoryLevels = screens.map((category) => {
        const categorySelections = selections[category.title] || {};
        const values = Object.values(categorySelections).filter(
            (val) => val > 0
        );
        const median = calculateMedian(values);
        return {
            title: category.title,
            median,
            levelName:
                levelNames[median as keyof typeof levelNames] ||
                "Not evaluated",
            competencies: category.competencies,
        };
    });

    const allMedianValues = categoryLevels
        .map((c) => c.median)
        .filter((val) => val > 0);
    const overallLevel = calculateMedian(allMedianValues);

    // Calculate default baseline (one level above overall evaluated level)
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

    const overallPerformance =
        overallLevel > 0
            ? getPerformanceStatus(overallLevel, baselineLevel)
            : "Not evaluated";
    const baselineLevelName =
        levelNames[baselineLevel as keyof typeof levelNames] || "Unknown Level";
    return (
        <div className="space-y-6" data-report-content>
            <div className="text-center">
                <h2 className="text-3xl font-bold text-foreground mb-2">
                    GROWth Plan
                </h2>
                <p className="text-muted-foreground">
                    Goal 🡢 Reality 🡢 Opportunity 🡢 Way Forward
                </p>
            </div>

            {/* Baseline Level Selector */}
            <Card>
                <CardHeader>
                    <CardTitle>Goal</CardTitle>
                    <CardDescription>
                        Select where you aspire to be in the next 6-12 months.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label
                            htmlFor="baseline-level"
                            className="text-sm font-medium"
                        >
                            Aspired goal
                        </Label>
                        <Select
                            value={baselineLevel.toString()}
                            onValueChange={(value) =>
                                setBaselineLevel(parseInt(value))
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select baseline level" />
                            </SelectTrigger>
                            <SelectContent>
                                {levelOptions.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value.toString()}
                                    >
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
                    <Button
                        variant={viewType === "radar" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewType("radar")}
                        className="rounded-md"
                    >
                        Radar View
                    </Button>
                    <Button
                        variant={viewType === "line" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewType("line")}
                        className="rounded-md"
                    >
                        Line View
                    </Button>
                </div>
            </div>

            {/* Reality Check */}
            <Card className="border-2 border-primary">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Reality Check</CardTitle>
                    <CardDescription>
                        Based on median outcomes across all areas
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center">
                        <span
                            className={`text-xl font-semibold ${getPerformanceColor(
                                overallPerformance
                            )}`}
                        >
                            {overallPerformance}
                        </span>
                    </div>

                    {/* Overall Chart without legend */}
                    <div className="mb-6">
                        {viewType === "radar" ? (
                            <RadarChartComponent
                                title="Overall Performance Summary"
                                data={categoryLevels.map((category) => ({
                                    competence: category.title,
                                    actual: category.median,
                                    expected: baselineLevel,
                                }))}
                                showLegend={false}
                            />
                        ) : (
                            <HorizontalLevelChart
                                title="Overall Performance Summary"
                                data={categoryLevels.map((category) => ({
                                    competence: category.title,
                                    actual: category.median,
                                    expected: baselineLevel,
                                }))}
                                showLegend={false}
                            />
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Detailed Category Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categoryLevels.map((category, index) => {
                    const categorySelections = selections[category.title] || {};
                    const categoryFeedback = feedback[category.title] || {};
                    const categoryPerformance =
                        category.median > 0
                            ? getPerformanceStatus(
                                  category.median,
                                  baselineLevel
                              )
                            : "Not evaluated";
                    return (
                        <Card key={index} className="w-full">
                            <CardHeader>
                                <CardTitle className="text-xl">
                                    {category.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Chart without legend */}
                                <div className="mb-6">
                                    {viewType === "radar" ? (
                                        <RadarChartComponent
                                            title={category.title}
                                            data={category.competencies.map(
                                                (competence) => ({
                                                    competence: competence.name,
                                                    actual:
                                                        categorySelections[
                                                            competence.name
                                                        ] || 0,
                                                    expected: baselineLevel,
                                                })
                                            )}
                                            showLegend={false}
                                        />
                                    ) : (
                                        <HorizontalLevelChart
                                            title={category.title}
                                            data={category.competencies.map(
                                                (competence) => ({
                                                    competence: competence.name,
                                                    actual:
                                                        categorySelections[
                                                            competence.name
                                                        ] || 0,
                                                    expected: baselineLevel,
                                                })
                                            )}
                                            showLegend={false}
                                        />
                                    )}
                                </div>

                                {/* Detailed feedback for evaluated areas */}
                                {category.competencies.map(
                                    (competence, areaIndex) => {
                                        const selectedLevel =
                                            categorySelections[competence.name];
                                        const areaFeedback =
                                            categoryFeedback[competence.name]?.[
                                                selectedLevel
                                            ];
                                        if (!selectedLevel || !areaFeedback)
                                            return null;
                                        const selectedLevelContent =
                                            competence.levels.find(
                                                (l) => l.level === selectedLevel
                                            );
                                        return;
                                    }
                                )}
                            </CardContent>
                        </Card>
                    );
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
                            <span className="text-sm">Aspired outcome</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-green-500" />
                            <span className="text-sm">
                                Actual outcome (when above aspirations)
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-red-500" />
                            <span className="text-sm">
                                Actual outcome (when below aspirations)
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
                <CardHeader>
                    <CardTitle>How this works</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p>
                            • Levels are calculated using the median value of
                            all evaluated areas within each category
                        </p>
                        <p>
                            • Overall level is the median of all individual
                            category levels
                        </p>
                        <p>
                            • Areas not evaluated are excluded from calculations
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* User Comments Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Opportunities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {categoryLevels.map((category) => {
                        const categoryFeedback = feedback[category.title] || {};
                        const hasAnyFeedback = Object.keys(
                            categoryFeedback
                        ).some(
                            (competenceName) =>
                                Object.keys(
                                    categoryFeedback[competenceName] || {}
                                ).length > 0
                        );

                        if (!hasAnyFeedback) return null;

                        return (
                            <div key={category.title} className="space-y-4">
                                <h3 className="text-xl font-semibold text-foreground">
                                    {category.title}
                                </h3>
                                {category.competencies.map((competence) => {
                                    const areaFeedback =
                                        categoryFeedback[competence.name];
                                    categoryFeedback[competence.name];
                                    if (
                                        !areaFeedback ||
                                        Object.keys(areaFeedback).length === 0
                                    )
                                        return null;

                                    return (
                                        <div
                                            key={competence.name}
                                            className="ml-4 space-y-3"
                                        >
                                            <h4 className="text-lg font-medium text-foreground">
                                                {competence.name}
                                                {competence.name}
                                            </h4>
                                            {Object.entries(areaFeedback).map(
                                                ([level, comments]) => (
                                                    <div
                                                        key={level}
                                                        className="ml-4 space-y-2"
                                                    >
                                                        {comments.evidence && (
                                                            <div>
                                                                <h5 className="text-sm font-medium text-muted-foreground mb-1">
                                                                    What you are
                                                                    doing well
                                                                </h5>
                                                                <p className="text-sm text-foreground">
                                                                    {
                                                                        comments.evidence
                                                                    }
                                                                </p>
                                                            </div>
                                                        )}
                                                        {comments.nextLevelFeedback && (
                                                            <div>
                                                                <h5 className="text-sm font-medium text-muted-foreground mb-1">
                                                                    What you can
                                                                    do better
                                                                </h5>
                                                                <p className="text-sm text-foreground">
                                                                    {
                                                                        comments.nextLevelFeedback
                                                                    }
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {/* Way Forward Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Way Forward</CardTitle>
                    <CardDescription>
                        Outline your action plan and next steps based on the
                        assessment results
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label
                            htmlFor="way-forward"
                            className="text-sm font-medium"
                        >
                            Action plan and next steps
                        </Label>
                        <Textarea
                            id="way-forward"
                            placeholder="Describe your planned actions, learning goals, development priorities, and specific next steps based on your assessment results..."
                            value={wayForward}
                            onChange={(e) =>
                                onWayForwardChange?.(e.target.value)
                            }
                            className="min-h-[120px] resize-none"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
