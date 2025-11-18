import type { APIGatewayProxyEvent } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TableNames } from '../utils/dynamodb-client.js';
import type { User, UserRole } from '../types/index.js';
import { errorResponse, errors } from '../utils/lambda-response.js';

/**
 * Extract authenticated user email from Cognito authorizer
 */
export function getAuthenticatedUserEmail(
  event: APIGatewayProxyEvent
): string | null {
  return event.requestContext.authorizer?.claims?.email || null;
}

/**
 * Fetch the current authenticated user from DynamoDB
 */
export async function getCurrentUser(
  event: APIGatewayProxyEvent
): Promise<User | null> {
  const userEmail = getAuthenticatedUserEmail(event);

  if (!userEmail) {
    return null;
  }

  const result = await docClient.send(
    new GetCommand({
      TableName: TableNames.Users,
      Key: { userId: userEmail }
    })
  );

  return result.Item ? (result.Item as User) : null;
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: User, role: UserRole): boolean {
  return user.roles.has(role);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: User, roles: UserRole[]): boolean {
  return roles.some((role) => user.roles.has(role));
}

/**
 * Require that the authenticated user has a specific role
 * Returns an error response if the check fails, otherwise returns null
 */
export async function requireRole(
  event: APIGatewayProxyEvent,
  role: UserRole
) {
  const user = await getCurrentUser(event);

  if (!user) {
    return errorResponse(errors.unauthorized('Authentication required'), 401);
  }

  if (!user.isActive) {
    return errorResponse(errors.forbidden('User account is inactive'), 403);
  }

  if (!hasRole(user, role)) {
    return errorResponse(
      errors.forbidden(`This action requires ${role} role`),
      403
    );
  }

  return null; // No error, user is authorized
}

/**
 * Require that the authenticated user has any of the specified roles
 * Returns an error response if the check fails, otherwise returns null
 */
export async function requireAnyRole(
  event: APIGatewayProxyEvent,
  roles: UserRole[]
) {
  const user = await getCurrentUser(event);

  if (!user) {
    return errorResponse(errors.unauthorized('Authentication required'), 401);
  }

  if (!user.isActive) {
    return errorResponse(errors.forbidden('User account is inactive'), 403);
  }

  if (!hasAnyRole(user, roles)) {
    return errorResponse(
      errors.forbidden(`This action requires one of: ${roles.join(', ')}`),
      403
    );
  }

  return null; // No error, user is authorized
}
