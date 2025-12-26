import type { FastifyRequest, FastifyReply } from "fastify";
import { errors } from "../../utils/lambda-response.js";
import { getTeamById } from "../../services/team-service.js";
import type { Team, ApiResponse } from "../../types/index.js";

/**
 * Get team by ID (non-admin endpoint)
 *
 * Path: GET /growth/teams/:teamId
 * Auth: Team members, managers, or admins (via requireTeamMemberOrManagerOrAdmin middleware)
 *
 * @returns Basic team info (id, name, managerId, isActive) or 404 if not found
 */
export async function getTeamHandler(
    request: FastifyRequest<{ Params: { teamId: string } }>,
    reply: FastifyReply
): Promise<void> {
    try {
        const { teamId } = request.params;

        if (!teamId) {
            const errorResponse: ApiResponse = {
                success: false,
                error: errors.badRequest("Team ID is required"),
            };
            return reply.status(400).send(errorResponse);
        }

        // Fetch team using service
        const team = await getTeamById(teamId);

        if (!team) {
            const errorResponse: ApiResponse = {
                success: false,
                error: errors.notFound("Team", teamId),
            };
            return reply.status(404).send(errorResponse);
        }

        // Return 404 for inactive teams (don't leak team existence)
        if (!team.isActive) {
            const errorResponse: ApiResponse = {
                success: false,
                error: errors.notFound("Team", teamId),
            };
            return reply.status(404).send(errorResponse);
        }

        // Return basic team info
        const successResponse: ApiResponse<Team> = {
            success: true,
            data: team,
        };

        return reply.status(200).send(successResponse);
    } catch (error) {
        request.log.error({ error, teamId: request.params.teamId }, "Error fetching team");
        const errorResponse: ApiResponse = {
            success: false,
            error: errors.internal("Failed to fetch team"),
        };
        return reply.status(500).send(errorResponse);
    }
}
