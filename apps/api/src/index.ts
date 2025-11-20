import awsLambdaFastify from "@fastify/aws-lambda";
import { buildApp } from "./app";

let proxy: any;

async function getProxy() {
    if (proxy) return proxy;

    const app = buildApp(false);

    // Decorate Fastify request so we can attach user info later
    app.decorateRequest("user", null);
    app.addHook("preHandler", async (request, reply) => {
        if (
            "event" in request &&
            typeof request.event === "object" &&
            request.event &&
            "user" in request.event &&
            request.event.user
        ) {
            request.user = (request as any).event.user;
        }
    });

    proxy = awsLambdaFastify(app);

    await app.ready();

    return proxy;
}

export const handler = async (event: any, context: any) => {
    const claims = event?.requestContext?.authorizer?.jwt?.claims;
    const email = claims?.email;

    if (email) {
        event.user = { email, claims };
    }

    const p = await getProxy();
    return p(event, context);
};
