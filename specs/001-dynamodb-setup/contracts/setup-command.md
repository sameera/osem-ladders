# CLI Contract: Setup Command

**Command**: `setup`
**Purpose**: Create all DynamoDB tables for OSEM Ladders platform
**Type**: Mutating operation (creates AWS resources)

## Syntax

```bash
pnpm db-setup setup [options]
```

## Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--env <environment>` | String | No | `dev` | Environment (dev, staging, prod) |
| `--region <region>` | String | No | AWS SDK default | AWS region (e.g., us-east-1) |
| `--dry-run` | Boolean | No | `false` | Preview changes without creating tables |
| `--force` | Boolean | No | `false` | Skip region validation warnings |
| `--quiet` | Boolean | No | `false` | Suppress progress output (errors only) |
| `--verbose` | Boolean | No | `false` | Show detailed AWS API calls |
| `--json` | Boolean | No | `false` | Output results in JSON format (for CI/CD) |

## Examples

### Basic Setup (Development)

```bash
pnpm db-setup setup
```

Output:
```
✓ Validating AWS credentials... Authenticated as: arn:aws:iam::123456789:user/dev-user
✓ Region: us-east-1

Creating tables...
⠋ Creating osem-dev-Users...
✓ osem-dev-Users created (5.2s)
⠋ Creating osem-dev-Teams...
✓ osem-dev-Teams created (6.1s)
⠋ Creating osem-dev-AssessmentPlans...
✓ osem-dev-AssessmentPlans created (7.3s)
⠋ Creating osem-dev-Assessments...
✓ osem-dev-Assessments created (8.4s)
⠋ Creating osem-dev-AssessmentReports...
✓ osem-dev-AssessmentReports created (6.8s)
⠋ Creating osem-dev-ConfigVersions...
✓ osem-dev-ConfigVersions created (5.5s)

✓ Setup complete! 6 tables created in 39.3s
```

### Production Setup with Explicit Region

```bash
pnpm db-setup setup --env prod --region us-east-1
```

### Dry Run (Preview)

```bash
pnpm db-setup setup --env prod --dry-run
```

Output:
```
ℹ DRY RUN MODE - No tables will be created

Tables to be created:
  • osem-prod-Users (partition key: userId)
  • osem-prod-Teams (partition key: teamId, GSIs: 1)
  • osem-prod-AssessmentPlans (partition key: planId, GSIs: 2)
  • osem-prod-Assessments (partition key: assessmentId, GSIs: 2)
  • osem-prod-AssessmentReports (partition key: reportId, GSIs: 2)
  • osem-prod-ConfigVersions (partition key: configId, GSIs: 1)

Total: 6 tables, 8 GSIs
Region: us-east-1
Billing mode: PAY_PER_REQUEST (on-demand)

To create tables, run without --dry-run flag
```

### CI/CD Integration (JSON Output)

```bash
pnpm db-setup setup --env staging --json
```

Output:
```json
{
  "success": true,
  "tablesCreated": [
    {
      "tableName": "osem-staging-Users",
      "status": "created",
      "duration": 5234
    },
    {
      "tableName": "osem-staging-Teams",
      "status": "created",
      "duration": 6107
    },
    {
      "tableName": "osem-staging-AssessmentPlans",
      "status": "created",
      "duration": 7289
    },
    {
      "tableName": "osem-staging-Assessments",
      "status": "created",
      "duration": 8421
    },
    {
      "tableName": "osem-staging-AssessmentReports",
      "status": "created",
      "duration": 6789
    },
    {
      "tableName": "osem-staging-ConfigVersions",
      "status": "created",
      "duration": 5512
    }
  ],
  "totalDuration": 39352,
  "region": "us-east-1",
  "environment": "staging"
}
```

### Idempotent Re-run (Tables Exist)

```bash
pnpm db-setup setup
```

Output:
```
✓ Validating AWS credentials... Authenticated as: arn:aws:iam::123456789:user/dev-user
✓ Region: us-east-1

Creating tables...
⚠ osem-dev-Users already exists (schema verified)
⚠ osem-dev-Teams already exists (schema verified)
⚠ osem-dev-AssessmentPlans already exists (schema verified)
⚠ osem-dev-Assessments already exists (schema verified)
⚠ osem-dev-AssessmentReports already exists (schema verified)
⚠ osem-dev-ConfigVersions already exists (schema verified)

✓ Setup complete! 0 tables created, 6 tables verified in 2.1s
```

## Exit Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 0 | Success | All tables created or verified successfully |
| 1 | Error | Critical failure (AWS credentials invalid, permissions denied, etc.) |
| 2 | Partial Success | Some tables created, others failed |

## Behavior

### Prerequisites Validation

1. **AWS Credentials**: Validated with STS GetCallerIdentity before table operations
2. **Region**: Checked against environment expectations (warns if mismatch)
3. **Permissions**: Requires `dynamodb:CreateTable`, `dynamodb:DescribeTable` IAM permissions

### Idempotency

- Checks table existence with `DescribeTable` before creating
- If table exists, verifies schema matches expected configuration
- Schema validation includes:
  - Partition key match
  - Sort key match (if applicable)
  - GSI count match
  - GSI key schemas match
  - Billing mode match (on-demand)
- If schema mismatch detected, fails with remediation steps

### Error Handling

**Credential Errors**:
```
✗ AWS credentials invalid

Remediation:
  1. Configure AWS CLI: `aws configure`
  2. Or set environment variables:
     export AWS_ACCESS_KEY_ID=...
     export AWS_SECRET_ACCESS_KEY=...
```

**Permission Errors**:
```
✗ Insufficient permissions to create DynamoDB tables

Error: User arn:aws:iam::123456789:user/dev-user is not authorized to perform: dynamodb:CreateTable

Remediation:
  1. Request IAM policy with dynamodb:CreateTable permission
  2. Or attach AmazonDynamoDBFullAccess policy (for development)
  3. See README.md for minimal IAM policy example
```

**Schema Mismatch**:
```
✗ Schema validation failed for osem-dev-Teams

Schema differences:
  - GSI count mismatch: 0 !== 1 (expected managerId-index missing)

Remediation: Delete table and re-run setup, or manually add GSI in AWS console:
  aws dynamodb update-table --table-name osem-dev-Teams \
    --attribute-definitions AttributeName=managerId,AttributeType=S \
    --global-secondary-index-updates '[{
      "Create": {
        "IndexName": "managerId-index",
        "KeySchema": [{"AttributeName": "managerId", "KeyType": "HASH"}],
        "Projection": {"ProjectionType": "ALL"}
      }
    }]'
```

**Partial Failure**:
```
✓ osem-dev-Users created
✓ osem-dev-Teams created
✗ osem-dev-AssessmentPlans creation failed

Error: ResourceLimitExceededException - Table limit exceeded for account

Setup aborted. 2 of 6 tables created.

Remediation:
  1. Request table limit increase via AWS Support
  2. Or delete unused tables
  3. Re-run setup after resolving limit issue (idempotent)

Exit code: 2 (partial success)
```

### Table Naming Convention

Tables are named: `osem-{environment}-{EntityName}`

| Environment | Example Table Name |
|-------------|--------------------|
| dev | `osem-dev-Users` |
| staging | `osem-staging-Users` |
| prod | `osem-prod-Users` |

Custom prefix can be set with `OSEM_DB_PREFIX` environment variable:
```bash
export OSEM_DB_PREFIX="mycompany-dev-"
pnpm db-setup setup  # Creates mycompany-dev-Users, mycompany-dev-Teams, etc.
```

### Table Creation Order

Tables are created sequentially (not parallel) to avoid account-level throttling:

1. Users
2. Teams
3. AssessmentPlans
4. Assessments
5. AssessmentReports
6. ConfigVersions

**Rationale**: DynamoDB has per-account CreateTable rate limits (10 simultaneous table creations). Sequential creation with waiters ensures tables reach ACTIVE state before next creation.

### Table Configuration

All tables created with:
- **Billing Mode**: PAY_PER_REQUEST (on-demand)
- **Encryption**: AWS-managed keys (default)
- **Point-in-Time Recovery**: Disabled (can be enabled later)
- **Deletion Protection**: Disabled (can be enabled for production)
- **Tags**:
  - `Environment`: `{env}`
  - `Application`: `osem-ladders`

## Performance

**Expected Duration**:
- 6 tables with 8 GSIs: ~40-60 seconds
- Per table: 5-10 seconds (DynamoDB provisioning time)

**Factors Affecting Duration**:
- AWS region latency
- DynamoDB service load
- Number of GSIs per table

## Testing

**Unit Tests**:
- CLI argument parsing
- Table name generation
- Error message formatting

**Integration Tests**:
- Setup against DynamoDB Local
- Idempotency (re-run setup twice)
- Schema validation (create table with wrong schema, verify failure)
- Partial failure recovery (mock CreateTable error after 2 tables)

**Manual Tests**:
- Real AWS account setup (dev environment)
- Production setup with --dry-run verification
- CI/CD integration (JSON output parsing)

## Related Commands

- [verify-command.md](./verify-command.md) - Validate setup completeness
- [list-tables.md](./list-tables.md) - List existing tables
- [delete-tables.md](./delete-tables.md) - Cleanup command (dev only)