import type { APIGatewayProxyHandler } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TableNames } from '../../utils/dynamodb-client.js';
import { successResponse, errorResponse, errors } from '../../utils/lambda-response.js';
import type { CreateUserInput, User } from '../../types/index.js';
import { validateEmail } from '../../utils/validators.js';
import { requireRole, getAuthenticatedUserEmail } from '../../middleware/auth.js';

/**
 * Create a new user (Admin only)
 *
 * Path: POST /users
 * Body: CreateUserInput
 *
 * @returns Created user object
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Require Admin role
    const authError = await requireRole(event, 'Admin');
    if (authError) {
      return authError;
    }

    if (!event.body) {
      return errorResponse(errors.badRequest('Request body is required'), 400);
    }

    const input: CreateUserInput = JSON.parse(event.body);

    // Validate required fields
    if (!input.userId || !input.name || !input.roles || !input.team) {
      return errorResponse(
        errors.validationError('Missing required fields: userId, name, roles, team'),
        400
      );
    }

    // Validate email format
    if (!validateEmail(input.userId)) {
      return errorResponse(
        errors.validationError('Invalid email format for userId'),
        400
      );
    }

    // Validate roles
    if (!Array.isArray(input.roles) || input.roles.length === 0) {
      return errorResponse(
        errors.validationError('roles must be a non-empty array'),
        400
      );
    }

    // Get authenticated user email
    const createdBy = getAuthenticatedUserEmail(event) || 'system';

    const now = Date.now();
    const user: User = {
      userId: input.userId,
      name: input.name,
      roles: new Set(input.roles),
      team: input.team,
      managerId: input.managerId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdBy
    };

    // Store in DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: TableNames.Users,
        Item: user,
        ConditionExpression: 'attribute_not_exists(userId)' // Prevent overwriting existing users
      })
    );

    // Convert roles Set to Array for JSON response
    const userResponse = {
      ...user,
      roles: Array.from(user.roles)
    };

    return successResponse(userResponse, 201);
  } catch (error: any) {
    console.error('Error creating user:', error);

    // Handle conditional check failure (user already exists)
    if (error.name === 'ConditionalCheckFailedException') {
      return errorResponse(
        errors.conflict('User with this email already exists'),
        409
      );
    }

    return errorResponse(
      errors.internal('Failed to create user'),
      500
    );
  }
};
