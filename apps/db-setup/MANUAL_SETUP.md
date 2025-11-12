# Manual DynamoDB Setup via AWS Console

This guide provides step-by-step instructions for creating the OSEM Ladders DynamoDB tables manually through the AWS Management Console, as an alternative to using the automated CLI tool.

## Table of Contents

- [When to Use This Guide](#when-to-use-this-guide)
- [Prerequisites](#prerequisites)
- [Table Naming Convention](#table-naming-convention)
- [Creating the Tables](#creating-the-tables)
  - [Table 1: Users](#table-1-users)
  - [Table 2: Teams](#table-2-teams)
  - [Table 3: AssessmentPlans](#table-3-assessmentplans)
  - [Table 4: Assessments](#table-4-assessments)
  - [Table 5: AssessmentReports](#table-5-assessmentreports)
  - [Table 6: ConfigVersions](#table-6-configversions)
- [Verification](#verification)
- [Quick Reference](#quick-reference)

---

## When to Use This Guide

Use this manual setup guide when:
- You prefer using the AWS Console over CLI tools
- You don't have Node.js/pnpm installed locally
- You're learning DynamoDB and want to understand each configuration step
- You need to create tables in environments where the CLI tool can't run
- You're troubleshooting or auditing existing table configurations

For automated setup, see the main [README.md](README.md) for the CLI tool.

---

## Prerequisites

Before starting, ensure you have:

1. **AWS Account** with access to DynamoDB
2. **IAM Permissions** to create and manage DynamoDB tables (see [README.md](README.md#iam-permissions))
3. **AWS Region** selected (e.g., `us-east-1`, `us-west-2`)
4. **Environment** decided (`dev`, `staging`, `prod`, or `local`)

### Accessing the AWS Console

1. Navigate to the [AWS Management Console](https://console.aws.amazon.com/)
2. Sign in with your credentials
3. Select your target AWS region from the top-right dropdown
4. Navigate to **Services** > **Database** > **DynamoDB**

---

## Table Naming Convention

All tables must follow this naming pattern:

```
osem-{environment}-{TableName}
```

### Examples

For the **dev** environment:
- `osem-dev-Users`
- `osem-dev-Teams`
- `osem-dev-AssessmentPlans`
- `osem-dev-Assessments`
- `osem-dev-AssessmentReports`
- `osem-dev-ConfigVersions`

For **production**:
- `osem-prod-Users`
- `osem-prod-Teams`
- etc.

Replace `{environment}` with your target environment throughout this guide.

---

## Creating the Tables

You will create 6 tables in total. Each section below provides detailed steps for one table.

### Table 1: Users

**Purpose**: Store user profiles and authentication information from Microsoft 365/Cognito.

**Schema**:
- **Partition Key**: `userId` (String) - Cognito sub/UUID
- **GSIs**: None

#### Steps

1. In the DynamoDB console, click **Tables** > **Create table**

2. **Table details**:
   - **Table name**: `osem-dev-Users` (replace `dev` with your environment)
   - **Partition key**: `userId`
   - **Partition key type**: String
   - **Sort key**: Leave unchecked

3. **Table settings**:
   - Select **Customize settings**
   - **Table class**: DynamoDB Standard
   - **Read/write capacity settings**: On-demand

4. **Secondary indexes**:
   - Skip this section (no GSIs needed)

5. **Encryption at rest**:
   - **Encryption type**: Owned by Amazon DynamoDB (default)

6. **Tags** (optional but recommended):
   - Click **Add new tag**
   - Tag 1: Key = `Environment`, Value = `dev`
   - Tag 2: Key = `Application`, Value = `osem-ladders`

7. Click **Create table**

8. Wait for table status to change to **Active** (usually 10-30 seconds)

---

### Table 2: Teams

**Purpose**: Store team metadata, manager assignments, and team membership.

**Schema**:
- **Partition Key**: `teamId` (String) - UUID
- **GSIs**:
  - `managerId-index` - Query teams by manager

#### Steps

1. Click **Create table**

2. **Table details**:
   - **Table name**: `osem-dev-Teams`
   - **Partition key**: `teamId`
   - **Partition key type**: String
   - **Sort key**: Leave unchecked

3. **Table settings**:
   - Select **Customize settings**
   - **Table class**: DynamoDB Standard
   - **Read/write capacity settings**: On-demand

4. **Secondary indexes**:
   - Click **Create global index**
   - **Index name**: `managerId-index`
   - **Partition key**: `managerId`
   - **Partition key type**: String
   - **Sort key**: Leave unchecked
   - **Attribute projections**: All
   - Click **Create index**

5. **Encryption at rest**:
   - **Encryption type**: Owned by Amazon DynamoDB

6. **Tags**:
   - Tag 1: `Environment` = `dev`
   - Tag 2: `Application` = `osem-ladders`

7. Click **Create table**

8. Wait for table status to become **Active**

---

### Table 3: AssessmentPlans

**Purpose**: Store assessment plan configurations, schedules, and status.

**Schema**:
- **Partition Key**: `planId` (String) - UUID
- **GSIs**:
  - `teamId-index` - Query plans by team
  - `status-index` - Query plans by status

#### Steps

1. Click **Create table**

2. **Table details**:
   - **Table name**: `osem-dev-AssessmentPlans`
   - **Partition key**: `planId`
   - **Partition key type**: String
   - **Sort key**: Leave unchecked

3. **Table settings**:
   - Select **Customize settings**
   - **Table class**: DynamoDB Standard
   - **Read/write capacity settings**: On-demand

4. **Secondary indexes**:

   **First GSI**:
   - Click **Create global index**
   - **Index name**: `teamId-index`
   - **Partition key**: `teamId`
   - **Partition key type**: String
   - **Sort key**: Leave unchecked
   - **Attribute projections**: All
   - Click **Create index**

   **Second GSI**:
   - Click **Create global index**
   - **Index name**: `status-index`
   - **Partition key**: `status`
   - **Partition key type**: String
   - **Sort key**: Leave unchecked
   - **Attribute projections**: All
   - Click **Create index**

5. **Encryption at rest**:
   - **Encryption type**: Owned by Amazon DynamoDB

6. **Tags**:
   - Tag 1: `Environment` = `dev`
   - Tag 2: `Application` = `osem-ladders`

7. Click **Create table**

8. Wait for table and all GSIs to become **Active**

---

### Table 4: Assessments

**Purpose**: Store individual self-assessments and manager assessments.

**Schema**:
- **Partition Key**: `assessmentId` (String) - UUID
- **GSIs**:
  - `planId-teamMemberId-index` - Query assessments by plan and team member (composite)
  - `teamMemberId-index` - Query all assessments for a team member

#### Steps

1. Click **Create table**

2. **Table details**:
   - **Table name**: `osem-dev-Assessments`
   - **Partition key**: `assessmentId`
   - **Partition key type**: String
   - **Sort key**: Leave unchecked

3. **Table settings**:
   - Select **Customize settings**
   - **Table class**: DynamoDB Standard
   - **Read/write capacity settings**: On-demand

4. **Secondary indexes**:

   **First GSI** (Composite key):
   - Click **Create global index**
   - **Index name**: `planId-teamMemberId-index`
   - **Partition key**: `planId`
   - **Partition key type**: String
   - **Sort key**: Check this box
   - **Sort key name**: `teamMemberId`
   - **Sort key type**: String
   - **Attribute projections**: All
   - Click **Create index**

   **Second GSI**:
   - Click **Create global index**
   - **Index name**: `teamMemberId-index`
   - **Partition key**: `teamMemberId`
   - **Partition key type**: String
   - **Sort key**: Leave unchecked
   - **Attribute projections**: All
   - Click **Create index**

5. **Encryption at rest**:
   - **Encryption type**: Owned by Amazon DynamoDB

6. **Tags**:
   - Tag 1: `Environment` = `dev`
   - Tag 2: `Application` = `osem-ladders`

7. Click **Create table**

8. Wait for table and all GSIs to become **Active**

---

### Table 5: AssessmentReports

**Purpose**: Store final assessment reports with variance analysis between self and manager assessments.

**Schema**:
- **Partition Key**: `reportId` (String) - UUID
- **GSIs**:
  - `planId-index` - Query reports by plan
  - `teamMemberId-index` - Query reports by team member

#### Steps

1. Click **Create table**

2. **Table details**:
   - **Table name**: `osem-dev-AssessmentReports`
   - **Partition key**: `reportId`
   - **Partition key type**: String
   - **Sort key**: Leave unchecked

3. **Table settings**:
   - Select **Customize settings**
   - **Table class**: DynamoDB Standard
   - **Read/write capacity settings**: On-demand

4. **Secondary indexes**:

   **First GSI**:
   - Click **Create global index**
   - **Index name**: `planId-index`
   - **Partition key**: `planId`
   - **Partition key type**: String
   - **Sort key**: Leave unchecked
   - **Attribute projections**: All
   - Click **Create index**

   **Second GSI**:
   - Click **Create global index**
   - **Index name**: `teamMemberId-index`
   - **Partition key**: `teamMemberId`
   - **Partition key type**: String
   - **Sort key**: Leave unchecked
   - **Attribute projections**: All
   - Click **Create index**

5. **Encryption at rest**:
   - **Encryption type**: Owned by Amazon DynamoDB

6. **Tags**:
   - Tag 1: `Environment` = `dev`
   - Tag 2: `Application` = `osem-ladders`

7. Click **Create table**

8. Wait for table and all GSIs to become **Active**

---

### Table 6: ConfigVersions

**Purpose**: Store career ladder configuration versions with markdown content and parsed structure.

**Schema**:
- **Partition Key**: `configId` (String) - UUID
- **GSIs**:
  - `isActive-index` - Query for active configurations (composite with createdAt sort)

#### Steps

1. Click **Create table**

2. **Table details**:
   - **Table name**: `osem-dev-ConfigVersions`
   - **Partition key**: `configId`
   - **Partition key type**: String
   - **Sort key**: Leave unchecked

3. **Table settings**:
   - Select **Customize settings**
   - **Table class**: DynamoDB Standard
   - **Read/write capacity settings**: On-demand

4. **Secondary indexes**:

   **GSI** (Composite key):
   - Click **Create global index**
   - **Index name**: `isActive-index`
   - **Partition key**: `isActive`
   - **Partition key type**: Number
   - **Sort key**: Check this box
   - **Sort key name**: `createdAt`
   - **Sort key type**: Number
   - **Attribute projections**: All
   - Click **Create index**

5. **Encryption at rest**:
   - **Encryption type**: Owned by Amazon DynamoDB

6. **Tags**:
   - Tag 1: `Environment` = `dev`
   - Tag 2: `Application` = `osem-ladders`

7. Click **Create table**

8. Wait for table and GSI to become **Active**

---

## Verification

After creating all 6 tables, verify your setup:

### 1. List All Tables

1. In the DynamoDB console, navigate to **Tables**
2. You should see all 6 tables listed with your environment prefix:
   - `osem-dev-Users`
   - `osem-dev-Teams`
   - `osem-dev-AssessmentPlans`
   - `osem-dev-Assessments`
   - `osem-dev-AssessmentReports`
   - `osem-dev-ConfigVersions`

### 2. Verify Each Table

For each table, click on its name and verify:

**Overview Tab**:
- Status: **Active** (green indicator)
- Table class: **DynamoDB Standard**
- Deletion protection: **Disabled** (unless you enabled it)

**Indexes Tab**:
- Verify the correct number and names of GSIs:
  - Users: 0 GSIs
  - Teams: 1 GSI (`managerId-index`)
  - AssessmentPlans: 2 GSIs (`teamId-index`, `status-index`)
  - Assessments: 2 GSIs (`planId-teamMemberId-index`, `teamMemberId-index`)
  - AssessmentReports: 2 GSIs (`planId-index`, `teamMemberId-index`)
  - ConfigVersions: 1 GSI (`isActive-index`)
- All GSI statuses should be **Active**

**Additional settings Tab**:
- Capacity mode: **On-demand**
- Encryption: **Owned by Amazon DynamoDB**

**Tags Tab**:
- Verify the tags are present:
  - `Environment` = `dev` (or your environment)
  - `Application` = `osem-ladders`

### 3. Test Table Access

To test that the tables are accessible:

1. Click on any table (e.g., `osem-dev-Users`)
2. Go to **Explore table items**
3. You should see an empty table with no items (this is expected for a new setup)
4. If you see "Access denied" errors, check your IAM permissions

---

## Quick Reference

### All Tables Summary

| Table Name | Partition Key | Sort Key | GSI Count | GSI Details |
|-----------|---------------|----------|-----------|-------------|
| Users | userId (S) | - | 0 | None |
| Teams | teamId (S) | - | 1 | managerId-index |
| AssessmentPlans | planId (S) | - | 2 | teamId-index, status-index |
| Assessments | assessmentId (S) | - | 2 | planId-teamMemberId-index, teamMemberId-index |
| AssessmentReports | reportId (S) | - | 2 | planId-index, teamMemberId-index |
| ConfigVersions | configId (S) | - | 1 | isActive-index (PK: isActive(N), SK: createdAt(N)) |

**Legend**:
- S = String
- N = Number
- PK = Partition Key
- SK = Sort Key

### Common Table Settings (All Tables)

| Setting | Value |
|---------|-------|
| Table class | DynamoDB Standard |
| Capacity mode | On-demand |
| Encryption | Owned by Amazon DynamoDB |
| Point-in-time recovery | Disabled (default) |
| Deletion protection | Disabled (default) |
| Tags | Environment={env}, Application=osem-ladders |

### GSI Configuration Details

#### Teams Table
- **managerId-index**: Query teams managed by a specific user
  - Partition Key: `managerId` (String)
  - Projection: All

#### AssessmentPlans Table
- **teamId-index**: Query plans for a specific team
  - Partition Key: `teamId` (String)
  - Projection: All

- **status-index**: Query plans by status (draft/active/completed/archived)
  - Partition Key: `status` (String)
  - Projection: All

#### Assessments Table
- **planId-teamMemberId-index**: Query assessments for a specific plan and team member
  - Partition Key: `planId` (String)
  - Sort Key: `teamMemberId` (String)
  - Projection: All

- **teamMemberId-index**: Query all assessments for a specific team member
  - Partition Key: `teamMemberId` (String)
  - Projection: All

#### AssessmentReports Table
- **planId-index**: Query reports for a specific plan
  - Partition Key: `planId` (String)
  - Projection: All

- **teamMemberId-index**: Query reports for a specific team member
  - Partition Key: `teamMemberId` (String)
  - Projection: All

#### ConfigVersions Table
- **isActive-index**: Query active configurations sorted by creation date
  - Partition Key: `isActive` (Number) - 0 or 1
  - Sort Key: `createdAt` (Number) - Unix timestamp in milliseconds
  - Projection: All

---

## Next Steps

After creating all tables:

1. **Update Application Configuration**: Update your application's DynamoDB table name configuration to match the environment you created
2. **Test Connectivity**: Use the AWS SDK or AWS CLI to verify you can access the tables
3. **Consider Backups**: Enable point-in-time recovery for production environments
4. **Enable Deletion Protection**: For production tables, enable deletion protection to prevent accidental deletion
5. **Monitor Costs**: Set up CloudWatch alarms for unexpected costs (on-demand pricing can scale with usage)

---

## Troubleshooting

### Table Creation Failed

**Error**: "Table already exists"
- **Solution**: The table name is already in use. Check if you've already created this table, or choose a different environment prefix.

**Error**: "Access Denied"
- **Solution**: Your IAM user/role lacks permissions. See [README.md](README.md#iam-permissions) for required permissions.

### GSI Creation Failed

**Error**: "Attribute not defined"
- **Solution**: DynamoDB requires all GSI key attributes to be defined. Verify you've specified the correct attribute names and types.

### Can't Find Created Tables

- Verify you're in the correct AWS region (top-right dropdown in console)
- Check the table name matches your environment prefix
- Refresh the DynamoDB console page

### Tags Not Showing

- Tags are optional and don't affect functionality
- Verify you clicked "Add new tag" and entered both Key and Value before creating the table
- You can add tags after creation by selecting the table > **Tags** tab > **Manage tags**

---

## Additional Resources

- [AWS DynamoDB Console Documentation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ConsoleDynamoDB.html)
- [Creating Tables in DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/WorkingWithTables.Basics.html#WorkingWithTables.Basics.CreateTable)
- [DynamoDB Global Secondary Indexes](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Main README.md](README.md) - Automated CLI tool documentation

---

## Comparison: Manual vs Automated Setup

| Aspect | Manual Console | Automated CLI |
|--------|---------------|---------------|
| **Time Required** | 15-20 minutes | 1-2 minutes |
| **Error Prone** | Manual entry can lead to typos | Consistent, tested |
| **Learning Curve** | Visual, easier for beginners | Requires CLI familiarity |
| **Repeatability** | Manual for each environment | Script once, run anywhere |
| **Verification** | Manual inspection | Automated validation |
| **Best For** | Learning, one-time setup | CI/CD, multiple environments |

For production deployments and multiple environments, we recommend using the automated CLI tool described in [README.md](README.md).

---

**Last Updated**: 2025-01-11
**Compatible With**: AWS DynamoDB Console (current version)
**Tested Regions**: us-east-1, us-west-2, eu-west-1
