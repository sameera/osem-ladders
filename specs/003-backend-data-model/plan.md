# Implementation Plan: Backend Data Model Overhaul

**Branch**: `003-backend-data-model` | **Date**: 2025-11-17 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-backend-data-model/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature overhau ls the backend data model to establish a new DynamoDB-based storage architecture using email addresses as user identifiers and content-addressed storage for assessment reports. The new model includes four core tables (Users, Teams, Assessments, AssessmentReports) that support multi-tenant team-based access patterns with role-based authorization. This represents a fundamental shift from the current architecture and will require migration of existing data.

## Technical Context

**Language/Version**: TypeScript 5.5.3 with Node.js 18+ (aligns with existing web app and Lambda projects)
**Primary Dependencies**:
- AWS SDK for JavaScript v3 (@aws-sdk/client-dynamodb, @aws-sdk/lib-dynamodb)
- AWS Lambda runtime
- DynamoDB as primary data store
- AWS API Gateway for RESTful endpoints
**Storage**: DynamoDB with 4 tables (Users, Teams, Assessments, AssessmentReports) using single-table design patterns where appropriate
**Testing**: Vitest (consistent with existing apps/web setup), integration tests for DynamoDB queries, contract tests for API endpoints
**Target Platform**: AWS Lambda serverless functions + DynamoDB (serverless architecture per constitution)
**Project Type**: Backend API services (will be consumed by existing apps/web frontend)
**Performance Goals**:
- Sub-100ms p95 for assessment report retrieval by composite key (SC-004)
- Single-query retrieval for team members by manager (SC-003)
- 30%+ storage reduction through content addressing (SC-002)
**Constraints**:
- Email addresses are immutable identifiers (cannot be changed after profile creation)
- Orphaned records allowed (queries must handle missing references gracefully)
- Users belong to exactly one team (single string value, not array)
- Content-addressed keys must follow format: `<userid>|<assessment_id>|<assessment-type>`
**Scale/Scope**:
- 4 DynamoDB tables with GSIs for manager-based queries
- Migration of existing user data to new email-based identifier scheme
- Elimination of Supabase legacy backend (marked as legacy in CLAUDE.md)
- Replace apps/db-setup if it's related to old data model

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principles Alignment

**I. Phased Organizational Platform Delivery** ✅
- This feature establishes the foundational backend data model required for multi-tenant organizational platform
- Aligns with Phase 1-2 of 8-phase migration plan (backend foundation with User/Team management)
- Blocks all subsequent phases as it provides the DynamoDB tables and access patterns needed

**II. Role-Based Security Model** ✅
- Users table includes `roles` array field for storing Team Member, Manager, and Admin roles
- Teams table includes `managerId` for manager assignment
- GSI on Users table (managerId) enables efficient "query users by manager" access pattern (FR-009)
- Authorization filters based on userId and team membership supported by data model design

**III. Assessment Workflow Integrity** ✅
- AssessmentReports table includes `type` field distinguishing self vs. manager assessments
- Content-addressed keys (`<userid>|<assessment_id>|<assessment-type>`) prevent accidental overwrites
- Data model supports immutable assessment storage (status field implied for workflow state)

**IV. Serverless-First Architecture** ✅
- DynamoDB chosen as storage (serverless, auto-scaling)
- Design assumes AWS Lambda + API Gateway for backend logic
- Table design uses partition keys, sort keys, and GSIs for efficient multi-tenant queries
- No EC2 or containerized services required

**V. API-First Development** ✅
- Plan includes contracts/ directory generation in Phase 1
- Backend data model defined before API implementation
- Frontend (apps/web) will consume APIs via React Query (already in use per CLAUDE.md)

**VI. Team-Centric Data Model** ✅
- Users table includes `team` field for team assignment
- Teams table is a first-class entity with unique identifier
- AssessmentReports reference both userId and assessmentId, which can be joined to Teams via Users
- Manager-based queries enabled via GSI (FR-009)

### Data Model Governance

**Entity Design Requirements** ✅
- Audit fields: `createdAt`, `updatedAt`, `createdBy`, `isActive` preserved in TypeScript interfaces (data-model.md lines 343-372) and API contracts, but omitted from table schema documentation for reduced redundancy (see research.md § 7 Constitutional Exception)
- UUIDs specified for Assessments (Assessment.id: UUID)
- Soft deletes implemented via `isActive` boolean in TypeScript interfaces (orphaned records allowed per FR-016)

**DynamoDB Schema Standards** 🔍 **RESEARCH REQUIRED**
- Partition key strategies need research: Users (userId/email), Teams (id), Assessments (id), AssessmentReports (composite CAS key)
- GSI design needs research: managerId GSI on Users table, potential team-based GSIs for AssessmentReports
- Sort key strategies for AssessmentReports need clarification (if querying by userId, what is sort key?)

###  Security Requirements

**Authentication & Authorization** ✅
- Data model supports role-based authorization via Users.roles array
- Team manager relationships supported via Teams.managerId and GSI
- Email-based user identification aligns with Cognito userId (email from Microsoft 365)

**Data Protection** ✅
- DynamoDB encryption at rest (AWS-managed keys)
- Assessment reports (sensitive feedback) stored in AssessmentReports table
- Email addresses (PII) used as userId - audit logging requirements noted

### Development Workflow

**Phase-Based Delivery** ✅
- This feature IS Phase 1-2 (backend foundation with DynamoDB tables)
- Completion criteria: All 4 tables created, GSIs defined, data migration plan documented
- Blocks Phase 3 (team management UI) and all subsequent phases

**Testing Requirements** 🔍 **NEEDS CLARIFICATION**
- Integration tests for role-based queries need specific scenarios defined
- Contract tests for API endpoints await API contract definition (Phase 1 output)
- DynamoDB query patterns (GetItem vs. Query vs. Scan) need research

### Performance Standards

**API Endpoints** ✅
- Target p95 <500ms for CRUD operations
- Target p95 <100ms for assessment report retrieval (SC-004)
- DynamoDB on-demand billing initially (per constitution)

**Lambda Functions** ✅
- 512MB memory minimum
- Connection reuse for DynamoDB client
- Timeouts: 10s for CRUD, 30s for complex queries

### Open Questions & Decision Framework

**Decisions Required Before Phase 0**:
1. ✅ Role assignment mechanism: Cognito groups vs. admin panel - **DEFER to separate feature** (users can be created with roles via API, admin panel is Phase 7)
2. ✅ Team structure: Nested teams? Multiple managers? - **CLARIFIED: Single manager per team, no nested teams** (per spec: FR-008 "exactly one manager per team")
3. 🔍 Multi-org support: Single org vs. multi-tenant SaaS - **NEEDS CLARIFICATION** (affects partition key design)

**Decisions Required Before Phase 1**:
4. 🔍 Assessment templates vs. config.md versioning - **NEEDS RESEARCH** (affects Assessments table design)
5. 🔍 Historical data retention policy - **NEEDS CLARIFICATION** (affects soft delete strategy)
6. 🔍 Config versioning for in-progress assessments - **NEEDS RESEARCH** (affects Assessments.plan field structure)

### Gate Status

**GATE: CONDITIONAL PASS** - Proceed to Phase 0 research to resolve:
1. Multi-org support decision (single organization vs. multi-tenant SaaS)
2. DynamoDB partition/sort key strategies for all 4 tables
3. GSI design for all access patterns (manager queries, team queries, user queries)
4. Assessment template versioning strategy
5. Historical data retention policy
6. Content-addressing implementation details (hash function, collision handling)

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/
├── web/                    # Existing React frontend (unchanged for this feature)
├── api/                    # NEW: Backend API Lambda functions
│   ├── src/
│   │   ├── models/         # TypeScript interfaces for Users, Teams, Assessments, AssessmentReports
│   │   ├── repositories/   # DynamoDB access layer (UserRepository, TeamRepository, etc.)
│   │   ├── handlers/       # Lambda function handlers (users.ts, teams.ts, assessments.ts, reports.ts)
│   │   ├── middleware/     # Auth middleware (JWT validation, role checking)
│   │   └── utils/          # Content addressing, validation, helpers
│   ├── tests/
│   │   ├── integration/    # DynamoDB integration tests, role-based query tests
│   │   ├── contract/       # API contract validation tests
│   │   └── unit/           # Repository and utility function tests
│   └── project.json        # Nx configuration for API project
├── db-setup/              # OBSOLETE: Will be replaced by infrastructure-as-code (AWS CDK/SAM)
└── status-lambda/         # Existing Lambda (unrelated to data model, keep as-is)

libs/                      # NEW: Shared libraries for monorepo
└── shared-types/          # Shared TypeScript types for Users, Teams, Assessments, etc.
    ├── src/
    │   ├── users.ts
    │   ├── teams.ts
    │   ├── assessments.ts
    │   └── reports.ts
    └── project.json

infrastructure/            # NEW: AWS CDK or SAM templates
├── stacks/
│   ├── dynamodb-stack.ts  # 4 table definitions with GSIs
│   ├── api-gateway-stack.ts
│   └── lambda-stack.ts
└── cdk.json or template.yaml
```

**Structure Decision**:
- **Monorepo approach** using Nx workspace (consistent with existing setup)
- **New apps/api project** for backend Lambda functions (TypeScript, matches existing apps/web and apps/status-lambda)
- **New libs/shared-types** library for DRY type definitions shared between frontend and backend
- **New infrastructure/ directory** for AWS CDK/SAM infrastructure-as-code (DynamoDB tables, Lambda functions, API Gateway)
- **apps/db-setup marked for removal**: Current setup likely related to old Supabase or different DynamoDB schema - will be replaced by infrastructure/
- **apps/web unchanged**: Frontend will consume new APIs but code structure remains stable for this feature

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations detected. All complexity is justified by core principles:
- 3 new projects (apps/api, libs/shared-types, infrastructure/) align with serverless architecture and monorepo structure
- Repository pattern required for DynamoDB access layer per Data Model Governance standards
- Infrastructure-as-code (AWS CDK/SAM) required per Serverless-First Architecture principle
