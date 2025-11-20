// src/plugins/auth.ts
import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { createRemoteJWKSet, jwtVerify } from "jose";

declare module "fastify" {
    interface FastifyRequest {
        user?: {
            email?: string;
            username?: string;
            name?: string;
            groups?: string[];
            claims: Record<string, any>;
        };
    }
}

interface AuthPluginOptions {
    issuer: string;
    audience: string;
    publicRoutes?: string[];
}

const authPlugin: FastifyPluginAsync<AuthPluginOptions> = async (
    fastify,
    opts
) => {
    const { issuer, audience, publicRoutes = [] } = opts;

    // Create JWKS client (cached in Lambda execution environment)
    const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));

    fastify.addHook("onRequest", async (request, reply) => {
        console.log("Authenticating request:", request.method, request.url);
        const url = request.url;

        // Skip auth for public routes
        if (publicRoutes.some((r) => url.startsWith(r))) {
            return;
        }

        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            reply.code(401);
            throw new Error("Missing or invalid Authorization header");
        }

        const token = authHeader.replace("Bearer ", "");

        try {
            const { payload } = await jwtVerify(token, jwks, {
                issuer,
                audience,
            });

            request.user = {
                email: payload.email as string | undefined,
                username:
                    (payload["cognito:username"] as string) ||
                    (payload["username"] as string),
                name: payload.name as string | undefined,
                groups: (payload["cognito:groups"] as string[]) || [],
                claims: payload,
            };
            console.log(request.user);
        } catch (err) {
            fastify.log.error(err);
            reply.code(401);
            throw new Error("Invalid or expired token");
        }
    });
};

export default fp(authPlugin, {
    name: "auth-plugin",
    fastify: ">=4.0.0",
});
