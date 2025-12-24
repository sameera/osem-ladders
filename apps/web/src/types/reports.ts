/**
 * Assessment Report types for frontend
 * Mirrors the backend types from apps/api/src/types/reports.ts
 */

/**
 * Assessment Report - completed assessment with responses
 */
export interface AssessmentReport {
  /** Content-addressed key (PK): <userId>|<assessmentId>|<type> */
  id: string;

  /** Assessment type: "self" or "manager" */
  type: AssessmentType;

  /** Email of user being assessed */
  userId: string;

  /** Assessment template UUID (season identifier from AssessmentPlan) */
  assessmentId: string;

  /** Email of person who completed assessment */
  assessorId: string;

  /** Assessment responses keyed by competency/level */
  responses: Record<string, CompetencyResponse>;

  /** Workflow status */
  status: AssessmentStatus;

  /** Unix timestamp when submitted (only set when status is "submitted") */
  submittedAt?: number;

  /** Soft delete flag */
  isActive: boolean;

  /** Unix timestamp when created */
  createdAt: number;

  /** Unix timestamp when last updated */
  updatedAt: number;

  /** Email of user who created this record */
  createdBy: string;
}

export type AssessmentType = 'self' | 'manager';
export type AssessmentStatus = 'not_started' | 'in_progress' | 'submitted';

/**
 * Competency response within an assessment
 */
export interface CompetencyResponse {
  /** Selected level (1-5 or similar) */
  selectedLevel: number;

  /** Optional text feedback */
  feedback?: string;  // Deprecated, keep for backward compatibility

  /** Evidence/strengths for selected level */
  evidence?: string;

  /** Opportunities for growth to next level */
  nextLevelFeedback?: string;
}

/**
 * Helper to create content-addressed report ID
 */
export function createReportId(
  userId: string,
  assessmentId: string,
  type: AssessmentType
): string {
  return `${userId}|${assessmentId}|${type}`;
}

/**
 * Helper to parse content-addressed report ID
 */
export function parseReportId(id: string): {
  userId: string;
  assessmentId: string;
  type: AssessmentType;
} {
  const [userId, assessmentId, type] = id.split('|');

  if (!userId || !assessmentId || !type) {
    throw new Error(`Invalid report ID format: ${id}`);
  }

  if (type !== 'self' && type !== 'manager') {
    throw new Error(`Invalid assessment type: ${type}`);
  }

  return { userId, assessmentId, type };
}

/**
 * Assessment report creation input
 */
export interface CreateReportInput {
  userId: string;
  assessmentId: string;
  type: AssessmentType;
  assessorId: string;
  responses?: Record<string, CompetencyResponse>;
}

/**
 * Assessment report update input
 */
export interface UpdateReportInput {
  responses?: Record<string, CompetencyResponse>;
  status?: AssessmentStatus;
}

/**
 * API response for fetching assessment report
 */
export interface GetReportResponse {
  success: boolean;
  data: AssessmentReport;
}

/**
 * API response for creating/updating assessment report
 */
export interface CreateReportResponse {
  success: boolean;
  data: AssessmentReport;
}
