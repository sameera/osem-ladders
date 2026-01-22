/**
 * Manager Review Page
 * Allows managers to complete assessment reviews for their team members
 * Accessible by manager only
 */

import React, { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUserMeta } from "@/hooks/useUserMeta";
import { useManagerCheck } from "@/hooks/useManagerCheck";
import { useAssessmentPlans } from "@/hooks/useAssessmentPlans";
import { useAssessmentReport } from "@/hooks/useAssessmentReport";
import { AssessmentView } from "@/components/assessment/AssessmentView";
import { uiToApiFormat, apiToUiFormat } from "@/utils/assessmentTransformers";
import type { AssessmentReviewData } from "@/hooks/useAssessmentReviewLogic";
import { Loader2, AlertCircle, Eye } from "lucide-react";
import { ShareReportDialog } from "@/components/assessment/ShareReportDialog";
import { UnshareReportDialog } from "@/components/assessment/UnshareReportDialog";
import { SharedReportBanner } from "@/components/assessment/SharedReportBanner";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ManagerReviewPage() {
    const { userId } = useParams<{ userId: string }>();

    // Dialog state
    const [showShareDialog, setShowShareDialog] = useState(false);
    const [showUnshareDialog, setShowUnshareDialog] = useState(false);

    // Fetch users and check access
    const { data: currentUser, isLoading: currentUserLoading } =
        useCurrentUser();
    const { data: targetUser, isLoading: targetUserLoading } =
        useUserMeta(userId);
    const { isManager, isLoading: managerCheckLoading } =
        useManagerCheck(userId);

    // Fetch assessment plans for user's team
    const { data: plansResponse, isLoading: plansLoading } = useAssessmentPlans(
        targetUser?.team,
        { includeInactive: false }
    );

    // Get most recent active plan
    const activePlan = useMemo(() => {
        if (!plansResponse || plansResponse.length === 0) return null;
        return plansResponse
            .filter((p) => p.isActive)
            .sort((a, b) => b.createdAt - a.createdAt)[0];
    }, [plansResponse]);

    // Fetch or create assessment report
    const {
        report,
        isLoading: reportLoading,
        createReport,
        updateReport,
        submitReport,
        shareReport,
        isSharing,
    } = useAssessmentReport(userId, activePlan?.season, "manager");

    // Fetch team member's self-assessment (just to check if it exists for link visibility)
    const { report: selfReport, isLoading: selfReportLoading } =
        useAssessmentReport(userId, activePlan?.season, "self");

    // Check if self-report is submitted (to show link)
    const hasSelfAssessment = useMemo(() => {
        return !!selfReport;
    }, [selfReport]);

    // Check access - manager OR team member viewing their own shared report
    // NOTE: Must be before any early returns to comply with Rules of Hooks
    const hasAccess = useMemo(() => {
        if (!currentUser || !targetUser) return false;

        // Manager can always access their team member's reports
        if (isManager) return true;

        // Team member can only access their own report if it has been shared
        const isViewingOwnReport = currentUser.userId === targetUser.userId;
        const isShared = report?.sharedWithAssessee === true;

        return isViewingOwnReport && isShared;
    }, [currentUser, targetUser, isManager, report]);

    // Loading states
    const isLoading =
        currentUserLoading ||
        targetUserLoading ||
        managerCheckLoading ||
        (targetUser?.team && plansLoading) ||
        reportLoading ||
        selfReportLoading;

    // Show loading spinner
    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">
                        Loading assessment...
                    </p>
                </div>
            </div>
        );
    }

    if (!hasAccess) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center max-w-md">
                    <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        Access Denied
                    </h1>
                    <p className="text-muted-foreground">
                        {currentUser?.userId === targetUser?.userId
                            ? "This manager review has not been shared with you yet."
                            : "You do not have permission to access this page."}
                    </p>
                </div>
            </div>
        );
    }

    // User not found
    if (!targetUser) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center max-w-md">
                    <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        User Not Found
                    </h1>
                    <p className="text-muted-foreground">
                        The user you're looking for doesn't exist.
                    </p>
                </div>
            </div>
        );
    }

    // No team assigned
    if (!targetUser.team) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center max-w-md">
                    <AlertCircle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        No Team Assigned
                    </h1>
                    <p className="text-muted-foreground">
                        {targetUser.name} is not assigned to a team yet.
                    </p>
                </div>
            </div>
        );
    }

    // No active plan
    if (!activePlan) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center max-w-md">
                    <AlertCircle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        No Active Plans
                    </h1>
                    <p className="text-muted-foreground">
                        No plans have been created yet for your team.
                    </p>
                </div>
            </div>
        );
    }

    // Convert report data to UI format
    const initialData = report ? apiToUiFormat(report.responses) : undefined;

    // Share/unshare handlers
    const handleShareClick = () => setShowShareDialog(true);
    const handleUnshareClick = () => setShowUnshareDialog(true);

    const handleShareConfirm = async () => {
        await shareReport(true);
        setShowShareDialog(false);
    };

    const handleUnshareConfirm = async () => {
        await shareReport(false);
        setShowUnshareDialog(false);
    };

    // Save handler
    const handleSave = async (data: AssessmentReviewData) => {
        if (!currentUser || !userId) return;

        const apiData = {
            responses: uiToApiFormat(data.selections, data.feedback),
            status: data.status,
        };

        if (!report) {
            // Create new report
            await createReport({
                userId,
                assessmentId: activePlan.season,
                type: "manager",
                assessorId: currentUser.userId,
                responses: apiData.responses,
            });
        } else {
            // Update existing report
            await updateReport(apiData);
        }
    };

    // Submit handler
    const handleSubmit = async (data: AssessmentReviewData) => {
        await handleSave(data);
        await submitReport();
    };

    // Create navigation link
    const navigationLink = (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span>
                        <Button
                            variant="outline"
                            size="sm"
                            asChild={hasSelfAssessment}
                            disabled={!hasSelfAssessment}
                        >
                            {hasSelfAssessment ? (
                                <Link to={`/users/${userId}/review/self`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Self-Assessment
                                </Link>
                            ) : (
                                <>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Self-Assessment
                                </>
                            )}
                        </Button>
                    </span>
                </TooltipTrigger>
                {!hasSelfAssessment && (
                    <TooltipContent>
                        <p>
                            {targetUser.name} hasn't submitted their
                            self-assessment yet
                        </p>
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
    );

    return (
        <>
            {report?.sharedWithAssessee && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                    <SharedReportBanner
                        sharedAt={report.sharedAt!}
                        sharedBy={report.sharedBy!}
                        assesseeName={targetUser.name}
                        viewingContext="shared"
                    />
                </div>
            )}

            <AssessmentView
                assessmentPlan={activePlan}
                assessmentType="manager"
                userName={targetUser.name}
                reviewerName={currentUser?.name || ""}
                initialData={initialData}
                onSave={handleSave}
                onSubmit={handleSubmit}
                onShareReport={
                    report?.status === "submitted"
                        ? handleShareClick
                        : undefined
                }
                onUnshareReport={
                    report?.status === "submitted"
                        ? handleUnshareClick
                        : undefined
                }
                isReportShared={report?.sharedWithAssessee}
                navigationLink={navigationLink}
            />

            <ShareReportDialog
                open={showShareDialog}
                onOpenChange={setShowShareDialog}
                onConfirm={handleShareConfirm}
                isLoading={isSharing}
                assesseeName={targetUser.name}
            />

            <UnshareReportDialog
                open={showUnshareDialog}
                onOpenChange={setShowUnshareDialog}
                onConfirm={handleUnshareConfirm}
                isLoading={isSharing}
                assesseeName={targetUser.name}
            />
        </>
    );
}
