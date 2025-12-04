/**
 * Assessment plan - represents a team's career ladder framework for a specific season
 */
export interface AssessmentPlan {
  /** Team ID (partition key) */
  teamId: string;

  /** Season identifier (sort key), e.g., "2024-Q1", "2025-H1", "2024-Annual" */
  season: string;

  /** Assessment plan name, e.g., "Engineering Ladder Q4 2025" */
  name: string;

  /** Structured competency data */
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
 * Category - top-level grouping of competencies
 */
export interface Category {
  /** Category name, e.g., "Technical Execution" */
  name: string;

  /** Array of competencies in this category */
  competencies: Competency[];
}

/**
 * Competency - specific skill area with multiple levels
 */
export interface Competency {
  /** Competency name, e.g., "Code Quality" */
  name: string;

  /** Array of levels for this competency */
  levels: Level[];
}

/**
 * Level - specific proficiency level within a competency
 */
export interface Level {
  /** Level number (e.g., 1-5) */
  level: number;

  /** Level title, e.g., "Junior", "Mid", "Senior" */
  title: string;

  /** Expectation text describing this level */
  description: string;
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