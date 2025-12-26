/**
 * Self Review Page
 * Allows users to complete their self-assessment
 * Accessible by the user themselves OR their manager
 */

import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUserMeta } from "@/hooks/useUserMeta";
import { useManagerCheck } from "@/hooks/useManagerCheck";
import { useAssessmentPlans } from "@/hooks/useAssessmentPlans";
import { useAssessmentReport } from "@/hooks/useAssessmentReport";
import { AssessmentView } from "@/components/assessment/AssessmentView";
import { SharedReportBanner } from "@/components/assessment/SharedReportBanner";
import { uiToApiFormat, apiToUiFormat } from "@/utils/assessmentTransformers";
import type { AssessmentReviewData } from "@/hooks/useAssessmentReviewLogic";
import { Loader2, AlertCircle, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export default function SelfReviewPage() {
    const { userId } = useParams<{ userId: string }>();

    // Fetch users and check access
    const { data: currentUser, isLoading: currentUserLoading } =
        useCurrentUser();
    const { data: targetUser, isLoading: targetUserLoading } = useUserMeta(userId);
    const { isManager, isLoading: managerCheckLoading, error: managerCheckError } =
        useManagerCheck(userId);

    // Check access: user themselves OR their manager
    const hasAccess = useMemo(() => {
        if (!currentUser || !targetUser) return false;
        return currentUser.userId === targetUser.userId || isManager;
    }, [currentUser, targetUser, isManager]);

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

    // Fetch or create assessment report (self)
    const {
        report,
        isLoading: reportLoading,
        createReport,
        updateReport,
        submitReport,
    } = useAssessmentReport(userId, activePlan?.season, "self");

    // Fetch manager report (if viewing own page and report is shared)
    const shouldFetchManagerReport = useMemo(() => {
        return currentUser?.userId === userId; // Only if viewing own page
    }, [currentUser, userId]);

    const {
        report: managerReport,
        isLoading: managerReportLoading,
    } = useAssessmentReport(
        shouldFetchManagerReport ? userId : undefined,
        shouldFetchManagerReport ? activePlan?.season : undefined,
        shouldFetchManagerReport ? "manager" : undefined
    );

    // Filter to only show if shared
    const sharedManagerReport = useMemo(() => {
        if (!managerReport) return null;
        if (!managerReport.sharedWithAssessee) return null;
        return managerReport;
    }, [managerReport]);

    // Loading states
    const isLoading =
        currentUserLoading ||
        targetUserLoading ||
        managerCheckLoading ||
        (targetUser?.team && plansLoading) ||
        reportLoading ||
        (shouldFetchManagerReport && managerReportLoading);

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

    // Check for permission errors
    if (managerCheckError) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center max-w-md">
                    <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        Access Error
                    </h1>
                    <p className="text-muted-foreground">
                        Unable to verify team access. Please contact your administrator.
                    </p>
                </div>
            </div>
        );
    }

    // Check access
    if (!hasAccess) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center max-w-md">
                    <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        Access Denied
                    </h1>
                    <p className="text-muted-foreground">
                        You don't have permission to view this assessment.
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
                type: "self",
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

    const isViewedByManager = useMemo(() => {
        return currentUser?.userId !== userId && isManager;
    }, [currentUser, userId, isManager]);

    // Create navigation link
    const navigationLink = isViewedByManager ? (
        <Button
            variant="outline"
            size="sm"
            asChild
        >
            <Link to={`/users/${userId}/review/manager`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Your Assessment
            </Link>
        </Button>
    ) : (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span>
                        <Button
                            variant="outline"
                            size="sm"
                            asChild={!!sharedManagerReport}
                            disabled={!sharedManagerReport}
                        >
                            {sharedManagerReport ? (
                                <Link to={`/users/${userId}/review/manager`}>
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View Manager's Assessment
                                </Link>
                            ) : (
                                <>
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View Manager's Assessment
                                </>
                            )}
                        </Button>
                    </span>
                </TooltipTrigger>
                {!sharedManagerReport && (
                    <TooltipContent>
                        <p>Your manager hasn't shared their assessment yet</p>
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
    );

    return (
        <>
            {/* Banner when manager is viewing */}
            {isViewedByManager && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                    <SharedReportBanner
                        sharedAt={report?.submittedAt || report?.createdAt || Date.now()}
                        sharedBy={report?.assessorId || userId || ""}
                        assesseeName={targetUser.name}
                        viewingContext="self-by-manager"
                    />
                </div>
            )}

            <AssessmentView
                assessmentPlan={activePlan}
                assessmentType="self"
                userName={targetUser.name}
                reviewerName={currentUser?.name || ""}
                initialData={initialData}
                onSave={isViewedByManager ? async () => {
                    // No-op: Read-only view for manager
                } : handleSave}
                onSubmit={isViewedByManager ? undefined : handleSubmit}
                readOnly={isViewedByManager}
                navigationLink={navigationLink}
            />
        </>
    );
}
