import { useState } from "react";
import { Category } from "@/data/model";
import { useAssessmentState } from "@/hooks/useAssessmentState";
import { useAssessmentNavigation } from "@/hooks/useAssessmentNavigation";
import { useAssessmentCompletion } from "@/hooks/useAssessmentCompletion";
import { useAssessmentFile } from "@/hooks/useAssessmentFile";

/**
 * Custom hook that manages all assessment-related state and handlers.
 * This consolidates the logic previously scattered in Index.tsx.
 */
export function useAssessmentLogic(
    categories: Category[],
    allCategories: string[]
) {
    const [showNewAssessmentPrompt, setShowNewAssessmentPrompt] =
        useState(false);
    const [showConfirmNewAssessment, setShowConfirmNewAssessment] =
        useState(false);
    const [wayForward, setWayForward] = useState<string>("");

    // Assessment state management
    const {
        selections,
        setSelections,
        feedback,
        setFeedback,
        teamMemberName,
        setTeamMemberName,
        currentLevel,
        setCurrentLevel,
        resetAssessment,
    } = useAssessmentState();

    // Navigation management
    const {
        currentScreen: currentCategory,
        setCurrentScreen: setCurrentCategory,
        handleNext,
        handlePrevious,
        resetNavigation,
    } = useAssessmentNavigation(allCategories.length);

    // Completion tracking
    const completedCategories = useAssessmentCompletion(categories, selections);

    // File operations
    const { handleSubmitAssessment: submitAssessmentFile, handleOpenAssessment } =
        useAssessmentFile();

    // Check if we need to show the team member prompt
    const showTeamMemberPrompt =
        !teamMemberName && Object.keys(selections).length === 0;

    // Handlers
    const handleTeamMemberSubmit = (name: string) => {
        setTeamMemberName(name);
    };

    const handleSelectionChange = (
        competence: string,
        level: number,
        evidence: string,
        nextLevelFeedback: string
    ) => {
        const currentCategoryData = categories[currentCategory];
        if (!currentCategoryData) return;

        setSelections((prev) => ({
            ...prev,
            [currentCategoryData.title]: {
                ...prev[currentCategoryData.title],
                [competence]: level,
            },
        }));

        setFeedback((prev) => ({
            ...prev,
            [currentCategoryData.title]: {
                ...prev[currentCategoryData.title],
                [competence]: {
                    ...prev[currentCategoryData.title]?.[competence],
                    [level]: { evidence, nextLevelFeedback },
                },
            },
        }));
    };

    const handleSubmitAssessment = () => {
        submitAssessmentFile(
            teamMemberName,
            currentLevel,
            categories,
            selections,
            feedback,
            wayForward
        );
        setShowNewAssessmentPrompt(true);
    };

    const handleNewAssessmentRequest = () => {
        const hasSelections =
            Object.keys(selections).length > 0 &&
            Object.values(selections).some(
                (categorySelections) =>
                    Object.keys(categorySelections).length > 0
            );

        if (hasSelections) {
            setShowConfirmNewAssessment(true);
        } else {
            handleStartNewAssessment();
        }
    };

    const handleConfirmNewAssessment = () => {
        setShowConfirmNewAssessment(false);
        handleStartNewAssessment();
    };

    const handleCancelConfirmNewAssessment = () => {
        setShowConfirmNewAssessment(false);
    };

    const handleStartNewAssessment = () => {
        resetAssessment();
        resetNavigation();
        setWayForward("");
        setShowNewAssessmentPrompt(false);
    };

    const handleCancelNewAssessment = () => {
        setShowNewAssessmentPrompt(false);
    };

    const handleOpenAssessmentFile = (data: any) => {
        handleOpenAssessment(
            data,
            setTeamMemberName,
            setCurrentLevel,
            setSelections,
            setFeedback,
            setCurrentCategory,
            setWayForward
        );
    };

    return {
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

        // Setters
        setCurrentCategory,
        setWayForward,

        // Navigation handlers
        handleNext,
        handlePrevious,

        // Assessment handlers
        handleTeamMemberSubmit,
        handleSelectionChange,
        handleSubmitAssessment,
        handleNewAssessmentRequest,
        handleConfirmNewAssessment,
        handleCancelConfirmNewAssessment,
        handleStartNewAssessment,
        handleCancelNewAssessment,
        handleOpenAssessmentFile,
    };
}
