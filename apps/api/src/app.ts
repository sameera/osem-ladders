import Fastify from "fastify";
import { getMeHandler } from "./handlers/users/get-me";

export function buildApp(enableLogging = true) {
    const app = Fastify({
        logger: enableLogging ? { level: "info" } : false,
    });

    // CORS configuration
    app.addHook("onRequest", async (request, reply) => {
        reply.header("Access-Control-Allow-Origin", "*");
        reply.header(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, DELETE, OPTIONS"
        );
        reply.header(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization"
        );
        reply.header("Access-Control-Allow-Credentials", "true");
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
