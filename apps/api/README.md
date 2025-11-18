# Backend API

Lambda-based REST API for the OSEM Ladders organizational assessment platform.

## Overview

This project provides the backend API implementation using AWS Lambda functions and DynamoDB. It implements the data model defined in [specs/003-backend-data-model](../../specs/003-backend-data-model/).

## Tech Stack

- **Runtime**: Node.js 18+ (AWS Lambda)
- **Language**: TypeScript 5.5.3
- **Database**: DynamoDB with AWS SDK v3
- **Build**: esbuild with ESM output
- **Testing**: Vitest
- **Validation**: Zod

## Project Structure

```
apps/api/
├── src/
│   ├── handlers/          # Lambda function handlers
│   │   ├── health.ts      # Health check endpoint
│   │   └── users/         # User-related endpoints
│   │       ├── get-me.ts      # GET /users/me
│   │       └── create-user.ts # POST /users (Admin only)
│   ├── middleware/        # Shared middleware (auth, etc.)
│   ├── repositories/      # DynamoDB data access layer (future)
│   ├── services/          # Business logic layer (future)
│   ├── types/             # TypeScript type definitions
│   │   ├── users.ts
│   │   ├── teams.ts
│   │   ├── assessments.ts
│   │   └── reports.ts
│   └── utils/             # Utility functions
│       ├── dynamodb-client.ts  # DynamoDB client config
│       ├── lambda-response.ts  # API response helpers
│       └── validators.ts       # Input validation
├── esbuild.config.ts      # Build configuration
├── vitest.config.ts       # Test configuration
├── package.json
├── project.json           # Nx project configuration
└── tsconfig.json
```

## Development

### Build

```bash
# Build all handlers
pnpm nx build api

# Build in development mode (with sourcemaps)
pnpm nx build api --configuration=development

# Watch mode
pnpm nx watch api
```

### Test

```bash
# Run tests
pnpm nx test api

# Run tests in watch mode
pnpm nx test api --watch
```

### Local Development

For local development with AWS SAM or LocalStack:

```bash
# Set environment variables
export APP_NAME=osem
export ENV=dev
export AWS_REGION=us-east-1

# Build the functions
pnpm nx build api
```

## Environment Variables

### Required

- `APP_NAME` - Application name prefix for DynamoDB tables (default: `osem`)
- `ENV` - Environment name (default: `dev`)
- `AWS_REGION` - AWS region (default: `us-east-1`)

### Optional

- `VERSION` - API version string (for health check)

## DynamoDB Tables

The API uses the following table naming convention: `<APP_NAME>-<ENV>-<TableName>`

Default tables (with APP_NAME=osem, ENV=dev):
- `osem-dev-Users`
- `osem-dev-Teams`
- `osem-dev-Assessments`
- `osem-dev-AssessmentReports`

## API Endpoints

### Health Check

- **GET** `/health`
  - Returns service status and configuration
  - No authentication required

### Users

- **GET** `/users/me`
  - Get current authenticated user's profile
  - Requires authentication via Cognito

- **POST** `/users`
  - Create a new user (Admin only)
  - Requires authentication with Admin role
  - Body: `CreateUserInput`

## Authentication

All endpoints (except `/health`) require authentication via AWS Cognito.

The API expects the following from the Cognito authorizer:
- `event.requestContext.authorizer.claims.email` - User's email address

### Authorization

Role-based authorization is implemented via middleware:

```typescript
import { requireRole, requireAnyRole } from '../middleware/auth.js';

// Require specific role
const authError = await requireRole(event, 'Admin');
if (authError) return authError;

// Require any of multiple roles
const authError = await requireAnyRole(event, ['Manager', 'Admin']);
if (authError) return authError;
```

## Data Model

See [data model documentation](../../specs/003-backend-data-model/data-model.md) for detailed schema information.

### Key Types

- **User** - Team members with roles and team assignments
- **Team** - Organizational units with managers
- **Assessment** - Reusable career ladder frameworks
- **AssessmentReport** - Completed assessments with content-addressed storage

## Build Output

esbuild generates Lambda-compatible ESM modules:

- Output directory: `dist/apps/api/`
- Format: ESM (`.mjs` extension)
- Bundling: Yes (all dependencies bundled except AWS SDK)
- Sourcemaps: Generated in dev mode
- Minification: Production mode only

## Next Steps

1. Add repository layer for DynamoDB operations
2. Add service layer for business logic
3. Implement remaining endpoints (teams, assessments, reports)
4. Add integration tests with DynamoDB Local
5. Add API Gateway configuration (SAM/CDK template)
6. Add CloudWatch logging and metrics
