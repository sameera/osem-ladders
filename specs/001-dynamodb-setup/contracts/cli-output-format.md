# CLI Output Format Specification

**Purpose**: Standardize output format for all CLI commands across human-readable and machine-readable modes

## Output Modes

### 1. Human-Readable (Default)

**Characteristics**:
- Colored output using Chalk
- Unicode symbols (✓, ✗, ⚠, ℹ)
- Progress spinners for long operations
- Clear visual hierarchy
- Contextual remediation steps

**Color Conventions**:

| Color | Use Case | Example |
|-------|----------|---------|
| Green | Success | `✓ Table created` |
| Red | Error | `✗ Failed to create table` |
| Yellow | Warning | `⚠ Table already exists` |
| Blue | Info | `ℹ Verifying schema...` |
| Gray | Verbose/meta | `Region: us-east-1` |

**Symbols**:

| Symbol | Meaning | Color |
|--------|---------|-------|
| ✓ | Success | Green |
| ✗ | Error/failure | Red |
| ⚠ | Warning | Yellow |
| ℹ | Information | Blue |
| ⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏ | Loading (spinner) | Cyan |

**Example**:
```
✓ Validating AWS credentials... Authenticated as: arn:aws:iam::123456789:user/dev-user
✓ Region: us-east-1

Creating tables...
⠋ Creating osem-dev-Users...
✓ osem-dev-Users created (5.2s)
⠋ Creating osem-dev-Teams...
✓ osem-dev-Teams created (6.1s)

✓ Setup complete! 6 tables created in 39.3s
```

### 2. JSON Mode (--json flag)

**Characteristics**:
- Valid JSON output only (no colored text, spinners, or progress)
- Structured data for programmatic parsing
- All errors included in JSON structure (not stderr)
- Exit code still indicates success/failure

**Structure**:

```typescript
interface SuccessOutput {
  success: true;
  command: string;  // "setup" | "verify" | "list" | "delete"
  data: any;        // Command-specific data
  duration: number; // Milliseconds
  region: string;
  environment: string;
  timestamp: string; // ISO 8601 format
}

interface ErrorOutput {
  success: false;
  command: string;
  error: {
    code: string;     // Error code (AWS_CREDENTIALS_INVALID, TABLE_NOT_FOUND, etc.)
    message: string;  // Human-readable error
    remediation?: string; // Remediation steps
    details?: any;    // Additional error details
  };
  duration: number;
  region: string;
  environment: string;
  timestamp: string;
}
```

**Example (setup success)**:
```json
{
  "success": true,
  "command": "setup",
  "data": {
    "tablesCreated": [
      {
        "tableName": "osem-dev-Users",
        "status": "created",
        "duration": 5234
      },
      {
        "tableName": "osem-dev-Teams",
        "status": "created",
        "duration": 6107
      }
    ],
    "tablesVerified": [],
    "totalTables": 6
  },
  "duration": 39352,
  "region": "us-east-1",
  "environment": "dev",
  "timestamp": "2025-11-10T15:30:45.123Z"
}
```

**Example (setup error)**:
```json
{
  "success": false,
  "command": "setup",
  "error": {
    "code": "AWS_CREDENTIALS_INVALID",
    "message": "Unable to locate credentials",
    "remediation": "Configure AWS CLI with 'aws configure' or set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables",
    "details": {
      "providerError": "CredentialsProviderError: Could not load credentials from any providers"
    }
  },
  "duration": 234,
  "region": "us-east-1",
  "environment": "dev",
  "timestamp": "2025-11-10T15:30:45.123Z"
}
```

**Example (verify with failures)**:
```json
{
  "success": false,
  "command": "verify",
  "error": {
    "code": "SCHEMA_VALIDATION_FAILED",
    "message": "3 tables have schema mismatches, 1 table missing",
    "remediation": "Run 'pnpm db-setup setup' to create missing tables or fix schema mismatches"
  },
  "data": {
    "checks": [
      {
        "tableName": "osem-dev-Users",
        "status": "ACTIVE",
        "passed": true
      },
      {
        "tableName": "osem-dev-Teams",
        "status": "ACTIVE",
        "passed": false,
        "issues": [
          {
            "type": "MISSING_GSI",
            "message": "Missing GSI 'managerId-index'",
            "expected": 1,
            "found": 0
          }
        ]
      },
      {
        "tableName": "osem-dev-AssessmentReports",
        "status": "NOT_FOUND",
        "passed": false,
        "issues": [
          {
            "type": "TABLE_NOT_FOUND",
            "message": "Table does not exist"
          }
        ]
      }
    ],
    "summary": {
      "totalTables": 6,
      "tablesFound": 5,
      "tablesMissing": 1,
      "tablesWithIssues": 2
    }
  },
  "duration": 1834,
  "region": "us-east-1",
  "environment": "dev",
  "timestamp": "2025-11-10T15:30:45.123Z"
}
```

### 3. Quiet Mode (--quiet flag)

**Characteristics**:
- Minimal output (only final summary)
- No spinners or progress updates
- Errors still displayed
- Compatible with --json (outputs only JSON, no progress)

**Example (setup quiet)**:
```bash
pnpm db-setup setup --quiet
```

Output:
```
✓ Setup complete! 6 tables created in 39.3s
```

**Example (verify quiet)**:
```bash
pnpm db-setup verify --quiet
```

Output (success):
```
✓ All checks passed! 6 tables verified
```

Output (failure):
```
✗ Verification failed! 3 tables with issues, 1 table missing
```

### 4. Verbose Mode (--verbose flag)

**Characteristics**:
- Maximum detail (AWS API calls, timings, credentials info)
- Includes internal operation details
- Gray-colored verbose lines (distinguish from main output)

**Example (setup verbose)**:
```bash
pnpm db-setup setup --verbose
```

Output:
```
✓ Validating AWS credentials... Authenticated as: arn:aws:iam::123456789:user/dev-user
  AWS Account ID: 123456789012
  IAM Principal: arn:aws:iam::123456789:user/dev-user
  Region: us-east-1
  Credential provider: SharedIniFileCredentials (~/.aws/credentials)

Creating tables...
⠋ Creating osem-dev-Users...
  API Call: CreateTable
  Params: {
    TableName: "osem-dev-Users",
    KeySchema: [{ AttributeName: "userId", KeyType: "HASH" }],
    BillingMode: "PAY_PER_REQUEST"
  }
  Response: Table status = CREATING
  Waiting for table to become ACTIVE... (polling every 5s)
  Table status: ACTIVE (after 5.2s)
✓ osem-dev-Users created (5.2s)

⠋ Creating osem-dev-Teams...
  API Call: CreateTable
  Params: {
    TableName: "osem-dev-Teams",
    KeySchema: [{ AttributeName: "teamId", KeyType: "HASH" }],
    GlobalSecondaryIndexes: [{ IndexName: "managerId-index", ... }],
    BillingMode: "PAY_PER_REQUEST"
  }
  Response: Table status = CREATING
  Waiting for table to become ACTIVE... (polling every 5s)
  Table status: ACTIVE (after 6.1s)
✓ osem-dev-Teams created (6.1s)

✓ Setup complete! 6 tables created in 39.3s
  Total API calls: 18 (6 CreateTable + 12 DescribeTable)
```

## Error Format

### Human-Readable Errors

**Structure**:
```
✗ {Error Title}

{Error Details - optional}

Remediation:
  1. {Step 1}
  2. {Step 2}
  ...

{Additional Context - optional}
```

**Example (AWS Credentials)**:
```
✗ AWS credentials invalid

Error: Unable to locate credentials. You can configure credentials by running "aws configure".

Remediation:
  1. Configure AWS CLI: `aws configure`
  2. Or set environment variables:
     export AWS_ACCESS_KEY_ID=...
     export AWS_SECRET_ACCESS_KEY=...
  3. Or use AWS SSO: `aws sso login`

Documentation: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html
```

**Example (Permissions)**:
```
✗ Insufficient permissions to create DynamoDB tables

Error: User arn:aws:iam::123456789:user/dev-user is not authorized to perform: dynamodb:CreateTable on resource: arn:aws:dynamodb:us-east-1:123456789:table/osem-dev-Users

Remediation:
  1. Request IAM policy with the following permissions:
     - dynamodb:CreateTable
     - dynamodb:DescribeTable
     - dynamodb:UpdateTable (for idempotent re-runs)

  2. Minimal IAM policy (see README.md):
     {
       "Version": "2012-10-17",
       "Statement": [{
         "Effect": "Allow",
         "Action": [
           "dynamodb:CreateTable",
           "dynamodb:DescribeTable",
           "dynamodb:UpdateTable"
         ],
         "Resource": "arn:aws:dynamodb:*:*:table/osem-*"
       }]
     }

  3. Or attach AmazonDynamoDBFullAccess policy (for development only)
```

**Example (Partial Failure)**:
```
✗ Setup failed after creating 3 of 6 tables

Tables created:
  ✓ osem-dev-Users
  ✓ osem-dev-Teams
  ✓ osem-dev-AssessmentPlans

Failed table:
  ✗ osem-dev-Assessments
     Error: ResourceLimitExceededException - Table limit exceeded for account

Remediation:
  1. Request table limit increase via AWS Support:
     https://console.aws.amazon.com/support/home#/case/create?issueType=service-limit-increase

  2. Current limit: 256 tables per region
     In use: 253 tables
     Available: 3 tables

  3. Or delete unused tables:
     aws dynamodb list-tables --region us-east-1 | grep -v osem-

  4. Re-run setup after resolving limit (idempotent - will skip existing tables):
     pnpm db-setup setup

Exit code: 2 (partial success - some tables created)
```

### JSON Errors

**Error Codes** (standardized across commands):

| Code | Description | Remediation |
|------|-------------|-------------|
| `AWS_CREDENTIALS_INVALID` | AWS credentials not found or expired | Configure AWS CLI or set environment variables |
| `AWS_PERMISSIONS_DENIED` | Insufficient IAM permissions | Add required IAM policies |
| `AWS_REGION_MISMATCH` | Region doesn't match expected environment | Use --force or fix region |
| `TABLE_NOT_FOUND` | Expected table doesn't exist | Run setup command |
| `SCHEMA_VALIDATION_FAILED` | Table schema doesn't match expected | Delete and recreate table |
| `TABLE_LIMIT_EXCEEDED` | Account table limit reached | Request limit increase or delete unused tables |
| `NETWORK_ERROR` | Network connectivity issue | Check internet connection and AWS service status |
| `UNKNOWN_ERROR` | Unexpected error | Check logs and report issue |

**Example**:
```json
{
  "success": false,
  "command": "setup",
  "error": {
    "code": "AWS_PERMISSIONS_DENIED",
    "message": "User arn:aws:iam::123456789:user/dev-user is not authorized to perform: dynamodb:CreateTable",
    "remediation": "Request IAM policy with dynamodb:CreateTable, dynamodb:DescribeTable, and dynamodb:UpdateTable permissions. See README.md for minimal IAM policy example.",
    "details": {
      "requiredPermissions": [
        "dynamodb:CreateTable",
        "dynamodb:DescribeTable",
        "dynamodb:UpdateTable"
      ],
      "iamPrincipal": "arn:aws:iam::123456789:user/dev-user",
      "awsErrorCode": "AccessDeniedException"
    }
  },
  "duration": 1234,
  "region": "us-east-1",
  "environment": "dev",
  "timestamp": "2025-11-10T15:30:45.123Z"
}
```

## Implementation Guidelines

### Detecting Output Mode

```typescript
const isJsonMode = options.json;
const isQuietMode = options.quiet;
const isVerboseMode = options.verbose;
const isTTY = process.stdout.isTTY && !isJsonMode;

// Spinners only in TTY non-JSON mode
const shouldShowSpinners = isTTY && !isQuietMode && !isJsonMode;

// Colors only in TTY mode
const shouldColorize = isTTY && !isJsonMode;

// Verbose output only if --verbose and not --json
const shouldLogVerbose = isVerboseMode && !isJsonMode;
```

### Logger Abstraction

```typescript
interface Logger {
  success(message: string, meta?: any): void;
  error(message: string, remediation?: string, meta?: any): void;
  warning(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  verbose(message: string, meta?: any): void;
  spinner(message: string): Spinner;
}

// Human-readable logger
class ConsoleLogger implements Logger {
  success(message: string) {
    console.log(chalk.green("✓"), message);
  }
  // ...
}

// JSON logger (accumulates data, outputs at end)
class JsonLogger implements Logger {
  private data: any[] = [];

  success(message: string, meta?: any) {
    this.data.push({ level: "success", message, ...meta });
  }

  finalize() {
    console.log(JSON.stringify({
      success: true,
      data: this.data,
      // ...
    }, null, 2));
  }
}
```

### Exit Code Handling

```typescript
function exitWithCode(code: 0 | 1 | 2, logger: Logger) {
  logger.finalize(); // Flush any buffered output (JSON mode)
  process.exit(code);
}

// Usage
if (allTablesCreated) {
  exitWithCode(0, logger); // Success
} else if (someTablesCreated) {
  exitWithCode(2, logger); // Partial success
} else {
  exitWithCode(1, logger); // Error
}
```

## Testing

**Unit Tests**:
- Logger implementations (console, JSON, quiet)
- Error formatting
- Color stripping in non-TTY
- JSON structure validation

**Integration Tests**:
- Capture stdout/stderr and validate format
- Test --json flag produces valid JSON
- Test --quiet flag suppresses progress
- Test --verbose flag includes detailed output
- Test error remediation messages

**Manual Tests**:
- TTY output (visual inspection of colors/spinners)
- CI/CD output (non-TTY, no colors)
- JSON parsing in shell scripts
- Quiet mode in cron jobs

## Accessibility

**Color Blindness**:
- Always include text symbols (✓, ✗, ⚠) alongside colors
- Never rely on color alone to convey meaning

**Screen Readers**:
- Use plain text in --quiet or --json mode for better screen reader support
- Spinner characters may be read aloud (acceptable for sighted users, use --quiet for screen readers)

**Non-English Speakers**:
- Use simple, clear English
- Provide structured remediation steps (numbered lists)
- Include AWS CLI commands (universal)

## Related Documentation

- [setup-command.md](./setup-command.md) - Setup command specification
- [verify-command.md](./verify-command.md) - Verify command specification
- README.md - User-facing documentation with manual steps
- data-model.md - Table schema reference for validation
