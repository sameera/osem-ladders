/**
 * TypeScript interfaces for DynamoDB table schemas
 *
 * These interfaces define the structure of items stored in each table.
 * All timestamps are Unix milliseconds (number type).
 * All IDs are UUID strings.
 */

// ============================================================================
// Table 1: Users
// ============================================================================

export interface UserItem {
  userId: string; // Cognito sub (UUID), partition key
  email: string; // From Cognito/Microsoft 365
  name: string; // Display name from Microsoft 365
  roles: Set<string>; // ['admin', 'manager', 'team_member']
  createdAt: number; // Unix timestamp (milliseconds)
  updatedAt: number; // Unix timestamp (milliseconds)
}

// ============================================================================
// Table 2: Teams
// ============================================================================

export interface TeamItem {
  teamId: string; // UUID, partition key
  teamName: string; // Display name
  description?: string; // Optional team description
  managerId: string; // User ID of manager (GSI key)
  memberIds: Set<string>; // Array of User IDs
  createdBy: string; // User ID (admin or manager)
  createdAt: number; // Unix timestamp (milliseconds)
  updatedAt: number; // Unix timestamp (milliseconds)
  isActive: boolean; // Soft delete flag
}

// ============================================================================
// Table 3: AssessmentPlans
// ============================================================================

export type AssessmentPlanStatus = 'draft' | 'active' | 'completed' | 'archived';

export interface AssessmentPlanItem {
  planId: string; // UUID, partition key
  teamId: string; // Team this plan belongs to (GSI key)
  planName: string; // e.g., "Q1 2025 Review"
  description?: string; // Optional plan description
  season: string; // e.g., "2025-Q1", "H1-2025"
  startDate: number; // Unix timestamp (milliseconds)
  endDate: number; // Unix timestamp (milliseconds)
  status: AssessmentPlanStatus; // 'draft', 'active', 'completed', 'archived' (GSI key)
  configVersion: string; // Reference to career ladder config version
  createdBy: string; // User ID
  createdAt: number; // Unix timestamp (milliseconds)
  updatedAt: number; // Unix timestamp (milliseconds)
}

// ============================================================================
// Table 4: Assessments
// ============================================================================

export type AssessmentType = 'self' | 'manager';
export type AssessmentStatus = 'not_started' | 'in_progress' | 'submitted';

// Nested structures for Assessments
export interface SelectionsMap {
  [category: string]: {
    [competency: string]: number; // Level number
  };
}

export interface FeedbackDetail {
  evidence: string;
  nextLevelFeedback: string;
}

export interface FeedbackMap {
  [category: string]: {
    [competency: string]: {
      [level: string]: FeedbackDetail; // Level as string key
    };
  };
}

export interface AssessmentItem {
  assessmentId: string; // UUID, partition key
  planId: string; // Reference to AssessmentPlan (GSI key)
  teamId: string; // Team context
  teamMemberId: string; // User ID being assessed (GSI key)
  assessmentType: AssessmentType; // 'self' or 'manager'
  assessorId: string; // User ID who did the assessment
  selections: SelectionsMap; // { category: { competency: level }}
  feedback: FeedbackMap; // Nested feedback structure
  currentLevel: number; // Overall career level
  wayForward?: string; // Optional career development notes
  status: AssessmentStatus; // 'not_started', 'in_progress', 'submitted'
  submittedAt?: number; // Unix timestamp (milliseconds), only if submitted
  createdAt: number; // Unix timestamp (milliseconds)
  updatedAt: number; // Unix timestamp (milliseconds)
}

// ============================================================================
// Table 5: AssessmentReports
// ============================================================================

export interface VarianceDetail {
  selfScore: number;
  managerScore: number;
  difference: number; // Can be negative
}

export interface VarianceMap {
  [category: string]: {
    [competency: string]: VarianceDetail;
  };
}

export interface AssessmentReportItem {
  reportId: string; // UUID, partition key
  planId: string; // Reference to AssessmentPlan (GSI key)
  teamMemberId: string; // User this report is for (GSI key)
  selfAssessmentId: string; // Reference to self Assessment
  managerAssessmentId: string; // Reference to manager Assessment
  finalLevel: number; // Based on manager assessment
  selfAssessedLevel: number; // For comparison
  variance: VarianceMap; // Variance structure
  generatedAt: number; // Unix timestamp (milliseconds)
  exportedAt?: number; // Unix timestamp if exported to PDF
}

// ============================================================================
// Table 6: ConfigVersions
// ============================================================================

// Nested structures for ConfigVersions
export interface ConfigLevel {
  level: number;
  description: string;
}

export interface ConfigCompetency {
  name: string;
  levels: ConfigLevel[];
}

export interface ConfigCategory {
  name: string;
  competencies: ConfigCompetency[];
}

export interface ParsedConfigMap {
  categories: ConfigCategory[];
}

export interface ConfigVersionItem {
  configId: string; // UUID, partition key
  version: string; // Semantic version (e.g., "1.0.0")
  configContent: string; // Full Markdown content (config.md)
  parsedConfig: ParsedConfigMap; // Cached parsed structure
  createdBy: string; // User ID
  createdAt: number; // Unix timestamp (milliseconds)
  isActive: boolean; // Only one active config at a time (GSI key)
}
