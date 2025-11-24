/**
 * Admin User Management Handlers
 * Fastify route handlers for /admin/users endpoints
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type {
  CreateUserRequest,
  UpdateUserRolesRequest,
  ListUsersQuery,
  UserResponse,
  GetUserResponse,
  ListUsersResponse,
  DeactivateUserResponse
} from '../types/users.js';
import * as userService from '../services/user-service.js';

/**
 * Helper: Extract current user email from request
 */
function getCurrentUserEmail(request: FastifyRequest): string {
  return request.user?.email || 'system';
}

/**
 * POST /admin/users
 * Create a new user
 */
export async function createUserHandler(
  request: FastifyRequest<{ Body: CreateUserRequest }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const createdBy = getCurrentUserEmail(request);
    const user = await userService.createUser(request.body, createdBy);

    const response: UserResponse = { user };
    return reply.status(201).send(response);
  } catch (error: any) {
    request.log.error({ error, body: request.body }, 'Error creating user');

    if (error.message?.startsWith('USER_EXISTS')) {
      return reply.status(409).send({
        error: 'USER_EXISTS',
        message: 'User with this email already exists'
      });
    }

    if (error.message?.startsWith('INVALID_EMAIL')) {
      return reply.status(400).send({
        error: 'INVALID_EMAIL',
        message: 'Email address format is invalid'
      });
    }

    if (error.message?.startsWith('INVALID_NAME')) {
      return reply.status(400).send({
        error: 'INVALID_NAME',
        message: 'Name cannot be empty'
      });
    }

    if (error.message?.startsWith('INVALID_ROLE')) {
      return reply.status(400).send({
        error: 'INVALID_ROLE',
        message: 'Role must be "manager" or "admin"'
      });
    }

    return reply.status(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * GET /admin/users/:userId
 * Get user by ID
 */
export async function getUserHandler(
  request: FastifyRequest<{ Params: { userId: string } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const user = await userService.getUserById(request.params.userId);

    if (!user) {
      return reply.status(404).send({
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    const response: GetUserResponse = { user };
    return reply.status(200).send(response);
  } catch (error: any) {
    request.log.error({ error, userId: request.params.userId }, 'Error fetching user');
    return reply.status(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * GET /admin/users
 * List all users with pagination and search
 */
export async function listUsersHandler(
  request: FastifyRequest<{ Querystring: ListUsersQuery }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const result = await userService.listUsers(request.query);
    return reply.status(200).send(result);
  } catch (error: any) {
    request.log.error({ error, query: request.query }, 'Error listing users');
    return reply.status(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * PATCH /admin/users/:userId
 * Update user roles
 */
export async function updateUserRolesHandler(
  request: FastifyRequest<{ Params: { userId: string }; Body: UpdateUserRolesRequest }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const updatedBy = getCurrentUserEmail(request);
    const user = await userService.updateUserRoles(
      request.params.userId,
      request.body,
      updatedBy
    );

    const response: UserResponse = { user };
    return reply.status(200).send(response);
  } catch (error: any) {
    request.log.error(
      { error, userId: request.params.userId, body: request.body },
      'Error updating user roles'
    );

    if (error.message?.startsWith('USER_NOT_FOUND')) {
      return reply.status(404).send({
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    if (error.message?.startsWith('INVALID_ROLE')) {
      return reply.status(400).send({
        error: 'INVALID_ROLE',
        message: 'Role must be "manager" or "admin"'
      });
    }

    return reply.status(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * DELETE /admin/users/:userId
 * Deactivate user (soft delete)
 */
export async function deactivateUserHandler(
  request: FastifyRequest<{ Params: { userId: string } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const adminUserId = getCurrentUserEmail(request);
    const result = await userService.deactivateUser(request.params.userId, adminUserId);

    const response: DeactivateUserResponse = result;
    return reply.status(200).send(response);
  } catch (error: any) {
    request.log.error(
      { error, userId: request.params.userId },
      'Error deactivating user'
    );

    if (error.message?.startsWith('USER_NOT_FOUND')) {
      return reply.status(404).send({
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    if (error.message?.startsWith('SELF_DEACTIVATION')) {
      return reply.status(400).send({
        error: 'SELF_DEACTIVATION',
        message: 'Cannot deactivate your own account'
      });
    }

    if (error.message?.startsWith('ALREADY_INACTIVE')) {
      return reply.status(400).send({
        error: 'ALREADY_INACTIVE',
        message: 'User is already deactivated'
      });
    }

    if (error.message?.startsWith('USER_IS_MANAGER')) {
      return reply.status(400).send({
        error: 'USER_IS_MANAGER',
        message: error.message.split(': ')[1] || 'User is manager of team(s). Reassign teams before deactivating.'
      });
    }

    return reply.status(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    });
  }
}
