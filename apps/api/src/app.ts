import Fastify, { type FastifyInstance, type FastifyError } from "fastify";
import cors from "@fastify/cors";
import { getMeHandler } from "./handlers/users/get-me";
import authPlugin from "./plugins/auth";
import { requireAdmin } from "./middleware/auth";
import {
    createUserHandler,
    getUserHandler,
    listUsersHandler,
    updateUserRolesHandler,
    deactivateUserHandler,
} from "./handlers/admin-users";

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

    // Admin-only routes for user management
    app.register(async (adminRoutes) => {
        adminRoutes.addHook("preHandler", requireAdmin);

        adminRoutes.get("/growth/admin/users", listUsersHandler);
        adminRoutes.post("/growth/admin/users", createUserHandler);
        adminRoutes.get("/growth/admin/users/:userId", getUserHandler);
        adminRoutes.patch("/growth/admin/users/:userId", updateUserRolesHandler);
        adminRoutes.delete("/growth/admin/users/:userId", deactivateUserHandler);
    });

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
