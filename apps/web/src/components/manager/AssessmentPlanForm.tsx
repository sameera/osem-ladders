/**
 * AssessmentPlanForm Component
 * Create plan form with visual builder
 */

import { useState, FormEvent, useEffect, useRef, ChangeEvent } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { TeamSelector } from "./TeamSelector";
import { PlanConfigBuilder } from "./PlanConfigBuilder";
import { parseConfig } from "@/utils/configParser";
import type { Category } from "@/data/model";
import type { CreateAssessmentPlanInput, AssessmentPlan } from "@/types/assessments";

interface AssessmentPlanFormProps {
    onSubmit: (data: {
        teamId: string;
        input: CreateAssessmentPlanInput;
    }) => void;
    isLoading?: boolean;
    error?: Error | null;
    initialData?: AssessmentPlan;
    mode?: 'create' | 'edit';
}

export function AssessmentPlanForm({
    onSubmit,
    isLoading = false,
    error,
    initialData,
    mode = 'create',
}: AssessmentPlanFormProps) {
    const [teamId, setTeamId] = useState("");
    const [season, setSeason] = useState("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [planConfig, setPlanConfig] = useState<Category[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize form from initialData when in edit mode
    useEffect(() => {
        if (initialData) {
            setTeamId(initialData.teamId);
            setSeason(initialData.season);
            setName(initialData.name);
            setDescription(initialData.description || "");
            setPlanConfig(JSON.parse(JSON.stringify(initialData.planConfig)));
        }
    }, [initialData]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!teamId) newErrors.teamId = "Team is required";
        if (!season.trim()) newErrors.season = "Season is required";
        if (!name.trim()) newErrors.name = "Plan name is required";
        if (planConfig.length === 0) {
            newErrors.planConfig = "At least one category is required";
        } else {
            // Validate plan config structure
            for (const category of planConfig) {
                if (!category.title.trim()) {
                    newErrors.planConfig = "All categories must have a title";
                    break;
                }
                if (category.competencies.length === 0) {
                    newErrors.planConfig =
                        "Each category must have at least one competency";
                    break;
                }
                for (const competency of category.competencies) {
                    if (!competency.name.trim()) {
                        newErrors.planConfig =
                            "All competencies must have a name";
                        break;
                    }
                    if (competency.levels.length === 0) {
                        newErrors.planConfig =
                            "Each competency must have at least one expectation";
                        break;
                    }
                    for (const expectation of competency.levels) {
                        if (!expectation.content.trim()) {
                            newErrors.planConfig =
                                "All expectations must have a title and description";
                            break;
                        }
                    }
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        onSubmit({
            teamId,
            input: {
                season: season.trim(),
                name: name.trim(),
                planConfig,
                description: description.trim() || undefined,
            },
        });
    };

    const handleClear = () => {
        setTeamId("");
        setSeason("");
        setName("");
        setDescription("");
        setPlanConfig([]);
        setErrors({});
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file extension
        if (!file.name.endsWith('.md')) {
            setErrors({
                ...errors,
                planConfig: "Please select a Markdown (.md) file."
            });
            return;
        }

        // Read file content
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            try {
                // Parse using existing utility
                const parsed = parseConfig(content);

                // Validate parsed result
                if (parsed.length === 0) {
                    setErrors({
                        ...errors,
                        planConfig: "The configuration file is empty or invalid. Please check the format."
                    });
                    return;
                }

                // Update planConfig state
                setPlanConfig(parsed);

                // Clear any previous planConfig errors
                setErrors({ ...errors, planConfig: "" });
            } catch (error) {
                // Show parsing error
                setErrors({
                    ...errors,
                    planConfig: "Failed to parse configuration file. Please check the format."
                });
            }
        };

        reader.onerror = () => {
            setErrors({
                ...errors,
                planConfig: "Failed to read file. Please try again."
            });
        };

        reader.readAsText(file);

        // Reset input so same file can be selected again
        event.target.value = '';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    {mode === 'edit' ? 'Edit Assessment Plan' : 'Create Assessment Plan'}
                </CardTitle>
                <CardDescription>
                    {mode === 'edit'
                        ? 'Update the career ladder framework for this team and season'
                        : 'Define a career ladder framework for a team and season'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Global error display */}
                    {error && (
                        <div
                            className="p-4 bg-red-50 border border-red-200 rounded-md"
                            role="alert"
                            aria-live="polite"
                        >
                            <p className="text-sm text-red-800">
                                {error.message}
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Team */}
                        <div className="space-y-2">
                            <Label htmlFor="team">
                                Team <span className="text-red-500">*</span>
                            </Label>
                            <TeamSelector
                                value={teamId}
                                onChange={(value) => {
                                    setTeamId(value);
                                    setErrors({ ...errors, teamId: "" });
                                }}
                                disabled={isLoading || mode === 'edit'}
                            />
                            {mode === 'edit' && (
                                <p className="text-sm text-gray-500">
                                    Cannot change team for existing plan
                                </p>
                            )}
                            {errors.teamId && (
                                <p
                                    className="text-sm text-red-500"
                                    role="alert"
                                >
                                    {errors.teamId}
                                </p>
                            )}
                        </div>

                        {/* Season */}
                        <div className="space-y-2">
                            <Label htmlFor="season">
                                Season <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="season"
                                type="text"
                                placeholder="e.g., 2025-Q1, FY25, Spring 2025"
                                value={season}
                                onChange={(e) => {
                                    setSeason(e.target.value);
                                    setErrors({ ...errors, season: "" });
                                }}
                                disabled={isLoading || mode === 'edit'}
                                required
                                aria-required="true"
                                aria-invalid={!!errors.season}
                            />
                            {mode === 'edit' && (
                                <p className="text-sm text-gray-500">
                                    Cannot change season for existing plan
                                </p>
                            )}
                            {errors.season && (
                                <p
                                    className="text-sm text-red-500"
                                    role="alert"
                                >
                                    {errors.season}
                                </p>
                            )}
                            {mode === 'create' && (
                                <p className="text-sm text-gray-500">
                                    Any string identifier (no format restrictions)
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Plan Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Plan Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="e.g., Engineering Ladder Q1 2025"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setErrors({ ...errors, name: "" });
                            }}
                            disabled={isLoading}
                            required
                            aria-required="true"
                            aria-invalid={!!errors.name}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500" role="alert">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">
                            Description (Optional)
                        </Label>
                        <Textarea
                            id="description"
                            placeholder="Describe the purpose of this assessment plan..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isLoading}
                            rows={3}
                        />
                    </div>

                    {/* Plan Config Builder */}
                    <div className="space-y-2">
                        <PlanConfigBuilder
                            planConfig={planConfig}
                            onChange={(config) => {
                                setPlanConfig(config);
                                setErrors({ ...errors, planConfig: "" });
                            }}
                        />
                        {errors.planConfig && (
                            <p className="text-sm text-red-500" role="alert">
                                {errors.planConfig}
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-3">
                        {/* Left side - Import button */}
                        <div>
                            {mode === 'create' && (
                                <>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".md"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        aria-label="Import configuration file"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleImportClick}
                                        disabled={isLoading}
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        Import from .md
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Right side - Clear and Submit buttons */}
                        <div className="flex items-center gap-3">
                            {mode === 'create' && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClear}
                                    disabled={isLoading}
                                >
                                    Clear
                                </Button>
                            )}
                            <Button type="submit" disabled={isLoading}>
                                {isLoading
                                    ? (mode === 'edit' ? "Updating..." : "Creating...")
                                    : (mode === 'edit' ? "Update Assessment Plan" : "Create Assessment Plan")}
                            </Button>
                        </div>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
