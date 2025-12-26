/**
 * SharedReportBanner Component
 * Informational banner displayed when viewing a shared assessment report
 */

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface SharedReportBannerProps {
    sharedAt: number;
    sharedBy: string;
    assesseeName: string;
    viewingContext?: 'shared' | 'self-by-manager';
}

export function SharedReportBanner({
    sharedAt,
    sharedBy,
    assesseeName,
    viewingContext = 'shared',
}: SharedReportBannerProps) {
    const formattedDate = new Date(sharedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const message = viewingContext === 'self-by-manager'
        ? `You are viewing ${assesseeName}'s self-assessment (submitted on ${formattedDate}).`
        : `This report was shared with ${assesseeName} on ${formattedDate}.`;

    return (
        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
                {message}
            </AlertDescription>
        </Alert>
    );
}
