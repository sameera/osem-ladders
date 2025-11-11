# Data Model: DynamoDB Tables for OSEM Ladders

**Feature**: DynamoDB Setup Tool
**Date**: 2025-11-10
**Source**: REDESIGN.md lines 56-158
**Status**: Ready for Implementation

## Overview

This document defines the 6 DynamoDB tables required for the OSEM Ladders organizational assessment platform. All schemas follow the constitution requirements for audit fields, data types, and access patterns.

**Key Design Principles**:
- Single-attribute partition keys (UUID strings) for even distribution
- Global Secondary Indexes (GSIs) for query access patterns
- On-demand billing mode (per constitution)
- DynamoDB Map type for nested structures
- Unix milliseconds (Number) for all timestamps
- Encryption at rest with AWS-managed keys (default)

---

## Table 1: Users

**Purpose**: Store user profiles extending Cognito authentication data

**Primary Key**:
- Partition Key: `userId` (String) - Cognito sub UUID

**Attributes**:

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | String | Yes | Cognito sub (UUID), partition key |
| email | String | Yes | From Cognito/Microsoft 365 |
| name | String | Yes | Display name from Microsoft 365 |
| roles | String Set | Yes | `['admin', 'manager', 'team_member']` |
| createdAt | Number | Yes | Unix timestamp (milliseconds) |
| updatedAt | Number | Yes | Unix timestamp (milliseconds) |

**Global Secondary Indexes**: None (lookups by userId only)

**DynamoDB Schema**:

```typescript
{
  TableName: "osem-{env}-Users",
  KeySchema: [
    { AttributeName: "userId", KeyType: "HASH" }
  ],
  AttributeDefinitions: [
    { AttributeName: "userId", AttributeType: "S" }
  ],
  BillingMode: "PAY_PER_REQUEST",
  Tags: [
    { Key: "Environment", Value: "{env}" },
    { Key: "Application", Value: "osem-ladders" }
  ]
}
```

**Access Patterns**:
1. Get user by ID: `GetItem(userId)`
2. List all users: `Scan` (admin only, paginated)

---

## Table 2: Teams

**Purpose**: Store team metadata and membership

**Primary Key**:
- Partition Key: `teamId` (String) - UUID

**Attributes**:

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| teamId | String | Yes | UUID, partition key |
| teamName | String | Yes | Display name |
| description | String | No | Optional team description |
| managerId | String | Yes | User ID of manager (GSI key) |
| memberIds | String Set | Yes | Array of User IDs |
| createdBy | String | Yes | User ID (admin or manager) |
| createdAt | Number | Yes | Unix timestamp (milliseconds) |
| updatedAt | Number | Yes | Unix timestamp (milliseconds) |
| isActive | Boolean | Yes | Soft delete flag |

**Global Secondary Indexes**:

1. **managerId-index**:
   - Partition Key: `managerId` (String)
   - Projection: ALL
   - Purpose: Find all teams managed by a user

**DynamoDB Schema**:

```typescript
{
  TableName: "osem-{env}-Teams",
  KeySchema: [
    { AttributeName: "teamId", KeyType: "HASH" }
  ],
  AttributeDefinitions: [
    { AttributeName: "teamId", AttributeType: "S" },
    { AttributeName: "managerId", AttributeType: "S" }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "managerId-index",
      KeySchema: [
        { AttributeName: "managerId", KeyType: "HASH" }
      ],
      Projection: { ProjectionType: "ALL" }
    }
  ],
  BillingMode: "PAY_PER_REQUEST",
  Tags: [
    { Key: "Environment", Value: "{env}" },
    { Key: "Application", Value: "osem-ladders" }
  ]
}
```

**Access Patterns**:
1. Get team by ID: `GetItem(teamId)`
2. List teams for manager: `Query(managerId-index, managerId = X)`
3. List all teams: `Scan` (admin only, paginated, filter isActive=true)

---

## Table 3: AssessmentPlans

**Purpose**: Store assessment plan metadata (seasonal reviews)

**Primary Key**:
- Partition Key: `planId` (String) - UUID

**Attributes**:

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| planId | String | Yes | UUID, partition key |
| teamId | String | Yes | Team this plan belongs to (GSI key) |
| planName | String | Yes | e.g., "Q1 2025 Review" |
| description | String | No | Optional plan description |
| season | String | Yes | e.g., "2025-Q1", "H1-2025" |
| startDate | Number | Yes | Unix timestamp (milliseconds) |
| endDate | Number | Yes | Unix timestamp (milliseconds) |
| status | String | Yes | 'draft', 'active', 'completed', 'archived' (GSI key) |
| configVersion | String | Yes | Reference to career ladder config version |
| createdBy | String | Yes | User ID |
| createdAt | Number | Yes | Unix timestamp (milliseconds) |
| updatedAt | Number | Yes | Unix timestamp (milliseconds) |

**Global Secondary Indexes**:

1. **teamId-index**:
   - Partition Key: `teamId` (String)
   - Projection: ALL
   - Purpose: Find all plans for a team

2. **status-index**:
   - Partition Key: `status` (String)
   - Projection: ALL
   - Purpose: Find all active/archived plans

**DynamoDB Schema**:

```typescript
{
  TableName: "osem-{env}-AssessmentPlans",
  KeySchema: [
    { AttributeName: "planId", KeyType: "HASH" }
  ],
  AttributeDefinitions: [
    { AttributeName: "planId", AttributeType: "S" },
    { AttributeName: "teamId", AttributeType: "S" },
    { AttributeName: "status", AttributeType: "S" }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "teamId-index",
      KeySchema: [
        { AttributeName: "teamId", KeyType: "HASH" }
      ],
      Projection: { ProjectionType: "ALL" }
    },
    {
      IndexName: "status-index",
      KeySchema: [
        { AttributeName: "status", KeyType: "HASH" }
      ],
      Projection: { ProjectionType: "ALL" }
    }
  ],
  BillingMode: "PAY_PER_REQUEST",
  Tags: [
    { Key: "Environment", Value: "{env}" },
    { Key: "Application", Value: "osem-ladders" }
  ]
}
```

**Access Patterns**:
1. Get plan by ID: `GetItem(planId)`
2. List plans for team: `Query(teamId-index, teamId = X)`
3. List active plans: `Query(status-index, status = 'active')`
4. List completed plans: `Query(status-index, status = 'completed')`

---

## Table 4: Assessments

**Purpose**: Store individual assessment instances (self and manager assessments)

**Primary Key**:
- Partition Key: `assessmentId` (String) - UUID

**Attributes**:

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| assessmentId | String | Yes | UUID, partition key |
| planId | String | Yes | Reference to AssessmentPlan (GSI key) |
| teamId | String | Yes | Team context |
| teamMemberId | String | Yes | User ID being assessed (GSI key) |
| assessmentType | String | Yes | 'self' or 'manager' |
| assessorId | String | Yes | User ID who did the assessment |
| selections | Map | Yes | `{ category: { competency: level }}` (Numbers) |
| feedback | Map | Yes | Nested feedback structure (see below) |
| currentLevel | Number | Yes | Overall career level |
| wayForward | String | No | Optional career development notes |
| status | String | Yes | 'not_started', 'in_progress', 'submitted' |
| submittedAt | Number | No | Unix timestamp (milliseconds), only if submitted |
| createdAt | Number | Yes | Unix timestamp (milliseconds) |
| updatedAt | Number | Yes | Unix timestamp (milliseconds) |

**Nested Structures**:

```typescript
// selections structure (DynamoDB Map)
{
  "Technical Execution": {
    "Coding": 3,
    "System Design": 4
  },
  "Impact": {
    "Project Leadership": 3
  }
}

// feedback structure (DynamoDB Map of Maps)
{
  "Technical Execution": {
    "Coding": {
      "3": {
        "evidence": "Led migration to microservices architecture...",
        "nextLevelFeedback": "Demonstrate system design for distributed systems..."
      }
    },
    "System Design": {
      "4": {
        "evidence": "Designed scalable data pipeline...",
        "nextLevelFeedback": "Lead architectural discussions across teams..."
      }
    }
  }
}
```

**Global Secondary Indexes**:

1. **planId-teamMemberId-index**:
   - Partition Key: `planId` (String)
   - Sort Key: `teamMemberId` (String)
   - Projection: ALL
   - Purpose: Find assessments for a specific plan member (both self and manager)

2. **teamMemberId-index**:
   - Partition Key: `teamMemberId` (String)
   - Projection: ALL
   - Purpose: Find all assessments for a user across all plans

**DynamoDB Schema**:

```typescript
{
  TableName: "osem-{env}-Assessments",
  KeySchema: [
    { AttributeName: "assessmentId", KeyType: "HASH" }
  ],
  AttributeDefinitions: [
    { AttributeName: "assessmentId", AttributeType: "S" },
    { AttributeName: "planId", AttributeType: "S" },
    { AttributeName: "teamMemberId", AttributeType: "S" }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "planId-teamMemberId-index",
      KeySchema: [
        { AttributeName: "planId", KeyType: "HASH" },
        { AttributeName: "teamMemberId", KeyType: "RANGE" }
      ],
      Projection: { ProjectionType: "ALL" }
    },
    {
      IndexName: "teamMemberId-index",
      KeySchema: [
        { AttributeName: "teamMemberId", KeyType: "HASH" }
      ],
      Projection: { ProjectionType: "ALL" }
    }
  ],
  BillingMode: "PAY_PER_REQUEST",
  Tags: [
    { Key: "Environment", Value: "{env}" },
    { Key: "Application", Value: "osem-ladders" }
  ]
}
```

**Access Patterns**:
1. Get assessment by ID: `GetItem(assessmentId)`
2. Find assessments for plan member: `Query(planId-teamMemberId-index, planId = X, teamMemberId = Y)`
3. Find all assessments for user: `Query(teamMemberId-index, teamMemberId = X)`
4. Filter self vs manager assessments: Application-level filter on `assessmentType` after query

---

## Table 5: AssessmentReports

**Purpose**: Store final reports combining self and manager assessments

**Primary Key**:
- Partition Key: `reportId` (String) - UUID

**Attributes**:

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| reportId | String | Yes | UUID, partition key |
| planId | String | Yes | Reference to AssessmentPlan (GSI key) |
| teamMemberId | String | Yes | User this report is for (GSI key) |
| selfAssessmentId | String | Yes | Reference to self Assessment |
| managerAssessmentId | String | Yes | Reference to manager Assessment |
| finalLevel | Number | Yes | Based on manager assessment |
| selfAssessedLevel | Number | Yes | For comparison |
| variance | Map | Yes | Variance structure (see below) |
| generatedAt | Number | Yes | Unix timestamp (milliseconds) |
| exportedAt | Number | No | Unix timestamp if exported to PDF |

**Nested Structures**:

```typescript
// variance structure (DynamoDB Map)
{
  "Technical Execution": {
    "Coding": {
      "selfScore": 3,
      "managerScore": 4,
      "difference": 1  // Can be negative
    },
    "System Design": {
      "selfScore": 4,
      "managerScore": 4,
      "difference": 0
    }
  }
}
```

**Global Secondary Indexes**:

1. **planId-index**:
   - Partition Key: `planId` (String)
   - Projection: ALL
   - Purpose: Find all reports for a plan

2. **teamMemberId-index**:
   - Partition Key: `teamMemberId` (String)
   - Projection: ALL
   - Purpose: Find all reports for a user (historical progression)

**DynamoDB Schema**:

```typescript
{
  TableName: "osem-{env}-AssessmentReports",
  KeySchema: [
    { AttributeName: "reportId", KeyType: "HASH" }
  ],
  AttributeDefinitions: [
    { AttributeName: "reportId", AttributeType: "S" },
    { AttributeName: "planId", AttributeType: "S" },
    { AttributeName: "teamMemberId", AttributeType: "S" }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "planId-index",
      KeySchema: [
        { AttributeName: "planId", KeyType: "HASH" }
      ],
      Projection: { ProjectionType: "ALL" }
    },
    {
      IndexName: "teamMemberId-index",
      KeySchema: [
        { AttributeName: "teamMemberId", KeyType: "HASH" }
      ],
      Projection: { ProjectionType: "ALL" }
    }
  ],
  BillingMode: "PAY_PER_REQUEST",
  Tags: [
    { Key: "Environment", Value: "{env}" },
    { Key: "Application", Value: "osem-ladders" }
  ]
}
```

**Access Patterns**:
1. Get report by ID: `GetItem(reportId)`
2. List reports for plan: `Query(planId-index, planId = X)`
3. List reports for user: `Query(teamMemberId-index, teamMemberId = X)` (career progression)

---

## Table 6: ConfigVersions

**Purpose**: Store versioned career ladder configuration (config.md)

**Primary Key**:
- Partition Key: `configId` (String) - UUID

**Attributes**:

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| configId | String | Yes | UUID, partition key |
| version | String | Yes | Semantic version (e.g., "1.0.0") |
| configContent | String | Yes | Full Markdown content (config.md) |
| parsedConfig | Map | Yes | Cached parsed structure (categories array) |
| createdBy | String | Yes | User ID |
| createdAt | Number | Yes | Unix timestamp (milliseconds) |
| isActive | Boolean | Yes | Only one active config at a time (GSI key) |

**Nested Structures**:

```typescript
// parsedConfig structure (DynamoDB Map)
{
  "categories": [
    {
      "name": "Technical Execution",
      "competencies": [
        {
          "name": "Coding",
          "levels": [
            { "level": 1, "description": "..." },
            { "level": 2, "description": "..." }
          ]
        }
      ]
    }
  ]
}
```

**Global Secondary Indexes**:

1. **isActive-index**:
   - Partition Key: `isActive` (Number: 0 or 1)
   - Sort Key: `createdAt` (Number)
   - Projection: ALL
   - Purpose: Find current active config (query isActive=1, sort by createdAt desc, limit 1)

**DynamoDB Schema**:

```typescript
{
  TableName: "osem-{env}-ConfigVersions",
  KeySchema: [
    { AttributeName: "configId", KeyType: "HASH" }
  ],
  AttributeDefinitions: [
    { AttributeName: "configId", AttributeType: "S" },
    { AttributeName: "isActive", AttributeType: "N" },
    { AttributeName: "createdAt", AttributeType: "N" }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "isActive-index",
      KeySchema: [
        { AttributeName: "isActive", KeyType: "HASH" },
        { AttributeName: "createdAt", KeyType: "RANGE" }
      ],
      Projection: { ProjectionType: "ALL" }
    }
  ],
  BillingMode: "PAY_PER_REQUEST",
  Tags: [
    { Key: "Environment", Value: "{env}" },
    { Key: "Application", Value: "osem-ladders" }
  ]
}
```

**Access Patterns**:
1. Get config by ID: `GetItem(configId)`
2. Get active config: `Query(isActive-index, isActive = 1, SortKeyCondition = desc, Limit = 1)`
3. List all config versions: `Scan` (admin only, sorted by createdAt)

---

## Summary

**Total Tables**: 6
**Total GSIs**: 8

| Table | Partition Key | GSIs | GSI Partition Keys |
|-------|---------------|------|--------------------|
| Users | userId | 0 | - |
| Teams | teamId | 1 | managerId |
| AssessmentPlans | planId | 2 | teamId, status |
| Assessments | assessmentId | 2 | planId (+sort: teamMemberId), teamMemberId |
| AssessmentReports | reportId | 2 | planId, teamMemberId |
| ConfigVersions | configId | 1 | isActive (+sort: createdAt) |

**Common Patterns**:
- All timestamps: Unix milliseconds (Number)
- All IDs: UUID (String)
- All nested data: DynamoDB Map type
- All GSI projections: ALL (no base table lookups)
- All tables: On-demand billing
- All tables: AWS-managed encryption at rest
- All tables: No sort keys on base table (single-attribute partition key)

**Constitution Compliance**:
- ✅ Audit fields: createdAt, updatedAt, createdBy (all tables)
- ✅ UUID IDs: All primary keys are String UUIDs
- ✅ Explicit booleans: isActive (Teams, ConfigVersions)
- ✅ Soft deletes: isActive flag (no hard deletes)
- ✅ Team-centric: teamId in all assessment-related tables
- ✅ Single-org assumption: No orgId field (see constitution open questions)

**Data Size Estimates** (MVP phase):
- Users: ~100 rows (small organization)
- Teams: ~10-20 rows (10-20 teams)
- AssessmentPlans: ~40 rows/year (4 plans/year * 10 teams)
- Assessments: ~400 rows/plan (10 teams * 10 members * 2 assessments) = ~16,000 rows/year
- AssessmentReports: ~200 rows/plan (10 teams * 10 members) = ~8,000 rows/year
- ConfigVersions: ~5 rows (infrequent config changes)

**Storage Estimate**: <100 MB for MVP year (well within free tier)

---

## Implementation Notes

1. **Table Creation Order**: No dependencies - all tables can be created in parallel
2. **GSI Creation**: All GSIs created inline with CreateTableCommand (faster than UpdateTable)
3. **Schema Validation**: Verify command will validate partition keys, sort keys, and GSI count match this spec
4. **Migration Path**: If multi-org support needed, add `orgId` String attribute and create new GSI `orgId-{entity}Id-index` without breaking existing single-org queries

---

## References

- REDESIGN.md lines 56-158 (source data model)
- Constitution.md Data Model Governance section
- DynamoDB Best Practices: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html