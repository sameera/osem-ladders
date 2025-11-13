# Tasks: Cognito Post-Signup User Provisioning

**Input**: Design documents from `/specs/002-cognito-signup-lambda/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Unit tests are included per user specification requirement. Tests use Vitest with mocked AWS SDK (no SAM Local).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Lambda function**: `apps/lambda-functions/cognito-post-signup/`
- **Source code**: `apps/lambda-functions/cognito-post-signup/src/`
- **Tests**: `apps/lambda-functions/cognito-post-signup/src/__tests__/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create Lambda project directory structure at apps/lambda-functions/cognito-post-signup/
- [ ] T002 Initialize package.json with TypeScript 5.5.3, Node.js 18+ dependencies, and scripts
- [ ] T003 [P] Configure tsconfig.json for Lambda runtime (ES2022 target, CommonJS module)
- [ ] T004 [P] Configure vitest.config.ts for unit testing with AWS SDK mocks
- [ ] T005 [P] Create .env.local template with USERS_TABLE_NAME and AWS_REGION
- [ ] T006 [P] Add ESLint configuration at apps/lambda-functions/cognito-post-signup/.eslintrc.json
- [ ] T007 [P] Install AWS SDK v3 dependencies (@aws-sdk/client-dynamodb, @aws-sdk/lib-dynamodb)
- [ ] T008 [P] Install Vitest and aws-sdk-client-mock for testing
- [ ] T009 Create .gitignore for node_modules, dist/, and .env.local

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T010 Create TypeScript type definitions for Cognito Post Confirmation event in apps/lambda-functions/cognito-post-signup/src/types.ts
- [ ] T011 Create TypeScript interface for User entity in apps/lambda-functions/cognito-post-signup/src/types.ts
- [ ] T012 [P] Initialize DynamoDB Document Client in apps/lambda-functions/cognito-post-signup/src/utils/dynamodb.ts
- [ ] T013 [P] Create structured logger utility in apps/lambda-functions/cognito-post-signup/src/utils/logger.ts
- [ ] T014 [P] Create test setup file with AWS SDK mocks in apps/lambda-functions/cognito-post-signup/src/__tests__/setup.ts
- [ ] T015 [P] Create mock Cognito event fixtures in apps/lambda-functions/cognito-post-signup/src/__tests__/fixtures/cognito-events.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Existing User Cognito Sync (Priority: P1) 🎯 MVP

**Goal**: Enable pre-created users (with admin/manager roles) to authenticate via Cognito while preserving their assigned roles

**Independent Test**: Manually create a user record in Users table with email "jane.doe@company.com" and roles ['manager'], then have that user sign up via Microsoft 365. Verify cognitoSub is populated and roles remain ['manager'].

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T016 [P] [US1] Unit test: UpdateItem preserves existing roles for pre-created user in apps/lambda-functions/cognito-post-signup/src/__tests__/userService.test.ts
- [ ] T017 [P] [US1] Unit test: Handler updates cognitoSub for existing user with email jane.doe@company.com in apps/lambda-functions/cognito-post-signup/src/__tests__/index.test.ts
- [ ] T018 [P] [US1] Unit test: Handler preserves existing name attribute if present in apps/lambda-functions/cognito-post-signup/src/__tests__/index.test.ts
- [ ] T019 [P] [US1] Unit test: Idempotency - repeated signups don't modify existing user in apps/lambda-functions/cognito-post-signup/src/__tests__/index.test.ts

### Implementation for User Story 1

- [ ] T020 [US1] Implement getExistingUserAttributes helper in apps/lambda-functions/cognito-post-signup/src/services/userService.ts
- [ ] T021 [US1] Implement upsertUser function with if_not_exists() expressions in apps/lambda-functions/cognito-post-signup/src/services/userService.ts
- [ ] T022 [US1] Implement Lambda handler extracting Cognito attributes in apps/lambda-functions/cognito-post-signup/src/index.ts
- [ ] T023 [US1] Add validation for required email and sub attributes in apps/lambda-functions/cognito-post-signup/src/index.ts
- [ ] T024 [US1] Add error handling for DynamoDB failures with Cognito error response in apps/lambda-functions/cognito-post-signup/src/index.ts
- [ ] T025 [US1] Add CloudWatch logging for user update operations in apps/lambda-functions/cognito-post-signup/src/index.ts
- [ ] T026 [US1] Verify all User Story 1 tests pass with implementation

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - New User Auto-Provisioning (Priority: P2)

**Goal**: Auto-provision users who sign up without pre-created records, assigning default team_member role

**Independent Test**: Sign up a user with email "new.user@company.com" who has no record in Users table and verify a new DynamoDB record is created with roles: ['team_member'].

### Tests for User Story 2

- [ ] T027 [P] [US2] Unit test: New user created with team_member role in apps/lambda-functions/cognito-post-signup/src/__tests__/userService.test.ts
- [ ] T028 [P] [US2] Unit test: Handler creates new user when no existing record found in apps/lambda-functions/cognito-post-signup/src/__tests__/index.test.ts
- [ ] T029 [P] [US2] Unit test: Default role assignment for auto-provisioned users in apps/lambda-functions/cognito-post-signup/src/__tests__/index.test.ts

### Implementation for User Story 2

- [ ] T030 [US2] Update upsertUser to handle new user creation with default roles in apps/lambda-functions/cognito-post-signup/src/services/userService.ts
- [ ] T031 [US2] Add logic to set roles: ['team_member'] for new users using if_not_exists() in apps/lambda-functions/cognito-post-signup/src/services/userService.ts
- [ ] T032 [US2] Add CloudWatch logging for new user provisioning operations in apps/lambda-functions/cognito-post-signup/src/index.ts
- [ ] T033 [US2] Verify all User Story 2 tests pass with implementation

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - User Profile Data Sync (Priority: P3)

**Goal**: Capture and store user profile information (email, display name) from Microsoft 365

**Independent Test**: Sign up with a Microsoft 365 account having specific display name and email, verify both values are correctly stored in DynamoDB Users table.

### Tests for User Story 3

- [ ] T034 [P] [US3] Unit test: Name attribute populated from Microsoft 365 display name in apps/lambda-functions/cognito-post-signup/src/__tests__/userService.test.ts
- [ ] T035 [P] [US3] Unit test: Name defaults to email prefix when display name missing in apps/lambda-functions/cognito-post-signup/src/__tests__/userService.test.ts
- [ ] T036 [P] [US3] Unit test: Email stored as both userId and email attribute in apps/lambda-functions/cognito-post-signup/src/__tests__/index.test.ts

### Implementation for User Story 3

- [ ] T037 [US3] Implement extractDisplayName helper with email prefix fallback in apps/lambda-functions/cognito-post-signup/src/utils/userAttributes.ts
- [ ] T038 [US3] Update upsertUser to populate name with fallback logic in apps/lambda-functions/cognito-post-signup/src/services/userService.ts
- [ ] T039 [US3] Ensure email is stored in both userId and email attributes in apps/lambda-functions/cognito-post-signup/src/services/userService.ts
- [ ] T040 [US3] Add CloudWatch logging for profile data sync operations in apps/lambda-functions/cognito-post-signup/src/index.ts
- [ ] T041 [US3] Verify all User Story 3 tests pass with implementation

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Error Handling & Edge Cases

**Purpose**: Comprehensive error handling for production readiness

- [ ] T042 [P] Unit test: Missing email attribute throws error in apps/lambda-functions/cognito-post-signup/src/__tests__/index.test.ts
- [ ] T043 [P] Unit test: Missing sub attribute throws error in apps/lambda-functions/cognito-post-signup/src/__tests__/index.test.ts
- [ ] T044 [P] Unit test: DynamoDB timeout error propagates to Cognito in apps/lambda-functions/cognito-post-signup/src/__tests__/index.test.ts
- [ ] T045 [P] Unit test: DynamoDB ResourceNotFoundException handled gracefully in apps/lambda-functions/cognito-post-signup/src/__tests__/index.test.ts
- [ ] T046 Implement validation for required Cognito attributes (email, sub) in apps/lambda-functions/cognito-post-signup/src/index.ts
- [ ] T047 Implement DynamoDB error handling with proper Cognito error response in apps/lambda-functions/cognito-post-signup/src/index.ts
- [ ] T048 Add comprehensive CloudWatch logging for all error scenarios in apps/lambda-functions/cognito-post-signup/src/index.ts
- [ ] T049 Verify error handling tests pass with implementation

---

## Phase 7: Deployment Infrastructure

**Purpose**: Prepare Lambda for deployment to AWS

- [ ] T050 [P] Create AWS SAM template.yaml at apps/lambda-functions/cognito-post-signup/template.yaml
- [ ] T051 [P] Create IAM policy document for DynamoDB UpdateItem permission at apps/lambda-functions/cognito-post-signup/policies/dynamodb-policy.json
- [ ] T052 [P] Create IAM trust policy for Lambda execution role at apps/lambda-functions/cognito-post-signup/policies/trust-policy.json
- [ ] T053 [P] Copy GitHub Actions workflow to .github/workflows/deploy-cognito-lambda.yml from contracts/github-workflow-deploy-lambda.yml
- [ ] T054 [P] Create README.md with deployment instructions at apps/lambda-functions/cognito-post-signup/README.md
- [ ] T055 Update monorepo package.json to include Lambda build scripts
- [ ] T056 Test TypeScript build output in dist/ directory
- [ ] T057 Test Lambda deployment package creation (zip file)

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T058 [P] Run pnpm lint and fix all linting issues
- [ ] T059 [P] Run pnpm test:coverage and verify 100% coverage for handlers and services
- [ ] T060 [P] Add JSDoc comments to all public functions in src/index.ts and src/services/userService.ts
- [ ] T061 [P] Update CLAUDE.md with Lambda project location and testing commands
- [ ] T062 [P] Create DEPLOYMENT.md with step-by-step deployment guide at apps/lambda-functions/cognito-post-signup/DEPLOYMENT.md
- [ ] T063 Run quickstart.md validation: verify all commands work correctly
- [ ] T064 Performance review: verify Lambda cold start < 500ms, hot invocation < 200ms
- [ ] T065 Security review: verify no secrets in code, IAM permissions follow least privilege

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Error Handling (Phase 6)**: Depends on User Stories 1-3 completion
- **Deployment (Phase 7)**: Depends on User Stories 1-3 completion
- **Polish (Phase 8)**: Depends on all previous phases being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on US1 (same upsertUser function handles both)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - No dependencies on US1/US2 (profile sync is independent)

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Service layer (userService.ts) before handler (index.ts)
- Validation before business logic
- Error handling after happy path
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T003-T009)
- All Foundational tasks marked [P] can run in parallel (T012-T015)
- Once Foundational phase completes, all user stories can start in parallel (US1, US2, US3)
- All tests for a user story marked [P] can run in parallel (write tests together)
- All Deployment Infrastructure tasks marked [P] can run in parallel (T050-T054)
- All Polish tasks marked [P] can run in parallel (T058-T062)

---

## Parallel Example: User Story 1

```bash
# Phase 1: Write all tests together for US1 (in parallel):
Task T016: "Unit test: UpdateItem preserves existing roles"
Task T017: "Unit test: Handler updates cognitoSub"
Task T018: "Unit test: Handler preserves existing name"
Task T019: "Unit test: Idempotency test"

# Phase 2: Implement in sequence:
Task T020: "Implement getExistingUserAttributes"
Task T021: "Implement upsertUser with if_not_exists()"
Task T022: "Implement Lambda handler"
Task T023: "Add validation"
Task T024: "Add error handling"
Task T025: "Add logging"
Task T026: "Verify tests pass"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T009)
2. Complete Phase 2: Foundational (T010-T015) - CRITICAL - blocks all stories
3. Complete Phase 3: User Story 1 (T016-T026)
4. **STOP and VALIDATE**: Test User Story 1 independently with pre-created user
5. Deploy to dev environment and test with real Cognito

**MVP Delivers**: Pre-created users (admins/managers) can authenticate via Microsoft 365 and their roles are preserved.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (auto-provisioning fallback)
4. Add User Story 3 → Test independently → Deploy/Demo (profile data sync polish)
5. Add Error Handling → Test edge cases → Deploy/Demo (production-ready)
6. Add Deployment Infrastructure → Automate CI/CD → Deploy/Demo
7. Polish → Code quality improvements → Deploy/Demo

**Each story adds value without breaking previous stories**

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T015)
2. Once Foundational is done:
   - Developer A: User Story 1 (T016-T026) - Existing user sync
   - Developer B: User Story 2 (T027-T033) - New user provisioning
   - Developer C: User Story 3 (T034-T041) - Profile data sync
3. Stories complete and integrate independently (all modify same upsertUser function)
4. Team completes Error Handling + Deployment + Polish together

---

## Testing Strategy

### Unit Testing (Required)

**Framework**: Vitest with aws-sdk-client-mock for AWS SDK v3 mocking

**Test Coverage Goals**:
- Handlers: 100%
- Services: 100%
- Utils: 100%

**Test Files**:
- `src/__tests__/index.test.ts` - Lambda handler tests
- `src/__tests__/userService.test.ts` - DynamoDB service tests
- `src/__tests__/setup.ts` - Vitest configuration with AWS mocks

**Test Scenarios** (per research.md):
1. ✅ New user provisioning with team_member role
2. ✅ Existing user update (cognitoSub only, roles preserved)
3. ✅ Missing email attribute (throws error)
4. ✅ Missing sub attribute (throws error)
5. ✅ Missing name attribute (defaults to email prefix)
6. ✅ DynamoDB error propagation
7. ✅ Idempotency (same event processed twice)

### No SAM Local Testing (Per User Requirement)

**Local Development**: Unit tests with mocked AWS SDK only
**Integration Testing**: Deploy to dev environment and test with real Cognito + DynamoDB
**Monitoring**: CloudWatch Logs for Lambda execution in dev environment

### Deployment Testing

After deployment to dev:
1. Pre-create user with email and roles ['manager']
2. Sign up via Microsoft 365 with that email
3. Verify cognitoSub populated, roles preserved
4. Sign up with new email (not pre-created)
5. Verify new user created with roles ['team_member']
6. Check CloudWatch Logs for all operations

---

## Success Criteria Mapping

Tasks map to success criteria from spec.md:

- **SC-001**: User Story 1 tasks (T016-T026) - Pre-created users retain roles
- **SC-002**: User Story 2 tasks (T027-T033) - New users get team_member role
- **SC-003**: Error Handling tasks (T042-T049) - Concurrent signup handling
- **SC-004**: User Story 3 tasks (T034-T041) - Profile data sync
- **SC-005**: Error Handling tasks (T042-T049) - Failure rate < 0.1%
- **SC-006**: Error Handling tasks (T046-T048) - Lambda failures prevent auth
- **SC-007**: Polish tasks (T064) - Execution duration < 1s for 95%
- **SC-008**: All logging tasks (T025, T032, T040, T048) - CloudWatch audit logs

---

## Task Count Summary

- **Phase 1 (Setup)**: 9 tasks
- **Phase 2 (Foundational)**: 6 tasks (BLOCKING)
- **Phase 3 (US1)**: 11 tasks (4 tests + 7 implementation)
- **Phase 4 (US2)**: 7 tasks (3 tests + 4 implementation)
- **Phase 5 (US3)**: 8 tasks (3 tests + 5 implementation)
- **Phase 6 (Error Handling)**: 8 tasks (4 tests + 4 implementation)
- **Phase 7 (Deployment)**: 8 tasks
- **Phase 8 (Polish)**: 8 tasks

**Total**: 65 tasks

**Parallel Opportunities**:
- Phase 1: 7 tasks can run in parallel
- Phase 2: 4 tasks can run in parallel
- Phase 3-5: 3 user stories can run in parallel (after Phase 2)
- Phase 6: 5 tasks can run in parallel
- Phase 7: 5 tasks can run in parallel
- Phase 8: 6 tasks can run in parallel

**Estimated Timeline** (single developer):
- MVP (Phases 1-3): ~8 hours
- Full feature (Phases 1-5): ~12 hours
- Production-ready (Phases 1-8): ~16 hours

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Single `upsertUser` function handles both US1 (existing user) and US2 (new user) via if_not_exists() expressions
- GitHub Actions workflow preferred for deployment over manual SAM deployment
- No SAM Local testing - unit tests only for local development
