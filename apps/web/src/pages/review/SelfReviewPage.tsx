/**
 * Self Review Page
 * Allows users to complete their self-assessment
 * Accessible by the user themselves OR their manager
 */

import React, { useMemo, useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUserMeta } from "@/hooks/useUserMeta";
import { useManagerCheck } from "@/hooks/useManagerCheck";
import { useAssessmentPlans } from "@/hooks/useAssessmentPlans";
import { useAssessmentReport } from "@/hooks/useAssessmentReport";
import { AssessmentView } from "@/components/assessment/AssessmentView";
import { SharedReportBanner } from "@/components/assessment/SharedReportBanner";
import { uiToApiFormat, apiToUiFormat } from "@/utils/assessmentTransformers";
import type { AssessmentReviewData } from "@/hooks/useAssessmentReviewLogic";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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

    // Tab state
    const [activeTab, setActiveTab] = useState<'self' | 'manager'>('self');

    // Auto-switch to self tab if manager report becomes unavailable
    useEffect(() => {
        if (activeTab === 'manager' && !sharedManagerReport) {
            setActiveTab('self');
        }
    }, [activeTab, sharedManagerReport]);

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
    const managerInitialData = sharedManagerReport
        ? apiToUiFormat(sharedManagerReport.responses)
        : undefined;

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

    return (
        <>
            {sharedManagerReport && (
                <div className="border-b border-border bg-background">
                    <div className="container mx-auto px-4">
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setActiveTab('self')}
                                className={cn(
                                    "px-4 py-3 font-medium border-b-2 transition-colors",
                                    activeTab === 'self'
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                )}
                            >
                                My Self-Assessment
                            </button>
                            <button
                                onClick={() => setActiveTab('manager')}
                                className={cn(
                                    "px-4 py-3 font-medium border-b-2 transition-colors",
                                    activeTab === 'manager'
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Manager's Assessment
                                <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                                    Shared
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'self' && (
                <AssessmentView
                    assessmentPlan={activePlan}
                    assessmentType="self"
                    userName={targetUser.name}
                    reviewerName={currentUser?.name || ""}
                    initialData={initialData}
                    onSave={handleSave}
                    onSubmit={handleSubmit}
                    readOnly={false}
                />
            )}

            {activeTab === 'manager' && sharedManagerReport && (
                <>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                        <SharedReportBanner
                            sharedAt={sharedManagerReport.sharedAt!}
                            sharedBy={sharedManagerReport.sharedBy!}
                            assesseeName="you"
                        />
                    </div>
                    <AssessmentView
                        assessmentPlan={activePlan}
                        assessmentType="manager"
                        userName={targetUser.name}
                        reviewerName={sharedManagerReport.assessorId}
                        initialData={managerInitialData}
                        onSave={async () => {}} // No-op for read-only
                        readOnly={true}
                    />
                </>
            )}
        </>
    );
}
