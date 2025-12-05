/**
 * Team Management API Types
 * Shared type definitions for team management operations
 */

/**
 * Team entity stored in DynamoDB
 */
export interface Team {
  id: string;                  // Partition key, unique identifier (e.g., "engineering-team")
  name: string;                // Human-readable team name
  managerId?: string | null;   // Optional user ID (email) of team manager
  isActive: boolean;           // Soft delete flag (NEW - from research.md)
  createdAt: number;           // Unix timestamp (ms)
  updatedAt: number;           // Unix timestamp (ms)
  createdBy: string;           // User ID of admin who created the team
}

/**
 * Team with calculated fields for display
 */
export interface TeamWithDetails extends Team {
  memberCount: number;                  // Calculated from Users table
  managerName?: string | null;          // Resolved from Users.name via managerId
  activeAssessment?: string | null;     // Active assessment plan name (Phase 4, null in Phase 3)
}

/**
 * Request to create a new team (User Story 1)
 */
export interface CreateTeamRequest {
  teamId: string;    // 2-50 chars, lowercase alphanumeric + hyphens
  name: string;      // 2-100 chars, any printable characters
  managerId: string; // REQUIRED - User ID (email) of team manager
}

/**
 * Request to assign or unassign team manager (User Story 3)
 */
export interface AssignManagerRequest {
  managerId: string | null;  // User ID (email) or null to unassign
}

/**
 * Request to add members to team (User Story 4)
 */
export interface AddMembersRequest {
  userIds: string[];  // Array of 1-50 user IDs (emails)
}

/**
 * Request to remove members from team (User Story 5)
 */
export interface RemoveMembersRequest {
  userIds: string[];  // Array of 1-50 user IDs (emails)
}

/**
 * Request to archive team (soft delete)
 */
export interface ArchiveTeamRequest {
  archive: boolean;  // true to archive, false to unarchive
}

/**
 * Query parameters for listing teams
 */
export interface ListTeamsQuery {
  search?: string;           // Search by team ID or name
  includeArchived?: boolean; // Include archived teams (default: false)
  managerId?: string;        // Filter by manager ID
}

/**
 * Paginated team list response
 */
export interface ListTeamsResponse {
  teams: TeamWithDetails[];
  total: number;              // Total count (for pagination)
  lastEvaluatedKey?: string;  // DynamoDB pagination token (optional)
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Error codes specific to team management
 */
export enum TeamErrorCode {
  TEAM_EXISTS = 'TEAM_EXISTS',                    // 409: Team ID already exists
  TEAM_NOT_FOUND = 'TEAM_NOT_FOUND',              // 404: Team not found
  INVALID_TEAM_ID = 'INVALID_TEAM_ID',            // 400: Invalid team ID format
  INVALID_MANAGER_ROLE = 'INVALID_MANAGER_ROLE',  // 400: User doesn't have manager role
  MANAGER_DEACTIVATED = 'MANAGER_DEACTIVATED',    // 400: Manager user is deactivated
  MANAGER_IS_MEMBER = 'MANAGER_IS_MEMBER',        // 400: Cannot remove team manager
  USER_NOT_FOUND = 'USER_NOT_FOUND',              // 404: User not found
  FORBIDDEN = 'FORBIDDEN',                        // 403: Admin access required
  UNAUTHORIZED = 'UNAUTHORIZED',                  // 401: Authentication required
}

/**
 * Validation regex patterns
 */
export const TEAM_ID_REGEX = /^[a-z0-9-]{2,50}$/;
export const MIN_TEAM_NAME_LENGTH = 2;
export const MAX_TEAM_NAME_LENGTH = 100;
export const MAX_BATCH_SIZE = 50;  // Max users per add/remove operation
