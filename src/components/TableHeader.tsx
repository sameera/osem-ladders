import React from "react";
import { NavigationArrows } from "./NavigationArrows";
import { getGradientColor } from "@/utils/colorUtils";

interface TableHeaderProps {
    allLevels: number[];
    canScrollLeft: boolean;
    canScrollRight: boolean;
    onScrollLeft: () => void;
    onScrollRight: () => void;
}

export function TableHeader({
    allLevels,
    canScrollLeft,
    canScrollRight,
    onScrollLeft,
    onScrollRight,
}: TableHeaderProps) {
    return (
        <thead>
            <tr className="border-b border-border">
                <th className="text-left py-4 px-6 font-semibold text-foreground bg-muted sticky left-0 z-20 min-w-[200px] relative">
                    <div className="flex items-center justify-between">
                        <NavigationArrows
                            canScrollLeft={canScrollLeft}
                            canScrollRight={canScrollRight}
                            onScrollLeft={onScrollLeft}
                            onScrollRight={onScrollRight}
                        />
                    </div>
                </th>
                {allLevels.map((level, levelIndex) => (
                    <th
                        key={level}
                        className="text-center py-4 px-1.5 font-semibold bg-muted min-w-[300px]"
                        style={{
                            color: getGradientColor(levelIndex, allLevels.length),
                            textShadow: `0 0 8px ${getGradientColor(levelIndex, allLevels.length)}30`
                        }}
                    >
                        L{level}
                    </th>
                ))}
            </tr>
        </thead>
    );
}
