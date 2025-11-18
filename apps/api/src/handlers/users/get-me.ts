import type { APIGatewayProxyHandler } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TableNames } from '../../utils/dynamodb-client.js';
import { successResponse, errorResponse, errors } from '../../utils/lambda-response.js';
import type { User } from '../../types/index.js';

/**
 * Get current authenticated user's profile
 *
 * Path: GET /users/me
 *
 * @returns Current user object or 404 if not found
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Get authenticated user email from Cognito authorizer claims
    const userEmail = event.requestContext.authorizer?.claims?.email;

    if (!userEmail) {
      return errorResponse(errors.unauthorized('No authenticated user found'), 401);
    }

    const result = await docClient.send(
      new GetCommand({
        TableName: TableNames.Users,
        Key: { userId: userEmail }
      })
    );

    if (!result.Item) {
      return errorResponse(
        errors.notFound('User', userEmail),
        404
      );
    }

    const user = result.Item as User;

    // Check if user is active
    if (!user.isActive) {
      return errorResponse(
        errors.forbidden('User account is inactive'),
        403
      );
    }

    // Convert roles Set to Array for JSON serialization
    const userResponse = {
      ...user,
      roles: Array.from(user.roles)
    };

    return successResponse(userResponse);
  } catch (error) {
    console.error('Error fetching current user:', error);
    return errorResponse(
      errors.internal('Failed to fetch user profile'),
      500
    );
  }
};
