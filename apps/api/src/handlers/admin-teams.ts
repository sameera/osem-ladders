/**
 * Admin Team Management Handlers
 * HTTP handlers for team CRUD operations
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  createTeam,
  getTeamById,
  listTeamsWithDetails,
  updateTeamManager,
} from '../services/team-service';
import type {
  CreateTeamRequest,
  AssignManagerRequest,
  Team,
  TeamWithDetails,
  ListTeamsQuery,
  ApiResponse,
  TeamErrorCode,
} from '../types/teams';

/**
 * T008: Create team handler
 * POST /growth/admin/teams
 */
export async function createTeamHandler(
  request: FastifyRequest<{ Body: CreateTeamRequest }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const userEmail = request.user?.email;
    if (!userEmail) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      } as ApiResponse<never>);
    }

    const team = await createTeam(request.body, userEmail);

    return reply.status(201).send({
      success: true,
      data: team,
    } as ApiResponse<Team>);
  } catch (error: any) {
    // Parse error codes
    if (error.message.includes('TEAM_EXISTS')) {
      return reply.status(409).send({
        success: false,
        error: {
          code: 'TEAM_EXISTS',
          message: error.message.split(': ')[1] || error.message,
        },
      } as ApiResponse<never>);
    }

    if (error.message.includes('INVALID_TEAM_ID') || error.message.includes('INVALID_TEAM_NAME')) {
      const code = error.message.split(':')[0];
      return reply.status(400).send({
        success: false,
        error: {
          code,
          message: error.message.split(': ')[1] || error.message,
        },
      } as ApiResponse<never>);
    }

    // Generic error
    console.error('Error creating team:', error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create team',
      },
    } as ApiResponse<never>);
  }
}

/**
 * T009: Get team handler
 * GET /growth/admin/teams/:teamId
 */
export async function getTeamHandler(
  request: FastifyRequest<{ Params: { teamId: string } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { teamId } = request.params;
    const team = await getTeamById(teamId);

    if (!team) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'TEAM_NOT_FOUND',
          message: `Team '${teamId}' not found`,
        },
      } as ApiResponse<never>);
    }

    return reply.status(200).send({
      success: true,
      data: team,
    } as ApiResponse<Team>);
  } catch (error: any) {
    console.error('Error fetching team:', error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch team',
      },
    } as ApiResponse<never>);
  }
}

/**
 * T010/T033: List teams handler with details
 * GET /growth/admin/teams
 */
export async function listTeamsHandler(
  request: FastifyRequest<{ Querystring: ListTeamsQuery }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { search, includeArchived, managerId } = request.query;

    const teams = await listTeamsWithDetails({
      search,
      includeArchived: includeArchived === 'true' || includeArchived === true,
      managerId,
    });

    return reply.status(200).send({
      success: true,
      data: {
        teams,
        total: teams.length,
      },
    } as ApiResponse<{ teams: TeamWithDetails[]; total: number }>);
  } catch (error: any) {
    console.error('Error listing teams:', error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list teams',
      },
    } as ApiResponse<never>);
  }
}

/**
 * T044: Update team manager handler
 * PATCH /growth/admin/teams/:teamId/manager
 */
export async function updateManagerHandler(
  request: FastifyRequest<{
    Params: { teamId: string };
    Body: AssignManagerRequest;
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { teamId } = request.params;
    const { managerId } = request.body;

    const team = await updateTeamManager(teamId, managerId);

    return reply.status(200).send({
      success: true,
      data: team,
    } as ApiResponse<Team>);
  } catch (error: any) {
    // Parse error codes
    if (error.message.includes('TEAM_NOT_FOUND')) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'TEAM_NOT_FOUND',
          message: error.message.split(': ')[1] || error.message,
        },
      } as ApiResponse<never>);
    }

    if (error.message.includes('MANAGER_NOT_FOUND')) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'MANAGER_NOT_FOUND',
          message: error.message.split(': ')[1] || error.message,
        },
      } as ApiResponse<never>);
    }

    // T050: Handle INVALID_MANAGER_ROLE error
    if (error.message.includes('INVALID_MANAGER_ROLE')) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'INVALID_MANAGER_ROLE',
          message: error.message.split(': ')[1] || error.message,
        },
      } as ApiResponse<never>);
    }

    // T051: Handle MANAGER_DEACTIVATED error (per SC-008)
    if (error.message.includes('MANAGER_DEACTIVATED')) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'MANAGER_DEACTIVATED',
          message: error.message.split(': ')[1] || error.message,
        },
      } as ApiResponse<never>);
    }

    // Generic error
    console.error('Error updating team manager:', error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update team manager',
      },
    } as ApiResponse<never>);
  }
}
