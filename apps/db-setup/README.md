# DynamoDB Setup Tool

A CLI tool for creating and managing DynamoDB tables for the OSEM Ladders organizational assessment platform.

## Table of Contents

- [Prerequisites](#prerequisites)
- [AWS Credentials Configuration](#aws-credentials-configuration)
- [IAM Permissions](#iam-permissions)
- [Installation](#installation)
- [Usage](#usage)
  - [Create Tables](#create-tables)
  - [Verify Tables](#verify-tables)
  - [List Tables](#list-tables)
  - [Delete Tables](#delete-tables)
- [Table Naming Convention](#table-naming-convention)
- [Exit Codes](#exit-codes)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before using this tool, ensure you have the following installed:

1. **Node.js 18 or higher**
   ```bash
   node --version  # Should be 18.x or higher
   ```

2. **pnpm package manager**
   ```bash
   npm install -g pnpm
   ```

3. **AWS CLI** (recommended for credential management)
   ```bash
   aws --version
   ```

4. **AWS Account** with appropriate permissions (see [IAM Permissions](#iam-permissions))

---

## AWS Credentials Configuration

The tool uses the AWS SDK for JavaScript v3, which supports multiple credential sources. Choose one of the following methods:

### Method 1: AWS CLI Configuration (Recommended)

Configure your AWS credentials using the AWS CLI:

```bash
aws configure
```

You'll be prompted for:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format (e.g., `json`)

This creates credential files at:
- `~/.aws/credentials` (access keys)
- `~/.aws/config` (region and other settings)

### Method 2: Environment Variables

Set AWS credentials as environment variables:

```bash
export AWS_ACCESS_KEY_ID="your-access-key-id"
export AWS_SECRET_ACCESS_KEY="your-secret-access-key"
export AWS_REGION="us-east-1"
```

### Method 3: Named Profiles

If you have multiple AWS accounts, use named profiles:

```bash
# Configure a named profile
aws configure --profile osem-dev

# Use the profile with the tool
export AWS_PROFILE=osem-dev
pnpm db-setup create --env dev
```

### Method 4: IAM Roles (EC2, ECS, Lambda)

If running on AWS infrastructure, the tool automatically uses IAM role credentials. No additional configuration needed.

### Verify Credentials

Test your credentials:

```bash
aws sts get-caller-identity
```

Expected output:
```json
{
    "UserId": "AIDAI...",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/your-username"
}
```

---

## IAM Permissions

The tool requires the following DynamoDB permissions:

### Minimal IAM Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:CreateTable",
        "dynamodb:DescribeTable",
        "dynamodb:ListTables",
        "dynamodb:UpdateTable",
        "dynamodb:DeleteTable",
        "dynamodb:TagResource"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/osem-*"
      ]
    }
  ]
}
```

### Managed Policy (Development/Testing)

For development environments, you can use the AWS managed policy:

```bash
# Attach AmazonDynamoDBFullAccess to your IAM user
aws iam attach-user-policy \
  --user-name your-username \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess
```

⚠️ **Warning**: `AmazonDynamoDBFullAccess` grants broad permissions. Use the minimal policy above for production.

### Required Actions by Command

| Command | Required Permissions |
|---------|---------------------|
| `create` | `dynamodb:CreateTable`, `dynamodb:DescribeTable`, `dynamodb:TagResource` |
| `verify` | `dynamodb:DescribeTable`, `dynamodb:ListTables` |
| `list` | `dynamodb:ListTables`, `dynamodb:DescribeTable` |
| `delete` | `dynamodb:DeleteTable`, `dynamodb:DescribeTable` |

---

## Installation

This tool is part of the OSEM Ladders monorepo. Install dependencies from the repository root:

```bash
# Clone the repository
git clone <repository-url>
cd osem-ladders

# Install dependencies
pnpm install

# Build the tool
pnpm nx build db-setup
```

The compiled tool is available at `apps/db-setup/dist/main.js` and can be run via:

```bash
pnpm db-setup [command] [options]
```

---

## Usage

### General Command Format

```bash
pnpm db-setup [command] [options]
```

### Global Options

All commands support these global options:

| Option | Description | Default |
|--------|-------------|---------|
| `-e, --env <environment>` | Environment (dev, staging, prod, local) | `dev` |
| `-r, --region <region>` | AWS region | From AWS config |
| `--endpoint <url>` | Custom DynamoDB endpoint (for DynamoDB Local) | - |
| `-v, --verbose` | Enable verbose logging | `false` |
| `-h, --help` | Display help | - |
| `-V, --version` | Display version | - |

---

### Create Tables

Create all 6 DynamoDB tables for the specified environment.

```bash
pnpm db-setup create [options]
```

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--force` | Delete existing tables and recreate (DESTRUCTIVE) | `false` |
| `--skip-wait` | Skip waiting for tables to become active | `false` |

#### Examples

**Create tables for dev environment:**
```bash
pnpm db-setup create --env dev
```

**Create tables for production in us-west-2:**
```bash
pnpm db-setup create --env prod --region us-west-2
```

**Create tables with verbose logging:**
```bash
pnpm db-setup create --env dev --verbose
```

**Use DynamoDB Local (requires Docker container running):**
```bash
# Start DynamoDB Local
docker run -d -p 8000:8000 amazon/dynamodb-local

# Create tables
pnpm db-setup create --env local --endpoint http://localhost:8000
```

**Force recreate existing tables (DESTRUCTIVE):**
```bash
pnpm db-setup create --env dev --force
```

⚠️ **Warning**: The `--force` flag will delete all existing tables and data. Use with caution.

#### What Gets Created

The create command creates 6 tables:

1. **osem-{env}-Users** - User profiles (no GSIs)
2. **osem-{env}-Teams** - Team metadata (1 GSI: managerId-index)
3. **osem-{env}-AssessmentPlans** - Assessment plans (2 GSIs: teamId-index, status-index)
4. **osem-{env}-Assessments** - Individual assessments (2 GSIs: planId-teamMemberId-index, teamMemberId-index)
5. **osem-{env}-AssessmentReports** - Final reports (2 GSIs: planId-index, teamMemberId-index)
6. **osem-{env}-ConfigVersions** - Career ladder configs (1 GSI: isActive-index)

All tables use:
- **Billing Mode**: On-demand (PAY_PER_REQUEST)
- **Encryption**: AWS-managed keys (default)
- **Tags**: Environment and Application tags

#### Expected Output

```
Create DynamoDB Tables

ℹ Environment: Development environment (dev)

✔ AWS credentials validated
  Account: 123456789012
  ARN: arn:aws:iam::123456789012:user/developer

ℹ Creating 6 DynamoDB tables...

✔ Created table: osem-dev-Users
✔ Created table: osem-dev-Teams
✔ Created table: osem-dev-AssessmentPlans
✔ Created table: osem-dev-Assessments
✔ Created table: osem-dev-AssessmentReports
✔ Created table: osem-dev-ConfigVersions

ℹ Waiting for tables to become active...

✔ Table osem-dev-Users is now active
✔ Table osem-dev-Teams is now active
✔ Table osem-dev-AssessmentPlans is now active
✔ Table osem-dev-Assessments is now active
✔ Table osem-dev-AssessmentReports is now active
✔ Table osem-dev-ConfigVersions is now active

Setup Summary

✔ Tables created: 6

  Total time: 45.23s

✔ Setup completed successfully
```

---

### Verify Tables

Verify that all tables exist and have correct schemas.

```bash
pnpm db-setup verify [options]
```

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--fix` | Attempt to fix schema mismatches (create missing tables) | `false` |

#### Examples

```bash
# Verify dev environment tables
pnpm db-setup verify --env dev

# Verify and fix missing tables
pnpm db-setup verify --env dev --fix
```

⚠️ **Note**: Verify command implementation is pending (Phase 6).

---

### List Tables

List all DynamoDB tables for the specified environment.

```bash
pnpm db-setup list [options]
```

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--details` | Show detailed table information | `false` |

#### Examples

```bash
# List tables for dev environment
pnpm db-setup list --env dev

# List with details (item count, size, GSIs)
pnpm db-setup list --env dev --details
```

⚠️ **Note**: List command implementation is pending (Phase 7).

---

### Delete Tables

Delete all DynamoDB tables for the specified environment.

```bash
pnpm db-setup delete [options]
```

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--yes` | Skip confirmation prompt | `false` |

#### Examples

```bash
# Delete dev tables (with confirmation)
pnpm db-setup delete --env dev

# Delete without confirmation
pnpm db-setup delete --env dev --yes
```

⚠️ **Warning**: This operation is destructive and will delete all data in the tables.

⚠️ **Note**: Delete command implementation is pending (Phase 7).

---

## Table Naming Convention

All tables follow the naming convention:

```
osem-{environment}-{TableName}
```

### Examples

| Environment | Table Name | Full Table Name |
|------------|------------|-----------------|
| dev | Users | `osem-dev-Users` |
| staging | Teams | `osem-staging-Teams` |
| prod | AssessmentPlans | `osem-prod-AssessmentPlans` |
| local | Assessments | `osem-local-Assessments` |

### Benefits

- **Environment isolation**: Multiple environments can coexist in the same AWS account
- **Easy identification**: Tables are clearly labeled by environment
- **IAM policy targeting**: Easy to write environment-specific IAM policies
- **Cost tracking**: Use tags and naming for cost allocation

### Supported Environments

| Environment | Description | Use Case |
|------------|-------------|----------|
| `dev` | Development | Local development and testing |
| `staging` | Staging | Pre-production testing and QA |
| `prod` | Production | Live production environment |
| `local` | Local DynamoDB | Docker container for offline development |

---

## Exit Codes

The tool uses standard exit codes to indicate success or failure:

| Exit Code | Meaning | Description |
|-----------|---------|-------------|
| `0` | Success | All operations completed successfully |
| `1` | Error | Fatal error occurred (credentials, permissions, network) |
| `2` | Partial Success | Some operations succeeded, others failed |

### Usage in Scripts

```bash
#!/bin/bash

# Run create command
pnpm db-setup create --env dev

# Check exit code
if [ $? -eq 0 ]; then
  echo "Setup succeeded"
  exit 0
elif [ $? -eq 2 ]; then
  echo "Setup partially succeeded - check logs"
  exit 1
else
  echo "Setup failed"
  exit 1
fi
```

---

## Troubleshooting

### Common Errors and Solutions

#### 1. Invalid AWS Credentials

**Error:**
```
✖ AWS credential validation failed
✗ Failed to validate AWS credentials
  › Error: AWS credential validation failed: The security token included in the request is invalid
```

**Solutions:**
- Run `aws configure` to set up credentials
- Verify credentials with `aws sts get-caller-identity`
- Check `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables
- Ensure your IAM user/role is active and not disabled

#### 2. Missing Credentials

**Error:**
```
No AWS credentials found.
```

**Solutions:**
- Run `aws configure` to set up credentials
- Set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables
- Set `AWS_PROFILE` to use a named profile from `~/.aws/credentials`

#### 3. Permission Denied

**Error:**
```
✖ Failed to create table: osem-dev-Users
  › Error: AccessDeniedException: User is not authorized to perform: dynamodb:CreateTable
```

**Solutions:**
- Contact your AWS administrator to grant DynamoDB permissions
- Attach the `AmazonDynamoDBFullAccess` managed policy (for development)
- Use the minimal IAM policy from the [IAM Permissions](#iam-permissions) section
- Verify IAM policies attached to your user or role

#### 4. Invalid Region

**Error:**
```
The specified AWS region is invalid.
```

**Solutions:**
- Check the `AWS_REGION` environment variable
- Use `--region` flag with a valid AWS region (e.g., `us-east-1`, `eu-west-1`)
- Run `aws ec2 describe-regions` to list available regions

#### 5. Table Already Exists

**Error:**
```
ℹ Table already exists: osem-dev-Users (status: ACTIVE)
```

**Solutions:**
- This is not an error - the tool is idempotent and skips existing tables
- Use `--force` flag to delete and recreate tables (DESTRUCTIVE)
- Use `verify` command to check table schemas
- Choose a different environment with `--env` flag

#### 6. Table Not Found

**Error:**
```
One or more tables do not exist.
```

**Solutions:**
- Run the `create` command first to create tables
- Verify you are using the correct `--env` flag
- Check the `AWS_REGION` matches where tables were created
- Run `list` command to see existing tables

#### 7. Rate Limit Exceeded

**Error:**
```
AWS API rate limit exceeded.
```

**Solutions:**
- Wait a few seconds and try again
- Reduce the number of concurrent operations
- Check AWS Service Health Dashboard for service issues
- Contact AWS support to request limit increases

#### 8. Network Connection Failed

**Error:**
```
Network connection to AWS failed.
```

**Solutions:**
- Check your internet connection
- Verify firewall or proxy settings allow AWS API access
- Check AWS service endpoints are accessible
- Try a different AWS region with `--region` flag

#### 9. DynamoDB Local Connection Failed

**Error:**
```
✖ AWS credential validation failed
  › Error: connect ECONNREFUSED 127.0.0.1:8000
```

**Solutions:**
- Ensure DynamoDB Local Docker container is running:
  ```bash
  docker run -d -p 8000:8000 amazon/dynamodb-local
  ```
- Verify the endpoint URL: `--endpoint http://localhost:8000`
- Check Docker container status: `docker ps`
- Use dummy credentials for local testing:
  ```bash
  export AWS_ACCESS_KEY_ID="dummy"
  export AWS_SECRET_ACCESS_KEY="dummy"
  export AWS_REGION="us-east-1"
  ```

### Getting More Information

For detailed error information, run commands with the `--verbose` flag:

```bash
pnpm db-setup create --env dev --verbose
```

### Still Having Issues?

1. Check the [Prerequisites](#prerequisites) section
2. Verify your [AWS credentials](#aws-credentials-configuration)
3. Review the [IAM permissions](#iam-permissions)
4. Check AWS CloudTrail logs for API errors
5. Open an issue in the repository with:
   - Command you ran
   - Full error output
   - Output of `aws sts get-caller-identity`
   - AWS region and environment

---

## Additional Resources

- [AWS DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/)
- [DynamoDB Local Setup](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

---

## Development

### Running Tests

```bash
# Run all tests
pnpm nx test db-setup

# Run integration tests (requires DynamoDB Local)
pnpm nx test db-setup --testPathPattern=integration
```

### Building

```bash
# Build the tool
pnpm nx build db-setup

# Build and run
pnpm nx build db-setup && pnpm db-setup --help
```

### Project Structure

```
apps/db-setup/
├── src/
│   ├── commands/          # Command handlers
│   │   └── setup.ts       # Create command implementation
│   ├── config/            # Configuration
│   │   ├── environments.ts   # Environment definitions
│   │   └── table-schemas.ts  # DynamoDB table schemas
│   ├── services/          # Core services
│   │   ├── credential-validator.ts
│   │   ├── dynamodb-client.ts
│   │   └── table-creator.ts
│   ├── types/             # TypeScript types
│   │   └── schemas.ts     # Table item interfaces
│   ├── utils/             # Utilities
│   │   ├── error-handler.ts
│   │   ├── logger.ts
│   │   └── table-waiter.ts
│   └── main.ts            # CLI entry point
├── tests/                 # Integration tests
│   └── integration/
├── README.md              # This file
├── package.json
├── project.json           # Nx configuration
├── tsconfig.json
└── vitest.config.ts
```

---

## License

Copyright © 2025 OSEM Ladders Team