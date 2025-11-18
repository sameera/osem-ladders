# Quick Start: Backend Data Model Implementation

**Feature**: Backend Data Model Overhaul
**Target Audience**: Developers implementing this feature
**Prerequisites**: Familiarity with DynamoDB, AWS Lambda, TypeScript

## Overview

This guide walks through implementing the 4-table DynamoDB backend with Lambda APIs for the OSEM Ladders platform.

## Phase 0: Prerequisites

### 1. Environment Setup

```bash
# Ensure Node.js 18+ and pnpm are installed
node --version  # Should be 18+
pnpm --version

# Install AWS CDK or SAM CLI (choose one)
npm install -g aws-cdk
# OR
brew install aws-sam-cli

# Configure AWS credentials
aws configure
```

### 2. Review Design Documents

Before coding, read these files in order:
1. [research.md](research.md) - Technical decisions and rationale
2. [data-model.md](data-model.md) - Complete table schemas and access patterns
3. [contracts/api-spec.yaml](contracts/api-spec.yaml) - REST API contracts

## Phase 1: Infrastructure Setup

### 1. Create Infrastructure Project

```bash
# From repository root
mkdir -p infrastructure/stacks

# Initialize AWS CDK (or SAM)
cd infrastructure
cdk init app --language typescript
```

### 2. Define DynamoDB Tables

Create `infrastructure/stacks/dynamodb-stack.ts`:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class DynamoDBStack extends cdk.Stack {
  public readonly usersTable: dynamodb.Table;
  public readonly teamsTable: dynamodb.Table;
  public readonly assessmentsTable: dynamodb.Table;
  public readonly reportsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Users Table
    this.usersTable = new dynamodb.Table(this, 'Users', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // GSI-1: TeamIndex
    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'TeamIndex',
      partitionKey: { name: 'team', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Teams Table
    this.teamsTable = new dynamodb.Table(this, 'Teams', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Assessments Table
    this.assessmentsTable = new dynamodb.Table(this, 'Assessments', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // AssessmentReports Table
    this.reportsTable = new dynamodb.Table(this, 'AssessmentReports', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // GSI-1: UserReportsIndex
    this.reportsTable.addGlobalSecondaryIndex({
      indexName: 'UserReportsIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Output table names
    new cdk.CfnOutput(this, 'UsersTableName', { value: this.usersTable.tableName });
    new cdk.CfnOutput(this, 'TeamsTableName', { value: this.teamsTable.tableName });
    new cdk.CfnOutput(this, 'AssessmentsTableName', { value: this.assessmentsTable.tableName });
    new cdk.CfnOutput(this, 'ReportsTableName', { value: this.reportsTable.tableName });
  }
}
```

### 3. Deploy Infrastructure

```bash
cd infrastructure
cdk bootstrap  # First time only
cdk deploy
```

Note the table names from outputs for next steps.

## Phase 2: Shared Types Library

### 1. Create Shared Types Project

```bash
# From repository root
nx generate @nx/node:library shared-types --directory=libs/shared-types
```

### 2. Define TypeScript Interfaces

Create `libs/shared-types/src/index.ts`:

```typescript
// Export all types
export * from './users';
export * from './teams';
export * from './assessments';
export * from './reports';
```

Copy interfaces from [data-model.md TypeScript Interfaces section](data-model.md#typescript-interfaces) into separate files:
- `libs/shared-types/src/users.ts`
- `libs/shared-types/src/teams.ts`
- `libs/shared-types/src/assessments.ts`
- `libs/shared-types/src/reports.ts`

### 3. Build Shared Types

```bash
nx build shared-types
```

## Phase 3: Backend API Project

### 1. Create API Project

```bash
# From repository root
nx generate @nx/node:application api --directory=apps/api
```

### 2. Install Dependencies

```bash
cd apps/api
pnpm add @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
pnpm add -D @types/aws-lambda
```

### 3. Create Repository Layer

Create `apps/api/src/repositories/user-repository.ts`:

```typescript
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { User } from '@osem-ladders/shared-types';

export class UserRepository {
  constructor(
    private readonly docClient: DynamoDBDocumentClient,
    private readonly tableName: string
  ) {}

  async getByEmail(userId: string): Promise<User | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { userId },
      })
    );
    return result.Item as User | null;
  }

  async create(user: Omit<User, 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<User> {
    const now = Date.now();
    const newUser: User = {
      ...user,
      createdAt: now,
      updatedAt: now,
      createdBy: user.userId, // System or admin
      isActive: true,
    };

    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: newUser,
        ConditionExpression: 'attribute_not_exists(userId)', // Prevent overwrites
      })
    );

    return newUser;
  }

  async getByTeam(team: string): Promise<User[]> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'TeamIndex',
        KeyConditionExpression: 'team = :team',
        ExpressionAttributeValues: {
          ':team': team,
        },
        FilterExpression: 'isActive = :true',
        ExpressionAttributeValues: {
          ':team': team,
          ':true': true,
        },
      })
    );
    return result.Items as User[];
  }

  // Add more methods: update, getByManager, etc.
}
```

Repeat for `team-repository.ts`, `assessment-repository.ts`, `report-repository.ts`.

### 4. Create Lambda Handlers

Create `apps/api/src/handlers/users.ts`:

```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { UserRepository } from '../repositories/user-repository';

// Initialize DynamoDB client outside handler (connection reuse)
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const userRepo = new UserRepository(docClient, process.env.USERS_TABLE_NAME!);

export const getUser: APIGatewayProxyHandler = async (event) => {
  try {
    const { userId } = event.pathParameters || {};
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'userId is required' },
        }),
      };
    }

    const user = await userRepo.getByEmail(userId);
    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found' },
        }),
      };
    }

    // TODO: Add authorization check (can only view own profile or managed team members)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: { user },
      }),
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      }),
    };
  }
};

// Add more handlers: createUser, updateUser, listUsers, etc.
```

### 5. Add Authorization Middleware

Create `apps/api/src/middleware/auth.ts`:

```typescript
import { APIGatewayProxyEvent } from 'aws-lambda';
import { verify } from 'jsonwebtoken';

export interface AuthContext {
  userId: string;
  roles: string[];
}

export function extractAuthContext(event: APIGatewayProxyEvent): AuthContext {
  const token = event.headers.Authorization?.replace('Bearer ', '');
  if (!token) {
    throw new Error('Missing authorization token');
  }

  // TODO: Verify Cognito JWT token
  // const decoded = verify(token, cognito public key);
  // return { userId: decoded.email, roles: decoded['cognito:groups'] };

  throw new Error('Not implemented');
}

export function hasRole(context: AuthContext, role: string): boolean {
  return context.roles.includes(role);
}
```

## Phase 4: API Gateway Integration

### 1. Create API Gateway Stack

Create `infrastructure/stacks/api-gateway-stack.ts`:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class ApiGatewayStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create REST API
    const api = new apigateway.RestApi(this, 'OsemLaddersAPI', {
      restApiName: 'OSEM Ladders Backend API',
      description: 'Backend API for organizational assessment platform',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // TODO: Add Lambda integrations for each endpoint
    // const usersResource = api.root.addResource('users');
    // usersResource.addMethod('GET', new apigateway.LambdaIntegration(getUserLambda));

    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url });
  }
}
```

## Phase 5: Data Migration

### 1. Create Migration Script

Create `apps/api/src/scripts/migrate-data.ts`:

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { Assessment, Category } from '@osem-ladders/shared-types';
import * as fs from 'fs';
import * as path from 'path';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

async function migrateAssessments() {
  // Parse config.md from apps/web/src/data/config.md
  const configPath = path.join(__dirname, '../../../web/src/data/config.md');
  const configContent = fs.readFileSync(configPath, 'utf-8');

  // TODO: Parse config.md into Category[] structure
  const plan: Category[] = []; // Parsed from config.md

  const assessment: Assessment = {
    id: crypto.randomUUID(),
    name: 'Initial Career Ladder',
    version: '1.0.0',
    plan,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'system',
  };

  await docClient.send(
    new PutCommand({
      TableName: process.env.ASSESSMENTS_TABLE_NAME!,
      Item: assessment,
    })
  );

  console.log(`Migrated assessment: ${assessment.id}`);
}

// Run migration
migrateAssessments().catch(console.error);
```

### 2. Run Migration

```bash
# Set environment variables
export ASSESSMENTS_TABLE_NAME=OsemLadders-Assessments

# Run migration script
tsx apps/api/src/scripts/migrate-data.ts
```

## Phase 6: Testing

### 1. Create Integration Tests

Create `apps/api/tests/integration/user-repository.test.ts`:

```typescript
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { UserRepository } from '../../src/repositories/user-repository';

// Use DynamoDB Local or test environment
const docClient = DynamoDBDocumentClient.from(/* test client */);
const userRepo = new UserRepository(docClient, 'test-users-table');

describe('UserRepository', () => {
  test('create user', async () => {
    const user = await userRepo.create({
      userId: 'test@example.com',
      name: 'Test User',
      roles: new Set(['TeamMember']),
      team: 'engineering',
      isActive: true,
    });

    expect(user.userId).toBe('test@example.com');
    expect(user.createdAt).toBeGreaterThan(0);
  });

  test('get user by email', async () => {
    const user = await userRepo.getByEmail('test@example.com');
    expect(user).not.toBeNull();
    expect(user?.name).toBe('Test User');
  });
});
```

### 2. Create Contract Tests

Create `apps/api/tests/contract/users-api.test.ts`:

```typescript
import { matchers } from 'jest-openapi';
import * as path from 'path';

// Load OpenAPI spec
const specPath = path.join(__dirname, '../../../003-backend-data-model/contracts/api-spec.yaml');
expect.extend(matchers);

describe('Users API', () => {
  test('GET /users/{userId} returns valid User schema', async () => {
    const res = await request(app).get('/users/test@example.com');
    expect(res.status).toEqual(200);
    expect(res.body).toSatisfyApiSpec();
  });
});
```

### 3. Run Tests

```bash
nx test api
```

## Phase 7: Deployment

### 1. Build and Package

```bash
nx build api
```

### 2. Deploy to AWS

```bash
cd infrastructure
cdk deploy --all
```

### 3. Verify Deployment

```bash
# Get API Gateway URL from CDK outputs
export API_URL=$(aws cloudformation describe-stacks \
  --stack-name OsemLaddersAPIStack \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text)

# Test health endpoint
curl $API_URL/health
```

## Phase 8: Frontend Integration

### 1. Update Frontend Environment Variables

Create `apps/web/.env.local`:

```bash
VITE_API_BASE_URL=https://your-api-gateway-url/v1
```

### 2. Create API Client

Create `apps/web/src/services/api-client.ts`:

```typescript
import { User, Team, Assessment, AssessmentReport } from '@osem-ladders/shared-types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class ApiClient {
  constructor(private readonly getToken: () => Promise<string>) {}

  async getUser(userId: string): Promise<User> {
    const token = await this.getToken();
    const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { data } = await res.json();
    return data.user;
  }

  // Add more methods for teams, assessments, reports
}
```

### 3. Use React Query

Update `apps/web/src/hooks/useUser.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { ApiClient } from '../services/api-client';

export function useUser(userId: string) {
  const { user } = useAuth();
  const apiClient = new ApiClient(() => user.getIdToken());

  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => apiClient.getUser(userId),
    enabled: !!user,
  });
}
```

## Common Issues

### DynamoDB Connection Errors
- Ensure AWS credentials are configured correctly
- Verify Lambda IAM role has DynamoDB permissions
- Check table names match environment variables

### Authorization Failures
- Verify Cognito JWT token is being sent in `Authorization` header
- Check token expiration
- Ensure roles are extracted correctly from token claims

### GSI Query Performance
- Verify GSI is fully populated (check DynamoDB console)
- Ensure query uses correct partition key
- Add pagination for large result sets

## Next Steps

1. **Implement remaining endpoints**: Complete all CRUD operations from [api-spec.yaml](contracts/api-spec.yaml)
2. **Add authorization**: Implement role-based access control per constitution Principle II
3. **Performance testing**: Validate <100ms p95 for report retrieval (SC-004)
4. **Monitoring**: Set up CloudWatch alarms for Lambda errors and DynamoDB throttling
5. **Documentation**: Update CLAUDE.md with new backend architecture

## Resources

- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [AWS Lambda Node.js](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html)
- [API Gateway REST API](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-rest-api.html)
- [Cognito JWT Verification](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html)
