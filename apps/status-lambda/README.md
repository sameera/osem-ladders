# Status Lambda Function

AWS Lambda function that provides a health check endpoint with Cognito authentication.

## Overview

This Lambda function handles `/status` requests and returns a health status response only if the request is properly authenticated with a valid Cognito JWT token.

## Features

- **JWT Authentication**: Validates Cognito JWT tokens using JWKS
- **Health Check**: Returns `{ isHealthy: true }` for authenticated requests
- **Security**: Rejects unauthorized requests with 401 status
- **CORS Support**: Includes CORS headers for web applications

## Response Format

### Successful Response (200)
```json
{
  "isHealthy": true,
  "timestamp": "2025-11-12T09:16:00.000Z",
  "user": "user@example.com"
}
```

### Unauthorized Response (401)
```json
{
  "error": "Unauthorized",
  "message": "Missing Authorization header"
}
```

## Environment Variables

The Lambda function requires the following environment variables:

- `COGNITO_REGION` - AWS region where Cognito User Pool is located (e.g., `us-east-1`)
- `COGNITO_USER_POOL_ID` - Cognito User Pool ID (e.g., `us-east-1_abc123xyz`)

## Authentication

The function expects an `Authorization` header with a Bearer token:

```
Authorization: Bearer <cognito-jwt-token>
```

The token is validated against the Cognito User Pool's JWKS endpoint and must:
- Be signed with RS256 algorithm
- Have a valid signature from Cognito
- Not be expired
- Have the correct issuer

## Building

Build the Lambda function using Nx:

```bash
# Production build
pnpm nx build status-lambda

# Development build
pnpm nx build status-lambda --configuration=development
```

The built artifacts are output to `apps/status-lambda/dist/`.

## Deployment

The main handler is exported as `handler` from `index.js`. When deploying to AWS Lambda:

1. Upload the built `dist/index.js` file
2. Set the handler to `index.handler`
3. Configure environment variables (`COGNITO_REGION`, `COGNITO_USER_POOL_ID`)
4. Ensure the Lambda execution role has CloudWatch Logs permissions
5. Set up API Gateway to route requests to this function

## IAM Permissions

The Lambda execution role needs:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

Note: This function does not require DynamoDB permissions as it only validates JWT tokens and returns a static response.

## Testing Locally

You can test the authentication logic by creating test events with valid Cognito JWT tokens. Example event:

```json
{
  "headers": {
    "Authorization": "Bearer eyJraWQiOiI..."
  },
  "requestContext": {
    "accountId": "123456789012"
  }
}
```

## Architecture

- `src/index.ts` - Main Lambda handler
- `src/auth.ts` - Authentication middleware with JWT validation

The authentication is implemented as a higher-order function `withAuth()` that wraps the main handler and validates tokens before processing requests.

## Dependencies

- `jsonwebtoken` - JWT token verification
- `jwks-rsa` - JWKS client for Cognito public keys
- `@aws-sdk/client-cognito-identity-provider` - AWS Cognito SDK (if needed for future features)

## Error Handling

The function handles the following error cases:
- Missing `Authorization` header → 401 Unauthorized
- Invalid header format → 401 Unauthorized
- Expired token → 401 Unauthorized
- Invalid signature → 401 Unauthorized
- Missing environment variables → 401 Unauthorized

All errors are logged to CloudWatch Logs for debugging and audit purposes.
