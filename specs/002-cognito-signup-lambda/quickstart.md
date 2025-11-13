# Quickstart: Cognito Post-Signup Lambda Development

**Feature**: 002-cognito-signup-lambda
**Date**: 2025-11-13
**For**: Local development and unit testing

## Prerequisites

- Node.js 18+ installed
- pnpm package manager
- AWS Account (for deployment only, not required for local dev/test)
- DynamoDB Users table created (from feature 001-dynamodb-setup)

## Project Setup

### 1. Navigate to Lambda Function Directory

```bash
cd /home/sameera/projects/osem-ladders/backend/cognito-post-signup
```

**Note**: This directory will be created during implementation phase (not created by `/speckit.plan`).

### 2. Install Dependencies

```bash
pnpm install
```

**Key Dependencies**:
- `@aws-sdk/client-dynamodb`: DynamoDB client
- `@aws-sdk/lib-dynamodb`: Document client for easier DynamoDB operations
- `typescript`: TypeScript 5.5.3
- `vitest`: Unit testing framework
- `aws-sdk-client-mock`: Mock AWS SDK v3 for testing

### 3. Configure Environment Variables

Create `.env.local` for local testing:

```bash
# .env.local (for unit tests)
USERS_TABLE_NAME=osem-dev-Users
AWS_REGION=us-east-1
```

**Note**: These variables are automatically set by AWS Lambda runtime in deployed environment.

## Development Workflow

### Project Structure

```
backend/cognito-post-signup/
├── src/
│   ├── index.ts              # Lambda handler
│   ├── types.ts              # TypeScript interfaces (Cognito event, User)
│   ├── services/
│   │   └── userService.ts    # DynamoDB operations
│   ├── utils/
│   │   ├── dynamodb.ts       # DynamoDB client initialization
│   │   └── logger.ts         # Structured logging
│   └── __tests__/
│       ├── setup.ts          # Vitest test setup
│       └── index.test.ts     # Handler unit tests
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── template.yaml             # AWS SAM template (for deployment)
```

### Build TypeScript

```bash
# Compile TypeScript to JavaScript
pnpm build

# Watch mode for development
pnpm build:watch
```

**Output**: `dist/` directory with compiled JavaScript

### Run Unit Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

**Test Coverage Goals**:
- Handlers: 100%
- Services: 100%
- Utils: 100%

### Lint and Format

```bash
# Run ESLint
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code with Prettier (if configured)
pnpm format
```

## Unit Testing

### Test Files

Unit tests are located in `src/__tests__/index.test.ts`.

**Test Scenarios Covered**:
1. ✅ New user provisioning with team_member role
2. ✅ Existing user update (cognitoSub only, roles preserved)
3. ✅ Missing email attribute (throws error)
4. ✅ Missing sub attribute (throws error)
5. ✅ Missing name attribute (defaults to email prefix)
6. ✅ DynamoDB error propagation
7. ✅ Idempotency (same event processed twice)

### Running Specific Tests

```bash
# Run specific test file
pnpm test index.test.ts

# Run tests matching pattern
pnpm test --grep "provision new user"

# Run single test
pnpm test --grep "should provision new user with team_member role"
```

### Mock Data

Test fixtures are in `src/__tests__/fixtures/` (to be created):

**Example Cognito Event**:

```typescript
const mockCognitoEvent: CognitoPostConfirmationTriggerEvent = {
  version: '1',
  region: 'us-east-1',
  userPoolId: 'us-east-1_test',
  userName: 'user@example.com',
  triggerSource: 'PostConfirmation_ConfirmSignUp',
  callerContext: {
    awsSdkVersion: '3',
    clientId: 'test-client-id',
  },
  request: {
    userAttributes: {
      sub: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      email: 'user@example.com',
      name: 'John Doe',
      email_verified: 'true',
      'cognito:user_status': 'CONFIRMED',
    },
  },
  response: {},
};
```

### Debugging Tests

```bash
# Run tests with debug output
pnpm test --reporter=verbose

# Run tests with Node.js debugger
node --inspect-brk node_modules/.bin/vitest
```

## Local Development (No SAM Local)

**Note**: Per user requirement, we do **NOT** use AWS SAM Local for integration testing. Unit tests with mocked AWS SDK are sufficient for local development.

### Manual Testing Strategy

1. **Unit tests**: Test handler logic with mocked DynamoDB
2. **Deployment to dev environment**: Test against real Cognito + DynamoDB
3. **CloudWatch Logs**: Monitor Lambda execution in dev environment

**Workflow**:
```
Local Dev → Unit Tests (mocked) → Deploy to Dev → Test with Real Cognito → CloudWatch Logs
```

## Deployment

### Deployment Strategy: GitHub Actions (Recommended)

**Modern Approach**: Automated CI/CD with GitHub Actions instead of manual SAM deployment.

**Workflow**: Push to branch → Run tests → Build → Deploy to AWS

### Prerequisites

- AWS Account with IAM user/role for deployment
- GitHub repository with Actions enabled
- GitHub Secrets configured (see below)
- DynamoDB Users table exists in target environment

### Setup GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

```
AWS_ACCESS_KEY_ID          # IAM user access key for deployment
AWS_SECRET_ACCESS_KEY      # IAM user secret key
AWS_REGION                 # Deployment region (e.g., us-east-1)
LAMBDA_FUNCTION_NAME       # PostConfirmationFunction
USERS_TABLE_NAME           # osem-dev-Users (or osem-prod-Users)
```

### GitHub Actions Workflow

See [contracts/github-workflow-deploy-lambda.yml](contracts/github-workflow-deploy-lambda.yml) for complete workflow example.

**Workflow triggers**:
- Push to `main` branch (production deployment)
- Push to feature branches (dev deployment)
- Manual workflow dispatch

**Workflow steps**:
1. Checkout code
2. Setup Node.js 18 + pnpm
3. Install dependencies
4. Run unit tests (Vitest)
5. Build TypeScript → JavaScript
6. Package Lambda deployment zip
7. Deploy to AWS Lambda
8. Update Cognito trigger (if needed)

### Manual Deployment (Alternative)

If GitHub Actions is not available, use direct AWS CLI deployment:

```bash
# Build Lambda package
pnpm build

# Create deployment package
cd dist
zip -r ../function.zip .
cd ..

# Deploy to Lambda
aws lambda update-function-code \
  --function-name PostConfirmationFunction \
  --zip-file fileb://function.zip \
  --region us-east-1

# Update environment variables
aws lambda update-function-configuration \
  --function-name PostConfirmationFunction \
  --environment "Variables={USERS_TABLE_NAME=osem-dev-Users}" \
  --region us-east-1
```

### Infrastructure Setup (One-Time)

**Create Lambda function** (if not exists):

```bash
# Create execution role
aws iam create-role \
  --role-name PostConfirmationLambdaRole \
  --assume-role-policy-document file://trust-policy.json

# Attach DynamoDB permissions
aws iam put-role-policy \
  --role-name PostConfirmationLambdaRole \
  --policy-name DynamoDBAccess \
  --policy-document file://dynamodb-policy.json

# Create Lambda function
aws lambda create-function \
  --function-name PostConfirmationFunction \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT_ID:role/PostConfirmationLambdaRole \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --memory-size 512 \
  --timeout 10 \
  --environment "Variables={USERS_TABLE_NAME=osem-dev-Users}"
```

### Connect to Cognito Trigger

After Lambda is deployed, configure Cognito User Pool:

```bash
# Get Lambda ARN
LAMBDA_ARN=$(aws lambda get-function \
  --function-name PostConfirmationFunction \
  --query 'Configuration.FunctionArn' \
  --output text)

# Update Cognito User Pool
aws cognito-idp update-user-pool \
  --user-pool-id <your-user-pool-id> \
  --lambda-config PostConfirmation=$LAMBDA_ARN
```

Or via AWS Console:
1. Navigate to Cognito User Pool
2. User Pool Properties → Lambda Triggers
3. Post Confirmation Trigger → Select `PostConfirmationFunction`
4. Save changes

### AWS CDK Alternative (TypeScript Infrastructure)

For TypeScript-based infrastructure, use AWS CDK instead of SAM:

```typescript
// infrastructure/lib/lambda-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export class PostConfirmationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const usersTable = dynamodb.Table.fromTableName(
      this,
      'UsersTable',
      'osem-dev-Users'
    );

    const postConfirmation = new lambda.Function(this, 'PostConfirmation', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('backend/cognito-post-signup/dist'),
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
      },
    });

    usersTable.grantWriteData(postConfirmation);
  }
}
```

Deploy with CDK:
```bash
pnpm cdk deploy PostConfirmationStack
```

## Testing Deployed Lambda

### 1. Trigger Cognito Signup Flow

Use your web application's signup flow:

```
1. User clicks "Sign Up with Microsoft 365"
2. User authenticates via Microsoft 365 (Azure AD)
3. User confirms account (if required)
4. Cognito triggers Post Confirmation Lambda
5. Lambda provisions user in DynamoDB Users table
6. User can now log in with correct roles
```

### 2. Verify User Provisioning

```bash
# Query Users table to verify user was created
aws dynamodb get-item \
  --table-name osem-dev-Users \
  --key '{"userId": {"S": "user@example.com"}}'
```

**Expected Output**:

```json
{
  "Item": {
    "userId": {"S": "user@example.com"},
    "email": {"S": "user@example.com"},
    "cognitoSub": {"S": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"},
    "name": {"S": "John Doe"},
    "roles": {"SS": ["team_member"]},
    "createdAt": {"N": "1700000000000"},
    "updatedAt": {"N": "1700000000000"}
  }
}
```

### 3. Check CloudWatch Logs

```bash
# View recent Lambda invocations
aws logs tail /aws/lambda/PostConfirmationFunction --follow

# Filter for errors
aws logs filter-events \
  --log-group-name /aws/lambda/PostConfirmationFunction \
  --filter-pattern "ERROR"
```

**Expected Log Output** (success):

```
START RequestId: abc123 Version: $LATEST
Post Confirmation triggered: {
  "triggerSource": "PostConfirmation_ConfirmSignUp",
  "userName": "user@example.com"
}
User provisioned successfully
END RequestId: abc123
REPORT RequestId: abc123 Duration: 250.00 ms Billed Duration: 251 ms Memory Size: 512 MB Max Memory Used: 85 MB
```

## Troubleshooting

### Common Issues

#### 1. "Missing required user attributes" Error

**Symptom**: Lambda logs show error, user authentication fails

**Cause**: Cognito event missing `sub` or `email` attributes

**Solution**:
- Verify Cognito User Pool attribute mapping for Microsoft 365 OIDC
- Check that `email` is a required attribute in User Pool configuration
- Ensure OIDC provider (Azure AD) returns email claim

#### 2. DynamoDB "ResourceNotFoundException"

**Symptom**: Lambda throws error about table not found

**Cause**: Users table doesn't exist or wrong table name

**Solution**:
- Verify Users table created: `aws dynamodb describe-table --table-name osem-dev-Users`
- Check `USERS_TABLE_NAME` environment variable matches actual table name
- Ensure Lambda has correct IAM permissions

#### 3. "Access Denied" DynamoDB Error

**Symptom**: Lambda can't write to DynamoDB

**Cause**: IAM role missing `dynamodb:UpdateItem` permission

**Solution**:
- Check Lambda execution role has DynamoDB permissions
- Add inline policy:
  ```json
  {
    "Effect": "Allow",
    "Action": ["dynamodb:UpdateItem"],
    "Resource": "arn:aws:dynamodb:*:*:table/osem-*-Users"
  }
  ```

#### 4. Lambda Timeout

**Symptom**: Lambda times out after 10 seconds

**Cause**: DynamoDB connection issues or throttling

**Solution**:
- Check CloudWatch metrics for DynamoDB throttling
- Verify Lambda can reach DynamoDB (VPC configuration if applicable)
- Increase Lambda memory for faster CPU (512MB → 1024MB)

#### 5. User Provisioned But Authentication Still Fails

**Symptom**: User record exists in DynamoDB but can't log in

**Cause**: Cognito authentication issue (not Lambda issue)

**Solution**:
- Verify Cognito User Pool allows the user to authenticate
- Check user status in Cognito: `aws cognito-idp admin-get-user --user-pool-id <id> --username <email>`
- Ensure user confirmed account (status: CONFIRMED)

## Performance Optimization

### Lambda Cold Start Optimization

**Current Configuration** (from research):
- Memory: 512MB
- Timeout: 10 seconds
- Client reuse: ✅ DynamoDB client initialized outside handler

**Expected Performance**:
- Cold start: ~250ms
- Hot invocation: ~100ms
- DynamoDB write: ~50ms

**Optimization Tips**:
- Keep deployment package small (<5MB uncompressed)
- Use tree-shaking (ES modules with proper imports)
- Avoid large dependencies (e.g., entire AWS SDK)

### Monitoring

```bash
# View Lambda metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=PostConfirmationFunction \
  --start-time 2025-01-01T00:00:00Z \
  --end-time 2025-01-02T00:00:00Z \
  --period 3600 \
  --statistics Average,Maximum
```

## References

- **Feature Spec**: [spec.md](spec.md)
- **Research**: [research.md](research.md)
- **Data Model**: [data-model.md](data-model.md)
- **Event Contract**: [contracts/cognito-post-confirmation-event.json](contracts/cognito-post-confirmation-event.json)
- **AWS Docs**: [Cognito Lambda Triggers](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools-working-with-aws-lambda-triggers.html)

---

**Status**: ✅ Ready for local development
**Next Step**: Run `/speckit.tasks` to generate implementation tasks
