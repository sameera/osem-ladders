/**
 * Assessment Plan Service
 * Handles CRUD operations for team-based assessment plans
 */

import { GetCommand, QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TableNames } from '../utils/dynamodb-client';
import type { AssessmentPlan, CreateAssessmentPlanInput, Category } from '../types/assessments';

// Season validation removed - any string is acceptable as season identifier

/**
 * Validate plan configuration structure
 */
export function validatePlanConfig(planConfig: Category[]): void {
  if (!Array.isArray(planConfig) || planConfig.length === 0) {
    throw new Error(
      'INVALID_PLAN_CONFIG: planConfig must be a non-empty array of categories'
    );
  }

  // Validate each category has required fields
  for (const category of planConfig) {
    if (!category.title || !Array.isArray(category.competencies)) {
      throw new Error(
        'INVALID_PLAN_CONFIG: Each category must have a title and competencies array'
      );
    }

    if (category.competencies.length === 0) {
      throw new Error(
        'INVALID_PLAN_CONFIG: Each category must have at least one competency'
      );
    }

    // Validate each competency
    for (const competency of category.competencies) {
      if (!competency.name || !Array.isArray(competency.levels)) {
        throw new Error(
          'INVALID_PLAN_CONFIG: Each competency must have a name and levels array'
        );
      }

      if (competency.levels.length === 0) {
        throw new Error(
          'INVALID_PLAN_CONFIG: Each competency must have at least one expectation'
        );
      }

      // Validate each expectation
      for (const expectation of competency.levels) {
        if (
          typeof expectation.level !== 'number' ||
          !expectation.title ||
          !expectation.content
        ) {
          throw new Error(
            'INVALID_PLAN_CONFIG: Each expectation must have a level number, title, and content'
          );
        }
      }
    }
  }
}

/**
 * List all assessment plans for a team
 */
export async function listPlansByTeam(
  teamId: string,
  options?: { includeInactive?: boolean }
): Promise<AssessmentPlan[]> {
  const { includeInactive = false } = options || {};

  const result = await docClient.send(
    new QueryCommand({
      TableName: TableNames.AssessmentPlans,
      KeyConditionExpression: 'teamId = :teamId',
      FilterExpression: includeInactive ? undefined : 'isActive = :active',
      ExpressionAttributeValues: {
        ':teamId': teamId,
        ...(includeInactive ? {} : { ':active': true }),
      },
    })
  );

  return (result.Items || []) as AssessmentPlan[];
}

/**
 * Get a specific assessment plan by team and season
 */
export async function getPlanByTeamAndSeason(
  teamId: string,
  season: string
): Promise<AssessmentPlan | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TableNames.AssessmentPlans,
      Key: { teamId, season },
    })
  );

  return result.Item ? (result.Item as AssessmentPlan) : null;
}

/**
 * Create or update an assessment plan for a team
 * Upsert behavior: creates if doesn't exist, updates if exists
 */
export async function createOrUpdatePlan(
  teamId: string,
  input: CreateAssessmentPlanInput,
  userId: string
): Promise<AssessmentPlan> {
  // Validate inputs
  validatePlanConfig(input.planConfig);

  // Check if plan already exists
  const existing = await getPlanByTeamAndSeason(teamId, input.season);
  const now = Date.now();

  const plan: AssessmentPlan = {
    teamId,
    season: input.season,
    name: input.name,
    planConfig: input.planConfig,
    description: input.description,
    isActive: true,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    createdBy: existing?.createdBy || userId,
  };

  await docClient.send(
    new PutCommand({
      TableName: TableNames.AssessmentPlans,
      Item: plan,
    })
  );

  return plan;
}
