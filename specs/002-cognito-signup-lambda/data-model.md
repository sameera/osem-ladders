# Data Model: Users Table Schema (Email-Based userId)

**Feature**: Cognito Post-Signup User Provisioning
**Date**: 2025-11-13
**Status**: Ready for Implementation
**Related Spec**: [spec.md](spec.md)
**Research**: [research.md](research.md)

## Overview

This document defines the Users table schema updates required for the Cognito Post-Signup Lambda function. The primary change is using **email addresses as userId** (partition key) instead of Cognito sub UUIDs, with Cognito sub stored separately as `cognitoSub`.

**Architectural Decision**: Email-based user identity (see [CONSTITUTION_UPDATE.md](CONSTITUTION_UPDATE.md))

## Users Table Schema

### Table Configuration

**Table Name**: `osem-{env}-Users` (e.g., `osem-dev-Users`, `osem-prod-Users`)
**Billing Mode**: On-demand (per constitution)
**Partition Key**: `userId` (String) - **Email address**
**Sort Key**: None
**Global Secondary Indexes**: None required for this feature

**Key Change from Original Schema** (specs/001-dynamodb-setup/data-model.md):
- Original: `userId` = Cognito `sub` UUID (e.g., "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")
- Updated: `userId` = Email address (e.g., "jane.doe@company.com")
- New attribute: `cognitoSub` = Cognito `sub` UUID for reference

### Attributes

| Attribute | Type | Required | Description | Set By | Updated By |
|-----------|------|----------|-------------|--------|------------|
| **userId** | String | Yes | User email address (partition key) | Lambda on signup | Immutable |
| **email** | String | Yes | User email (duplicate of userId for clarity) | Lambda on signup | Immutable |
| **cognitoSub** | String | Yes* | Cognito sub UUID (immutable Cognito identifier) | Lambda on signup | Lambda on signup |
| **name** | String | Yes | Display name from Microsoft 365 | Lambda on signup or Admin | Admin (role mgmt) |
| **roles** | String Set | Yes | User roles: 'admin', 'manager', 'team_member' | Lambda (default) or Admin | Admin (role mgmt) |
| **createdAt** | Number | Yes | Unix timestamp in milliseconds | Lambda on signup | Immutable |
| **updatedAt** | Number | Yes | Unix timestamp in milliseconds | Lambda on signup | Lambda on every update |

**Note**: `cognitoSub` is required after first Cognito authentication. Pre-created users may not have `cognitoSub` initially.

### DynamoDB Type Definitions

```typescript
// TypeScript interface (for Lambda and API functions)
interface UserItem {
  userId: string;        // Partition key (email)
  email: string;         // Email address (same as userId)
  cognitoSub?: string;   // Cognito sub UUID (populated on first auth)
  name: string;          // Display name
  roles: Set<string>;    // String Set: ['admin'], ['manager'], ['team_member'], etc.
  createdAt: number;     // Unix milliseconds
  updatedAt: number;     // Unix milliseconds
}
```

### DynamoDB Schema Definition

```typescript
// AWS SDK v3 CreateTableCommand input
{
  TableName: "osem-{env}-Users",
  KeySchema: [
    { AttributeName: "userId", KeyType: "HASH" } // Email as partition key
  ],
  AttributeDefinitions: [
    { AttributeName: "userId", AttributeType: "S" } // String type
  ],
  BillingMode: "PAY_PER_REQUEST",
  StreamSpecification: {
    StreamEnabled: false // No DynamoDB Streams needed for this feature
  },
  SSESpecification: {
    Enabled: true, // Encryption at rest (AWS-managed keys)
    SSEType: "KMS",
    KMSMasterKeyId: "alias/aws/dynamodb" // Default AWS-managed key
  },
  Tags: [
    { Key: "Environment", Value: "{env}" },
    { Key: "Application", Value: "osem-ladders" },
    { Key: "Feature", Value: "002-cognito-signup-lambda" }
  ]
}
```

## Access Patterns

### Lambda Post-Signup Access Patterns

1. **Check if user exists + update/create**:
   - Operation: `UpdateItem` with `if_not_exists()` expressions
   - Key: `{ userId: email }`
   - Attributes: Sets `cognitoSub`, preserves `roles`/`name` if exists, creates with defaults if new
   - Idempotent: Safe to retry

### Future API Access Patterns (not in this feature)

2. **Get user by email (userId)**:
   - Operation: `GetItem`
   - Key: `{ userId: email }`
   - Use case: Authorization checks, profile lookups

3. **List all users (admin only)**:
   - Operation: `Scan` with pagination
   - Use case: Admin user management UI
   - **Warning**: Expensive for large user counts; consider GSI if needed

## Example Items

### Example 1: Pre-Created Admin User (Before Cognito Auth)

```json
{
  "userId": "admin@company.com",
  "email": "admin@company.com",
  "name": "System Administrator",
  "roles": ["admin"],
  "createdAt": 1699900000000,
  "updatedAt": 1699900000000
}
```

**Note**: No `cognitoSub` yet. Added when admin authenticates via Cognito.

### Example 2: Pre-Created Admin User (After Cognito Auth)

```json
{
  "userId": "admin@company.com",
  "email": "admin@company.com",
  "cognitoSub": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "name": "System Administrator",
  "roles": ["admin"],
  "createdAt": 1699900000000,
  "updatedAt": 1700000000000
}
```

**Change**: Lambda added `cognitoSub` and updated `updatedAt`.

### Example 3: Auto-Provisioned User (New User, Not Pre-Created)

```json
{
  "userId": "jane.doe@company.com",
  "email": "jane.doe@company.com",
  "cognitoSub": "bbbbbbbb-cccc-dddd-eeee-ffffffffffff",
  "name": "Jane Doe",
  "roles": ["team_member"],
  "createdAt": 1700100000000,
  "updatedAt": 1700100000000
}
```

**Note**: Lambda created entire record with default `team_member` role.

### Example 4: Manager with Multiple Roles

```json
{
  "userId": "manager@company.com",
  "email": "manager@company.com",
  "cognitoSub": "cccccccc-dddd-eeee-ffff-000000000000",
  "name": "Engineering Manager",
  "roles": ["manager", "team_member"],
  "createdAt": 1699950000000,
  "updatedAt": 1700050000000
}
```

**Note**: User has both `manager` and `team_member` roles (dual-role scenario per constitution).

## Data Integrity Constraints

### Validation Rules

**Email Format** (userId):
- Must be valid email format (validated by Cognito)
- Case-insensitive (DynamoDB queries are case-sensitive, handle lowercasing in application layer)
- Immutable (email changes create new user record per architectural decision)

**Cognito Sub** (cognitoSub):
- UUID format from Cognito
- Immutable once set
- Required after first Cognito authentication
- Optional for pre-created users (populated on first login)

**Roles** (roles):
- Must be one of: `admin`, `manager`, `team_member`
- String Set (DynamoDB native type, prevents duplicates)
- Minimum one role required
- Multiple roles allowed (dual-role scenarios)

**Timestamps**:
- Unix milliseconds (Number type)
- `createdAt`: Set once, never modified
- `updatedAt`: Modified on every write operation

### Conditional Expressions

**Lambda UpdateItem Conditional Logic**:

```typescript
UpdateExpression: `
  SET cognitoSub = :cognitoSub,                              // Always update
      #name = if_not_exists(#name, :name),                   // Preserve existing
      roles = if_not_exists(roles, :defaultRoles),           // Preserve existing
      updatedAt = :updatedAt,                                // Always update
      createdAt = if_not_exists(createdAt, :createdAt)       // Set only if new
`
```

**Behavior**:
- **Existing user**: Only `cognitoSub` and `updatedAt` change; `name` and `roles` preserved
- **New user**: All attributes set with defaults (`roles: ['team_member']`, `name` from Microsoft 365)

## Constitutional Compliance

### Entity Design Requirements (Constitution Section: Data Model Governance)

✅ **Audit fields present**: `createdAt`, `updatedAt` (Unix milliseconds)
⚠️ **createdBy field**: Not applicable (system-created users, no createdBy userId)
✅ **UUID IDs**: Exception granted - `userId` is email, but `cognitoSub` stores UUID for reference
✅ **Explicit booleans**: N/A (no boolean flags in Users table)
✅ **Soft deletes**: Not implemented for Users (users are deactivated by removing roles, not setting `isActive: false`)

### DynamoDB Schema Standards

✅ **Single-attribute partition key**: `userId` (email) ensures even distribution
✅ **Native DynamoDB types**: `roles` uses String Set (not JSON string)
✅ **Proper key design**: Email distribution prevents hot partitions (no org-wide partition key)
✅ **No scans required**: Lambda uses `GetItem` equivalent via `UpdateItem` with Key

### Security Requirements

✅ **Encryption at rest**: AWS-managed KMS keys
✅ **No PII in logs**: Lambda logs userId (email) only, not name or cognitoSub
✅ **Data protection**: DynamoDB encryption + TLS in transit

## Migration from Original Schema

### Changes Required to 001-dynamodb-setup

**File**: `specs/001-dynamodb-setup/data-model.md` (lines 22-65)

**Changes**:

1. **userId definition**:
   ```diff
   - userId (String) - Cognito sub UUID
   + userId (String) - User email address (partition key)
   ```

2. **Add cognitoSub attribute**:
   ```diff
   + cognitoSub (String) - Cognito sub UUID for reference
   ```

3. **Update attribute table**:
   ```diff
   | Attribute | Type | Description |
   - | userId | String | Cognito sub (UUID), partition key |
   + | userId | String | User email address, partition key |
   + | cognitoSub | String | Cognito sub (UUID) for reference |
   ```

4. **Update access patterns**:
   ```diff
   - 1. Get user by ID: GetItem(userId) where userId = Cognito sub
   + 1. Get user by email: GetItem(userId) where userId = email
   ```

### Schema Migration Strategy

**For existing deployments** (if any):

1. **Backup existing Users table**
2. **Create new Users table** with email-based schema
3. **Data migration script**:
   - Read all items from old table (userId = Cognito sub)
   - Transform: `newUserId = item.email`, `cognitoSub = oldUserId`
   - Write to new table
   - Validate count matches
4. **Update all foreign key references** in Teams, Assessments, etc. (use email instead of sub)
5. **Switch application to new table**
6. **Archive old table**

**For new deployments**: Create Users table with email-based schema from start (no migration needed).

## References

- **Architectural Decision**: [CONSTITUTION_UPDATE.md](CONSTITUTION_UPDATE.md) - Email-based user identity rationale
- **Research**: [research.md](research.md) - DynamoDB update patterns, if_not_exists() logic
- **Original Schema**: `specs/001-dynamodb-setup/data-model.md` - Users table (Cognito sub-based, to be updated)
- **Constitution**: `.specify/memory/constitution.md` - Data Model Governance requirements
- **Feature Spec**: [spec.md](spec.md) - User provisioning requirements

---

**Status**: ✅ Schema defined, ready for implementation
**Next Step**: Create Lambda function (`apps/lambda-functions/cognito-post-signup/`)
