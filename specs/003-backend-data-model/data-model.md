# Data Model: Backend Data Model Overhaul

**Feature**: Backend Data Model Overhaul
**Date**: 2025-11-17
**Source**: [spec.md](spec.md) + [research.md](research.md)

## Overview

This data model defines 4 DynamoDB tables for the OSEM Ladders organizational assessment platform:

1. **Users** - Team members and managers with roles and team assignments
2. **Teams** - Organizational units with manager assignments and active assessments
3. **Assessments** - Reusable assessment templates (career ladder frameworks)
4. **AssessmentReports** - Completed assessments with content-addressed storage

**Key Design Principles**:

-   Email-based user identification (immutable)
-   Content-addressed storage for reports (prevents duplicates)
-   Single-organization deployment (MVP scope)
-   Soft deletes for referential integrity
-   GSIs for manager-based and team-based queries

---

## Table 1: Users

**Purpose**: Store user profiles with roles, team assignments, and manager relationships

### Schema

| Attribute | Type       | Description                                  | Required | Constraints                           |
| --------- | ---------- | -------------------------------------------- | -------- | ------------------------------------- |
| `userId`  | String     | User email address (partition key)           | Yes      | Immutable, unique, valid email format |
| `name`    | String     | User's full name                             | Yes      | 1-255 characters                      |
| `roles`   | String Set | User roles: "TeamMember", "Manager", "Admin" | Yes      | At least one role                     |
| `team`    | String     | Team identifier (e.g., "engineering")        | Yes      | Must reference valid Teams.id         |

### Indexes

**Primary Key**:

-   Partition Key (PK): `userId`
-   Sort Key (SK): None

**GSI-1: TeamIndex**

-   Purpose: Query all users in a specific team
-   Partition Key: `team`
-   Sort Key: `userId`
-   Projection: ALL

### Validation Rules

1. Email addresses (userId) must be valid email format (RFC 5322)
2. Users cannot change userId after creation (immutable identifier)
3. `roles` must contain at least one valid role ("TeamMember", "Manager", "Admin")
4. `team` must reference an existing Teams.id

### Access Patterns

1. **Get user by email**: `GetItem(PK=userId)`
2. **Get all users in team**: `Query(GSI=TeamIndex, PK=team)`

---

## Table 2: Teams

**Purpose**: Store organizational teams with manager assignments and active assessment tracking

### Schema

| Attribute            | Type   | Description                                          | Required | Constraints                                           |
| -------------------- | ------ | ---------------------------------------------------- | -------- | ----------------------------------------------------- |
| `id`                 | String | Team identifier (partition key), e.g., "engineering" | Yes      | Lowercase, alphanumeric + hyphens, unique             |
| `name`               | String | Human-readable team name                             | Yes      | 1-255 characters                                      |
| `managerId`          | String | Manager's userId (email)                             | Yes      | Must reference valid Users.userId with "Manager" role |
| `activeAssessmentId` | String | Currently active assessment UUID                     | No       | Must reference valid Assessments.id if set            |

### Indexes

**Primary Key**:

-   Partition Key (PK): `id`
-   Sort Key (SK): None

**No GSIs**: Teams are queried primarily by ID. Manager-to-teams relationship is indirect via Users.team field.

### Validation Rules

1. Team `id` must be lowercase, alphanumeric with hyphens only (e.g., "engineering", "product-design")
2. `managerId` must reference a user with "Manager" role in their `roles` set
3. `activeAssessmentId` must reference an existing Assessments.id (if provided)
4. Teams cannot be hard-deleted if Users reference them (soft delete only)

### Access Patterns

1. **Get team by ID**: `GetItem(PK=id)`
2. **Get teams managed by user**: Query Users.GSI-2 (TeamIndex) where `managerId = userId`

---

## Table 3: Assessments

**Purpose**: Store reusable assessment templates (career ladder frameworks) with versioning

### Schema

| Attribute     | Type   | Description                                            | Required | Constraints                          |
| ------------- | ------ | ------------------------------------------------------ | -------- | ------------------------------------ |
| `id`          | String | Assessment UUID (partition key)                        | Yes      | UUIDv4 format                        |
| `name`        | String | Assessment name, e.g., "Engineering Ladder Q4 2025"    | Yes      | 1-255 characters, unique per version |
| `plan`        | List   | Array of Category objects (structured competency data) | Yes      | Valid Category[] structure           |
| `description` | String | Assessment description                                 | No       | Max 1000 characters                  |

### Plan Structure (Category[])

```typescript
interface Category {
    name: string; // e.g., "Technical Execution"
    competencies: Competency[];
}

interface Competency {
    name: string; // e.g., "Code Quality"
    levels: Level[];
}

interface Level {
    level: number; // 1-5 or similar
    title: string; // e.g., "Junior", "Mid", "Senior"
    description: string; // Expectation text
}
```

### Indexes

**Primary Key**:

-   Partition Key (PK): `id`
-   Sort Key (SK): None

### Validation Rules

1. `id` must be valid UUIDv4
2. `plan` must be valid JSON matching Category[] structure
3. Assessment templates are immutable once created (updates create new version)

### Access Patterns

1. **Get assessment by ID**: `GetItem(PK=id)`

---

## Table 4: AssessmentReports

**Purpose**: Store completed assessments with content-addressed keys to prevent duplicates

### Schema

| Attribute      | Type   | Description                                                                | Required | Constraints                                           |
| -------------- | ------ | -------------------------------------------------------------------------- | -------- | ----------------------------------------------------- |
| `id`           | String | Content-addressed key (partition key): `<userid>\|<assessment_id>\|<type>` | Yes      | Format: `email\|UUID\|self` or `email\|UUID\|manager` |
| `type`         | String | Assessment type: "self" or "manager"                                       | Yes      | Enum: ["self", "manager"]                             |
| `userId`       | String | Email of user being assessed                                               | Yes      | Must reference valid Users.userId                     |
| `assessmentId` | String | Assessment template UUID                                                   | Yes      | Must reference valid Assessments.id                   |
| `assessorId`   | String | Email of person who completed assessment                                   | Yes      | userId for self, managerId for manager                |
| `responses`    | Map    | Assessment responses keyed by competency/level                             | Yes      | Valid response structure                              |
| `status`       | String | Workflow status                                                            | Yes      | Enum: ["not_started", "in_progress", "submitted"]     |
| `submittedAt`  | Number | Unix timestamp when submitted                                              | No       | Set when status becomes "submitted"                   |

### Responses Structure

```typescript
interface Responses {
    [competencyId: string]: {
        selectedLevel: number; // Level selected (1-5)
        feedback?: string; // Optional text feedback
    };
}
```

### Indexes

**Primary Key**:

-   Partition Key (PK): `id` (content-addressed composite key)
-   Sort Key (SK): None

**GSI-1: UserReportsIndex**

-   Purpose: Query all reports for a specific user (FR-013)
-   Partition Key: `userId`
-   Sort Key: `createdAt`
-   Projection: ALL

### Validation Rules

1. `id` must follow format: `<userId>|<assessmentId>|<type>` (pipe-delimited)
2. `type` must be "self" or "manager"
3. `userId` must reference existing user
4. `assessmentId` must reference existing assessment template
5. For type="self": `assessorId` must equal `userId`
6. For type="manager": `assessorId` must equal `managerId` of user's team
7. Reports with status="submitted" are **immutable** (cannot be edited)
8. Duplicate submissions (same userId|assessmentId|type) **overwrite** previous report (CAS behavior)

### Access Patterns

1. **Get report by composite key**: `GetItem(PK=<userid>|<assessment_id>|<type>)` - Target: <100ms p95
2. **Get all reports for user**: `Query(GSI=UserReportsIndex, PK=userId, SK sorted by createdAt DESC)`
3. **Get specific user's self and manager reports for assessment**: `Query(GSI=AssessmentReportsIndex, PK=assessmentId, SK begins_with userId)`

---

## Entity Relationships

```
Users (1) ----< (M) AssessmentReports [userId]
  |
  | (M) ----< (1) Teams [team]
  | (M) ----< (1) Users [managerId] (self-referential)

Teams (1) ----< (1) Users [managerId]
  | (1) ----< (1) Assessments [activeAssessmentId]

Assessments (1) ----< (M) AssessmentReports [assessmentId]
  | (1) ----< (M) Teams [activeAssessmentId]
```

**Referential Integrity Policy** (per FR-016):

-   Orphaned records are **allowed**
-   Queries must handle missing references gracefully (e.g., user deleted but reports remain)
-   Soft deletes (`isActive=false`) preserve historical data
-   Hard deletes (if ever needed) must be admin-only and audited

---

## Migration from Current System

### Phase 1: Schema Creation

1. Create 4 DynamoDB tables with defined schemas and GSIs
2. Enable point-in-time recovery for all tables
3. Enable encryption at rest (AWS-managed keys)
4. Set up DynamoDB Streams for audit logging (future feature)

### Phase 2: Data Migration

1. **Users**: Migrate from existing Cognito user pool + current database
    - Map Cognito email → userId
    - Extract roles from Cognito groups or existing DB
    - Assign teams based on current team structure
2. **Teams**: Create teams from existing organizational structure
    - Assign managers based on current hierarchy
    - Leave `activeAssessmentId` null initially
3. **Assessments**: Seed from `apps/web/src/data/config.md`
    - Parse config.md → Assessment.plan structure
    - Version: "1.0.0"
    - Name: "Initial Career Ladder"
4. **AssessmentReports**: Migrate existing assessment data (if any)
    - Transform to new CAS key format
    - Preserve historical assessment dates

### Phase 3: Validation

1. Verify all users have valid team assignments
2. Verify all managers have "Manager" role
3. Verify all assessment reports reference valid users/assessments
4. Run test queries for all access patterns
5. Validate GSI population (ManagerIndex, TeamIndex, etc.)

---

## Performance Considerations

### Query Performance

-   **Users by email**: GetItem - O(1), <10ms
-   **Team members by manager**: Query on GSI - O(n) where n = team size, <50ms for 100 users
-   **Reports by composite key**: GetItem - O(1), <100ms (SC-004 target)
-   **User assessment history**: Query on GSI - O(n) where n = reports per user, <200ms for 50 reports

### Storage Efficiency

-   **Content addressing**: Prevents duplicate self/manager assessments per user/template
-   **Expected savings**: 30%+ reduction vs. allowing unlimited duplicate submissions (SC-002)
-   **Assessment templates**: Shared across teams (1 template → N teams)

### Scalability

-   **Partition key distribution**: Email addresses provide high cardinality (millions of unique users)
-   **Hot partitions**: None expected (no single partition receives disproportionate traffic)
-   **GSI cardinality**: ManagerIndex and TeamIndex have reasonable fanout (1 manager → dozens of team members)

---

## TypeScript Interfaces

**Location**: `libs/shared-types/src/`

```typescript
// users.ts
export interface User {
    userId: string; // Email (PK)
    name: string;
    roles: Set<"TeamMember" | "Manager" | "Admin">;
    team: string; // Team ID
    managerId?: string; // Manager's email
    isActive: boolean;
    createdAt: number;
    updatedAt: number;
    createdBy: string;
}

// teams.ts
export interface Team {
    id: string; // Team identifier (PK)
    name: string;
    managerId: string; // Manager's email
    activeAssessmentId?: string; // Assessment UUID
    isActive: boolean;
    createdAt: number;
    updatedAt: number;
    createdBy: string;
}

// assessments.ts
export interface Assessment {
    id: string; // UUID (PK)
    name: string;
    version: string; // Semver
    plan: Category[];
    description?: string;
    isActive: boolean;
    createdAt: number;
    updatedAt: number;
    createdBy: string;
}

export interface Category {
    name: string;
    competencies: Competency[];
}

export interface Competency {
    name: string;
    levels: Level[];
}

export interface Level {
    level: number;
    title: string;
    description: string;
}

// reports.ts
export interface AssessmentReport {
    id: string; // CAS key (PK): <userId>|<assessmentId>|<type>
    type: "self" | "manager";
    userId: string; // User being assessed
    assessmentId: string; // Assessment template UUID
    assessorId: string; // Person who completed (userId or managerId)
    responses: Map<string, CompetencyResponse>;
    status: "not_started" | "in_progress" | "submitted";
    submittedAt?: number;
    isActive: boolean;
    createdAt: number;
    updatedAt: number;
    createdBy: string;
}

export interface CompetencyResponse {
    selectedLevel: number;
    feedback?: string;
}
```

---

## Next Steps

1. **Infrastructure**: Define DynamoDB tables in AWS CDK/SAM (infrastructure/ directory)
2. **API Contracts**: Define REST endpoints in contracts/ directory (Phase 1 output)
3. **Repositories**: Implement DynamoDB access layer in apps/api/src/repositories/
4. **Migration Scripts**: Create data migration utilities
5. **Integration Tests**: Test all access patterns and GSIs
