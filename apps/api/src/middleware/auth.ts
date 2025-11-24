import type { APIGatewayProxyEvent } from 'aws-lambda';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TableNames } from '../utils/dynamodb-client.js';
import type { User, UserRole } from '../types/index.js';
import { errorResponse, errors } from '../utils/lambda-response.js';

/**
 * Extract authenticated user email from Cognito authorizer (Lambda)
 */
export function getAuthenticatedUserEmail(
  event: APIGatewayProxyEvent
): string | null {
  return event.requestContext.authorizer?.claims?.email || null;
}

/**
 * Fetch user from DynamoDB by email
 */
async function fetchUserFromDB(email: string): Promise<User | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TableNames.Users,
      Key: { userId: email }
    })
  );

  return result.Item ? (result.Item as User) : null;
}

/**
 * Fetch the current authenticated user from DynamoDB (Lambda)
 */
export async function getCurrentUser(
  event: APIGatewayProxyEvent
): Promise<User | null> {
  const userEmail = getAuthenticatedUserEmail(event);

  if (!userEmail) {
    return null;
  }

  return fetchUserFromDB(userEmail);
}

/**
 * Check if user has a specific role (works with array or Set)
 */
export function hasRole(user: User, role: UserRole): boolean {
  if (Array.isArray(user.roles)) {
    return user.roles.includes(role);
  }
  // Support legacy Set-based roles
  return (user.roles as any).has(role);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: User, roles: UserRole[]): boolean {
  return roles.some((role) => hasRole(user, role));
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

/**
 * Fastify middleware: Require admin role
 * Uses request.user populated by auth plugin
 */
export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const userEmail = request.user?.email;

  if (!userEmail) {
    return reply.status(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }
    });
  }

  // Fetch full user record from DynamoDB to check roles and status
  const user = await fetchUserFromDB(userEmail);

  if (!user) {
    return reply.status(403).send({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'User not found'
      }
    });
  }

  if (!user.isActive) {
    return reply.status(403).send({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'User account is inactive'
      }
    });
  }

  if (!hasRole(user, 'admin')) {
    return reply.status(403).send({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required'
      }
    });
  }

  // Attach full user object to request for use in handlers
  (request as any).currentUser = user;
}
