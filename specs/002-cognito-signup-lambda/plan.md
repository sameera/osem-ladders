# Implementation Plan: Cognito Post-Signup User Provisioning

**Branch**: `002-cognito-signup-lambda` | **Date**: 2025-11-12 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-cognito-signup-lambda/spec.md`

## Summary

Create an AWS Lambda function triggered by Cognito Post Confirmation events to provision user records in the DynamoDB Users table. The Lambda implements a two-tier onboarding approach: (1) for pre-created users, it links their Cognito sub while preserving administrator-assigned roles, (2) for new users not pre-created, it auto-provisions them with default team_member role. This enables role-based access control from first login while supporting self-service onboarding.

**Technical Approach**: Lambda function (Node.js 18+, TypeScript 5.5.3) with AWS SDK v3 for DynamoDB operations (GetItem to check existence, UpdateItem for existing users, PutItem for new users). Email addresses serve as immutable userId partition keys, with Cognito sub stored as cognitoSub attribute. IAM role grants dynamodb:GetItem, dynamodb:PutItem, dynamodb:UpdateItem permissions.

## Technical Context

**Language/Version**: TypeScript 5.5.3 with Node.js 18+ Lambda runtime
**Primary Dependencies**: AWS SDK for JavaScript v3 (@aws-sdk/client-dynamodb, @aws-sdk/lib-dynamodb)
**Storage**: DynamoDB Users table with userId (email) as partition key
**Testing**: Jest/Vitest for unit tests, AWS SAM Local for integration testing with Cognito events
**Target Platform**: AWS Lambda (Node.js 18.x runtime)
**Project Type**: Serverless Lambda function (apps/lambda-functions/cognito-post-signup/)
**Performance Goals**: <1 second execution time for 95% of invocations (both create and update operations)
**Constraints**:
- Must complete within Lambda timeout (10 seconds max)
- Must be idempotent (safe to retry)
- Must preserve existing user roles when updating records
- Must fail authentication on DynamoDB errors (no partial success)

**Scale/Scope**:
- ~100 users initial deployment
- Handles concurrent signups during onboarding periods (10+ concurrent)
- Single AWS region deployment
- Cognito Post Confirmation trigger integration

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principles Alignment

**✅ I. Phased Organizational Platform Delivery**
Status: PASS
This feature is foundational (enables user authentication and role-based access). Aligns with Phase 1-2 (User/Team management backend foundation). Lambda must be complete before any role-based UI work begins.

**✅ II. Role-Based Security Model (NON-NEGOTIABLE)**
Status: PASS
Lambda respects pre-assigned roles (admin, manager, team_member) from Users table. For pre-created users, roles are preserved during Cognito sync. For auto-provisioned users, default team_member role is assigned (minimal permissions). Authorization enforcement happens in subsequent API endpoints, not in this Lambda (this Lambda only provisions user records).

**✅ III. Assessment Workflow Integrity (NON-NEGOTIABLE)**
Status: N/A (Not Applicable)
This Lambda does not handle assessment workflows. It provisions user records only.

**✅ IV. Serverless-First Architecture**
Status: PASS
Lambda function on AWS with DynamoDB storage. No EC2 or containers. Infrastructure defined as code (SAM template or CDK).

**⚠️ V. API-First Development**
Status: PARTIAL (Clarification Required)
This is a Cognito trigger (event-driven), not a user-facing API endpoint. No REST API contract applies. Event contract (Cognito Post Confirmation event payload) is AWS-defined and documented. Need to clarify if internal Lambda event handlers require contracts/ documentation.

**✅ VI. Team-Centric Data Model**
Status: PASS (with caveat)
Users table does not directly include teamId (users can belong to multiple teams via Teams.memberIds). Team membership is established separately. This Lambda only provisions user identity records.

### Data Model Governance Alignment

**✅ Entity Design Requirements**
Status: PASS
User records include audit fields: createdAt, updatedAt (Unix milliseconds). userId is email (not UUID per architectural decision). cognitoSub stores Cognito sub UUID. No soft deletes for Users table (users are not deleted, roles are revoked).

**✅ DynamoDB Schema Standards**
Status: PASS
Users table uses single-attribute partition key (userId = email). No GSIs needed for this Lambda (only GetItem by userId). Update operations use UpdateItem with attribute preservation.

### Security Requirements Alignment

**✅ Authentication & Authorization**
Status: PASS (Lambda context)
Lambda is invoked by Cognito service (not user-facing). No JWT validation needed in this Lambda. Authorization happens in API Gateway + downstream Lambda functions that validate userId/roles from Cognito token.

**✅ Data Protection**
Status: PASS
DynamoDB encryption at rest (AWS-managed keys). TLS in transit (AWS managed). CloudWatch logs will use userId (email) for audit, not log sensitive feedback (no feedback in Users table). PII access logged via CloudWatch.

### Open Questions Resolution

**Q: Role assignment mechanism (Cognito groups vs. admin panel)**
Decision: Admin panel approach - administrators pre-create users in DynamoDB with roles, Lambda links Cognito sub. Cognito groups NOT used for role storage (roles stored in DynamoDB Users.roles attribute).

**Q: Multi-org support (single organization vs. multi-tenant SaaS)**
Decision: Single organization (no orgId in Users table). Constitution states single-org assumption. If multi-org needed later, would require schema migration to add orgId.

### Constitution Violations

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| API-First Development (event-driven Lambda) | Cognito triggers are event-driven, not REST APIs | Cannot convert Cognito Post Confirmation to REST API - it's an AWS service integration point |

**Justification**: Cognito Post Confirmation trigger is an AWS event source, not a user-facing API. Event contract is defined by AWS, not us. This is the only way to automate user provisioning on signup. Downstream user management APIs (CRUD operations on Users table) WILL follow API-First principle with contracts/.

## Project Structure

### Documentation (this feature)

```text
specs/002-cognito-signup-lambda/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (Cognito event schema, DynamoDB update patterns)
├── data-model.md        # Phase 1 output (Users table schema with email-based userId)
├── quickstart.md        # Phase 1 output (Local testing with SAM)
├── contracts/           # Phase 1 output (Cognito event contract, not API contract)
│   └── cognito-post-confirmation-event.json  # AWS event schema
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/
└── lambda-functions/
    └── cognito-post-signup/
        ├── src/
        │   ├── handler.ts           # Lambda handler (Cognito Post Confirmation trigger)
        │   ├── services/
        │   │   └── userService.ts   # DynamoDB operations (getUser, createUser, updateUser)
        │   ├── models/
        │   │   └── user.ts          # User type definitions
        │   └── utils/
        │       ├── dynamodb.ts      # DynamoDB client initialization
        │       └── logger.ts        # Structured logging utility
        ├── tests/
        │   ├── unit/
        │   │   └── userService.test.ts
        │   └── integration/
        │       └── handler.test.ts  # Test with mock Cognito events
        ├── package.json
        ├── tsconfig.json
        └── template.yaml            # SAM template for Lambda deployment

infrastructure/
└── cognito/
    └── post-confirmation-trigger-config.json  # Cognito trigger configuration
```

**Structure Decision**: Serverless Lambda function follows apps/lambda-functions/ pattern. Each Lambda function is a separate deployable unit with its own package.json and SAM template. Aligns with monorepo Nx structure where backend functions are isolated from frontend.

## Complexity Tracking

No unjustified violations. API-First exception is necessary for Cognito service integration.

---

## Phase 0: Research Summary

**Status**: ✅ Complete

**Artifacts Created**:
- [research.md](research.md) - Comprehensive research on Cognito triggers, DynamoDB patterns, IAM permissions, Lambda configuration, and unit testing

**Key Research Findings**:

1. **Cognito Event Schema**: Documented complete TypeScript interface for Post Confirmation event with sub, email, name attributes
2. **DynamoDB Pattern**: Single `UpdateItem` with `if_not_exists()` for idempotent upsert (handles both existing user update and new user creation atomically)
3. **Error Handling**: Fail-fast strategy with error propagation to Cognito for automatic retry (up to 3 attempts)
4. **IAM Permissions**: Least-privilege approach - only `dynamodb:UpdateItem` required (no GetItem/PutItem needed)
5. **Lambda Configuration**: 512MB memory, 10s timeout, DynamoDB client reuse outside handler for ~40% performance improvement
6. **Unit Testing**: Vitest with `aws-sdk-client-mock` for type-safe AWS SDK v3 mocking; no SAM Local required per user preference

**No NEEDS CLARIFICATION items remain**: All technical unknowns resolved via AWS documentation research.

---

## Phase 1: Design & Contracts Summary

**Status**: ✅ Complete

**Artifacts Created**:

1. **[data-model.md](data-model.md)**: Users table schema with email-based userId
   - Updated partition key: `userId` (email) instead of Cognito sub
   - New attribute: `cognitoSub` for Cognito UUID reference
   - Example items for all user scenarios (pre-created admin, auto-provisioned user, dual-role manager)
   - Migration strategy from original schema

2. **[contracts/cognito-post-confirmation-event.json](contracts/cognito-post-confirmation-event.json)**: JSON Schema for AWS Cognito event
   - Complete event structure with required/optional fields
   - Example event payload for testing
   - Notes on Lambda response requirements and idempotency

3. **[quickstart.md](quickstart.md)**: Local development guide
   - Unit testing workflow (no SAM Local per user requirement)
   - Deployment instructions with AWS SAM
   - Troubleshooting common issues
   - Performance monitoring

4. **CLAUDE.md Updated**: Agent context updated with new technologies
   - TypeScript 5.5.3 with Node.js 18+ Lambda runtime
   - AWS SDK for JavaScript v3 (@aws-sdk/client-dynamodb, @aws-sdk/lib-dynamodb)
   - DynamoDB Users table with email-based userId

**Constitution Check (Post-Design)**:

All principles remain compliant:
- ✅ Serverless-First Architecture: Lambda + DynamoDB
- ✅ Role-Based Security Model: Respects pre-assigned roles, assigns team_member default
- ✅ Data Model Governance: Email-based userId documented with rationale
- ✅ Security Requirements: No PII in CloudWatch logs, DynamoDB encryption at rest

**API-First Exception Confirmed**: Cognito triggers are event-driven (AWS service integration), not user-facing REST APIs. Event contract documented in contracts/.

---

## Phase 2: Task Generation Summary

**Status**: ✅ Complete

**Artifacts Created**:
- **[tasks.md](tasks.md)**: Complete implementation task breakdown (65 tasks)
  - Organized by user story for independent implementation
  - Test-driven development approach (tests written first)
  - Clear dependencies and parallel opportunities
  - MVP path defined (Phases 1-3, 26 tasks)

**Task Breakdown**:
- Phase 1 (Setup): 9 tasks - Project initialization
- Phase 2 (Foundational): 6 tasks - Core infrastructure (BLOCKING)
- Phase 3 (US1 - P1): 11 tasks - Existing user Cognito sync
- Phase 4 (US2 - P2): 7 tasks - New user auto-provisioning
- Phase 5 (US3 - P3): 8 tasks - Profile data sync
- Phase 6 (Error Handling): 8 tasks - Edge cases
- Phase 7 (Deployment): 8 tasks - Infrastructure
- Phase 8 (Polish): 8 tasks - Code quality

**Parallel Opportunities**: 27 tasks marked [P] for concurrent execution

**MVP Scope**: Phases 1-3 (26 tasks, ~8 hours)
- Delivers: Pre-created users can authenticate via Microsoft 365 with role preservation

---

## Implementation Readiness

**Next Step**: Begin implementation with `/speckit.implement` or start with Phase 1 tasks manually

**Implementation Prerequisites**:
- ✅ Technical research complete (DynamoDB patterns, Lambda config)
- ✅ Data model defined (Users table with email-based userId)
- ✅ Event contract documented (Cognito Post Confirmation schema)
- ✅ Testing strategy defined (Vitest unit tests, no SAM Local)
- ✅ Constitutional compliance verified
- ✅ Agent context updated (CLAUDE.md)
- ✅ Implementation tasks generated (tasks.md with 65 tasks)

**Outstanding Dependencies**:
- DynamoDB Users table created (from 001-dynamodb-setup)
- Cognito User Pool configured with Microsoft 365 OIDC (existing infrastructure)
- Constitutional update (email-based userId) documented in CONSTITUTION_UPDATE.md (awaiting merge to constitution.md)

**Estimated Complexity**: Low-Medium
- Lambda function: ~200 lines TypeScript
- Unit tests: ~300 lines (7 test scenarios)
- Infrastructure: SAM template + IAM policy
- Total implementation time: 16 hours (all phases), 8 hours (MVP only)

