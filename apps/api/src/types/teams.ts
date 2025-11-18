/**
 * Team entity - represents an organizational unit
 */
export interface Team {
  /** Team identifier (partition key), e.g., "engineering" */
  id: string;

  /** Human-readable team name */
  name: string;

  /** Manager's userId (email) */
  managerId: string;

  /** Currently active assessment UUID */
  activeAssessmentId?: string;

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
 * Team creation input
 */
export interface CreateTeamInput {
  id: string;
  name: string;
  managerId: string;
  activeAssessmentId?: string;
}

/**
 * Team update input
 */
export interface UpdateTeamInput {
  name?: string;
  managerId?: string;
  activeAssessmentId?: string;
}