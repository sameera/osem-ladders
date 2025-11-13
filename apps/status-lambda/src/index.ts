import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { withAuth } from "./auth";

/**
 * Health check status response
 */
interface StatusResponse {
    isHealthy: boolean;
    timestamp?: string;
    user?: string;
}

/**
 * Lambda handler for /status endpoint
 * Returns health status if the request is properly authenticated
 */
const statusHandler = async (
    event: APIGatewayProxyEvent,
    user: { sub: string; email: string }
): Promise<APIGatewayProxyResult> => {
    console.log("Status check requested by user:", {
        userId: user.sub,
        email: user.email,
    });

    const response: StatusResponse = {
        isHealthy: true,
        timestamp: new Date().toISOString(),
        user: user.email,
    };

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify(response),
    };
};

/**
 * Main Lambda handler with authentication middleware
 */
export const handler = withAuth(statusHandler);
