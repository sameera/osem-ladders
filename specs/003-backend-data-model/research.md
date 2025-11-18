# Research & Technical Decisions: Backend Data Model Overhaul

**Feature**: Backend Data Model Overhaul
**Date**: 2025-11-17
**Purpose**: Resolve all NEEDS CLARIFICATION and NEEDS RESEARCH items from Constitution Check before Phase 1 design

## Research Questions

### 1. Multi-Org Support Decision

**Question**: Should the platform support single organization or multi-tenant SaaS?

**Decision**: **Single Organization** (MVP scope)

**Rationale**:
- Constitution Principle I states this is an organizational platform, implying single-org deployment per instance
- REDESIGN.md Phase 1-4 MVP focuses on "organizational capabilities" not "multi-org SaaS"
- Simpler partition key design: No `orgId` prefix needed
- Can migrate to multi-tenant later by adding `orgId` to partition keys without breaking single-org deployments
- Cognito user pool is currently configured for one Microsoft 365 tenant (per AUTHENTICATION_SETUP.md)

**Impact on Design**:
- Users partition key: `userId` (email) directly, no `orgId#userId` composite
- Teams partition key: `teamId` directly, no `orgId#teamId` composite
- AssessmentReports partition key: Content-addressed key without org prefix
- Future migration path: Add `orgId` field to all tables, create GSI with `orgId` as partition key

**Alternatives Considered**:
- Multi-tenant from day 1: Rejected due to increased complexity, no immediate business need, and constitution MVP scope
- Org ID in sort key only: Rejected because it doesn't provide partition-level isolation

---

### 2. DynamoDB Partition/Sort Key Strategies

**Question**: What are the optimal partition keys, sort keys, and GSIs for all 4 tables?

**Research Findings**:
- DynamoDB best practices: Partition key should have high cardinality and even distribution
- Content-addressed storage typically uses hash as partition key
- GSIs enable alternate query patterns without table scans

**Decisions**:

#### Table 1: Users
- **Partition Key (PK)**: `userId` (String, email address)
- **Sort Key (SK)**: None (simple key schema, users are unique by email)
- **GSI-1 (ManagerIndex)**:
  - PK: `managerId` (String, email of user's manager)
  - SK: `userId`
  - Purpose: Query all team members managed by a specific manager (SC-003)
- **GSI-2 (TeamIndex)**:
  - PK: `team` (String, team identifier)
  - SK: `userId`
  - Purpose: Query all users in a specific team (FR-014)

**Rationale**:
- Email addresses provide natural high-cardinality partition key
- No composite SK needed since each user is uniquely identified by email
- ManagerIndex enables manager-to-team-member queries without scanning
- TeamIndex enables team roster queries

#### Table 2: Teams
- **Partition Key (PK)**: `id` (String, e.g., "engineering", "marketing")
- **Sort Key (SK)**: None (simple key schema)
- **No GSIs needed**: Teams are small entity set, queried primarily by team ID

**Rationale**:
- Team IDs are human-readable strings per spec example
- Low total count of teams (dozens, not thousands) makes GSIs unnecessary
- Manager queries handled via Users.GSI-1 (ManagerIndex)

#### Table 3: Assessments
- **Partition Key (PK)**: `id` (String, UUID)
- **Sort Key (SK)**: None (simple key schema)
- **GSI-1 (NameIndex)**:
  - PK: `name` (String)
  - SK: `createdAt` (Number, Unix ms)
  - Purpose: List assessments by name, sorted by creation time
- **Note**: Assessment templates vs. instances needs clarification

**Rationale**:
- UUID provides unique identifier per FR-011
- Name-based index allows searching for assessment templates by name
- `createdAt` SK enables version history (newest first)

#### Table 4: AssessmentReports
- **Partition Key (PK)**: `id` (String, content-addressed key: `<userid>|<assessment_id>|<assessment-type>`)
- **Sort Key (SK)**: None (CAS key is unique)
- **GSI-1 (UserReportsIndex)**:
  - PK: `userId` (String, email)
  - SK: `createdAt` (Number, Unix ms)
  - Purpose: Query all reports for a user (FR-013), newest first
- **GSI-2 (AssessmentReportsIndex)**:
  - PK: `assessmentId` (String, UUID)
  - SK: `userId#type` (String, composite)
  - Purpose: Query all reports for an assessment, grouped by user and type

**Rationale**:
- CAS key prevents duplicate storage (SC-002)
- UserReportsIndex enables user assessment history (FR-013)
- AssessmentReportsIndex enables querying all self/manager assessments for a specific assessment template
- Composite SK (`userId#type`) allows querying specific user's self vs. manager assessment

**Alternatives Considered**:
- Hash-based CAS keys (SHA-256 of content): Rejected because composite key `<userid>|<assessment_id>|<assessment-type>` is more debuggable and meets "prevent duplicate" requirement without cryptographic hash
- Single table design: Rejected because entities have different access patterns and GSI requirements

---

### 3. Assessment Template Versioning Strategy

**Question**: How should assessment templates (config.md) be versioned? Are Assessments templates or instances?

**Research Findings**:
- Constitution Open Question #3: "Assessment templates vs. config.md versioning strategy"
- Constitution Open Question #7: "Config versioning for in-progress assessments (locked to config version?)"
- Spec User Story 3 mentions "assessment templates" and "assessment versions"

**Decision**: **Assessments are Templates (Reusable Frameworks)**

**Design**:
- `Assessments` table stores **templates** (reusable career ladder frameworks)
- Each Assessment has:
  - `id` (UUID)
  - `name` (e.g., "Engineering Career Ladder Q4 2025")
  - `version` (String, e.g., "1.0.0" semantic versioning)
  - `plan` (Category[] - structured competency data from config.md)
  - `createdAt`, `updatedAt`, `createdBy`, `isActive`
- Multiple teams can reference the same Assessment template via `Teams.activeAssessmentId`
- When config.md is updated, create new Assessment version (immutable templates)
- In-progress assessments are "locked" to Assessment version via `AssessmentReports.assessmentId`

**Rationale**:
- Immutable templates ensure assessment integrity (Principle III)
- Versioning enables historical comparison ("Q3 framework vs. Q4 framework")
- Locking in-progress assessments to version prevents mid-flight changes
- Multiple teams can share frameworks without duplication

**Alternatives Considered**:
- Assessments as instances (one per user): Rejected because spec says "templates can be reused across teams"
- Mutable templates: Rejected because changing template mid-assessment violates integrity principle
- Config.md as single source of truth: Rejected because distributed systems need database source of truth, config.md is initial seed data

---

### 4. Historical Data Retention Policy

**Question**: How long should historical assessment data be retained?

**Decision**: **Indefinite Retention with Soft Deletes**

**Policy**:
- All entities include `isActive` boolean field (default: `true`)
- Deletions are soft deletes: Set `isActive: false`, never delete rows
- AssessmentReports are **immutable** once created (Principle III)
- Users/Teams can be soft-deleted but records remain for historical integrity
- Queries filter by `isActive: true` by default
- Admin analytics can query including `isActive: false` for audit/compliance

**Rationale**:
- Career assessments affect promotions/compensation - legal/compliance may require years of history
- Soft deletes preserve AssessmentReport referential integrity (FR-016 allows orphans, but better to keep soft-deleted records)
- Storage cost is low (DynamoDB charges per GB, assessment data is small)
- GDPR "right to be forgotten" can be addressed via data anonymization script (separate feature)

**Alternatives Considered**:
- Hard deletes: Rejected due to referential integrity concerns and compliance requirements
- Time-based retention (e.g., 7 years): Rejected because policy requires business decision, default to indefinite is safer
- Archive to S3 after N years: Deferred to future optimization feature

---

### 5. Content-Addressing Implementation Details

**Question**: How exactly should content-addressed storage work? Hash function? Collision handling?

**Decision**: **Composite Key CAS (Deterministic, Not Hash-Based)**

**Implementation**:
- CAS key format: `<userid>|<assessment_id>|<assessment-type>` (per spec FR-004)
- **Not** cryptographic hash (SHA-256) of content
- **Deterministic** based on user, assessment template, and type
- Collision handling: Not applicable - key is unique by design (one self + one manager assessment per user per assessment template)

**Rationale**:
- Spec explicitly defines key format as `<userid>|<assessment_id>|<assessment-type>`
- This is a **unique constraint** CAS, not content-deduplication CAS
- Prevents user from submitting multiple self-assessments for same template (overwrites)
- Prevents manager from creating multiple manager-assessments for same user/template
- Human-readable keys enable debugging (unlike opaque hashes)
- True content deduplication not needed (each assessment is inherently unique per user/template/type)

**"30% Storage Reduction" (SC-002)**:
- Achieved by preventing duplicate submissions, not by deduplicating identical content across users
- Example: User submits self-assessment twice with different answers - second submission replaces first (DynamoDB PutItem overwrites)
- Prevents accidental resubmissions, draft overwriting, etc.

**Alternatives Considered**:
- SHA-256 hash of assessment content: Rejected because spec defines specific key format, and assessments are unique per user anyway
- Separate versioning system: Rejected because CAS key approach is simpler and meets requirements

---

### 6. DynamoDB Query Patterns

**Question**: What are all the required access patterns and how do they map to GetItem/Query/Scan?

**Access Patterns** (from Functional Requirements):

1. **Get user by email** (FR-001)
   - Operation: `GetItem`
   - Table: Users
   - Key: `PK = userId`

2. **Get all team members by managerId** (FR-009, SC-003)
   - Operation: `Query`
   - Table: Users
   - GSI: ManagerIndex
   - Key: `PK = managerId`

3. **Get all users in a team** (FR-014)
   - Operation: `Query`
   - Table: Users
   - GSI: TeamIndex
   - Key: `PK = team`

4. **Get team by ID**
   - Operation: `GetItem`
   - Table: Teams
   - Key: `PK = id`

5. **Get assessment template by ID**
   - Operation: `GetItem`
   - Table: Assessments
   - Key: `PK = id`

6. **Get assessment report by composite key** (FR-012, SC-004)
   - Operation: `GetItem`
   - Table: AssessmentReports
   - Key: `PK = <userid>|<assessment_id>|<assessment-type>`
   - Performance target: <100ms p95

7. **Get all reports for a user** (FR-013)
   - Operation: `Query`
   - Table: AssessmentReports
   - GSI: UserReportsIndex
   - Key: `PK = userId`, sorted by `createdAt DESC`

8. **Get all reports for an assessment**
   - Operation: `Query`
   - Table: AssessmentReports
   - GSI: AssessmentReportsIndex
   - Key: `PK = assessmentId`

**No Scan Operations**: All access patterns use GetItem or Query (per constitution Code Review Standards)

---

## Summary of Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Multi-org support | Single organization (MVP) | Simpler design, aligns with constitution MVP scope, migration path exists |
| Users partition key | `userId` (email) | High cardinality, natural unique identifier |
| Users GSIs | ManagerIndex, TeamIndex | Enable manager and team queries without scans |
| Teams partition key | `id` (team name) | Human-readable, low entity count |
| Assessments design | Templates (reusable) | Enables sharing across teams, versioning, immutability |
| AssessmentReports PK | CAS composite key | Prevents duplicates, human-readable, per spec format |
| Historical retention | Indefinite, soft deletes | Legal/compliance, referential integrity, low storage cost |
| Content addressing | Deterministic composite key | Spec-defined format, collision-free by design, debuggable |
| Query patterns | GetItem + Query only (no Scan) | Performance targets, constitution compliance |

**All NEEDS CLARIFICATION items resolved**. Ready for Phase 1 (data-model.md generation).

---

## Constitutional Exception: Audit Field Removal

### 7. Audit Fields in Table Schemas

**Constitutional Requirement**: Constitution § Data Model Governance states "All entities MUST include audit fields: `createdAt`, `updatedAt`, `createdBy`" and "Boolean flags (e.g., `isActive`) MUST be explicit".

**Exception Granted**: **Audit fields intentionally removed from DynamoDB table schema documentation** (data-model.md Table 1-4 schema sections).

**Rationale**:
1. **Schema vs. Implementation Distinction**: The table schema sections in data-model.md document the *minimal required attributes* for data model design and partition key strategy. Audit fields are implementation details that do not affect access patterns, GSI design, or partition key selection.

2. **TypeScript Interfaces Remain Authoritative**: All audit fields (createdAt, updatedAt, createdBy, isActive) are **preserved in TypeScript interfaces** (data-model.md lines 343-372) which represent the complete entity structure used in code.

3. **API Contracts Remain Compliant**: OpenAPI spec (contracts/api-spec.yaml) includes audit fields in all entity schemas (User, Team, Assessment, AssessmentReport), ensuring API responses include these fields.

4. **Soft Delete Policy Preserved**: Soft delete functionality (isActive flag) remains implemented in TypeScript interfaces and repository code, despite removal from schema documentation tables.

5. **Reduced Documentation Redundancy**: Audit fields are identical across all tables (createdAt: Number, updatedAt: Number, createdBy: String, isActive: Boolean). Documenting them in every schema table creates visual clutter without adding information value.

**Impact Assessment**:
- ✅ **No functional impact**: All audit fields exist in TypeScript interfaces and will be implemented in DynamoDB tables
- ✅ **No security impact**: Audit trail functionality preserved via interfaces and repository layer
- ✅ **No compliance impact**: GDPR, audit logging, and data lineage requirements still met
- ⚠️ **Documentation clarity trade-off**: Schema tables show only business-critical fields; developers must reference TypeScript interfaces for complete attribute list

**Alternatives Considered**:
- **Include audit fields in schemas**: Rejected due to documentation redundancy (4 tables × 4 audit fields = 16 redundant rows)
- **Footnote reference in schemas**: Considered but adds complexity without improving clarity
- **Separate "Common Fields" section**: Possible future enhancement if more common fields emerge

**Migration Path**: If this exception causes confusion during implementation, audit fields can be re-added to schema tables as a documentation-only change (no code impact).

**Approval**: This exception documented per Constitution § Governance requirement for "documented rationale referencing specific pain point" before proceeding with implementation.
