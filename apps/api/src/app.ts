import Fastify, { type FastifyInstance, type FastifyError } from "fastify";
import cors from "@fastify/cors";
import { getMeHandler } from "./handlers/users/get-me";
import authPlugin from "./plugins/auth";

export function buildApp(disableLogging?: boolean): FastifyInstance {
    const app = Fastify({
        logger: disableLogging ? false : { level: "info" },
    });

    // CORS configuration
    app.register(cors, {
        origin: true, // Reflects the request origin, supports credentials
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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

    app.get("/growth/health", async () => ({ success: true }));
    app.get("/growth/users/me", getMeHandler);

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
