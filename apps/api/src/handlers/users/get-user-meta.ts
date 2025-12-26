import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TableNames } from "../../utils/dynamodb-client.js";
import { errors } from "../../utils/lambda-response.js";
import type { User, UserMeta, ApiResponse } from "../../types/index.js";

/**
 * Get user metadata by userId
 *
 * Path: GET /users/:userId
 * Auth: Authenticated users (no admin required)
 *
 * @returns User metadata (subset of User fields) or 404 if not found
 */
export const getUserMetaHandler: RouteHandler = async (
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
): Promise<void> => {
    try {
        const { userId } = request.params;

        if (!userId) {
            const errorResponse: ApiResponse = {
                success: false,
                error: errors.badRequest("User ID is required"),
            };
            return reply.status(400).send(errorResponse);
        }

        const result = await docClient.send(
            new GetCommand({
                TableName: TableNames.Users,
                Key: { userId: decodeURIComponent(userId) },
            })
        );

        if (!result.Item) {
            const errorResponse: ApiResponse = {
                success: false,
                error: errors.notFound("User", userId),
            };
            return reply.status(404).send(errorResponse);
        }

        const user = result.Item as User;

        // Return 404 for inactive users (don't leak user existence)
        if (!user.isActive) {
            const errorResponse: ApiResponse = {
                success: false,
                error: errors.notFound("User", userId),
            };
            return reply.status(404).send(errorResponse);
        }

        // Return only metadata fields (exclude admin fields)
        const userMeta: UserMeta = {
            userId: user.userId,
            name: user.name,
            roles: Array.from(user.roles),
            isActive: user.isActive,
            team: user.team,
        };

        const successResponse: ApiResponse<{ user: UserMeta }> = {
            success: true,
            data: { user: userMeta },
        };

        return reply.status(200).send(successResponse);
    } catch (error) {
        request.log.error({ error, userId: request.params.userId }, "Error fetching user metadata");
        const errorResponse: ApiResponse = {
            success: false,
            error: errors.internal("Failed to fetch user metadata"),
        };
        return reply.status(500).send(errorResponse);
    }
};
