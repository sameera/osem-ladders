import Fastify from "fastify";
import cors from "@fastify/cors";
import { getMeHandler } from "./handlers/users/get-me";

export function buildApp(enableLogging = true) {
    const app = Fastify({
        logger: enableLogging ? { level: "info" } : false,
    });

    // CORS configuration
    app.register(cors, {
        origin: true, // Reflects the request origin, supports credentials
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    });

    app.get("/growth/health", async () => ({ success: true }));
    app.get("/growth/users/me", getMeHandler);

    app.setErrorHandler(
        (error: { message: string; statusCode: number }, request, reply) => {
            request.log.error(error);
            reply.status(error.statusCode || 500).send({
                success: false,
                error: {
                    code: "INTERNAL_ERROR",
                    message: error.message || "Internal server error",
                },
            });
        }
    );

    return app;
}
