/**
 * User entity - represents a team member with roles and team assignment
 */
export interface User {
  /** User email address (partition key) */
  userId: string;

  /** User's full name */
  name: string;

  /** User roles: "TeamMember", "Manager", "Admin" */
  roles: Set<UserRole>;

  /** Team identifier (e.g., "engineering") */
  team: string;

  /** Manager's userId (email) - optional */
  managerId?: string;

  /** Soft delete flag */
  isActive: boolean;

  /** Unix timestamp when created */
  createdAt: number;

  /** Unix timestamp when last updated */
  updatedAt: number;

  /** Email of user who created this record */
  createdBy: string;
}

export type UserRole = 'TeamMember' | 'Manager' | 'Admin';

/**
 * User creation input
 */
export interface CreateUserInput {
  userId: string;
  name: string;
  roles: UserRole[];
  team: string;
  managerId?: string;
}

/**
 * User update input
 */
export interface UpdateUserInput {
  name?: string;
  roles?: UserRole[];
  team?: string;
  managerId?: string;
}