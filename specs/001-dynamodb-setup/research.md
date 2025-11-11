# Research: DynamoDB Setup Tool Technology Decisions

**Feature**: DynamoDB Setup Tool
**Date**: 2025-11-10
**Status**: Complete

## Overview

This document captures research findings and design decisions for implementing the DynamoDB setup tool. All "NEEDS CLARIFICATION" items from the plan have been resolved through AWS SDK documentation review and DynamoDB best practices.

---

## 1. AWS SDK v3 DynamoDB Patterns

### Decision: Use AWS SDK v3 with Modular Imports

**Rationale**:
- SDK v3 is the current standard (v2 maintenance mode since 2023)
- Modular imports reduce bundle size (important for CLI startup time)
- Better TypeScript support with strict typing
- Native async/await instead of callback/promise conversion

**Alternatives Considered**:
- **AWS SDK v2**: Rejected - legacy support only, larger bundle size, worse TypeScript experience
- **Full SDK v3 import**: Rejected - unnecessary bloat for CLI tool

**Implementation Pattern**:

```typescript
// Good: Modular imports (tree-shakeable)
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { CreateTableCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

// Bad: Full import (includes unused services)
import * as AWS from "aws-sdk"; // v2 pattern - avoid
```

### Decision: Use waitUntilTableExists for Table Readiness

**Rationale**:
- AWS SDK v3 provides built-in waiter utilities that handle polling logic
- Automatically retries with exponential backoff (reduces API calls)
- Handles edge cases (table transitions, throttling)
- Cleaner code than manual DescribeTable polling loops

**Pattern**:

```typescript
import { waitUntilTableExists } from "@aws-sdk/client-dynamodb";

await createTable(params);
await waitUntilTableExists(
  { client, maxWaitTime: 120 }, // 2 minutes max
  { TableName: tableName }
);
```

**Alternatives Considered**:
- **Manual DescribeTable polling**: Rejected - more error-prone, requires custom retry logic
- **setTimeout delays**: Rejected - wastes time with fixed intervals instead of adaptive polling

### Decision: GSI Creation Inline with CreateTable

**Rationale**:
- Simpler code (one operation instead of CreateTable + UpdateTable)
- Faster setup (parallel GSI provisioning)
- Avoids table update throttling issues (UpdateTable has rate limits)
- DynamoDB creates GSIs in parallel during table creation

**Pattern**:

```typescript
const params = {
  TableName: "Teams",
  KeySchema: [{ AttributeName: "teamId", KeyType: "HASH" }],
  AttributeDefinitions: [
    { AttributeName: "teamId", AttributeType: "S" },
    { AttributeName: "managerId", AttributeType: "S" }, // For GSI
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "managerId-index",
      KeySchema: [{ AttributeName: "managerId", KeyType: "HASH" }],
      Projection: { ProjectionType: "ALL" },
    },
  ],
  BillingMode: "PAY_PER_REQUEST", // On-demand
};
```

**Alternatives Considered**:
- **Separate UpdateTable calls**: Rejected - slower, subject to table update limits, more complex error handling

### Decision: Handle ResourceInUseException for Idempotency

**Rationale**:
- CreateTable throws ResourceInUseException if table exists
- Idempotent execution requires graceful handling (not a failure)
- Allows safe re-runs after partial failures

**Pattern**:

```typescript
try {
  await client.send(new CreateTableCommand(params));
} catch (error) {
  if (error.name === "ResourceInUseException") {
    // Table exists - verify schema matches
    await verifyTableSchema(tableName, params);
  } else {
    throw error;
  }
}
```

---

## 2. DynamoDB Table Design Validation

### Decision: Single-Attribute Partition Keys with Even Distribution

**Rationale**:
- Hot partitions occur when many requests target same partition key value
- UUIDs (userId, teamId, etc.) provide natural even distribution
- Single-attribute keys simpler than composite keys for base table

**Validation**:
- ✅ Users table: `userId` (UUID) - each user unique, even distribution
- ✅ Teams table: `teamId` (UUID) - each team unique
- ✅ AssessmentPlans table: `planId` (UUID) - each plan unique
- ✅ Assessments table: `assessmentId` (UUID) - each assessment unique
- ✅ AssessmentReports table: `reportId` (UUID) - each report unique
- ✅ ConfigVersions table: `configId` (UUID) - few rows, not a concern

**Hot Partition Risk**: ❌ None - all partition keys are unique UUIDs

### Decision: GSI Design Based on Query Access Patterns

From REDESIGN.md access patterns:

| Table | GSI | Partition Key | Sort Key | Query Pattern |
|-------|-----|---------------|----------|---------------|
| Teams | managerId-index | managerId | - | Find all teams for a manager |
| AssessmentPlans | teamId-index | teamId | - | Find all plans for a team |
| AssessmentPlans | status-index | status | - | Find all active/archived plans |
| Assessments | planId-teamMemberId-index | planId | teamMemberId | Find assessments for a plan member |
| Assessments | teamMemberId-index | teamMemberId | - | Find all assessments for a user |
| AssessmentReports | planId-index | planId | - | Find all reports for a plan |
| AssessmentReports | teamMemberId-index | teamMemberId | - | Find all reports for a user |
| ConfigVersions | isActive-index | isActive | createdAt (desc) | Find current active config |

**Total GSIs**: 8 (aligns with plan.md estimate)

### Decision: ALL Projection for GSIs

**Rationale**:
- Avoids additional base table lookups (Query + BatchGetItem)
- Simpler application code (no fetch waterfall)
- Storage cost negligible for small dataset (<100k assessments expected)
- Read capacity savings > storage cost (on-demand pricing)

**Pattern**:

```typescript
GlobalSecondaryIndexes: [{
  IndexName: "managerId-index",
  KeySchema: [{ AttributeName: "managerId", KeyType: "HASH" }],
  Projection: { ProjectionType: "ALL" }, // Include all attributes
}]
```

**Alternatives Considered**:
- **KEYS_ONLY**: Rejected - requires base table lookups for every query
- **INCLUDE specific attributes**: Rejected - complex to maintain, easy to miss required attributes

### Decision: On-Demand Billing Mode (Constitution Mandated)

**Rationale**:
- Constitution principle IV requires on-demand billing
- Seasonal assessment patterns cause traffic spikes (Q1, H1 reviews)
- Unknown initial traffic patterns (MVP phase)
- No over-provisioning waste

**Implementation**:

```typescript
BillingMode: "PAY_PER_REQUEST" // No ReadCapacityUnits/WriteCapacityUnits needed
```

### Decision: Native Map Type for Nested Structures

**Rationale**:
- Assessments have nested feedback structure (category → competency → level → feedback)
- DynamoDB Map type supports atomic updates (`UpdateExpression` with nested paths)
- JSON strings require full object replacement (race conditions in concurrent edits)
- Better query performance (no JSON parse/stringify overhead)

**Pattern**:

```typescript
// Assessment.feedback structure
{
  "Technical Execution": { // Map
    "Coding": { // Map
      "3": { // Map
        "evidence": "Led migration to microservices...",
        "nextLevelFeedback": "Demonstrate system design..."
      }
    }
  }
}
```

**Alternatives Considered**:
- **JSON strings**: Rejected - no atomic updates, parse overhead, harder to query
- **Flattened attributes**: Rejected - loses hierarchical structure, harder to query

### Decision: Disable Point-in-Time Recovery Initially

**Rationale**:
- PITR adds ~20% cost overhead
- MVP phase has low data volume (restore from backups acceptable)
- Can enable later when production-ready

**Implementation**:

```typescript
// PITR disabled by default (not specified in CreateTableCommand)
// Enable later with: UpdateContinuousBackupsCommand
```

---

## 3. CLI Tool Best Practices

### Decision: Commander.js for Multi-Command CLI

**Rationale**:
- Industry standard for Node.js CLIs (used by Vue, Angular, etc.)
- Built-in help generation (`--help`)
- Subcommand pattern (setup, verify, list-tables, delete-tables)
- Argument parsing with types and validation

**Pattern**:

```typescript
import { Command } from "commander";

const program = new Command();

program
  .name("osem-db-setup")
  .description("DynamoDB setup tool for OSEM Ladders")
  .version("1.0.0");

program
  .command("setup")
  .description("Create all DynamoDB tables")
  .option("--env <environment>", "Environment (dev|staging|prod)", "dev")
  .option("--region <region>", "AWS region", "us-east-1")
  .option("--dry-run", "Preview changes without creating tables")
  .action(setupCommand);

program.parse();
```

**Alternatives Considered**:
- **Yargs**: Rejected - more complex API, larger bundle size
- **Manual argv parsing**: Rejected - reinventing wheel, no help generation

### Decision: Chalk v5 for Colored Output

**Color Conventions**:
- Green: Success (`✓ Users table created`)
- Red: Error (`✗ Failed to create Teams table`)
- Yellow: Warning (`⚠ Table already exists, skipping`)
- Blue: Info (`ℹ Verifying table schema...`)
- Gray: Verbose (`Region: us-east-1`)

**Pattern**:

```typescript
import chalk from "chalk";

console.log(chalk.green("✓"), "Users table created");
console.log(chalk.red("✗"), "Failed:", error.message);
console.log(chalk.yellow("⚠"), "Table exists, verifying schema...");
```

**Accessibility**: Always include text prefix (✓/✗/⚠) for color-blind users

### Decision: Ora for Loading Spinners

**Rationale**:
- Long-running operations need progress feedback
- Spinner provides "alive" indicator during table creation (5-10 seconds per table)
- Success/fail/warning states with color

**Pattern**:

```typescript
import ora from "ora";

const spinner = ora("Creating Users table...").start();
try {
  await createUsersTable();
  spinner.succeed("Users table created");
} catch (error) {
  spinner.fail("Users table creation failed");
}
```

### Decision: Exit Codes for CI/CD Integration

**Standard Exit Codes**:
- `0`: Success (all operations completed)
- `1`: Error (failure, operation aborted)
- `2`: Partial success (some tables created, others failed)

**Rationale**:
- CI/CD pipelines check exit codes for success/failure
- Exit code 2 allows scripts to decide if partial success acceptable

**Pattern**:

```typescript
process.exit(0); // Success
process.exit(1); // Critical error (AWS credentials invalid)
process.exit(2); // Partial (3 tables created, 1 failed)
```

### Decision: Environment Variable Handling

**Priority Order** (AWS SDK default):
1. CLI flags (`--region us-west-2`)
2. Environment variables (`AWS_REGION`, `AWS_PROFILE`)
3. AWS config file (`~/.aws/config`)
4. Default region (`us-east-1`)

**Custom Environment Variables**:
- `NODE_ENV`: Controls table name prefix (dev/staging/prod)
- `AWS_REGION`: Override region (standard AWS SDK var)
- `OSEM_DB_PREFIX`: Custom table name prefix (optional)

**Pattern**:

```typescript
const region = options.region || process.env.AWS_REGION || "us-east-1";
const environment = options.env || process.env.NODE_ENV || "dev";
const tablePrefix = process.env.OSEM_DB_PREFIX || `osem-${environment}-`;
```

---

## 4. Testing Against DynamoDB

### Decision: DynamoDB Local for Integration Tests

**Rationale**:
- Real DynamoDB interactions without AWS costs
- Fast test execution (local Docker container)
- Reproducible test environment
- Supports all DynamoDB operations (CreateTable, Query, etc.)

**Setup** (in `vitest.config.ts`):

```typescript
export default defineConfig({
  test: {
    globalSetup: "./tests/setup-dynamodb-local.ts", // Start Docker container
    globalTeardown: "./tests/teardown-dynamodb-local.ts", // Stop container
  },
});
```

**Docker Compose** (`tests/docker-compose.dynamodb-local.yml`):

```yaml
version: '3'
services:
  dynamodb-local:
    image: amazon/dynamodb-local:latest
    ports:
      - "8000:8000"
    command: "-jar DynamoDBLocal.jar -sharedDb -inMemory"
```

**Alternatives Considered**:
- **AWS SDK Client Mock**: Rejected - doesn't test actual DynamoDB behavior (table creation, waits, errors)
- **Real AWS DynamoDB**: Rejected - costs money, slower, requires cleanup, CI/CD complexity

### Decision: Vitest Configuration for Async AWS Operations

**Pattern**:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 30000, // 30 seconds for table creation
    hookTimeout: 10000, // 10 seconds for setup/teardown
  },
});
```

**Test Structure**:

```typescript
describe("Setup Command", () => {
  beforeEach(async () => {
    // Delete all tables from previous test
    await deleteAllTables();
  });

  it("creates all 6 tables on first run", async () => {
    await setupCommand({ env: "test", region: "us-east-1" });

    const tables = await listTables();
    expect(tables).toHaveLength(6);
    expect(tables).toContain("osem-test-Users");
    expect(tables).toContain("osem-test-Teams");
    // ...
  });
});
```

### Decision: Cleanup Strategy (Delete Tables in afterEach)

**Rationale**:
- Fresh state for each test (no cross-test pollution)
- Idempotency tests need clean environment
- Fast cleanup (DynamoDB Local in-memory mode)

**Pattern**:

```typescript
afterEach(async () => {
  const tables = await listTables();
  await Promise.all(
    tables.map(tableName => deleteTable(tableName))
  );
});
```

---

## 5. Idempotency Patterns

### Decision: DescribeTable Before CreateTable

**Rationale**:
- Check table existence without triggering ResourceInUseException
- Validate schema matches desired state (detect drift)
- Faster than try/catch approach (no exception overhead)

**Pattern**:

```typescript
async function createTableIdempotent(params: CreateTableInput) {
  try {
    const existing = await client.send(
      new DescribeTableCommand({ TableName: params.TableName })
    );

    // Table exists - verify schema
    await verifySchema(existing.Table, params);
    console.log(chalk.yellow("⚠"), `${params.TableName} already exists (verified)`);
  } catch (error) {
    if (error.name === "ResourceNotFoundException") {
      // Table doesn't exist - create it
      await client.send(new CreateTableCommand(params));
      console.log(chalk.green("✓"), `${params.TableName} created`);
    } else {
      throw error;
    }
  }
}
```

### Decision: Schema Verification (Detect Drift)

**Check**:
- Partition key matches
- Sort key matches (if applicable)
- GSI count matches
- GSI key schemas match
- Billing mode matches (on-demand)

**Pattern**:

```typescript
function verifySchema(existing: TableDescription, desired: CreateTableInput): void {
  const issues: string[] = [];

  // Check partition key
  const existingPK = existing.KeySchema.find(k => k.KeyType === "HASH");
  const desiredPK = desired.KeySchema.find(k => k.KeyType === "HASH");
  if (existingPK.AttributeName !== desiredPK.AttributeName) {
    issues.push(`Partition key mismatch: ${existingPK.AttributeName} !== ${desiredPK.AttributeName}`);
  }

  // Check GSI count
  const existingGSIs = existing.GlobalSecondaryIndexes?.length || 0;
  const desiredGSIs = desired.GlobalSecondaryIndexes?.length || 0;
  if (existingGSIs !== desiredGSIs) {
    issues.push(`GSI count mismatch: ${existingGSIs} !== ${desiredGSIs}`);
  }

  if (issues.length > 0) {
    throw new SchemaValidationError(
      `Schema validation failed for ${existing.TableName}:\n` +
      issues.map(i => `  - ${i}`).join("\n") +
      `\n\nRemediation: Delete table and re-run setup, or manually update schema in AWS console.`
    );
  }
}
```

### Decision: GSI Update Strategy (Future Enhancement)

**Current**: Fail if GSI missing (require manual fix or delete/recreate)

**Rationale**:
- UpdateTable with GSI changes has strict limits (one GSI change at a time)
- Complex state management (GSI creation takes 5-10 minutes)
- P3 priority (nice-to-have, not MVP)

**Future Pattern**:

```typescript
// Phase 3 enhancement: Automatically add missing GSIs
const missingGSIs = detectMissingGSIs(existing, desired);
for (const gsi of missingGSIs) {
  await client.send(new UpdateTableCommand({
    TableName: tableName,
    GlobalSecondaryIndexUpdates: [{
      Create: gsi
    }]
  }));
  await waitUntilIndexActive(gsi.IndexName);
}
```

---

## 6. AWS Credential Resolution

### Decision: Use Default AWS SDK Credential Chain

**Chain Order** (per AWS SDK documentation):
1. Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`)
2. Shared credentials file (`~/.aws/credentials` with `AWS_PROFILE`)
3. Shared config file (`~/.aws/config` with `AWS_PROFILE`)
4. ECS container credentials (when running in AWS ECS)
5. EC2 instance metadata (when running on EC2)
6. IAM role (when running in Lambda/ECS)

**Implementation**:

```typescript
// No explicit credentials needed - SDK handles chain
const client = new DynamoDBClient({ region });
```

### Decision: Validate Credentials with STS GetCallerIdentity

**Rationale**:
- Fail fast with clear error before attempting table operations
- Provides AWS account ID and IAM principal (useful for logging)
- Low-cost operation (<1ms, $0.0001 per call)

**Pattern**:

```typescript
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";

async function validateCredentials() {
  const spinner = ora("Validating AWS credentials...").start();
  try {
    const sts = new STSClient({ region });
    const identity = await sts.send(new GetCallerIdentityCommand({}));

    spinner.succeed(`Authenticated as: ${identity.Arn}`);
    return identity;
  } catch (error) {
    spinner.fail("AWS credentials invalid");

    if (error.name === "ExpiredToken") {
      console.error(chalk.red("\n✗ Credentials expired"));
      console.error(chalk.gray("Remediation: Run `aws sso login` or regenerate access keys\n"));
    } else if (error.name === "CredentialsProviderError") {
      console.error(chalk.red("\n✗ No credentials found"));
      console.error(chalk.gray("Remediation:"));
      console.error(chalk.gray("  1. Configure AWS CLI: `aws configure`"));
      console.error(chalk.gray("  2. Or set environment variables:"));
      console.error(chalk.gray("     export AWS_ACCESS_KEY_ID=..."));
      console.error(chalk.gray("     export AWS_SECRET_ACCESS_KEY=...\n"));
    } else {
      console.error(chalk.red("\n✗"), error.message);
    }

    process.exit(1);
  }
}
```

### Decision: Region Selection with Validation

**Priority**:
1. CLI flag (`--region us-west-2`)
2. Environment variable (`AWS_REGION`)
3. AWS config file (`~/.aws/config` default region)
4. Default (`us-east-1`)

**Validation**:
- Warn if region doesn't match expected deployment region (from env config)
- Allow override with `--force` flag

**Pattern**:

```typescript
const region = options.region || process.env.AWS_REGION || "us-east-1";

if (environment === "prod" && region !== "us-east-1") {
  console.warn(chalk.yellow("⚠"), `Production expected in us-east-1, but using ${region}`);
  if (!options.force) {
    console.error(chalk.red("✗"), "Use --force to override region check");
    process.exit(1);
  }
}
```

---

## 7. Additional Design Decisions

### Decision: Table Naming Convention

**Pattern**: `osem-{environment}-{EntityName}`

**Examples**:
- `osem-dev-Users`
- `osem-staging-Teams`
- `osem-prod-Assessments`

**Rationale**:
- Clear environment separation (avoid dev/prod confusion)
- Consistent with AWS naming conventions
- Supports multi-environment in same account (dev + staging in one account)
- Easy to filter in AWS Console (`osem-dev-*`)

### Decision: Error Recovery Strategy (Fail-Fast)

**Pattern**: Stop on first error, do not continue creating remaining tables

**Rationale**:
- Partial setup leads to confusing state (3 of 6 tables created)
- Idempotency allows safe re-run after fixing error
- Exit code 1 indicates failure, CI/CD can retry

**Alternative Considered**:
- **Continue-on-error**: Rejected - complex state tracking, misleading success messages

**Pattern**:

```typescript
for (const tableSchema of tableSchemas) {
  try {
    await createTableIdempotent(tableSchema);
  } catch (error) {
    console.error(chalk.red("✗"), `Failed to create ${tableSchema.TableName}`);
    console.error(chalk.red("Error:"), error.message);
    console.error(chalk.gray("\nSetup aborted. Fix error and re-run setup command."));
    process.exit(1); // Fail fast
  }
}
```

### Decision: Logging Verbosity Levels

**Levels**:
- **Quiet** (`--quiet`): Only errors and final summary
- **Normal** (default): Success/error per table, spinners, summary
- **Verbose** (`--verbose`): AWS API calls, credential details, timing

**Pattern**:

```typescript
const logger = {
  info: (msg) => !options.quiet && console.log(msg),
  verbose: (msg) => options.verbose && console.log(chalk.gray(msg)),
  error: (msg) => console.error(chalk.red(msg)),
};

logger.verbose(`Creating table with params: ${JSON.stringify(params)}`);
logger.info(chalk.green("✓"), "Users table created");
```

---

## Summary of Decisions

| Topic | Decision | Rationale |
|-------|----------|-----------|
| AWS SDK | v3 with modular imports | Modern, smaller bundle, better TypeScript |
| Table readiness | waitUntilTableExists | Built-in waiter, handles retries |
| GSI creation | Inline with CreateTable | Faster, simpler, avoids UpdateTable limits |
| Idempotency | DescribeTable before CreateTable | Check existence, verify schema drift |
| Partition keys | Single-attribute UUIDs | Even distribution, no hot partitions |
| GSI projection | ALL | Avoid base table lookups, negligible cost |
| Billing mode | On-demand | Constitution mandated, handles spikes |
| Nested data | DynamoDB Map type | Atomic updates, no JSON parse overhead |
| PITR | Disabled initially | Cost optimization for MVP |
| CLI framework | Commander.js | Industry standard, help generation |
| Colored output | Chalk v5 | Clear visual feedback |
| Progress feedback | Ora spinners | "Alive" indicator for long operations |
| Exit codes | 0/1/2 (success/error/partial) | CI/CD integration |
| Testing | DynamoDB Local | Real DynamoDB, no AWS costs |
| Test cleanup | Delete tables in afterEach | Fresh state per test |
| Credentials | AWS SDK default chain | Flexible, supports all auth methods |
| Credential validation | STS GetCallerIdentity | Fail fast with clear error |
| Table naming | `osem-{env}-{Entity}` | Environment separation |
| Error recovery | Fail-fast | Avoid confusing partial state |
| Logging | Quiet/Normal/Verbose | Flexibility for different contexts |

**All NEEDS CLARIFICATION items resolved** ✅

---

## References

- AWS SDK v3 Documentation: https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/
- DynamoDB CreateTable API: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_CreateTable.html
- DynamoDB Best Practices: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html
- Commander.js Documentation: https://github.com/tj/commander.js
- DynamoDB Local Setup: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html
