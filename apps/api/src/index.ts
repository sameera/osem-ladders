import Fastify from 'fastify';
import awsLambdaFastify from '@fastify/aws-lambda';
import type { FastifyRequest, FastifyReply } from 'fastify';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  APIGatewayProxyHandler,
  Context
} from 'aws-lambda';

// Import handlers
import { handler as healthHandler } from './handlers/health.js';
import { handler as createUserHandler } from './handlers/users/create-user.js';
import { handler as getMeHandler } from './handlers/users/get-me.js';

// Create Fastify app
const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info'
  }
});

/**
 * Helper to convert Fastify request to API Gateway event
 * This allows us to use existing Lambda handlers with Fastify
 */
function createApiGatewayEvent(
  request: FastifyRequest
): Partial<APIGatewayProxyEvent> {
  return {
    httpMethod: request.method,
    path: request.url,
    headers: request.headers as { [key: string]: string },
    queryStringParameters: request.query as { [key: string]: string } | null,
    body: request.body ? JSON.stringify(request.body) : null,
    requestContext: {
      // Extract Cognito claims from API Gateway authorizer if present
      authorizer: (request.headers as any)['x-apigateway-event']
        ? JSON.parse((request.headers as any)['x-apigateway-event']).requestContext.authorizer
        : undefined
    } as any
  };
}

/**
 * Helper to execute Lambda handler and send response via Fastify
 */
async function executeLambdaHandler(
  request: FastifyRequest,
  reply: FastifyReply,
  handler: APIGatewayProxyHandler
) {
  try {
    const event = createApiGatewayEvent(request) as APIGatewayProxyEvent;
    const context = {} as Context; // Minimal context for local testing

    // Call handler with callback (Lambda handlers support both Promise and callback styles)
    const result = await new Promise<APIGatewayProxyResult>((resolve, reject) => {
      const callback = (error: any, result?: APIGatewayProxyResult) => {
        if (error) {
          reject(error);
        } else {
          resolve(result!);
        }
      };

      // Call the handler - it might return a Promise or use the callback
      const handlerResult = handler(event, context, callback);

      // If the handler returns a Promise, use that instead
      if (handlerResult && typeof handlerResult.then === 'function') {
        handlerResult.then(resolve).catch(reject);
      }
    });

    // Set headers
    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        reply.header(key, String(value));
      });
    }

    // Send response
    reply.status(result.statusCode);

    if (result.body) {
      const body = JSON.parse(result.body);
      return body;
    }

    return null;
  } catch (error) {
    request.log.error(error, 'Error executing Lambda handler');
    reply.status(500);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    };
  }
}

// CORS configuration
app.addHook('onRequest', async (request, reply) => {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  reply.header('Access-Control-Allow-Credentials', 'true');
});

// Handle OPTIONS requests for CORS preflight
app.options('*', async (request, reply) => {
  reply.status(204).send();
});

// ===== Route Definitions =====

/**
 * Health check endpoint
 * GET /health
 */
app.get('/health', async (request, reply) => {
  return executeLambdaHandler(request, reply, healthHandler);
});

/**
 * Create a new user (Admin only)
 * POST /users
 */
app.post('/users', async (request, reply) => {
  return executeLambdaHandler(request, reply, createUserHandler);
});

/**
 * Get current authenticated user's profile
 * GET /users/me
 */
app.get('/users/me', async (request, reply) => {
  return executeLambdaHandler(request, reply, getMeHandler);
});

// 404 handler for unknown routes
app.setNotFoundHandler((request, reply) => {
  reply.status(404).send({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
      details: {
        path: request.url,
        method: request.method
      }
    }
  });
});

// Error handler
app.setErrorHandler((error, request, reply) => {
  request.log.error(error);

  reply.status(error.statusCode || 500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error'
    }
  });
});

// Export the Lambda handler
export const handler = awsLambdaFastify(app, {
  decorateRequest: true,
  enforceBase64: (request) => {
    // Handle binary content types
    const contentType = request.headers['content-type'];
    return contentType?.includes('multipart/form-data') ||
           contentType?.includes('application/octet-stream') ||
           false;
  }
});

// For local development/testing
export { app };