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

    const app = buildApp();
    proxy = awsLambdaFastify(app);

    await app.ready();

    return proxy;
}

export const handler: Handler<
    ExtendedAPIGatewayProxyEvent,
    APIGatewayProxyResult
> = async (event, context, callback) => {
    const p = await getProxy();
    return p(event, context, callback) as Promise<APIGatewayProxyResult>;
};
