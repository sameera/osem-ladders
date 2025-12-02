# Implementation Plan: Administrator Team Management

**Branch**: `005-team-management` | **Date**: 2025-11-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-team-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Administrators need a team management interface to create teams, assign managers, and manage team membership. This feature builds on the existing user management system (004-user-management) to enable organizational structure. The technical approach uses the existing DynamoDB Teams table with API endpoints for CRUD operations, following the same patterns established in user management (admin-only routes, React Query hooks, optimistic updates).

## Technical Context

**Language/Version**: TypeScript 5.5.3 with Node.js 18+ (aligns with existing web app and Lambda projects)
**Primary Dependencies**:
- Backend: Fastify, AWS SDK for JavaScript v3 (@aws-sdk/client-dynamodb, @aws-sdk/lib-dynamodb), jose (JWT verification)
- Frontend: React 18, React Query (@tanstack/react-query), shadcn/ui, Tailwind CSS

**Storage**: DynamoDB with Teams table (teamId PK, managerId GSI from 001-dynamodb-setup)
**Testing**: Vitest for integration tests (backend) and component tests (frontend)
**Target Platform**:
- Backend: AWS Lambda with Node.js 18 runtime
- Frontend: Web browsers (Chrome, Firefox, Safari, Edge)

**Project Type**: Web application (Nx monorepo with apps/api and apps/web)
**Performance Goals**:
- API response time: p95 <500ms per constitution
- Team list display: responsive with up to 100 teams (SC-002)
- Search operations: <1s for 95% of queries (SC-007)

**Constraints**:
- Admin-only access (role-based authorization per constitution Section II)
- Users can belong to only one team at a time (FR-010)
- Manager assignment requires user to have "manager" role (FR-007)
- Historical data preservation when removing members (FR-014)

**Scale/Scope**:
- Expected: 10-50 teams in typical organization
- Target: Support up to 100 teams per SC-002
- 5 user stories (P1-P5) with approximately 50-60 implementation tasks

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principles (Section I-VI)

**I. Phased Organizational Platform Delivery**: ✅ PASS
- This feature is Phase 3 of the 8-phase migration plan (REDESIGN.md)
- Prerequisites satisfied: Phase 1-2 (Backend foundation, DynamoDB, Lambda) complete, Phase 2 (004-user-management) complete
- Deliverable: Team management enables organizational structure needed for Phase 4 (Assessment plans)
- Independently deployable and testable

**II. Role-Based Security Model**: ✅ PASS
- All endpoints will use admin-only authorization (requireAdmin middleware from 004)
- Team membership changes will update Users table (`team` field) affecting team-based queries
- Manager role validation enforced before assigning team managers (FR-007, FR-016)
- Authorization filters on all DynamoDB queries

**III. Assessment Workflow Integrity**: ✅ N/A
- This feature does not directly interact with assessment workflows
- Team structure foundation for future assessment features

**IV. Serverless-First Architecture**: ✅ PASS
- AWS Lambda functions with Fastify for API endpoints
- DynamoDB Teams table with partition key (teamId) and GSI (managerId)
- No EC2 or containers introduced

**V. API-First Development**: ✅ PASS
- API contracts will be documented in contracts/ before implementation
- Frontend uses React Query for server state management
- Optimistic updates with rollback following 004 patterns

**VI. Team-Centric Data Model**: ✅ PASS
- Teams table is the core entity being managed
- All team operations scoped by teamId
- managerId GSI enables efficient manager-based queries

### Data Model Governance

**Entity Design Requirements**: ✅ PASS
- Teams table includes audit fields: createdAt, updatedAt, createdBy (from 001-dynamodb-setup)
- teamId uses meaningful identifiers (not UUIDs, per business requirements)
- Soft deletes NOT required per spec (teams can be archived but spec doesn't mandate FR for archival)
- ACTION REQUIRED: Clarify if team archival/soft delete needed

**DynamoDB Schema Standards**: ✅ PASS
- Teams table uses teamId as partition key (even distribution)
- managerId GSI exists for "teams by manager" query pattern
- No nested structures in Teams entity (flat structure with managerId, name, members array)

### Security Requirements

**Authentication & Authorization**: ✅ PASS
- All endpoints require valid Cognito JWT (existing auth plugin)
- Admin role required for all team management operations
- Authorization pattern: All team endpoints check for admin role via requireAdmin middleware
- 403 for unauthorized access (not 404)

**Data Protection**: ✅ PASS
- DynamoDB encryption at rest enabled (AWS-managed keys from 001)
- TLS 1.2+ via API Gateway
- No PII logging (team names and IDs only, not user emails)
- Team membership changes logged via audit fields

### Development Workflow

**Phase-Based Delivery**: ✅ PASS
- Phase 1-2 (Backend foundation) complete (001-dynamodb-setup, 002-cognito-signup-lambda, 003-backend-data-model)
- Phase 2 (User management) complete (004-user-management)
- Phase 3 (Team management) - THIS FEATURE
- Phase 4 (Assessment plans) - BLOCKED until this complete

**Testing Requirements**: ✅ PASS
- User stories have Given-When-Then acceptance criteria (spec.md)
- Integration tests required for:
  - Admin-only authorization (non-admins get 403)
  - Manager role validation before assignment
  - Team member updates reflected in Users table
  - Duplicate team ID prevention
- Edge cases covered in spec.md

**Code Review Standards**: ✅ PASS
- requireAdmin middleware reuse from 004
- DynamoDB operations use GetItem/Query/Scan (Scan acceptable for admin "list all teams")
- Standardized response structure from 004
- contracts/ documentation required

### Performance Standards

✅ PASS
- Target p95 <500ms for CRUD operations
- React Query cache TTL: 1 minute for team lists (per constitution)
- Lambda 512MB memory minimum
- 10s timeout for CRUD operations
- DynamoDB on-demand billing (from 001-dynamodb-setup)

### Open Questions (Constitution Section: Open Questions & Decision Framework)

**Phase 2 Prerequisites**:
- ❓ **Question 2**: Team structure (nested teams allowed? multiple managers per team?)
  - Spec implies: Single manager per team (FR-006, edge cases show manager can be assigned to multiple teams)
  - Spec implies: Flat team structure (no nested teams mentioned)
  - **ACTION REQUIRED**: Confirm assumptions or document as `// ASSUMPTION: Single manager, flat structure`

**Resolved Questions**:
- Role assignment mechanism: Already implemented in 004 (admin panel)
- Multi-org support: Single organization (per REDESIGN.md Phase 1-8 scope)

### Gate Summary

✅ **GATES PASSED** - Proceed to Phase 0 research
- All core principles align with constitution
- Prerequisites (004-user-management) complete
- Security model matches role-based authorization requirements
- Phase boundary respected (Phase 3 follows Phase 2 completion)

⚠️ **ACTION REQUIRED BEFORE PHASE 1**:
1. ~~Clarify team archival/soft delete requirement (vs hard delete)~~ ✅ **RESOLVED** - Soft deletes required per constitution, implemented via isActive field (research.md)
2. ~~Confirm team structure assumptions (single manager, flat structure, or document as ASSUMPTION)~~ ✅ **RESOLVED** - Single manager, flat structure confirmed (research.md, data-model.md)

---

### Post-Design Re-evaluation

**Date**: 2025-11-24 (After Phase 1 completion)

All constitution gates remain **✅ PASSED** after design completion:

**Data Model Governance** - Soft delete requirement resolved:
- Teams table includes `isActive: boolean` field
- Archive/unarchive operations implemented in API contracts
- Historical data preservation verified in data-model.md

**Team Structure** - Assumptions documented:
- Single manager per team (Teams.managerId: string | null)
- Flat structure (no nested teams)
- Manager can manage multiple teams
- Documented in data-model.md and API contracts

**New Design Artifacts Validated**:
- ✅ data-model.md: Entity definitions, relationships, validation rules align with constitution
- ✅ contracts/team-types.ts: TypeScript interfaces match DynamoDB schema standards
- ✅ contracts/api-endpoints.md: All endpoints use admin-only authorization, standardized responses
- ✅ quickstart.md: Test scenarios validate success criteria (SC-001 through SC-009)

**No new constitutional violations introduced during design.**

**GATES: ✅ ALL PASSED - Proceed to Phase 2 (Task Generation)**

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
apps/api/                              # Backend (Fastify + Lambda)
├── src/
│   ├── types/
│   │   └── teams.ts                    # Team entity types (NEW)
│   ├── services/
│   │   └── team-service.ts             # Team CRUD operations (NEW)
│   ├── handlers/
│   │   └── admin-teams.ts              # Team management endpoints (NEW)
│   ├── middleware/
│   │   └── auth.ts                     # Existing requireAdmin middleware (REUSE)
│   └── app.ts                          # Register team routes (MODIFY)
└── tests/
    └── integration/
        └── teams.test.ts               # Team management integration tests (NEW)

apps/web/                              # Frontend (React + Vite)
├── src/
│   ├── types/
│   │   └── teams.ts                    # Team entity types (NEW)
│   ├── services/
│   │   └── team-api.ts                 # Team API client (NEW)
│   ├── hooks/
│   │   └── useTeams.ts                 # React Query hooks (NEW)
│   ├── components/
│   │   └── admin/
│   │       ├── TeamForm.tsx            # Create team form (NEW)
│   │       ├── TeamTable.tsx           # Team list table (NEW)
│   │       ├── TeamManagement.tsx      # Main container (NEW)
│   │       ├── ManagerSelector.tsx     # Assign manager dropdown (NEW)
│   │       └── MemberSelector.tsx      # Add/remove members (NEW)
│   ├── pages/
│   │   └── AdminTeamsPage.tsx          # Team management page (NEW)
│   └── router.tsx                      # Add /admin/teams route (MODIFY)
└── tests/
    └── components/
        └── admin/
            └── TeamManagement.test.tsx  # Component tests (NEW)
```

**Structure Decision**: Web application (Nx monorepo with separate apps/api and apps/web). This follows the existing pattern from 004-user-management. Backend uses Fastify for Lambda functions, frontend uses React with shadcn/ui components. TypeScript types are duplicated across both apps to maintain independence (no shared packages yet).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations. All gates passed.
