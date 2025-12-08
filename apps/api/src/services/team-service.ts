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
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import {
    Team,
    TeamWithDetails,
    CreateTeamRequest,
    UpdateTeamRequest,
    TEAM_ID_REGEX,
    MIN_TEAM_NAME_LENGTH,
    MAX_TEAM_NAME_LENGTH,
} from "../types/teams";
import { TableNames } from "../utils/dynamodb-client";

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1",
});

/**
 * Validation helpers
 */
function validateTeamId(teamId: string): void {
    if (!TEAM_ID_REGEX.test(teamId)) {
        throw new Error(
            "INVALID_TEAM_ID: Team ID must be 2-50 characters, lowercase alphanumeric and hyphens only"
        );
    }
}

function validateTeamName(name: string): void {
    if (
        name.length < MIN_TEAM_NAME_LENGTH ||
        name.length > MAX_TEAM_NAME_LENGTH
    ) {
        throw new Error(
            `INVALID_TEAM_NAME: Team name must be between ${MIN_TEAM_NAME_LENGTH} and ${MAX_TEAM_NAME_LENGTH} characters`
        );
    }
}

/**
 * Validate manager exists, has manager role, and is active
 * Reusable for both creation and update operations
 * @throws Error with codes: MANAGER_NOT_FOUND, INVALID_MANAGER_ROLE, MANAGER_DEACTIVATED
 */
async function validateManager(managerId: string): Promise<void> {
    const managerResult = await client.send(
        new GetItemCommand({
            TableName: TableNames.Users,
            Key: marshall({ userId: managerId }),
        })
    );

    if (!managerResult.Item) {
        throw new Error(`MANAGER_NOT_FOUND: User '${managerId}' not found`);
    }

    const manager = unmarshall(managerResult.Item);

    if (!manager.roles || !manager.roles.includes("manager")) {
        throw new Error(
            `INVALID_MANAGER_ROLE: User '${managerId}' does not have manager role`
        );
    }

    if (!manager.isActive) {
        throw new Error(
            `MANAGER_DEACTIVATED: User '${managerId}' is deactivated and cannot be assigned as manager`
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

    // Validate manager exists, has role, and is active
    await validateManager(request.managerId);

    // Check for duplicate teamId
    const existing = await client.send(
        new GetItemCommand({
            TableName: TableNames.Teams,
            Key: marshall({ id: request.teamId }),
        })
    );

    if (existing.Item) {
        throw new Error(
            `TEAM_EXISTS: A team with ID '${request.teamId}' already exists`
        );
    }

    // Create team entity
    const now = Date.now();
    const team: Team = {
        id: request.teamId,
        name: request.name,
        managerId: request.managerId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        createdBy,
    };

    // Store in DynamoDB
    await client.send(
        new PutItemCommand({
            TableName: TableNames.Teams,
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
            TableName: TableNames.Teams,
            Key: marshall({ id: teamId }),
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
                TableName: TableNames.Teams,
                IndexName: "managerId-name-index",
                KeyConditionExpression: "managerId = :managerId",
                FilterExpression: includeArchived
                    ? undefined
                    : "isActive = :active",
                ExpressionAttributeValues: marshall({
                    ":managerId": managerId,
                    ...(includeArchived ? {} : { ":active": true }),
                }),
            })
        );

        const teams =
            result.Items?.map((item) => unmarshall(item) as Team) || [];

        // Apply search filter if provided
        if (search) {
            const searchLower = search.toLowerCase();
            return teams.filter(
                (team) =>
                    team.id.toLowerCase().includes(searchLower) ||
                    team.name.toLowerCase().includes(searchLower)
            );
        }

        return teams;
    }

    // Otherwise, scan all teams
    const result = await client.send(
        new ScanCommand({
            TableName: TableNames.Teams,
            FilterExpression: includeArchived
                ? undefined
                : "isActive = :active",
            ExpressionAttributeValues: includeArchived
                ? undefined
                : marshall({ ":active": true }),
        })
    );

    let teams = result.Items?.map((item) => unmarshall(item) as Team) || [];

    // Apply search filter if provided
    if (search) {
        const searchLower = search.toLowerCase();
        teams = teams.filter(
            (team) =>
                team.id.toLowerCase().includes(searchLower) ||
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
            TableName: TableNames.Users,
            FilterExpression: "team = :teamId AND isActive = :active",
            ExpressionAttributeValues: marshall({
                ":teamId": teamId,
                ":active": true,
            }),
            Select: "COUNT",
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
            TableName: TableNames.Users,
            FilterExpression: "team = :teamId AND isActive = :active",
            ExpressionAttributeValues: marshall({
                ":teamId": teamId,
                ":active": true,
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
    const memberCount = await getTeamMemberCount(team.id);

    // Get manager name if managerId is set
    let managerName: string | null = null;
    if (team.managerId) {
        const managerResult = await client.send(
            new GetItemCommand({
                TableName: TableNames.Users,
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
 * Update team details (Phase 1: name only)
 * Team ID is immutable and cannot be changed
 */
export async function updateTeam(
    teamId: string,
    request: UpdateTeamRequest
): Promise<Team> {
    // Check if team exists
    const team = await getTeamById(teamId);
    if (!team) {
        throw new Error(`TEAM_NOT_FOUND: Team '${teamId}' not found`);
    }

    // Validate team name
    validateTeamName(request.name);

    // Update team with new name
    const now = Date.now();
    const result = await client.send(
        new UpdateItemCommand({
            TableName: TableNames.Teams,
            Key: marshall({ id: teamId }),
            UpdateExpression: "SET #name = :name, updatedAt = :updatedAt",
            ExpressionAttributeNames: {
                "#name": "name", // Use attribute name placeholder to avoid reserved keyword issues
            },
            ExpressionAttributeValues: marshall({
                ":name": request.name.trim(),
                ":updatedAt": now,
            }),
            ReturnValues: "ALL_NEW",
        })
    );

    if (!result.Attributes) {
        throw new Error("Failed to update team");
    }

    return unmarshall(result.Attributes) as Team;
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
        await validateManager(managerId);
    }

    // Update team with new managerId
    const now = Date.now();
    const result = await client.send(
        new UpdateItemCommand({
            TableName: TableNames.Teams,
            Key: marshall({ id: teamId }),
            UpdateExpression:
                "SET managerId = :managerId, updatedAt = :updatedAt",
            ExpressionAttributeValues: marshall({
                ":managerId": managerId,
                ":updatedAt": now,
            }),
            ReturnValues: "ALL_NEW",
        })
    );

    if (!result.Attributes) {
        throw new Error("Failed to update team manager");
    }

    return unmarshall(result.Attributes) as Team;
}

/**
 * Add members to a team
 * Updates the team field for multiple users
 */
export async function addMembersToTeam(
    teamId: string,
    userIds: string[]
): Promise<void> {
    // Check if team exists
    const team = await getTeamById(teamId);
    if (!team) {
        throw new Error(`TEAM_NOT_FOUND: Team '${teamId}' not found`);
    }

    // Validate all users exist and are active, then update them
    const now = Date.now();
    for (const userId of userIds) {
        const userResult = await client.send(
            new GetItemCommand({
                TableName: TableNames.Users,
                Key: marshall({ userId }),
            })
        );

        if (!userResult.Item) {
            throw new Error(`USER_NOT_FOUND: User '${userId}' not found`);
        }

        const user = unmarshall(userResult.Item);
        if (!user.isActive) {
            throw new Error(
                `USER_DEACTIVATED: User '${userId}' is deactivated and cannot be added to team`
            );
        }

        // Update user's team field
        await client.send(
            new UpdateItemCommand({
                TableName: TableNames.Users,
                Key: marshall({ userId }),
                UpdateExpression: "SET team = :team, updatedAt = :updatedAt",
                ExpressionAttributeValues: marshall({
                    ":team": teamId,
                    ":updatedAt": now,
                }),
            })
        );
    }
}

/**
 * Remove a member from a team
 * Sets the team field to null for the user
 */
export async function removeMemberFromTeam(
    teamId: string,
    userId: string
): Promise<void> {
    // Check if team exists
    const team = await getTeamById(teamId);
    if (!team) {
        throw new Error(`TEAM_NOT_FOUND: Team '${teamId}' not found`);
    }

    // Check if user exists
    const userResult = await client.send(
        new GetItemCommand({
            TableName: TableNames.Users,
            Key: marshall({ userId }),
        })
    );

    if (!userResult.Item) {
        throw new Error(`USER_NOT_FOUND: User '${userId}' not found`);
    }

    const user = unmarshall(userResult.Item);

    // Prevent removing the team manager
    if (team.managerId === userId) {
        throw new Error(
            `MANAGER_IS_MEMBER: Cannot remove team manager from the team. Change the manager first.`
        );
    }

    // Check if user is actually a member of this team
    if (user.team !== teamId) {
        throw new Error(
            `USER_NOT_IN_TEAM: User '${userId}' is not a member of team '${teamId}'`
        );
    }

    // Update user's team field to null
    const now = Date.now();
    await client.send(
        new UpdateItemCommand({
            TableName: TableNames.Users,
            Key: marshall({ userId }),
            UpdateExpression: "SET team = :team, updatedAt = :updatedAt",
            ExpressionAttributeValues: marshall({
                ":team": null,
                ":updatedAt": now,
            }),
        })
    );
}
