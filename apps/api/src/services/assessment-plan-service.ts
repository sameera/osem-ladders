/**
 * Assessment Plan Service
 * Handles CRUD operations for team-based assessment plans
 */

import { GetCommand, QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TableNames } from '../utils/dynamodb-client';
import type { AssessmentPlan, CreateAssessmentPlanInput, Category } from '../types/assessments';

/**
 * Season validation regex
 * Supports formats: YYYY-Q1 to Q4, YYYY-H1 to H2, YYYY-Annual
 */
const SEASON_REGEX = /^(20\d{2})-(Q[1-4]|H[1-2]|Annual)$/;

/**
 * Validate season format
 */
export function validateSeason(season: string): void {
  if (!SEASON_REGEX.test(season)) {
    throw new Error(
      'INVALID_SEASON: Season must match format YYYY-Q1, YYYY-H1, or YYYY-Annual'
    );
  }
}

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
    if (!category.name || !Array.isArray(category.competencies)) {
      throw new Error(
        'INVALID_PLAN_CONFIG: Each category must have a name and competencies array'
      );
    }

    // Validate each competency
    for (const competency of category.competencies) {
      if (!competency.name || !Array.isArray(competency.levels)) {
        throw new Error(
          'INVALID_PLAN_CONFIG: Each competency must have a name and levels array'
        );
      }

      // Validate each level
      for (const level of competency.levels) {
        if (
          typeof level.level !== 'number' ||
          !level.title ||
          !level.description
        ) {
          throw new Error(
            'INVALID_PLAN_CONFIG: Each level must have a level number, title, and description'
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
  validateSeason(input.season);
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
