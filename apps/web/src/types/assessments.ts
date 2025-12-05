/**
 * Assessment Plan types for frontend
 * Uses the existing Category/Competence/Expectation types from data/model.ts
 */

import type { Category } from '@/data/model';

/**
 * Assessment plan - represents a team's career ladder framework for a specific season
 */
export interface AssessmentPlan {
  /** Team ID (partition key) */
  teamId: string;

  /** Season identifier (sort key), e.g., "2024-Q1", "FY25", "Spring 2025" - any string */
  season: string;

  /** Assessment plan name, e.g., "Engineering Ladder Q4 2025" */
  name: string;

  /** Structured competency data using frontend Category type */
  planConfig: Category[];

  /** Assessment plan description */
  description?: string;

  /** Soft delete flag */
  isActive: boolean;

  /** Unix timestamp when created */
  createdAt: number;

  /** Unix timestamp when last updated */
  updatedAt: number;

  /** Email of user who created this record */
  createdBy: string;
}

/**
 * Assessment plan creation input
 */
export interface CreateAssessmentPlanInput {
  season: string;
  name: string;
  planConfig: Category[];
  description?: string;
}

/**
 * Assessment plan update input
 */
export interface UpdateAssessmentPlanInput {
  name?: string;
  planConfig?: Category[];
  description?: string;
}

/**
 * Query parameters for listing assessment plans
 */
export interface ListPlansQuery {
  includeInactive?: boolean;
}

/**
 * API response for listing assessment plans
 */
export interface ListPlansResponse {
  plans: AssessmentPlan[];
  total: number;
}

/**
 * API response for single assessment plan
 */
export interface GetPlanResponse {
  success: boolean;
  data: AssessmentPlan;
}

/**
 * API response for create/update
 */
export interface CreatePlanResponse {
  success: boolean;
  data: AssessmentPlan;
}
