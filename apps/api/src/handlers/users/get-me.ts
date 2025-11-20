import type { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TableNames } from "../../utils/dynamodb-client.js";
import { errors } from "../../utils/lambda-response.js";
import type { User, ApiResponse } from "../../types/index.js";

/**
 * Get current authenticated user's profile
 *
 * Path: GET /users/me
 *
 * @returns Current user object or 404 if not found
 */
export const getMeHandler: RouteHandler = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userEmail = request.user?.email;

        if (!userEmail) {
            const errorResponse: ApiResponse = {
                success: false,
                error: errors.unauthorized("No authenticated user found"),
            };
            return reply.status(401).send(errorResponse);
        }

        const result = await docClient.send(
            new GetCommand({
                TableName: TableNames.Users,
                Key: { userId: userEmail },
            })
        );

        if (!result.Item) {
            const errorResponse: ApiResponse = {
                success: false,
                error: errors.notFound("User", userEmail),
            };
            return reply.status(404).send(errorResponse);
        }

        const user = result.Item as User;

        // Check if user is active
        if (!user.isActive) {
            const errorResponse: ApiResponse = {
                success: false,
                error: errors.forbidden("User account is inactive"),
            };
            return reply.status(403).send(errorResponse);
        }

        // Convert roles Set to Array for JSON serialization
        const userResponse = {
            ...user,
            roles: Array.from(user.roles),
        };

        const successResponse: ApiResponse<typeof userResponse> = {
            success: true,
            data: userResponse,
        };

        return reply.status(200).send(successResponse);
    } catch (error) {
        request.log.error({ error }, "Error fetching current user");
        const errorResponse: ApiResponse = {
            success: false,
            error: errors.internal("Failed to fetch user profile"),
        };
        return reply.status(500).send(errorResponse);
    }
};
