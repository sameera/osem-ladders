import type { FastifyRequest, FastifyReply, RouteHandler } from 'fastify';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TableNames } from '../../utils/dynamodb-client.js';
import { errors } from '../../utils/lambda-response.js';
import type { CreateUserInput, User, ApiResponse } from '../../types/index.js';
import { validateEmail } from '../../utils/validators.js';

/**
 * Create a new user (Admin only)
 *
 * Path: POST /users
 * Body: CreateUserInput
 *
 * @returns Created user object
 */
export const createUserHandler: RouteHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    // Get authenticated user email from Cognito authorizer claims
    const awsEvent = (request as any).awsLambda?.event;
    const userEmail = awsEvent?.requestContext?.authorizer?.claims?.email;

    if (!userEmail) {
      const errorResponse: ApiResponse = {
        success: false,
        error: errors.unauthorized('Authentication required'),
      };
      return reply.status(401).send(errorResponse);
    }

    // TODO: Add role checking middleware or helper for Admin role requirement
    // For now, we'll proceed with the assumption that authorization is handled elsewhere

    const input = request.body as CreateUserInput;

    // Validate required fields
    if (!input.userId || !input.name || !input.roles || !input.team) {
      const errorResponse: ApiResponse = {
        success: false,
        error: errors.validationError('Missing required fields: userId, name, roles, team'),
      };
      return reply.status(400).send(errorResponse);
    }

    // Validate email format
    if (!validateEmail(input.userId)) {
      const errorResponse: ApiResponse = {
        success: false,
        error: errors.validationError('Invalid email format for userId'),
      };
      return reply.status(400).send(errorResponse);
    }

    // Validate roles
    if (!Array.isArray(input.roles) || input.roles.length === 0) {
      const errorResponse: ApiResponse = {
        success: false,
        error: errors.validationError('roles must be a non-empty array'),
      };
      return reply.status(400).send(errorResponse);
    }

    // Get authenticated user email as creator
    const createdBy = userEmail || 'system';

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

    const successResponse: ApiResponse<typeof userResponse> = {
      success: true,
      data: userResponse,
    };

    return reply.status(201).send(successResponse);
  } catch (error: any) {
    request.log.error({ error }, 'Error creating user');

    // Handle conditional check failure (user already exists)
    if (error.name === 'ConditionalCheckFailedException') {
      const errorResponse: ApiResponse = {
        success: false,
        error: errors.conflict('User with this email already exists'),
      };
      return reply.status(409).send(errorResponse);
    }

    const errorResponse: ApiResponse = {
      success: false,
      error: errors.internal('Failed to create user'),
    };
    return reply.status(500).send(errorResponse);
  }
};
