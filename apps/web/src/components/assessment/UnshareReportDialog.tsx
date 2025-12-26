/**
 * UnshareReportDialog Component
 * Confirmation dialog for revoking assessee's access to assessment report
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
import { EyeOff, Loader2 } from "lucide-react";

interface UnshareReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isLoading: boolean;
    assesseeName: string;
}

export function UnshareReportDialog({
    open,
    onOpenChange,
    onConfirm,
    isLoading,
    assesseeName,
}: UnshareReportDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center space-x-2">
                        <EyeOff className="w-5 h-5" />
                        <span>Revoke Access to Report?</span>
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to revoke {assesseeName}'s access
                        to this report? They will no longer be able to view
                        your feedback.
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
                        disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Revoking...
                            </>
                        ) : (
                            <>
                                <EyeOff className="w-4 h-4 mr-2" />
                                Revoke Access
                            </>
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
