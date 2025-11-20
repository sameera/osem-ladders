import 'fastify';

interface UserInfo {
    email: string;
    claims?: Record<string, unknown>;
}

declare module 'fastify' {
    interface FastifyRequest {
        user?: UserInfo;
    }
}
