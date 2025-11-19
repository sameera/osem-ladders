import React, { useMemo } from "react";
import { ScreenContent } from "@/components/ScreenContent";
import { NavigationButtons } from "@/components/NavigationButtons";
import { parseConfig } from "@/utils/configParser";
import { AssessmentPrompts } from "@/components/assessment/AssessmentPrompts";
import { AssessmentLayout } from "@/components/assessment/AssessmentLayout";
import configMarkdown from "@/data/config.md?raw";
import { Category } from "@/data/model";
import { useAssessmentLogic } from "@/hooks/useAssessmentLogic";

export function AssessmentContainer() {
    const categories: Category[] = useMemo(
        () => parseConfig(configMarkdown),
        []
    );

    const allCategories = useMemo(
        () => [...categories.map((c) => c.title), "Report"],
        [categories]
    );

    const {
        // State
        selections,
        feedback,
        teamMemberName,
        currentLevel,
        wayForward,
        currentCategory,
        completedCategories,
        showTeamMemberPrompt,
        showConfirmNewAssessment,
        showNewAssessmentPrompt,

        // Handlers
        handleTeamMemberSubmit,
        handleSelectionChange,
        handleSubmitAssessment,
        handleNewAssessmentRequest,
        handleConfirmNewAssessment,
        handleCancelConfirmNewAssessment,
        handleStartNewAssessment,
        handleCancelNewAssessment,
        handleOpenAssessmentFile,
        setCurrentCategory,
        setWayForward,
        handleNext,
        handlePrevious,
    } = useAssessmentLogic(categories, allCategories);

    if (categories.length === 0) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        Loading...
                    </h1>
                    <p className="text-muted-foreground">
                        Parsing configuration...
                    </p>
                </div>
            </div>
        );
    }

    const isReportScreen = currentCategory === categories.length;
    const currentCategoryData = !isReportScreen
        ? categories[currentCategory]
        : null;
    const currentSelections = currentCategoryData
        ? selections[currentCategoryData.title] || {}
        : {};
    const currentFeedback = currentCategoryData
        ? feedback[currentCategoryData.title] || {}
        : {};

    return (
        <>
            <AssessmentPrompts
                showTeamMemberPrompt={showTeamMemberPrompt}
                showConfirmNewAssessment={showConfirmNewAssessment}
                showNewAssessmentPrompt={showNewAssessmentPrompt}
                onTeamMemberSubmit={handleTeamMemberSubmit}
                onConfirmNewAssessment={handleConfirmNewAssessment}
                onCancelConfirmNewAssessment={handleCancelConfirmNewAssessment}
                onStartNewAssessment={handleStartNewAssessment}
                onCancelNewAssessment={handleCancelNewAssessment}
            />

            <AssessmentLayout
                teamMemberName={teamMemberName}
                allScreens={allCategories}
                currentScreen={currentCategory}
                completedScreens={completedCategories}
                onNewAssessment={handleNewAssessmentRequest}
                onOpenAssessment={handleOpenAssessmentFile}
                onScreenChange={setCurrentCategory}
            >
                <ScreenContent
                    isReportScreen={isReportScreen}
                    currentScreenData={currentCategoryData}
                    screens={categories}
                    selections={selections}
                    currentSelections={currentSelections}
                    currentFeedback={currentFeedback}
                    feedback={feedback}
                    onSelectionChange={handleSelectionChange}
                    wayForward={wayForward}
                    onWayForwardChange={setWayForward}
                />

                <NavigationButtons
                    currentScreen={currentCategory}
                    totalScreens={allCategories.length}
                    isReportScreen={isReportScreen}
                    onPrevious={handlePrevious}
                    onNext={handleNext}
                    onSubmitAssessment={handleSubmitAssessment}
                />
            </AssessmentLayout>
        </>
    );
}