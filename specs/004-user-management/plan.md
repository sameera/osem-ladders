# Implementation Plan: Administrator User Management

**Branch**: `004-user-management` | **Date**: 2025-11-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-user-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Administrators need a user management interface to add users by email, assign roles (manager/admin), update roles, and deactivate users while preserving historical data. This feature builds on the existing DynamoDB Users table and AWS Cognito authentication, adding frontend UI components and backend API endpoints for CRUD operations with role-based authorization.

## Technical Context

**Language/Version**: TypeScript 5.5.3 with Node.js 18+ (aligns with existing web and API apps)
**Primary Dependencies**:
- **Frontend**: React 18, React Query (@tanstack/react-query), shadcn/ui, Tailwind CSS, React Router
- **Backend**: Fastify (existing API framework), AWS SDK v3 (@aws-sdk/client-dynamodb, @aws-sdk/lib-dynamodb), AWS Lambda runtime
**Storage**: AWS DynamoDB - Users table (existing, defined in spec 003-backend-data-model)
**Testing**: Vitest for both frontend and backend (existing test infrastructure)
**Target Platform**:
- **Frontend**: Modern browsers (Chrome, Firefox, Safari, Edge) via React SPA hosted on port 8080
- **Backend**: AWS Lambda functions behind API Gateway (serverless)
**Project Type**: Web application (fullstack: React frontend + Lambda backend)
**Performance Goals**:
- User list rendering: <1s for 1000 users with pagination
- API response times: <500ms p95 for CRUD operations
- Search/filter: <1s for 95% of queries
**Constraints**:
- Role-based authorization: Only users with "admin" role can access user management features
- Deactivation must preserve historical assessment data (soft delete via isActive flag)
- Email validation must prevent 100% of invalid formats
- Self-deactivation must be blocked
- Team managers must be unassigned before deactivation
**Scale/Scope**:
- Support up to 1000 users in organization
- 1 admin user management page with 4 main operations (add, view, update role, deactivate)
- 5-7 backend API endpoints for user CRUD operations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Phased Organizational Platform Delivery
✅ **PASS** - This feature is part of Phase 2 (User/Team Management) in the 8-phase migration plan. It delivers independently valuable organizational capability (user onboarding and role management) and can be deployed before assessment workflows.

### Principle II: Role-Based Security Model
✅ **PASS** - All user management endpoints will validate Cognito JWT tokens and enforce "admin" role requirement. Authorization checks will occur at API Gateway (authentication) and Lambda function (role-based filtering). Self-deactivation prevention and team manager checks align with dual-role security requirements.

### Principle III: Assessment Workflow Integrity
✅ **PASS** - This feature supports workflow integrity by preventing deactivation of team managers without role reassignment (FR-016), ensuring manager assessments remain valid. Historical assessment data preservation (FR-014) maintains audit trail.

### Principle IV: Serverless-First Architecture
✅ **PASS** - Backend uses AWS Lambda functions with API Gateway for RESTful endpoints. Storage uses existing DynamoDB Users table with partition key (userId/email). No EC2 instances or containers introduced.

### Principle V: API-First Development
✅ **PASS** - API contracts will be documented in `contracts/` directory before implementation. Frontend will use React Query for server state management. No localStorage for user data (server-side source of truth).

### Principle VI: Team-Centric Data Model
✅ **PASS** - User entity includes `team` field for team affiliation. User queries will support filtering by team. Admin role enables cross-team queries with explicit authorization.

### Data Model Governance
✅ **PASS** - User entity includes audit fields (createdAt, updatedAt, createdBy). Soft delete via `isActive: false` flag (FR-013, SC-005). Email addresses are immutable (per spec 003-backend-data-model FR-017).

### Security Requirements
✅ **PASS** - All endpoints require valid Cognito JWT with "admin" role. Authorization violations return HTTP 403. Deactivation enforcement prevents authentication (FR-013). No PII logging in CloudWatch (use userId only).

### Development Workflow
✅ **PASS** - Feature follows Phase 2 (User/Team Management) prerequisites. User stories are independently testable with Given-When-Then acceptance criteria. Integration tests required for admin authorization and self-deactivation prevention.

### Performance Standards
✅ **PASS** - API endpoints target <500ms p95 response time (aligned with constitution). React Query cache TTL: 1 minute for user lists. Lambda functions will reuse DynamoDB connections and use 512MB memory minimum.

**Gate Status**: ✅ **ALL CHECKS PASSED** - Proceed to Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
specs/004-user-management/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── users.openapi.yaml
│   └── users-types.ts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Nx Monorepo Structure (Web Application with Backend API)

apps/api/                           # Backend Lambda functions
├── src/
│   ├── handlers/
│   │   └── users.ts                # User management Lambda handlers (NEW)
│   ├── services/
│   │   └── user-service.ts         # User business logic (NEW)
│   ├── middleware/
│   │   └── auth.ts                 # Existing auth middleware (EXTEND for admin check)
│   ├── types/
│   │   └── users.ts                # Existing user type definitions (REFERENCE)
│   └── app.ts                      # Existing Fastify app (ADD routes)
└── tests/
    ├── integration/
    │   └── users.test.ts           # User management integration tests (NEW)
    └── unit/
        └── user-service.test.ts    # User service unit tests (NEW)

apps/web/                           # Frontend React application
├── src/
│   ├── components/
│   │   └── admin/                  # Admin-specific components (NEW)
│   │       ├── UserManagement.tsx
│   │       ├── UserTable.tsx
│   │       ├── UserForm.tsx
│   │       └── UserRoleBadge.tsx
│   ├── pages/
│   │   └── AdminUsersPage.tsx      # User management page (NEW)
│   ├── hooks/
│   │   └── useUsers.ts             # React Query hooks for user data (NEW)
│   ├── services/
│   │   └── user-api.ts             # User API client (NEW)
│   └── App.tsx                     # Existing app (ADD route for /admin/users)
└── tests/
    └── components/
        └── admin/
            └── UserManagement.test.tsx  # Component tests (NEW)
```

**Structure Decision**: This is an Nx monorepo with separate `apps/web/` (React frontend) and `apps/api/` (Fastify backend for Lambda) applications. The user management feature adds new frontend components under `apps/web/src/components/admin/`, new API handlers under `apps/api/src/handlers/`, and shared type definitions. This structure follows existing patterns established in specs 002 and 003.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations detected. All checks passed.
