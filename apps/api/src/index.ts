import awsLambdaFastify from "@fastify/aws-lambda";
import type {
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
    Handler,
} from "aws-lambda";
import { buildApp } from "./app";

interface UserInfo {
    email: string;
    claims: Record<string, unknown>;
}

interface ExtendedAPIGatewayProxyEvent extends APIGatewayProxyEvent {
    user?: UserInfo;
}

let proxy: any = null;

async function getProxy(): Promise<any> {
    if (proxy) return proxy;

    const app = buildApp(false);
    proxy = awsLambdaFastify(app);

    await app.ready();

    return proxy;
}

export const handler: Handler<
    ExtendedAPIGatewayProxyEvent,
    APIGatewayProxyResult
> = async (event, context, callback) => {
    const claims = event?.requestContext?.authorizer?.jwt?.claims;
    const email = claims?.email as string | undefined;
    console.log("Email", email);

    if (email) {
        event.user = { email, claims: claims as Record<string, unknown> };
    }

    const p = await getProxy();
    return p(event, context, callback) as Promise<APIGatewayProxyResult>;
};
