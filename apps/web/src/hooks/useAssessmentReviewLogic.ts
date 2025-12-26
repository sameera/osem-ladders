/**
 * Assessment Review Logic Hook
 * Refactored version of useAssessmentLogic for API-backed assessment reviews
 * Manages assessment state, navigation, and auto-save functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Category } from '@/data/model';
import { useAssessmentNavigation } from '@/hooks/useAssessmentNavigation';
import { useAssessmentCompletion } from '@/hooks/useAssessmentCompletion';

export interface AssessmentReviewData {
  selections: Record<string, Record<string, number>>;
  feedback: Record<string, Record<string, Record<number, { evidence: string; nextLevelFeedback: string }>>>;
  wayForward?: string;
  status: 'in_progress' | 'submitted';
}

export interface UseAssessmentReviewLogicProps {
  categories: Category[];
  initialData?: Partial<AssessmentReviewData>;
  onSave: (data: AssessmentReviewData) => Promise<void>;
  autoSaveInterval?: number; // milliseconds
  readOnly?: boolean;
}

export type SaveStatus = 'saved' | 'saving' | 'error' | 'idle';

export function useAssessmentReviewLogic({
  categories,
  initialData,
  onSave,
  autoSaveInterval = 30000, // 30 seconds default
  readOnly = false,
}: UseAssessmentReviewLogicProps) {
  // State
  const [selections, setSelections] = useState<Record<string, Record<string, number>>>(
    initialData?.selections || {}
  );
  const [feedback, setFeedback] = useState<
    Record<string, Record<string, Record<number, { evidence: string; nextLevelFeedback: string }>>>
  >(initialData?.feedback || {});
  const [wayForward, setWayForward] = useState<string>(initialData?.wayForward || '');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef(false); // Track immediate save requests

  // Create allCategories with Report screen
  const allCategories = [...categories.map((c) => c.title), 'Report'];

  // Navigation management
  const {
    currentScreen: currentCategory,
    setCurrentScreen: setCurrentCategory,
    handleNext,
    handlePrevious,
  } = useAssessmentNavigation(allCategories.length);

  // Completion tracking
  const completedCategories = useAssessmentCompletion(categories, selections);

  // Auto-save handler
  const performSave = useCallback(async () => {
    if (saveStatus === 'saving') return; // Prevent concurrent saves

    setSaveStatus('saving');
    try {
      await onSave({
        selections,
        feedback,
        wayForward,
        status: 'in_progress',
      });
      setSaveStatus('saved');
      setLastSavedAt(Date.now());
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveStatus('error');
    }
  }, [selections, feedback, wayForward, onSave, saveStatus]);

  // Set up auto-save timer whenever data changes
  useEffect(() => {
    // Skip auto-save in read-only mode
    if (readOnly) return;

    // Clear existing timer
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    // Only auto-save if there's actual data
    if (Object.keys(selections).length > 0) {
      // Check if we need an immediate save
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        performSave();
      } else {
        // Otherwise use debounced auto-save
        const timer = setTimeout(() => {
          performSave();
        }, autoSaveInterval);

        setAutoSaveTimer(timer);
      }
    }

    // Cleanup
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selections, feedback, wayForward, readOnly]);

  // Manual save trigger
  const triggerManualSave = useCallback(async () => {
    await performSave();
  }, [performSave]);

  // Selection change handler
  const handleSelectionChange = useCallback(
    (competence: string, level: number, evidence: string, nextLevelFeedback: string) => {
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

      // Mark that we need an immediate save
      pendingSaveRef.current = true;
    },
    [currentCategory, categories]
  );

  return {
    // State
    selections,
    feedback,
    wayForward,
    currentCategory,
    completedCategories,
    saveStatus,
    lastSavedAt,

    // Setters
    setCurrentCategory,
    setWayForward,

    // Navigation handlers
    handleNext,
    handlePrevious,

    // Assessment handlers
    handleSelectionChange,
    triggerManualSave,
  };
}
