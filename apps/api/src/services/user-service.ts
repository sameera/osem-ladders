/**
 * User Service
 * Business logic for user management operations
 */

import { PutCommand, GetCommand, UpdateCommand, ScanCommand, type ScanCommandInput } from '@aws-sdk/lib-dynamodb';
import { AdminDisableUserCommand, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { docClient, TableNames } from '../utils/dynamodb-client.js';
import type {
  User,
  UserRole,
  CreateUserRequest,
  UpdateUserRolesRequest,
  ListUsersQuery,
  ListUsersResponse
} from '../types/users.js';

// Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

/**
 * Validation Helper Functions
 */

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MAX_EMAIL_LENGTH = 254;
export const MAX_NAME_LENGTH = 255;
export const VALID_ROLES: readonly UserRole[] = ['manager', 'admin'] as const;

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= MAX_EMAIL_LENGTH;
}

export function validateName(name: string): boolean {
  return name.trim().length > 0 && name.length <= MAX_NAME_LENGTH;
}

export function validateRoles(roles: string[]): boolean {
  return roles.every(role => VALID_ROLES.includes(role as UserRole));
}

/**
 * User Service Functions
 */

/**
 * Create a new user
 */
export async function createUser(
  request: CreateUserRequest,
  createdBy: string
): Promise<User> {
  // Validate email
  if (!validateEmail(request.email)) {
    throw new Error('INVALID_EMAIL: Email address format is invalid');
  }

  // Validate name
  if (!validateName(request.name)) {
    throw new Error('INVALID_NAME: Name cannot be empty');
  }

  // Validate roles
  const roles = request.roles || [];
  if (!validateRoles(roles)) {
    throw new Error('INVALID_ROLE: Role must be "manager" or "admin"');
  }

  const now = Date.now();
  const user: User = {
    userId: request.email,
    name: request.name,
    roles: roles as UserRole[],
    team: request.team || null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    createdBy
  };

  try {
    await docClient.send(
      new PutCommand({
        TableName: TableNames.Users,
        Item: user,
        ConditionExpression: 'attribute_not_exists(userId)'
      })
    );

    return user;
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      throw new Error('USER_EXISTS: User with this email already exists');
    }
    throw error;
  }
}

/**
 * Get user by ID (email)
 */
export async function getUserById(userId: string): Promise<User | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TableNames.Users,
      Key: { userId }
    })
  );

  return result.Item ? (result.Item as User) : null;
}

/**
 * List users with pagination and search
 */
export async function listUsers(query: ListUsersQuery): Promise<ListUsersResponse> {
  const limit = Math.min(query.limit || 100, 500);
  const params: ScanCommandInput = {
    TableName: TableNames.Users,
    Limit: limit,
    ExclusiveStartKey: query.nextToken ? JSON.parse(query.nextToken) : undefined
  };

  // Add filter expressions for search and status
  const filterExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  // Search filter
  if (query.search) {
    filterExpressions.push('contains(#name, :search) OR contains(userId, :search)');
    expressionAttributeNames['#name'] = 'name';
    expressionAttributeValues[':search'] = query.search;
  }

  // Status filter
  if (query.status && query.status !== 'all') {
    const isActive = query.status === 'active';
    filterExpressions.push('isActive = :isActive');
    expressionAttributeValues[':isActive'] = isActive;
  }

  if (filterExpressions.length > 0) {
    params.FilterExpression = filterExpressions.join(' AND ');
    if (Object.keys(expressionAttributeNames).length > 0) {
      params.ExpressionAttributeNames = expressionAttributeNames;
    }
    params.ExpressionAttributeValues = expressionAttributeValues;
  }

  const result = await docClient.send(new ScanCommand(params));

  return {
    users: (result.Items || []) as User[],
    nextToken: result.LastEvaluatedKey ? JSON.stringify(result.LastEvaluatedKey) : null
  };
}

/**
 * Update user roles
 */
export async function updateUserRoles(
  userId: string,
  request: UpdateUserRolesRequest,
  updatedBy: string
): Promise<User> {
  // Validate roles
  if (!validateRoles(request.roles)) {
    throw new Error('INVALID_ROLE: Role must be "manager" or "admin"');
  }

  // Check if user exists
  const existingUser = await getUserById(userId);
  if (!existingUser) {
    throw new Error('USER_NOT_FOUND: User not found');
  }

  const now = Date.now();

  await docClient.send(
    new UpdateCommand({
      TableName: TableNames.Users,
      Key: { userId },
      UpdateExpression: 'SET roles = :roles, updatedAt = :now, updatedBy = :updatedBy',
      ExpressionAttributeValues: {
        ':roles': request.roles,
        ':now': now,
        ':updatedBy': updatedBy
      }
    })
  );

  return {
    ...existingUser,
    roles: request.roles as UserRole[],
    updatedAt: now,
    updatedBy
  };
}

/**
 * Helper: Check if user manages any teams
 * Returns array of team IDs the user manages
 */
export async function getTeamsByManagerId(userId: string): Promise<string[]> {
  // Query Teams table with managerId GSI
  // For now, return empty array as Teams functionality is not in scope for this feature
  // This will be implemented in a future feature (005-team-management)
  return [];
}

/**
 * Deactivate user (soft delete)
 */
export async function deactivateUser(
  userId: string,
  adminUserId: string
): Promise<{ userId: string; deactivatedAt: number }> {
  // Check if user exists
  const user = await getUserById(userId);
  if (!user) {
    throw new Error('USER_NOT_FOUND: User not found');
  }

  // Prevent self-deactivation
  if (userId === adminUserId) {
    throw new Error('SELF_DEACTIVATION: Cannot deactivate your own account');
  }

  // Check if user is already inactive
  if (!user.isActive) {
    throw new Error('ALREADY_INACTIVE: User is already deactivated');
  }

  // Check if user is a team manager
  const managedTeams = await getTeamsByManagerId(userId);
  if (managedTeams.length > 0) {
    throw new Error(`USER_IS_MANAGER: User is manager of ${managedTeams.length} team(s). Reassign teams before deactivating.`);
  }

  const now = Date.now();

  // Update DynamoDB
  await docClient.send(
    new UpdateCommand({
      TableName: TableNames.Users,
      Key: { userId },
      UpdateExpression: 'SET isActive = :false, updatedAt = :now, updatedBy = :updatedBy',
      ExpressionAttributeValues: {
        ':false': false,
        ':now': now,
        ':updatedBy': adminUserId
      },
      ConditionExpression: 'userId <> :adminUserId',
      ExpressionAttributeNames: {
        '#userId': 'userId'
      }
    })
  );

  // Disable in Cognito
  try {
    await cognitoClient.send(
      new AdminDisableUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: userId
      })
    );
  } catch (error) {
    // Log error but don't fail - DynamoDB is source of truth
    console.error('Failed to disable user in Cognito:', error);
  }

  return {
    userId,
    deactivatedAt: now
  };
}
