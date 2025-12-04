/**
 * Assessment Plan Handlers
 * HTTP handlers for team-based assessment plan operations
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  listPlansByTeam,
  getPlanByTeamAndSeason,
  createOrUpdatePlan,
} from '../services/assessment-plan-service';
import type {
  AssessmentPlan,
  CreateAssessmentPlanInput,
  ListPlansQuery,
} from '../types/assessments';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * GET /growth/teams/:teamId/plans
 * List all assessment plans for a team
 */
export async function listPlansHandler(
  request: FastifyRequest<{
    Params: { teamId: string };
    Querystring: ListPlansQuery;
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { teamId } = request.params;
    const { includeInactive } = request.query;

    const plans = await listPlansByTeam(teamId, {
      includeInactive: includeInactive === 'true' || includeInactive === true,
    });

    return reply.status(200).send({
      success: true,
      data: { plans, total: plans.length },
    } as ApiResponse<{ plans: AssessmentPlan[]; total: number }>);
  } catch (error: any) {
    console.error('Error listing plans:', error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list assessment plans',
      },
    } as ApiResponse<never>);
  }
}

/**
 * GET /growth/teams/:teamId/plan/:season
 * Get a specific assessment plan by team and season
 */
export async function getPlanHandler(
  request: FastifyRequest<{
    Params: { teamId: string; season: string };
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { teamId, season } = request.params;

    const plan = await getPlanByTeamAndSeason(teamId, season);

    if (!plan) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'PLAN_NOT_FOUND',
          message: `Assessment plan for team '${teamId}' and season '${season}' not found`,
        },
      } as ApiResponse<never>);
    }

    return reply.status(200).send({
      success: true,
      data: plan,
    } as ApiResponse<AssessmentPlan>);
  } catch (error: any) {
    console.error('Error fetching plan:', error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch assessment plan',
      },
    } as ApiResponse<never>);
  }
}

/**
 * PUT /growth/teams/:teamId/plans
 * Create or update an assessment plan for a team
 */
export async function createOrUpdatePlanHandler(
  request: FastifyRequest<{
    Params: { teamId: string };
    Body: CreateAssessmentPlanInput;
  }>,
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

    const { teamId } = request.params;
    const plan = await createOrUpdatePlan(teamId, request.body, userEmail);

    return reply.status(200).send({
      success: true,
      data: plan,
    } as ApiResponse<AssessmentPlan>);
  } catch (error: any) {
    // Handle validation errors
    if (error.message.includes('INVALID_SEASON')) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'INVALID_SEASON',
          message: error.message.split(': ')[1] || error.message,
        },
      } as ApiResponse<never>);
    }

    if (error.message.includes('INVALID_PLAN_CONFIG')) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'INVALID_PLAN_CONFIG',
          message: error.message.split(': ')[1] || error.message,
        },
      } as ApiResponse<never>);
    }

    if (error.message.includes('TEAM_NOT_FOUND')) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'TEAM_NOT_FOUND',
          message: error.message.split(': ')[1] || error.message,
        },
      } as ApiResponse<never>);
    }

    // Generic error
    console.error('Error creating/updating plan:', error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create or update assessment plan',
      },
    } as ApiResponse<never>);
  }
}
