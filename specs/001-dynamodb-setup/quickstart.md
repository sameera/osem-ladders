# Quickstart Guide: DynamoDB Setup Tool

**Time Required**: 10 minutes
**Purpose**: Get DynamoDB tables set up for local development

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] Node.js 18+ installed (`node --version`)
- [ ] pnpm installed (`pnpm --version`)
- [ ] AWS account created
- [ ] AWS CLI installed (`aws --version`)
- [ ] AWS credentials configured

**Quick Check**:
```bash
node --version   # Should show v18.x or higher
pnpm --version   # Should show 8.x or higher
aws --version    # Should show aws-cli/2.x
aws sts get-caller-identity  # Should show your AWS account ID
```

If any checks fail, see [Full Prerequisites](#full-prerequisites) section below.

---

## 5-Minute Setup (Development Environment)

### Step 1: Navigate to Project Root

```bash
cd /path/to/osem-ladders
```

### Step 2: Install Dependencies

```bash
pnpm install
```

This installs all dependencies for the entire monorepo, including the DynamoDB setup tool.

### Step 3: Run Setup Command

```bash
pnpm db-setup setup
```

**Expected Output**:
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

### Step 4: Verify Setup

```bash
pnpm db-setup verify
```

**Expected Output**:
```
✓ Validating AWS credentials... Authenticated as: arn:aws:iam::123456789:user/dev-user
✓ Region: us-east-1

Verifying tables...
✓ osem-dev-Users (OK)
✓ osem-dev-Teams (OK)
✓ osem-dev-AssessmentPlans (OK)
✓ osem-dev-Assessments (OK)
✓ osem-dev-AssessmentReports (OK)
✓ osem-dev-ConfigVersions (OK)

✓ All checks passed! 6 tables verified in 1.8s
```

### Step 5: Confirm in AWS Console (Optional)

1. Open [AWS Console → DynamoDB](https://console.aws.amazon.com/dynamodbv2)
2. Region: `us-east-1` (or your configured region)
3. You should see 6 tables: `osem-dev-Users`, `osem-dev-Teams`, etc.

**Done!** Your DynamoDB tables are ready for development.

---

## Common Use Cases

### Setup Staging Environment

```bash
pnpm db-setup setup --env staging --region us-east-1
pnpm db-setup verify --env staging
```

### Setup Production Environment

**⚠️ Important**: Always use `--dry-run` first to preview changes

```bash
# 1. Preview changes (no tables created)
pnpm db-setup setup --env prod --region us-east-1 --dry-run

# 2. Review output carefully

# 3. If everything looks correct, run without --dry-run
pnpm db-setup setup --env prod --region us-east-1

# 4. Verify setup
pnpm db-setup verify --env prod
```

### Re-Run Setup (Idempotent)

If setup fails partway through, or you want to ensure tables are up-to-date:

```bash
pnpm db-setup setup
```

Existing tables are detected and verified (not recreated).

### Cleanup Development Tables

**⚠️ Warning**: This deletes all data!

```bash
pnpm db-setup delete-tables --env dev
```

---

## Troubleshooting

### Error: "Unable to locate credentials"

**Problem**: AWS credentials not configured

**Solution**:
```bash
# Option 1: Configure AWS CLI interactively
aws configure

# Enter when prompted:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (us-east-1)
# - Default output format (json)

# Option 2: Set environment variables
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=us-east-1
```

**Verify**:
```bash
aws sts get-caller-identity
```

### Error: "User is not authorized to perform: dynamodb:CreateTable"

**Problem**: AWS user lacks DynamoDB permissions

**Solution**: Add IAM policy with required permissions

1. Open [AWS Console → IAM → Users](https://console.aws.amazon.com/iam/home#/users)
2. Select your user
3. Click "Add permissions" → "Attach policies directly"
4. Search for "DynamoDB" and attach:
   - **AmazonDynamoDBFullAccess** (for development)
   - OR create custom policy (see [IAM Policy Example](#iam-policy-example) below)

**Verify**:
```bash
pnpm db-setup setup
```

### Error: "Table limit exceeded for account"

**Problem**: AWS account has too many tables (default limit: 256 per region)

**Solution**:

1. **Check current table count**:
   ```bash
   aws dynamodb list-tables --region us-east-1 | grep -c '"'
   ```

2. **Request limit increase** (fastest option):
   - Open [AWS Support → Service limit increase](https://console.aws.amazon.com/support/home#/case/create?issueType=service-limit-increase)
   - Service: DynamoDB
   - Request: Increase table limit to 512 (or desired number)
   - Justification: "Developing multi-tenant assessment platform"

3. **Delete unused tables** (alternative):
   ```bash
   # List all tables
   aws dynamodb list-tables --region us-east-1

   # Delete specific table
   aws dynamodb delete-table --table-name old-unused-table
   ```

### Error: "ResourceInUseException: Table already exists"

**Problem**: This shouldn't happen (setup command is idempotent), but if it does:

**Solution**:
```bash
# Option 1: Verify existing tables match expected schema
pnpm db-setup verify

# Option 2: Delete and recreate (⚠️ deletes all data!)
pnpm db-setup delete-tables --env dev
pnpm db-setup setup
```

### Setup is slow (>2 minutes)

**Problem**: AWS region latency or service load

**Workaround**:
- Use region closer to your location
- Run during off-peak hours
- Typical duration: 40-60 seconds (acceptable)

---

## Full Prerequisites

### 1. Node.js 18+ Installation

**macOS (Homebrew)**:
```bash
brew install node@18
```

**Ubuntu/Debian**:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Windows**:
Download from [nodejs.org](https://nodejs.org/) and run installer

**Verify**:
```bash
node --version  # Should show v18.x or higher
npm --version   # Should show 9.x or higher
```

### 2. pnpm Installation

```bash
npm install -g pnpm
```

**Verify**:
```bash
pnpm --version  # Should show 8.x or higher
```

### 3. AWS Account Creation

1. Go to [aws.amazon.com](https://aws.amazon.com/)
2. Click "Create an AWS Account"
3. Follow registration steps
4. Verify email and add payment method
5. Free tier includes 25 GB DynamoDB storage (sufficient for development)

### 4. AWS CLI Installation

**macOS (Homebrew)**:
```bash
brew install awscli
```

**Ubuntu/Debian**:
```bash
sudo apt install awscli
```

**Windows**:
Download from [AWS CLI Install Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

**Verify**:
```bash
aws --version  # Should show aws-cli/2.x
```

### 5. AWS Credentials Configuration

#### Option 1: Access Keys (Recommended for Development)

1. **Create Access Key**:
   - Open [AWS Console → IAM → Users](https://console.aws.amazon.com/iam/home#/users)
   - Select your user → "Security credentials" tab
   - Click "Create access key"
   - Purpose: "Command Line Interface (CLI)"
   - Save Access Key ID and Secret Access Key

2. **Configure AWS CLI**:
   ```bash
   aws configure
   ```
   Enter:
   - AWS Access Key ID: `<your-access-key-id>`
   - AWS Secret Access Key: `<your-secret-key>`
   - Default region: `us-east-1`
   - Default output format: `json`

3. **Verify**:
   ```bash
   aws sts get-caller-identity
   ```
   Should show your AWS account ID and user ARN

#### Option 2: AWS SSO (For Organizations)

1. **Configure SSO**:
   ```bash
   aws configure sso
   ```
   Follow prompts to authenticate with your organization's SSO

2. **Login**:
   ```bash
   aws sso login
   ```

3. **Verify**:
   ```bash
   aws sts get-caller-identity
   ```

### 6. IAM Permissions

#### IAM Policy Example (Minimal Permissions)

If you don't have admin access, request this policy be attached to your user:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:CreateTable",
        "dynamodb:DescribeTable",
        "dynamodb:UpdateTable",
        "dynamodb:DeleteTable",
        "dynamodb:ListTables"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/osem-*"
      ]
    }
  ]
}
```

**To attach**:
1. Open [AWS Console → IAM → Policies](https://console.aws.amazon.com/iam/home#/policies)
2. Click "Create policy"
3. JSON tab → Paste policy above
4. Name: `OSEMLaddersDynamoDBAccess`
5. Create policy
6. Attach to your user: IAM → Users → Your User → Add permissions → Attach policy

---

## Next Steps

After completing setup:

1. **Read Full Documentation**: [apps/db-setup/README.md](../../../apps/db-setup/README.md)
2. **Explore CLI Commands**:
   ```bash
   pnpm db-setup --help
   pnpm db-setup setup --help
   pnpm db-setup verify --help
   ```

3. **Review Data Model**: [data-model.md](./data-model.md)
4. **Start Development**:
   - Phase 2: Lambda functions for User/Team management
   - Phase 3: Team management UI
   - See [REDESIGN.md](../../../REDESIGN.md) for full roadmap

---

## Common Commands Reference

| Command | Description | Example |
|---------|-------------|---------|
| `pnpm db-setup setup` | Create all tables (dev env) | `pnpm db-setup setup` |
| `pnpm db-setup setup --env <env>` | Create tables for specific env | `pnpm db-setup setup --env prod` |
| `pnpm db-setup setup --dry-run` | Preview changes | `pnpm db-setup setup --env prod --dry-run` |
| `pnpm db-setup verify` | Validate table schemas | `pnpm db-setup verify` |
| `pnpm db-setup list-tables` | List existing tables | `pnpm db-setup list-tables --env dev` |
| `pnpm db-setup delete-tables` | Delete all tables (⚠️ data loss!) | `pnpm db-setup delete-tables --env dev` |
| `pnpm db-setup --help` | Show all commands | `pnpm db-setup --help` |

---

## FAQ

**Q: Can I run setup multiple times?**
A: Yes, setup is idempotent. Existing tables are verified, not recreated.

**Q: How much does DynamoDB cost?**
A: Free tier: 25 GB storage, 25 WCU, 25 RCU per month. Development usage typically stays within free tier. Production costs depend on read/write volume.

**Q: Can I use DynamoDB Local instead of AWS?**
A: Not for this setup tool (creates real AWS tables). For testing, see `apps/db-setup/tests/` for DynamoDB Local examples.

**Q: What if I want different table names?**
A: Set `OSEM_DB_PREFIX` environment variable:
```bash
export OSEM_DB_PREFIX="mycompany-dev-"
pnpm db-setup setup  # Creates mycompany-dev-Users, etc.
```

**Q: Can I setup multiple environments in one AWS account?**
A: Yes, use different `--env` values:
```bash
pnpm db-setup setup --env dev
pnpm db-setup setup --env staging
```
Tables are named `osem-{env}-{Table}`, so they don't conflict.

**Q: How do I delete all tables?**
A: ⚠️ **Warning: This deletes all data!**
```bash
pnpm db-setup delete-tables --env dev
```

---

## Support

**Issues**: [GitHub Issues](https://github.com/sameera/osem-ladders/issues)
**Documentation**: [Full README](../../../apps/db-setup/README.md)
**Constitution**: [constitution.md](../../../.specify/memory/constitution.md)
**Redesign Roadmap**: [REDESIGN.md](../../../REDESIGN.md)
