# CLI Contract: Verify Command

**Command**: `verify`
**Purpose**: Validate DynamoDB tables match expected schema
**Type**: Read-only operation (no AWS resource changes)

## Syntax

```bash
pnpm db-setup verify [options]
```

## Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--env <environment>` | String | No | `dev` | Environment (dev, staging, prod) |
| `--region <region>` | String | No | AWS SDK default | AWS region (e.g., us-east-1) |
| `--quiet` | Boolean | No | `false` | Suppress progress output (errors only) |
| `--json` | Boolean | No | `false` | Output results in JSON format (for CI/CD) |

## Examples

### Basic Verification (Development)

```bash
pnpm db-setup verify
```

Output:
```
✓ Validating AWS credentials... Authenticated as: arn:aws:iam::123456789:user/dev-user
✓ Region: us-east-1

Verifying tables...

✓ osem-dev-Users
  • Status: ACTIVE
  • Partition key: userId (String)
  • GSIs: 0
  • Billing: PAY_PER_REQUEST

✓ osem-dev-Teams
  • Status: ACTIVE
  • Partition key: teamId (String)
  • GSIs: 1 (managerId-index)
  • Billing: PAY_PER_REQUEST

✓ osem-dev-AssessmentPlans
  • Status: ACTIVE
  • Partition key: planId (String)
  • GSIs: 2 (teamId-index, status-index)
  • Billing: PAY_PER_REQUEST

✓ osem-dev-Assessments
  • Status: ACTIVE
  • Partition key: assessmentId (String)
  • GSIs: 2 (planId-teamMemberId-index, teamMemberId-index)
  • Billing: PAY_PER_REQUEST

✓ osem-dev-AssessmentReports
  • Status: ACTIVE
  • Partition key: reportId (String)
  • GSIs: 2 (planId-index, teamMemberId-index)
  • Billing: PAY_PER_REQUEST

✓ osem-dev-ConfigVersions
  • Status: ACTIVE
  • Partition key: configId (String)
  • GSIs: 1 (isActive-index with sort key createdAt)
  • Billing: PAY_PER_REQUEST

✓ All checks passed! 6 tables verified in 1.8s
```

### Production Verification

```bash
pnpm db-setup verify --env prod --region us-east-1
```

### CI/CD Integration (JSON Output)

```bash
pnpm db-setup verify --env staging --json
```

Output (success):
```json
{
  "success": true,
  "checks": [
    {
      "tableName": "osem-staging-Users",
      "status": "ACTIVE",
      "partitionKey": { "name": "userId", "type": "S" },
      "gsiCount": 0,
      "billingMode": "PAY_PER_REQUEST",
      "passed": true
    },
    {
      "tableName": "osem-staging-Teams",
      "status": "ACTIVE",
      "partitionKey": { "name": "teamId", "type": "S" },
      "gsiCount": 1,
      "gsiNames": ["managerId-index"],
      "billingMode": "PAY_PER_REQUEST",
      "passed": true
    },
    {
      "tableName": "osem-staging-AssessmentPlans",
      "status": "ACTIVE",
      "partitionKey": { "name": "planId", "type": "S" },
      "gsiCount": 2,
      "gsiNames": ["teamId-index", "status-index"],
      "billingMode": "PAY_PER_REQUEST",
      "passed": true
    },
    {
      "tableName": "osem-staging-Assessments",
      "status": "ACTIVE",
      "partitionKey": { "name": "assessmentId", "type": "S" },
      "gsiCount": 2,
      "gsiNames": ["planId-teamMemberId-index", "teamMemberId-index"],
      "billingMode": "PAY_PER_REQUEST",
      "passed": true
    },
    {
      "tableName": "osem-staging-AssessmentReports",
      "status": "ACTIVE",
      "partitionKey": { "name": "reportId", "type": "S" },
      "gsiCount": 2,
      "gsiNames": ["planId-index", "teamMemberId-index"],
      "billingMode": "PAY_PER_REQUEST",
      "passed": true
    },
    {
      "tableName": "osem-staging-ConfigVersions",
      "status": "ACTIVE",
      "partitionKey": { "name": "configId", "type": "S" },
      "sortKey": null,
      "gsiCount": 1,
      "gsiNames": ["isActive-index"],
      "billingMode": "PAY_PER_REQUEST",
      "passed": true
    }
  ],
  "summary": {
    "totalTables": 6,
    "tablesFound": 6,
    "tablesMissing": 0,
    "tablesWithIssues": 0
  },
  "duration": 1834,
  "region": "us-east-1",
  "environment": "staging"
}
```

### Verification with Failures

```bash
pnpm db-setup verify --env dev
```

Output:
```
✓ Validating AWS credentials... Authenticated as: arn:aws:iam::123456789:user/dev-user
✓ Region: us-east-1

Verifying tables...

✓ osem-dev-Users (OK)

✗ osem-dev-Teams
  • Issue: Missing GSI 'managerId-index'
  • Expected: 1 GSI, found: 0

✓ osem-dev-AssessmentPlans (OK)

✗ osem-dev-Assessments
  • Issue: Wrong partition key
  • Expected: assessmentId (String)
  • Found: id (String)

✗ osem-dev-AssessmentReports
  • Issue: Table not found
  • Expected table: osem-dev-AssessmentReports

✓ osem-dev-ConfigVersions (OK)

✗ Verification failed! 3 tables with issues, 1 table missing

Remediation steps:
  1. Missing tables: Run `pnpm db-setup setup` to create missing tables
  2. Schema mismatches: Delete affected tables and re-run setup:
     aws dynamodb delete-table --table-name osem-dev-Teams
     aws dynamodb delete-table --table-name osem-dev-Assessments
     pnpm db-setup setup
  3. Or manually fix schema issues in AWS console (see data-model.md)

Exit code: 1
```

## Exit Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 0 | Success | All tables exist and schemas match |
| 1 | Failure | One or more tables missing or schema mismatch |

## Behavior

### Validation Checks

For each expected table, verify:

1. **Table Existence**: Table exists in DynamoDB
2. **Table Status**: Status is ACTIVE (not CREATING, UPDATING, DELETING)
3. **Partition Key**: Attribute name and type match expected schema
4. **Sort Key**: Attribute name and type match (if applicable)
5. **GSI Count**: Number of GSIs matches expected count
6. **GSI Names**: All expected GSI names present
7. **GSI Key Schemas**: GSI partition/sort keys match expected schema
8. **Billing Mode**: Billing mode is PAY_PER_REQUEST (on-demand)

### Failure Modes

**Table Not Found**:
```
✗ osem-dev-AssessmentReports
  • Issue: Table not found
  • Expected table: osem-dev-AssessmentReports

Remediation: Run `pnpm db-setup setup` to create missing table
```

**Table Not Active**:
```
⚠ osem-dev-Teams
  • Status: CREATING (provisioning in progress)
  • Expected: ACTIVE

Remediation: Wait for table to finish provisioning (typically 5-10 seconds)
```

**Partition Key Mismatch**:
```
✗ osem-dev-Users
  • Issue: Wrong partition key
  • Expected: userId (String)
  • Found: id (String)

Remediation: Table schema incompatible. Delete and recreate:
  aws dynamodb delete-table --table-name osem-dev-Users
  pnpm db-setup setup
```

**Missing GSI**:
```
✗ osem-dev-Teams
  • Issue: Missing GSI 'managerId-index'
  • Expected: 1 GSI, found: 0

Remediation: Add missing GSI manually or delete table and re-run setup:
  1. Manual GSI creation (takes 5-10 minutes):
     aws dynamodb update-table --table-name osem-dev-Teams \
       --attribute-definitions AttributeName=managerId,AttributeType=S \
       --global-secondary-index-updates '[{
         "Create": {
           "IndexName": "managerId-index",
           "KeySchema": [{"AttributeName": "managerId", "KeyType": "HASH"}],
           "Projection": {"ProjectionType": "ALL"}
         }
       }]'

  2. Or delete and recreate (faster):
     aws dynamodb delete-table --table-name osem-dev-Teams
     pnpm db-setup setup
```

**Extra GSI**:
```
✗ osem-dev-Assessments
  • Issue: Unexpected GSI 'planId-index' found
  • Expected GSIs: planId-teamMemberId-index, teamMemberId-index
  • Found GSIs: planId-index, planId-teamMemberId-index, teamMemberId-index

Remediation: Remove unexpected GSI or accept drift:
  aws dynamodb update-table --table-name osem-dev-Assessments \
    --global-secondary-index-updates '[{
      "Delete": {"IndexName": "planId-index"}
    }]'
```

**Wrong Billing Mode**:
```
⚠ osem-dev-Users
  • Issue: Wrong billing mode
  • Expected: PAY_PER_REQUEST (on-demand)
  • Found: PROVISIONED (5 RCU, 5 WCU)

Remediation: Update billing mode (no downtime):
  aws dynamodb update-table --table-name osem-dev-Users \
    --billing-mode PAY_PER_REQUEST
```

### Quiet Mode

Suppresses progress output, only shows summary:

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
Exit code: 1
```

### Performance

**Expected Duration**:
- 6 tables: ~2-3 seconds
- Per table: ~300-500ms (DescribeTable API call)

**Optimization**: Verify operations run in parallel (Promise.all) to minimize latency

## Testing

**Unit Tests**:
- Schema comparison logic
- Error message formatting
- JSON output structure

**Integration Tests**:
- Verify against DynamoDB Local (all tables)
- Verify with missing table
- Verify with schema mismatch (wrong partition key)
- Verify with missing GSI
- Verify with extra GSI
- Verify with wrong billing mode

**Manual Tests**:
- Real AWS account verification (dev environment)
- Production verification (--dry-run safety check before deploy)
- CI/CD integration (JSON output parsing in GitHub Actions)

## Use Cases

### Pre-Deployment Check

Before deploying Lambda functions, verify database is ready:

```bash
pnpm db-setup verify --env staging --json
```

If exit code 0, proceed with deployment. If exit code 1, abort deployment.

### Post-Setup Validation

After running setup command, verify all tables created correctly:

```bash
pnpm db-setup setup && pnpm db-setup verify
```

### Periodic Health Check

Run verify in cron job to detect schema drift:

```bash
0 0 * * * cd /path/to/osem-ladders && pnpm db-setup verify --env prod --quiet || /usr/bin/alert-on-call
```

### Disaster Recovery Validation

After restoring from backup, verify schema integrity:

```bash
# Restore from backup (manual AWS console step)
# Then verify schema
pnpm db-setup verify --env prod
```

## Related Commands

- [setup-command.md](./setup-command.md) - Create tables
- [list-tables.md](./list-tables.md) - List existing tables
- [cli-output-format.md](./cli-output-format.md) - Output format specification