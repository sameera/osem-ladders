/**
 * Assessment Data Transformers
 * Convert between UI format (nested by category) and API format (flat keyed responses)
 */

import type { CompetencyResponse } from '@/types/reports';

/**
 * UI format for assessment selections and feedback
 * Used by AssessmentContainer and AssessmentView components
 */
export interface AssessmentUIData {
  selections: Record<string, Record<string, number>>;
  feedback: Record<string, Record<string, Record<number, { evidence: string; nextLevelFeedback: string }>>>;
}

/**
 * Convert UI format to API format
 *
 * UI format (nested by category):
 * {
 *   selections: {
 *     "Technical Execution": {
 *       "Code Quality": 3,
 *       "System Design": 4
 *     }
 *   },
 *   feedback: {
 *     "Technical Execution": {
 *       "Code Quality": {
 *         3: {
 *           evidence: "Led refactoring of auth module",
 *           nextLevelFeedback: "Work on distributed systems"
 *         }
 *       }
 *     }
 *   }
 * }
 *
 * API format (flat keyed):
 * {
 *   "Technical Execution|Code Quality": {
 *     selectedLevel: 3,
 *     feedback: "Evidence: Led refactoring of auth module\nNext: Work on distributed systems"
 *   }
 * }
 */
export function uiToApiFormat(
  selections: Record<string, Record<string, number>>,
  feedback: Record<string, Record<string, Record<number, { evidence: string; nextLevelFeedback: string }>>>
): Record<string, CompetencyResponse> {
  const responses: Record<string, CompetencyResponse> = {};

  for (const [category, competencies] of Object.entries(selections)) {
    for (const [competence, level] of Object.entries(competencies)) {
      const key = `${category}|${competence}`;
      const competenceFeedback = feedback[category]?.[competence]?.[level];

      responses[key] = {
        selectedLevel: level,
        evidence: competenceFeedback?.evidence,
        nextLevelFeedback: competenceFeedback?.nextLevelFeedback,
        // Keep old format for backward compatibility
        feedback: competenceFeedback
          ? `Evidence: ${competenceFeedback.evidence}\nNext: ${competenceFeedback.nextLevelFeedback}`
          : undefined,
      };
    }
  }

  return responses;
}

/**
 * Convert API format to UI format
 */
export function apiToUiFormat(
  responses: Record<string, CompetencyResponse>
): AssessmentUIData {
  const selections: Record<string, Record<string, number>> = {};
  const feedback: Record<string, Record<string, Record<number, { evidence: string; nextLevelFeedback: string }>>> = {};

  for (const [key, response] of Object.entries(responses)) {
    const [category, competence] = key.split('|');

    if (!category || !competence) {
      console.warn(`Invalid response key format: ${key}`);
      continue;
    }

    // Set selection
    if (!selections[category]) selections[category] = {};
    selections[category][competence] = response.selectedLevel;

    // Parse feedback - prioritize new fields, fallback to old format
    let evidence = '';
    let nextLevelFeedback = '';

    if (response.evidence !== undefined || response.nextLevelFeedback !== undefined) {
      // New format - use dedicated fields
      evidence = response.evidence || '';
      nextLevelFeedback = response.nextLevelFeedback || '';
    } else if (response.feedback) {
      // Old format - parse from concatenated string
      const [evidencePart, nextPart] = response.feedback.split('\nNext: ');
      evidence = evidencePart?.replace('Evidence: ', '') || '';
      nextLevelFeedback = nextPart || '';
    }

    if (evidence || nextLevelFeedback) {
      if (!feedback[category]) feedback[category] = {};
      if (!feedback[category][competence]) feedback[category][competence] = {};

      feedback[category][competence][response.selectedLevel] = {
        evidence,
        nextLevelFeedback,
      };
    }
  }

  return { selections, feedback };
}
