/**
 * ShareReportDialog Component
 * Confirmation dialog for sharing assessment report with assessee
 */

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Send, Loader2 } from "lucide-react";

interface ShareReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isLoading: boolean;
    assesseeName: string;
}

export function ShareReportDialog({
    open,
    onOpenChange,
    onConfirm,
    isLoading,
    assesseeName,
}: ShareReportDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center space-x-2">
                        <Send className="w-5 h-5 text-red-600" />
                        <span>Send Report to {assesseeName}?</span>
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to send this assessment report to{" "}
                        {assesseeName}? They will be able to view your feedback
                        immediately.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-700 focus:text-red-700">
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4 mr-2" />
                                Send to {assesseeName}
                            </>
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
