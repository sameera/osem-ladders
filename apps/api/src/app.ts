import Fastify, { type FastifyInstance, type FastifyError } from "fastify";
import cors from "@fastify/cors";
import { getMeHandler } from "./handlers/users/get-me";
import { getUserMetaHandler } from "./handlers/users/get-user-meta";
import authPlugin from "./plugins/auth";
import { requireAdmin, requireTeamManagerOrAdmin, requireTeamMemberOrManagerOrAdmin } from "./middleware/auth";
import { getTeamHandler as getTeamMemberHandler } from "./handlers/teams/get-team";
import {
    createUserHandler,
    getUserHandler,
    listUsersHandler,
    updateUserRolesHandler,
    deactivateUserHandler,
} from "./handlers/admin-users";
import {
    createTeamHandler,
    getTeamHandler,
    listTeamsHandler,
    updateTeamHandler,
    updateManagerHandler,
    getTeamMembersHandler,
    addTeamMembersHandler,
    removeTeamMemberHandler,
} from "./handlers/admin-teams";
import {
    listPlansHandler,
    getPlanHandler,
    createOrUpdatePlanHandler,
    togglePlanStatusHandler,
} from "./handlers/assessment-plans";
import {
    getReportHandler,
    createReportHandler,
    updateReportHandler,
    submitReportHandler,
    deleteReportHandler,
    shareReportHandler,
} from "./handlers/assessment-reports";

export function buildApp(disableLogging?: boolean): FastifyInstance {
    const app = Fastify({
        logger: disableLogging ? false : { level: "info" },
    });

    // CORS configuration
    app.register(cors, {
        origin: true, // Reflects the request origin, supports credentials
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    });

    const issuer = process.env.AUTH_ISSUER;
    const audience = process.env.AUTH_AUDIENCE;

    if (!issuer || !audience) {
        throw new Error("Missing required environment variables");
    }

    app.register(authPlugin, {
        issuer,
        audience,
        publicRoutes: ["/growth/health"],
    });

    // Public routes
    app.get("/growth/health", async () => ({ success: true }));

    // User routes
    app.get("/growth/users/me", getMeHandler);
    app.get("/growth/users/:userId", getUserMetaHandler);

    // Team routes (for team members)
    app.get("/growth/teams/:teamId", async (request, reply) => {
        const { teamId } = request.params as { teamId: string };
        await requireTeamMemberOrManagerOrAdmin(teamId)(request, reply);
        if (!reply.sent) {
            return getTeamMemberHandler(request as any, reply);
        }
    });

    // Admin-only routes for user management
    app.register(async (adminRoutes) => {
        adminRoutes.addHook("preHandler", requireAdmin);

        adminRoutes.get("/growth/admin/users", listUsersHandler);
        adminRoutes.post("/growth/admin/users", createUserHandler);
        adminRoutes.get("/growth/admin/users/:userId", getUserHandler);
        adminRoutes.patch(
            "/growth/admin/users/:userId",
            updateUserRolesHandler
        );
        adminRoutes.delete(
            "/growth/admin/users/:userId",
            deactivateUserHandler
        );

        // Team management routes (T011, T045)
        adminRoutes.patch("/growth/admin/teams/:teamId", updateTeamHandler);
        adminRoutes.patch(
            "/growth/admin/teams/:teamId/manager",
            updateManagerHandler
        );
        adminRoutes.get(
            "/growth/admin/teams/:teamId/members",
            getTeamMembersHandler
        );
        adminRoutes.post(
            "/growth/admin/teams/:teamId/members",
            addTeamMembersHandler
        );
        adminRoutes.delete(
            "/growth/admin/teams/:teamId/members/:userId",
            removeTeamMemberHandler
        );
        adminRoutes.get("/growth/admin/teams/:teamId", getTeamHandler);
        adminRoutes.get("/growth/admin/teams", listTeamsHandler);
        adminRoutes.post("/growth/admin/teams", createTeamHandler);
    });

    // Assessment plan routes (team member, manager, or admin access for read; manager or admin for write)
    app.get("/growth/teams/:teamId/plans", async (request, reply) => {
        const { teamId } = request.params as { teamId: string };
        await requireTeamMemberOrManagerOrAdmin(teamId)(request, reply);
        if (!reply.sent) {
            return listPlansHandler(request as any, reply);
        }
    });

    app.get("/growth/teams/:teamId/plan/:season", async (request, reply) => {
        const { teamId } = request.params as { teamId: string };
        await requireTeamMemberOrManagerOrAdmin(teamId)(request, reply);
        if (!reply.sent) {
            return getPlanHandler(request as any, reply);
        }
    });

    app.put("/growth/teams/:teamId/plans", async (request, reply) => {
        const { teamId } = request.params as { teamId: string };
        await requireTeamManagerOrAdmin(teamId)(request, reply);
        if (!reply.sent) {
            return createOrUpdatePlanHandler(request as any, reply);
        }
    });

    app.patch(
        "/growth/teams/:teamId/plan/:season/status",
        async (request, reply) => {
            const { teamId } = request.params as { teamId: string };
            await requireTeamManagerOrAdmin(teamId)(request, reply);
            if (!reply.sent) {
                return togglePlanStatusHandler(request as any, reply);
            }
        }
    );

    // Assessment report routes (authenticated users)
    app.get("/growth/reports/:reportId", getReportHandler);
    app.post("/growth/reports", createReportHandler);
    app.patch("/growth/reports/:reportId", updateReportHandler);
    app.put("/growth/reports/:reportId/submit", submitReportHandler);
    app.delete("/growth/reports/:reportId", deleteReportHandler);
    app.patch("/growth/reports/:reportId/share", shareReportHandler);

    app.setErrorHandler((error: FastifyError, request, reply) => {
        request.log.error(error);
        reply.status(error.statusCode || 500).send({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: error.message || "Internal server error",
            },
        });
    });

    return app;
}
