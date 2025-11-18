/**
 * Assessment template - represents a career ladder framework
 */
export interface Assessment {
  /** Assessment UUID (partition key) */
  id: string;

  /** Assessment name, e.g., "Engineering Ladder Q4 2025" */
  name: string;

  /** Semantic version */
  version: string;

  /** Structured competency data */
  plan: Category[];

  /** Assessment description */
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
 * Assessment creation input
 */
export interface CreateAssessmentInput {
  name: string;
  version: string;
  plan: Category[];
  description?: string;
}

/**
 * Assessment update input
 */
export interface UpdateAssessmentInput {
  name?: string;
  description?: string;
}