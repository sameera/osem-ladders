/**
 * Team Service
 * Handles CRUD operations for team management
 */

import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  ScanCommand,
  UpdateItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import {
  Team,
  TeamWithDetails,
  CreateTeamRequest,
  TEAM_ID_REGEX,
  MIN_TEAM_NAME_LENGTH,
  MAX_TEAM_NAME_LENGTH,
} from '../types/teams';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const TEAMS_TABLE = process.env.DYNAMODB_TEAMS_TABLE || 'Teams';
const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE || 'Users';

/**
 * Validation helpers
 */
function validateTeamId(teamId: string): void {
  if (!TEAM_ID_REGEX.test(teamId)) {
    throw new Error(
      'INVALID_TEAM_ID: Team ID must be 2-50 characters, lowercase alphanumeric and hyphens only'
    );
  }
}

function validateTeamName(name: string): void {
  if (name.length < MIN_TEAM_NAME_LENGTH || name.length > MAX_TEAM_NAME_LENGTH) {
    throw new Error(
      `INVALID_TEAM_NAME: Team name must be between ${MIN_TEAM_NAME_LENGTH} and ${MAX_TEAM_NAME_LENGTH} characters`
    );
  }
}

/**
 * T005: Create a new team with validation
 */
export async function createTeam(
  request: CreateTeamRequest,
  createdBy: string
): Promise<Team> {
  // Validate inputs
  validateTeamId(request.teamId);
  validateTeamName(request.name);

  // Check for duplicate teamId
  const existing = await client.send(
    new GetItemCommand({
      TableName: TEAMS_TABLE,
      Key: marshall({ teamId: request.teamId }),
    })
  );

  if (existing.Item) {
    throw new Error(`TEAM_EXISTS: A team with ID '${request.teamId}' already exists`);
  }

  // Create team entity
  const now = Date.now();
  const team: Team = {
    teamId: request.teamId,
    name: request.name,
    managerId: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    createdBy,
  };

  // Store in DynamoDB
  await client.send(
    new PutItemCommand({
      TableName: TEAMS_TABLE,
      Item: marshall(team),
    })
  );

  return team;
}

/**
 * T006: Get team by ID
 */
export async function getTeamById(teamId: string): Promise<Team | null> {
  const result = await client.send(
    new GetItemCommand({
      TableName: TEAMS_TABLE,
      Key: marshall({ teamId }),
    })
  );

  if (!result.Item) {
    return null;
  }

  return unmarshall(result.Item) as Team;
}

/**
 * T007: List teams with search and filter support
 */
export async function listTeams(options?: {
  search?: string;
  includeArchived?: boolean;
  managerId?: string;
}): Promise<Team[]> {
  const { search, includeArchived = false, managerId } = options || {};

  // If filtering by managerId, use GSI
  if (managerId) {
    const result = await client.send(
      new QueryCommand({
        TableName: TEAMS_TABLE,
        IndexName: 'managerId-index',
        KeyConditionExpression: 'managerId = :managerId',
        FilterExpression: includeArchived ? undefined : 'isActive = :active',
        ExpressionAttributeValues: marshall({
          ':managerId': managerId,
          ...(includeArchived ? {} : { ':active': true }),
        }),
      })
    );

    const teams = result.Items?.map((item) => unmarshall(item) as Team) || [];

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      return teams.filter(
        (team) =>
          team.teamId.toLowerCase().includes(searchLower) ||
          team.name.toLowerCase().includes(searchLower)
      );
    }

    return teams;
  }

  // Otherwise, scan all teams
  const result = await client.send(
    new ScanCommand({
      TableName: TEAMS_TABLE,
      FilterExpression: includeArchived ? undefined : 'isActive = :active',
      ExpressionAttributeValues: includeArchived ? undefined : marshall({ ':active': true }),
    })
  );

  let teams = result.Items?.map((item) => unmarshall(item) as Team) || [];

  // Apply search filter if provided
  if (search) {
    const searchLower = search.toLowerCase();
    teams = teams.filter(
      (team) =>
        team.teamId.toLowerCase().includes(searchLower) ||
        team.name.toLowerCase().includes(searchLower)
    );
  }

  return teams;
}

/**
 * T030: Get count of active members for a team
 */
export async function getTeamMemberCount(teamId: string): Promise<number> {
  const result = await client.send(
    new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'team = :teamId AND isActive = :active',
      ExpressionAttributeValues: marshall({
        ':teamId': teamId,
        ':active': true,
      }),
      Select: 'COUNT',
    })
  );

  return result.Count || 0;
}

/**
 * T031: Get all active members for a team
 */
export async function getTeamMembers(teamId: string): Promise<any[]> {
  const result = await client.send(
    new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'team = :teamId AND isActive = :active',
      ExpressionAttributeValues: marshall({
        ':teamId': teamId,
        ':active': true,
      }),
    })
  );

  return result.Items?.map((item) => unmarshall(item)) || [];
}

/**
 * T032: Helper to enrich a team with calculated details
 */
async function enrichTeamWithDetails(team: Team): Promise<TeamWithDetails> {
  // Get member count
  const memberCount = await getTeamMemberCount(team.teamId);

  // Get manager name if managerId is set
  let managerName: string | null = null;
  if (team.managerId) {
    const managerResult = await client.send(
      new GetItemCommand({
        TableName: USERS_TABLE,
        Key: marshall({ userId: team.managerId }),
      })
    );

    if (managerResult.Item) {
      const manager = unmarshall(managerResult.Item);
      managerName = manager.name || null;
    }
  }

  return {
    ...team,
    memberCount,
    managerName,
    activeAssessment: null, // Will be implemented in later phase
  };
}

/**
 * T032: List teams with calculated details (member count, manager name)
 */
export async function listTeamsWithDetails(options?: {
  search?: string;
  includeArchived?: boolean;
  managerId?: string;
}): Promise<TeamWithDetails[]> {
  const teams = await listTeams(options);

  // Enrich each team with details in parallel
  const teamsWithDetails = await Promise.all(
    teams.map((team) => enrichTeamWithDetails(team))
  );

  return teamsWithDetails;
}

/**
 * T043: Update team manager with validation
 */
export async function updateTeamManager(
  teamId: string,
  managerId: string | null
): Promise<Team> {
  // Check if team exists
  const team = await getTeamById(teamId);
  if (!team) {
    throw new Error(`TEAM_NOT_FOUND: Team '${teamId}' not found`);
  }

  // If managerId is provided (not null), validate the manager
  if (managerId) {
    const managerResult = await client.send(
      new GetItemCommand({
        TableName: USERS_TABLE,
        Key: marshall({ userId: managerId }),
      })
    );

    if (!managerResult.Item) {
      throw new Error(`MANAGER_NOT_FOUND: User '${managerId}' not found`);
    }

    const manager = unmarshall(managerResult.Item);

    // T050: Validate manager has "manager" role
    if (!manager.roles || !manager.roles.includes('manager')) {
      throw new Error(
        `INVALID_MANAGER_ROLE: User '${managerId}' does not have manager role`
      );
    }

    // T051: Validate manager is active (per SC-008)
    if (!manager.isActive) {
      throw new Error(
        `MANAGER_DEACTIVATED: User '${managerId}' is deactivated and cannot be assigned as manager`
      );
    }
  }

  // Update team with new managerId
  const now = Date.now();
  const result = await client.send(
    new UpdateItemCommand({
      TableName: TEAMS_TABLE,
      Key: marshall({ teamId }),
      UpdateExpression: 'SET managerId = :managerId, updatedAt = :updatedAt',
      ExpressionAttributeValues: marshall({
        ':managerId': managerId,
        ':updatedAt': now,
      }),
      ReturnValues: 'ALL_NEW',
    })
  );

  if (!result.Attributes) {
    throw new Error('Failed to update team manager');
  }

  return unmarshall(result.Attributes) as Team;
}
