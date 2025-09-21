import React from "react";
import { NavigationArrows } from "./NavigationArrows";

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
                <th
                    colSpan={allLevels.length}
                    className="text-center py-4 px-1.5 font-semibold text-foreground bg-muted relative">
                    <div className="flex items-center justify-between w-full relative">
                        <span
                            className="text-blue-600 font-bold z-10 relative"
                            style={{
                                textShadow: "0 0 8px rgba(37, 99, 235, 0.3)",
                            }}>
                            Solid
                        </span>
                        <div className="flex-1 flex items-center justify-center mx-4 relative">
                            <div className="w-full h-0.5 bg-gradient-to-r from-blue-600 via-yellow-500 to-purple-600 relative">
                                <div className="absolute left-1/4 top-1/2 transform -translate-y-1/2 -translate-x-1/2" />
                                <div className="absolute right-1/4 top-1/2 transform -translate-y-1/2 translate-x-1/2" />
                            </div>
                            <span
                                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-yellow-500 font-bold bg-muted px-2 z-10"
                                style={{
                                    textShadow:
                                        "0 0 8px rgba(234, 179, 8, 0.3)",
                                }}>
                                Shining
                            </span>
                        </div>
                        <span
                            className="text-purple-600 font-bold z-10 relative"
                            style={{
                                textShadow: "0 0 8px rgba(147, 51, 234, 0.3)",
                            }}>
                            Iconic
                        </span>
                    </div>
                </th>
            </tr>
        </thead>
    );
}
