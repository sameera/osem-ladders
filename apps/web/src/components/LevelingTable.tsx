import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Competence } from "@/data/model";
import { ScrollableTableContainer } from "./ScrollableTableContainer";
import { TableHeader } from "./TableHeader";
import { TableCell } from "./TableCell";
import { getGradientColor } from "@/utils/colorUtils";

interface LevelingTableProps {
    competencies: Competence[];
    selections: Record<string, number>;
    feedback: Record<
        string,
        Record<string, { evidence: string; nextLevelFeedback: string }>
    >;
    onSelectionChange: (
        competence: string,
        level: number,
        evidence: string,
        nextLevelFeedback: string
    ) => void;
}

// Configurable tooltip text length limit
const TOOLTIP_TEXT_LIMIT = 200;

export function LevelingTable({
    competencies,
    selections,
    feedback,
    onSelectionChange,
}: LevelingTableProps) {
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [scrollLeftFn, setScrollLeftFn] = useState<(() => void) | null>(null);
    const [scrollRightFn, setScrollRightFn] = useState<(() => void) | null>(null);

    // Get all unique levels across all competencies
    const allLevels = Array.from(
        new Set(
            competencies.flatMap((area) =>
                area.levels.map((level) => level.level)
            )
        )
    ).sort((a, b) => a - b);

    const handleScrollStateChange = (canLeft: boolean, canRight: boolean) => {
        setCanScrollLeft(canLeft);
        setCanScrollRight(canRight);
    };

    const handleGetScrollFunctions = (scrollLeft: () => void, scrollRight: () => void) => {
        setScrollLeftFn(() => scrollLeft);
        setScrollRightFn(() => scrollRight);
    };

    return (
        <div className="relative">
            <ScrollableTableContainer
                onScrollStateChange={handleScrollStateChange}
                onGetScrollFunctions={handleGetScrollFunctions}
            >
                <table className="w-full border-collapse bg-card rounded-lg shadow-sm">
                    <TableHeader
                        allLevels={allLevels}
                        canScrollLeft={canScrollLeft}
                        canScrollRight={canScrollRight}
                        onScrollLeft={() => scrollLeftFn?.()}
                        onScrollRight={() => scrollRightFn?.()}
                    />
                    <tbody>
                        {competencies.map((competence, areaIndex) => (
                            <tr
                                key={competence.name}
                                className={cn(
                                    "border-b border-border hover:bg-muted/30 transition-colors",
                                    areaIndex % 2 === 0 && "bg-muted/10"
                                )}
                            >
                                <td className="py-4 px-6 font-medium text-foreground sticky left-0 z-10 bg-card">
                                    {competence.name}
                                </td>
                                {allLevels.map((level, levelIndex) => {
                                    const levelContent = competence.levels.find(
                                        (l) => l.level === level
                                    );
                                    const isSelected =
                                        selections[competence.name] === level;
                                    const cellFeedback =
                                        feedback[competence.name]?.[level];

                                    const hoverColor = getGradientColor(
                                        levelIndex,
                                        allLevels.length
                                    );

                                    return (
                                        <td
                                            key={level}
                                            className="py-2 px-1.5 h-24 align-top min-w-[300px]"
                                        >
                                            {levelContent ? (
                                                <TableCell
                                                    levelContent={levelContent}
                                                    competence={competence}
                                                    level={level}
                                                    isSelected={isSelected}
                                                    onSelectionChange={
                                                        onSelectionChange
                                                    }
                                                    tooltipTextLimit={
                                                        TOOLTIP_TEXT_LIMIT
                                                    }
                                                    feedback={cellFeedback}
                                                    hoverColor={hoverColor}
                                                />
                                            ) : (
                                                <div className="w-full h-full p-1 text-center text-muted-foreground flex items-center justify-center min-h-[80px]">
                                                    —
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </ScrollableTableContainer>
        </div>
    );
}
