import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { FeedbackPopup } from "./FeedbackPopup";
import { Competence } from "@/data/model";

interface TableCellProps {
    levelContent: any;
    competence: Competence;
    level: number;
    isSelected: boolean;
    onSelectionChange: (
        competence: string,
        level: number,
        evidence: string,
        nextLevelFeedback: string
    ) => void;
    tooltipTextLimit: number;
    feedback?: { evidence: string; nextLevelFeedback: string };
    hoverColor?: string;
    readOnly?: boolean;
}

export function TableCell({
    levelContent,
    competence,
    level,
    isSelected,
    onSelectionChange,
    tooltipTextLimit,
    feedback,
    hoverColor,
    readOnly = false,
}: TableCellProps) {
    const [showFeedbackPopup, setShowFeedbackPopup] = useState<boolean>(false);
    const [showFullDescriptionDialog, setShowFullDescriptionDialog] =
        useState<boolean>(false);
    const hasDescription: boolean =
        levelContent.description && levelContent.description.trim();

    const shouldShowDialog = (description: string): boolean => {
        return description.length > tooltipTextLimit;
    };

    const getTruncatedDescription = (description: string): string => {
        if (description.length <= tooltipTextLimit) {
            return description;
        }
        return description.substring(0, tooltipTextLimit) + "...";
    };

    const handleCellClick = (e: React.MouseEvent): void => {
        if (readOnly) return; // Prevent clicks in read-only mode
        e.stopPropagation();
        setShowFeedbackPopup(true);
    };

    const handleFeedbackConfirm = (
        evidence: string,
        nextLevelFeedback: string
    ): void => {
        onSelectionChange(competence.name, level, evidence, nextLevelFeedback);
        setShowFeedbackPopup(false);
    };

    const handleFeedbackCancel = (): void => {
        setShowFeedbackPopup(false);
    };

    const handleSelectFromFullDescription = (): void => {
        setShowFullDescriptionDialog(false);
        setShowFeedbackPopup(true);
    };

    const handleViewFullDescription = (): void => {
        setShowFullDescriptionDialog(true);
    };

    // Format content to show each sentence on a new line
    const formatContent = (content: string): JSX.Element[] => {
        return content
            .split(/(?<=[.!?])\s+/)
            .filter((sentence) => sentence.trim())
            .map((sentence, index) => (
                <div key={index} className={index > 0 ? "mt-1" : ""}>
                    {sentence.trim()}
                </div>
            ));
    };

    const cellButton = (
        <button
            onClick={handleCellClick}
            disabled={readOnly}
            className={cn(
                "w-full h-full text-left p-3 rounded-md border transition-all duration-200",
                "hover:shadow-md",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                isSelected
                    ? "bg-primary/10 text-primary shadow-md"
                    : "border-border bg-background hover:bg-accent",
                readOnly ? "cursor-default opacity-90" : "cursor-pointer",
                "min-h-[120px] flex items-start"
            )}
            style={{
                ...(hoverColor
                    ? ({
                          "--hover-border-color": hoverColor,
                      } as React.CSSProperties & {
                          "--hover-border-color": string;
                      })
                    : {}),
                ...(isSelected && hoverColor
                    ? {
                          borderColor: hoverColor,
                      }
                    : {}),
            }}
            onMouseEnter={(e) => {
                if (hoverColor && !isSelected && !readOnly) {
                    e.currentTarget.style.borderColor = hoverColor;
                }
            }}
            onMouseLeave={(e) => {
                if (hoverColor && !isSelected && !readOnly) {
                    e.currentTarget.style.borderColor = "";
                }
            }}
        >
            <div className="text-sm leading-relaxed w-full">
                {formatContent(levelContent.content)}
            </div>
        </button>
    );

    if (!hasDescription) {
        return (
            <>
                {cellButton}
                <FeedbackPopup
                    isOpen={showFeedbackPopup}
                    onClose={handleFeedbackCancel}
                    onConfirm={handleFeedbackConfirm}
                    competence={competence}
                    selectedLevel={level}
                    initialEvidence={feedback?.evidence || ""}
                    initialNextLevelFeedback={feedback?.nextLevelFeedback || ""}
                />
            </>
        );
    }

    const needsDialog: boolean = shouldShowDialog(levelContent.description);
    const truncatedDescription: string = getTruncatedDescription(
        levelContent.description
    );

    return (
        <>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>{cellButton}</TooltipTrigger>
                    <TooltipContent side="top" className="max-w-sm p-3">
                        <div className="space-y-3">
                            <MarkdownRenderer
                                content={truncatedDescription}
                                className="text-sm"
                            />
                            {needsDialog && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={handleViewFullDescription}
                                >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    View Full Description
                                </Button>
                            )}
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {/* Dialog moved outside tooltip provider */}
            <Dialog
                open={showFullDescriptionDialog}
                onOpenChange={setShowFullDescriptionDialog}
            >
                <DialogContent className="max-w-2xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>{levelContent.content}</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="mt-4 max-h-[60vh]">
                        <MarkdownRenderer
                            content={levelContent.description}
                            className="text-sm leading-relaxed pr-4"
                        />
                    </ScrollArea>
                    <div className="flex gap-2 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => setShowFullDescriptionDialog(false)}
                            className="flex-1"
                        >
                            Close
                        </Button>
                        <Button
                            onClick={handleSelectFromFullDescription}
                            className="flex-1"
                        >
                            Select L{level}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <FeedbackPopup
                isOpen={showFeedbackPopup}
                onClose={handleFeedbackCancel}
                onConfirm={handleFeedbackConfirm}
                competence={competence}
                selectedLevel={level}
                initialEvidence={feedback?.evidence || ""}
                initialNextLevelFeedback={feedback?.nextLevelFeedback || ""}
            />
        </>
    );
}
