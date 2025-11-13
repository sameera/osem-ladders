/**
 * User service for DynamoDB operations
 * Handles user provisioning and updates
 */

import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, getUsersTableName } from '../utils/dynamodb';
import { ProvisioningResult } from '../types';
import { logger } from '../utils/logger';

/**
 * User data for upsert operation
 */
export interface UpsertUserData {
  email: string;
  cognitoSub: string;
  name: string;
}

/**
 * Upsert user record in DynamoDB
 * Uses UpdateItem with if_not_exists() for idempotent operation
 * - If user exists: Updates cognitoSub, preserves existing name and roles
 * - If user doesn't exist: Creates with default team_member role
 *
 * @param data - User data from Cognito event
 * @returns Provisioning result with success status and user details
 */
export async function upsertUser(data: UpsertUserData): Promise<ProvisioningResult> {
  const { email, cognitoSub, name } = data;
  const tableName = getUsersTableName();
  const now = Date.now();

  try {
    logger.info('Upserting user', {
      userId: email,
      cognitoSub,
      operation: 'upsertUser',
    });

    // Single UpdateItem command handles both create and update atomically
    const command = new UpdateCommand({
      TableName: tableName,
      Key: {
        userId: email, // Email is the partition key
      },
      UpdateExpression: `
        SET cognitoSub = :cognitoSub,
            email = :email,
            #name = if_not_exists(#name, :name),
            updatedAt = :updatedAt,
            createdAt = if_not_exists(createdAt, :createdAt),
            roles = if_not_exists(roles, :defaultRoles)
      `,
      ExpressionAttributeNames: {
        '#name': 'name', // 'name' is a reserved keyword
      },
      ExpressionAttributeValues: {
        ':cognitoSub': cognitoSub,
        ':email': email,
        ':name': name,
        ':updatedAt': now,
        ':createdAt': now,
        ':defaultRoles': new Set(['team_member']), // Default role for new users
      },
      ReturnValues: 'ALL_NEW', // Return the updated item
    });

    const response = await docClient.send(command);
    const updatedUser = response.Attributes;

    if (!updatedUser) {
      throw new Error('UpdateItem did not return updated attributes');
    }

    // Convert DynamoDB Set to array for response
    const roles = Array.from(updatedUser.roles as Set<string>);

    // Determine if this is a new user (createdAt === updatedAt)
    const isNewUser = updatedUser.createdAt === updatedUser.updatedAt;

    logger.info('User upserted successfully', {
      userId: email,
      cognitoSub,
      isNewUser,
      rolesCount: roles.length,
      operation: 'upsertUser',
    });

    return {
      success: true,
      userId: email,
      isNewUser,
      roles,
    };
  } catch (error) {
    logger.error(
      'Failed to upsert user',
      {
        userId: email,
        cognitoSub,
        operation: 'upsertUser',
      },
      error as Error
    );

    throw error; // Propagate error to Cognito for retry
  }
}
