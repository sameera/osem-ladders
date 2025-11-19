import awsLambdaFastify from "@fastify/aws-lambda";
import { buildApp } from "./app";

let proxy: any;

async function getProxy() {
    if (proxy) return proxy;

    const app = buildApp(false);
    proxy = awsLambdaFastify(app);

    await app.ready();

    return proxy;
}

export const handler = async (event: any, context: any) => {
    const p = await getProxy();
    return p(event, context);
};
