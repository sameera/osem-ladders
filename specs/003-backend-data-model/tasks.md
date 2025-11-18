# Tasks: Backend Data Model Overhaul

**Input**: Design documents from `/specs/003-backend-data-model/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: This feature does NOT explicitly request tests, so test tasks are excluded per specification rules.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md, this is an Nx monorepo with:
- `libs/shared-types/` - Shared TypeScript types
- `apps/api/` - Backend Lambda functions
- `infrastructure/` - AWS CDK infrastructure as code

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure per plan.md specifications

- [ ] T001 Create Nx library for shared types with command: `nx generate @nx/node:library shared-types --directory=libs/shared-types`
- [ ] T002 Configure shared-types library project.json for TypeScript 5.5.3 and tsconfig paths in libs/shared-types/project.json
- [ ] T003 [P] Create infrastructure directory structure: infrastructure/stacks/ for AWS CDK
- [ ] T004 [P] Initialize AWS CDK project in infrastructure/ with: `cdk init app --language typescript`
- [ ] T005 [P] Create Nx application for backend API with command: `nx generate @nx/node:application api --directory=apps/api`
- [ ] T006 Install AWS SDK dependencies in apps/api: `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `@types/aws-lambda`
- [ ] T007 [P] Configure apps/api/project.json with TypeScript 5.5.3, Lambda runtime settings, and build targets

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 Define User interface in libs/shared-types/src/users.ts per data-model.md TypeScript interfaces
- [ ] T009 [P] Define Team interface in libs/shared-types/src/teams.ts per data-model.md TypeScript interfaces
- [ ] T010 [P] Define Assessment and Category interfaces in libs/shared-types/src/assessments.ts per data-model.md TypeScript interfaces
- [ ] T011 [P] Define AssessmentReport interface in libs/shared-types/src/reports.ts per data-model.md TypeScript interfaces
- [ ] T012 Create shared-types barrel export in libs/shared-types/src/index.ts exporting all interfaces
- [ ] T013 Build shared-types library with: `nx build shared-types`
- [ ] T014 Create DynamoDB stack in infrastructure/stacks/dynamodb-stack.ts defining Users table with TeamIndex GSI per data-model.md
- [ ] T015 [P] Add Teams table definition to infrastructure/stacks/dynamodb-stack.ts per data-model.md (no GSIs)
- [ ] T016 [P] Add Assessments table definition to infrastructure/stacks/dynamodb-stack.ts per data-model.md (simple PK)
- [ ] T017 [P] Add AssessmentReports table definition to infrastructure/stacks/dynamodb-stack.ts with UserReportsIndex GSI per data-model.md
- [ ] T018 Configure DynamoDB tables with encryption at rest, point-in-time recovery, and PAY_PER_REQUEST billing in infrastructure/stacks/dynamodb-stack.ts
- [ ] T019 Add CloudFormation outputs for all 4 table names in infrastructure/stacks/dynamodb-stack.ts
- [ ] T020 Deploy DynamoDB infrastructure with: `cdk bootstrap` (first time) then `cdk deploy`
- [ ] T021 Create base DynamoDB client utility in apps/api/src/utils/dynamodb-client.ts for connection reuse (512MB Lambda per plan.md)
- [ ] T022 [P] Create error response utility in apps/api/src/utils/error-handler.ts for standard error format per api-spec.yaml
- [ ] T023 [P] Create success response utility in apps/api/src/utils/response-handler.ts for standard response format per api-spec.yaml
- [ ] T024 Create auth middleware skeleton in apps/api/src/middleware/auth.ts for JWT extraction (Cognito integration deferred)
- [ ] T025 Create authorization utility in apps/api/src/middleware/authorization.ts for role checking (TeamMember, Manager, Admin)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Profile Management (Priority: P1) 🎯 MVP

**Goal**: Enable creating, retrieving, and updating user profiles with email-based identification, role management, and team assignments

**Independent Test**: Create user via POST /users, retrieve via GET /users/{userId}, update team via PUT /users/{userId}, retrieve via GET /me with populated team object

### Implementation for User Story 1

- [ ] T026 [P] [US1] Create UserRepository class in apps/api/src/repositories/user-repository.ts implementing getByEmail (GetItem)
- [ ] T027 [P] [US1] Add create method to UserRepository in apps/api/src/repositories/user-repository.ts with userId immutability check (FR-017)
- [ ] T028 [P] [US1] Add update method to UserRepository in apps/api/src/repositories/user-repository.ts prohibiting userId changes (FR-017)
- [ ] T029 [P] [US1] Add getByTeam method to UserRepository in apps/api/src/repositories/user-repository.ts using TeamIndex GSI (FR-014)
- [ ] T030 [P] [US1] Add listUsers method to UserRepository in apps/api/src/repositories/user-repository.ts with isActive filtering
- [ ] T031 [US1] Create POST /users Lambda handler in apps/api/src/handlers/users/createUser.ts per api-spec.yaml (admin only)
- [ ] T032 [US1] Create GET /users/{userId} Lambda handler in apps/api/src/handlers/users/getUser.ts per api-spec.yaml with authorization (self or admin)
- [ ] T033 [US1] Create PUT /users/{userId} Lambda handler in apps/api/src/handlers/users/updateUser.ts per api-spec.yaml with role-based auth
- [ ] T034 [US1] Create GET /users Lambda handler in apps/api/src/handlers/users/listUsers.ts per api-spec.yaml (admin only)
- [ ] T035 [US1] Create GET /me Lambda handler in apps/api/src/handlers/users/getCurrentUser.ts returning UserProfile with populated TeamInfo (FR-018)
- [ ] T036 [US1] Implement team population logic in GET /me handler to fetch team by team ID and return essential fields only (id, name, managerId, activeAssessmentId)
- [ ] T037 [US1] Add email format validation utility in apps/api/src/utils/validators.ts for RFC 5322 compliance
- [ ] T038 [US1] Add role validation in user handlers ensuring at least one role from [TeamMember, Manager, Admin]
- [ ] T039 [US1] Configure API Gateway /users and /me routes in infrastructure/stacks/api-gateway-stack.ts for User Story 1 endpoints
- [ ] T040 [US1] Configure Lambda function definitions in infrastructure/stacks/lambda-stack.ts for all user handlers with 10s timeout
- [ ] T041 [US1] Deploy API Gateway and Lambda stack with: `cdk deploy` and verify endpoints with curl or Postman

**Checkpoint**: At this point, User Story 1 should be fully functional - users can be created, retrieved (including GET /me), and updated via API

---

## Phase 4: User Story 2 - Team Structure and Management (Priority: P2)

**Goal**: Enable creating teams, assigning managers, tracking active assessments, and querying team members

**Independent Test**: Create team via POST /teams, retrieve via GET /teams/{teamId}, update manager via PUT /teams/{teamId}, query users by team via GET /users?team=engineering

### Implementation for User Story 2

- [ ] T042 [P] [US2] Create TeamRepository class in apps/api/src/repositories/team-repository.ts implementing getById (GetItem)
- [ ] T043 [P] [US2] Add create method to TeamRepository in apps/api/src/repositories/team-repository.ts with team ID format validation (lowercase alphanumeric + hyphens)
- [ ] T044 [P] [US2] Add update method to TeamRepository in apps/api/src/repositories/team-repository.ts for manager and activeAssessmentId updates
- [ ] T045 [P] [US2] Add listTeams method to TeamRepository in apps/api/src/repositories/team-repository.ts with isActive filtering
- [ ] T046 [US2] Create POST /teams Lambda handler in apps/api/src/handlers/teams/createTeam.ts per api-spec.yaml (admin or manager)
- [ ] T047 [US2] Create GET /teams/{teamId} Lambda handler in apps/api/src/handlers/teams/getTeam.ts per api-spec.yaml
- [ ] T048 [US2] Create PUT /teams/{teamId} Lambda handler in apps/api/src/handlers/teams/updateTeam.ts per api-spec.yaml (admin or team manager)
- [ ] T049 [US2] Create GET /teams Lambda handler in apps/api/src/handlers/teams/listTeams.ts per api-spec.yaml with managerId filter support
- [ ] T050 [US2] Add manager validation in team handlers ensuring managerId references user with Manager role (FR-008)
- [ ] T051 [US2] Add team ID format validation in team handlers (lowercase, alphanumeric, hyphens only)
- [ ] T052 [US2] Configure API Gateway /teams routes in infrastructure/stacks/api-gateway-stack.ts for Team Story 2 endpoints
- [ ] T053 [US2] Configure Lambda function definitions in infrastructure/stacks/lambda-stack.ts for all team handlers
- [ ] T054 [US2] Deploy updated API stack with: `cdk deploy` and verify team endpoints

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - users exist in teams with assigned managers

---

## Phase 5: User Story 3 - Assessment Management (Priority: P3)

**Goal**: Enable creating and managing assessment templates with category structures, versioning, and retrieval by ID

**Independent Test**: Create assessment via POST /assessments, retrieve via GET /assessments/{assessmentId}, list via GET /assessments

### Implementation for User Story 3

- [ ] T055 [P] [US3] Create AssessmentRepository class in apps/api/src/repositories/assessment-repository.ts implementing getById (GetItem)
- [ ] T056 [P] [US3] Add create method to AssessmentRepository in apps/api/src/repositories/assessment-repository.ts with UUID generation and version field
- [ ] T057 [P] [US3] Add listAssessments method to AssessmentRepository in apps/api/src/repositories/assessment-repository.ts with isActive filtering
- [ ] T058 [US3] Create POST /assessments Lambda handler in apps/api/src/handlers/assessments/createAssessment.ts per api-spec.yaml (admin only)
- [ ] T059 [US3] Create GET /assessments/{assessmentId} Lambda handler in apps/api/src/handlers/assessments/getAssessment.ts per api-spec.yaml
- [ ] T060 [US3] Create GET /assessments Lambda handler in apps/api/src/handlers/assessments/listAssessments.ts per api-spec.yaml with name filter
- [ ] T061 [US3] Add plan structure validation in assessment handlers ensuring valid Category[] format per data-model.md
- [ ] T062 [US3] Add semantic version validation (e.g., 1.0.0) in assessment handlers per api-spec.yaml pattern
- [ ] T063 [US3] Configure API Gateway /assessments routes in infrastructure/stacks/api-gateway-stack.ts for Assessment Story 3 endpoints
- [ ] T064 [US3] Configure Lambda function definitions in infrastructure/stacks/lambda-stack.ts for all assessment handlers
- [ ] T065 [US3] Deploy updated API stack with: `cdk deploy` and verify assessment endpoints

**Checkpoint**: All user stories 1, 2, 3 should now be independently functional - assessments can be created and assigned to teams

---

## Phase 6: User Story 4 - Assessment Report Generation (Priority: P4)

**Goal**: Enable creating and accessing assessment reports with content-addressed storage, supporting both self and manager assessment types

**Independent Test**: Create self-assessment via POST /reports, retrieve via GET /reports/{reportId}, query by user via GET /reports?userId=user@example.com, verify duplicate prevention with same userId|assessmentId|type

### Implementation for User Story 4

- [ ] T066 [P] [US4] Create content-addressed key utility in apps/api/src/utils/content-addressing.ts generating keys in format: userId|assessmentId|type
- [ ] T067 [P] [US4] Create AssessmentReportRepository class in apps/api/src/repositories/report-repository.ts implementing getById (GetItem with CAS key)
- [ ] T068 [P] [US4] Add create method to AssessmentReportRepository in apps/api/src/repositories/report-repository.ts using PutItem (overwrites duplicates per FR-015)
- [ ] T069 [P] [US4] Add update method to AssessmentReportRepository in apps/api/src/repositories/report-repository.ts with immutability check for status=submitted
- [ ] T070 [P] [US4] Add getByUser method to AssessmentReportRepository in apps/api/src/repositories/report-repository.ts using UserReportsIndex GSI (FR-013)
- [ ] T071 [P] [US4] Add listReports method to AssessmentReportRepository in apps/api/src/repositories/report-repository.ts with userId and assessmentId filters
- [ ] T072 [US4] Create POST /reports Lambda handler in apps/api/src/handlers/reports/createReport.ts per api-spec.yaml with type-based authorization
- [ ] T073 [US4] Create GET /reports/{reportId} Lambda handler in apps/api/src/handlers/reports/getReport.ts per api-spec.yaml with role-based access
- [ ] T074 [US4] Create PUT /reports/{reportId} Lambda handler in apps/api/src/handlers/reports/updateReport.ts per api-spec.yaml blocking updates for submitted reports
- [ ] T075 [US4] Create GET /reports Lambda handler in apps/api/src/handlers/reports/listReports.ts per api-spec.yaml with userId, assessmentId, type filters
- [ ] T076 [US4] Add assessor validation in report handlers: for type=self, assessorId must equal userId; for type=manager, assessorId must equal managerId
- [ ] T077 [US4] Add report immutability validation in update handler returning 403 for status=submitted per api-spec.yaml
- [ ] T078 [US4] Add orphaned record handling in report queries gracefully returning results even if user/assessment deleted (FR-016)
- [ ] T079 [US4] Configure API Gateway /reports routes in infrastructure/stacks/api-gateway-stack.ts for Report Story 4 endpoints
- [ ] T080 [US4] Configure Lambda function definitions in infrastructure/stacks/lambda-stack.ts for all report handlers with 30s timeout (complex queries)
- [ ] T081 [US4] Deploy updated API stack with: `cdk deploy` and verify report endpoints including <100ms p95 for GetItem by composite key

**Checkpoint**: All user stories should now be independently functional - complete end-to-end assessment workflow from users to reports

---

## Phase 7: Data Migration and Seeding

**Purpose**: Migrate existing data to new DynamoDB schema and seed initial assessment from config.md

- [ ] T082 Create config.md parser utility in apps/api/src/utils/config-parser.ts to convert Markdown to Category[] structure
- [ ] T083 Create data migration script in apps/api/src/scripts/migrate-assessments.ts to seed initial assessment from apps/web/src/data/config.md
- [ ] T084 [P] Create data migration script in apps/api/src/scripts/migrate-users.ts to migrate users from Cognito or existing database to Users table
- [ ] T085 [P] Create data migration script in apps/api/src/scripts/migrate-teams.ts to create initial teams based on current organizational structure
- [ ] T086 Run assessment migration with: `tsx apps/api/src/scripts/migrate-assessments.ts` after setting ASSESSMENTS_TABLE_NAME env var
- [ ] T087 Run user and team migrations to populate Users and Teams tables
- [ ] T088 Verify migration success by querying all tables and validating data integrity

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and production readiness

- [ ] T089 [P] Add CloudWatch logging to all Lambda handlers using structured logging format
- [ ] T090 [P] Add error tracking and alerting in infrastructure/stacks/monitoring-stack.ts for Lambda errors and DynamoDB throttling
- [ ] T091 [P] Configure CORS in API Gateway stack to allow apps/web frontend access
- [ ] T092 [P] Add API Gateway request validation using OpenAPI spec from contracts/api-spec.yaml
- [ ] T093 [P] Implement Cognito JWT verification in apps/api/src/middleware/auth.ts using AWS Cognito public keys
- [ ] T094 [P] Add rate limiting to API Gateway to prevent abuse
- [ ] T095 Update CLAUDE.md to document new backend architecture, DynamoDB tables, API endpoints, and removal of Supabase legacy
- [ ] T096 Remove obsolete apps/db-setup directory (marked obsolete in OBSOLETE_CODE.md)
- [ ] T097 [P] Add API documentation generation from OpenAPI spec for developer portal
- [ ] T098 [P] Performance testing for SC-004 target: verify report retrieval <100ms p95 using load testing tool
- [ ] T099 Validate all acceptance scenarios from spec.md user stories by running end-to-end test scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (T001-T007) - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion (T008-T025)
  - User Story 1 (Phase 3): Can start after Foundational - No dependencies on other stories
  - User Story 2 (Phase 4): Can start after Foundational - Integrates with US1 (users belong to teams) but independently testable
  - User Story 3 (Phase 5): Can start after Foundational - No dependencies on other stories (assessments are templates)
  - User Story 4 (Phase 6): Can start after Foundational - References US1 (users), US2 (teams via users), US3 (assessments) but independently testable
- **Data Migration (Phase 7)**: Depends on all user stories being deployed (T026-T081)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: INDEPENDENT - Can complete without US2, US3, US4
- **User Story 2 (P2)**: INDEPENDENT - Can complete without US1, US3, US4 (but integrates with US1 for team membership)
- **User Story 3 (P3)**: INDEPENDENT - Can complete without US1, US2, US4
- **User Story 4 (P4)**: INDEPENDENT - Can complete and test without other stories (references users, assessments but handles orphaned records)

### Within Each User Story

- Repository layer before handlers
- Core CRUD operations before complex queries
- Validation utilities before handler implementation
- Infrastructure deployment after all handler code is complete

### Parallel Opportunities

- **Phase 1**: T003, T004, T005, T007 can run in parallel (different directories)
- **Phase 2**: T009-T011 (interfaces), T015-T017 (table definitions), T022-T023 (utilities) can run in parallel
- **User Story 1**: T026-T030 (repository methods), T031-T034 (handlers) can run in parallel
- **User Story 2**: T042-T045 (repository methods), T046-T049 (handlers) can run in parallel
- **User Story 3**: T055-T057 (repository methods), T058-T060 (handlers) can run in parallel
- **User Story 4**: T066-T071 (repository methods and utilities), T072-T075 (handlers) can run in parallel
- **Phase 7**: T084-T085 (migration scripts) can run in parallel
- **Phase 8**: T089-T094, T097-T098 can run in parallel

---

## Parallel Example: User Story 1 Implementation

```bash
# Launch all repository methods for User Story 1 together:
Task T026: "Create UserRepository class with getByEmail"
Task T027: "Add create method to UserRepository"
Task T028: "Add update method to UserRepository"
Task T029: "Add getByTeam method to UserRepository"
Task T030: "Add listUsers method to UserRepository"

# After repositories complete, launch all handlers together:
Task T031: "Create POST /users Lambda handler"
Task T032: "Create GET /users/{userId} Lambda handler"
Task T033: "Create PUT /users/{userId} Lambda handler"
Task T034: "Create GET /users Lambda handler"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T007)
2. Complete Phase 2: Foundational (T008-T025) - CRITICAL, blocks all stories
3. Complete Phase 3: User Story 1 (T026-T041)
4. **STOP and VALIDATE**: Test User Story 1 independently using curl/Postman
5. Deploy to staging environment
6. Demo user management functionality

### Incremental Delivery (All 4 User Stories)

1. Complete Setup + Foundational → Foundation ready (checkpoint)
2. Add User Story 1 → Test independently → Deploy staging → Demo (MVP!)
3. Add User Story 2 → Test independently → Verify team management → Deploy staging
4. Add User Story 3 → Test independently → Verify assessment templates → Deploy staging
5. Add User Story 4 → Test independently → Verify end-to-end workflow → Deploy staging
6. Run data migration → Seed production data
7. Polish and production hardening → Deploy production
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers after Foundational phase completes:

1. Team completes Setup + Foundational together (T001-T025)
2. Once Foundational is done:
   - Developer A: User Story 1 (T026-T041) - User profiles and GET /me
   - Developer B: User Story 2 (T042-T054) - Team management
   - Developer C: User Story 3 (T055-T065) - Assessment templates
   - Developer D: User Story 4 (T066-T081) - Assessment reports
3. Stories complete and integrate independently
4. Team collaborates on Phase 7 (data migration) and Phase 8 (polish)

---

## Notes

- [P] tasks = different files/directories, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability (US1, US2, US3, US4)
- Each user story should be independently completable and testable per spec.md acceptance criteria
- Commit after each task or logical group of parallel tasks
- Stop at any checkpoint to validate story independently before proceeding
- All file paths are exact and follow the monorepo structure from plan.md
- Total task count: 99 tasks
- MVP scope (User Story 1 only): 41 tasks (T001-T041)
- Performance target SC-004 validated in T081 and T098
- Tests were NOT included as they are not explicitly requested in the specification