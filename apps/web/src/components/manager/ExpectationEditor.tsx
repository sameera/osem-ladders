/**
 * ExpectationEditor Component
 * Single expectation editor (level, title, content)
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { Expectation } from "@/data/model";

interface ExpectationEditorProps {
    expectation: Expectation;
    index: number;
    onChange: (
        index: number,
        field: keyof Expectation,
        value: string | number
    ) => void;
    onRemove: (index: number) => void;
    canRemove?: boolean;
}

export function ExpectationEditor({
    expectation,
    index,
    onChange,
    onRemove,
    canRemove = true,
}: ExpectationEditorProps) {
    return (
        <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30 dark:bg-muted/10">
            <div className="flex items-center justify-between">
                <h5 className="text-sm font-medium text-foreground">
                    Expectation {index + 1}
                </h5>
                {canRemove && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(index)}
                        aria-label={`Remove expectation ${index + 1}`}
                    >
                        <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                )}
            </div>

            {/* Level Number */}
            <div className="space-y-2">
                <Label htmlFor={`expectation-${index}-level`}>
                    Level Number <span className="text-red-500">*</span>
                </Label>
                <Input
                    id={`expectation-${index}-level`}
                    type="number"
                    min="1"
                    value={expectation.level}
                    onChange={(e) =>
                        onChange(
                            index,
                            "level",
                            parseInt(e.target.value, 10)
                        )
                    }
                    required
                    aria-required="true"
                />
            </div>

            {/* Content */}
            <div className="space-y-2">
                <Label htmlFor={`expectation-${index}-content`}>
                    Content <span className="text-red-500">*</span>
                </Label>
                <Textarea
                    id={`expectation-${index}-content`}
                    placeholder="Describe what is expected at this level..."
                    value={expectation.content || ""}
                    onChange={(e) => onChange(index, "content", e.target.value)}
                    rows={3}
                    required
                    aria-required="true"
                />
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor={`expectation-${index}-description`}>
                    Description (Optional)
                </Label>
                <Textarea
                    id={`expectation-${index}-description`}
                    placeholder="Additional context or notes..."
                    value={expectation.description || ""}
                    onChange={(e) =>
                        onChange(index, "description", e.target.value)
                    }
                    rows={2}
                />
            </div>
        </div>
    );
}
