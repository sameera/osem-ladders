# API Lambda Function

This is a serverless API built with **AWS Lambda**, **Fastify**, and **DynamoDB**.

## Architecture

-   **Router Framework**: Fastify with `@fastify/aws-lambda` adapter
-   **Single Lambda Deployment**: All API routes are handled by one Lambda function
-   **API Gateway**: Required to expose HTTP endpoints and handle Cognito authorization
-   **Runtime**: Node.js 18 (ESM modules)

## Routes

### Health Check

-   **GET /health** - Returns service status and configuration info
-   No authentication required

### User Management

-   **POST /users** - Create a new user (Admin role required)
-   **GET /users/me** - Get current authenticated user's profile

## How the Router Works

The application uses Fastify to route incoming API Gateway events to the appropriate handler functions:

```
API Gateway Request
    ↓
Lambda (index.mjs)
    ↓
Fastify Router
    ↓
Route Handler (health.ts, create-user.ts, get-me.ts, etc.)
    ↓
DynamoDB
```

### Key Components

1. **src/index.ts** - Main Fastify router
2. **src/handlers/** - Individual Lambda-style handlers
3. **esbuild.config.ts** - Build configuration

## API Gateway Integration

### Required Configuration

You **must** use API Gateway because:

-   Lambda functions don't have public HTTP endpoints by themselves
-   API Gateway provides HTTP endpoint exposure, Cognito authorization, CORS, rate limiting

### Route Mapping

All routes are handled by the same Lambda function. API Gateway forwards the entire request to Lambda, and Fastify routes it internally.

## Development

### Build

```bash
pnpm nx build api --configuration=production
```

### Adding New Routes

1. Create handler in `src/handlers/`
2. Import and register route in `src/index.ts`
3. Build and deploy

## Deployment

See `.github/workflows/deploy-api-lambda.yml` for automated deployment.
