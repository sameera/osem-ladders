# Tasks: DynamoDB Setup Tool

**Input**: Design documents from `/specs/001-dynamodb-setup/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Integration tests with DynamoDB Local are included per constitution testing requirements

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize Nx application structure for CLI tool

- [x] T001 Create Nx application using `nx generate @nx/node:application db-setup --directory=apps/db-setup`
- [x] T002 Install AWS SDK v3 dependencies: `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `@aws-sdk/client-sts`
- [x] T003 [P] Install CLI dependencies: `commander@12.x`, `chalk@5.x`, `ora@8.x`
- [x] T004 [P] Configure TypeScript in apps/db-setup/tsconfig.json for Node.js 18+ target (already configured by Nx)
- [x] T005 [P] Configure Vitest in apps/db-setup/vitest.config.ts
- [x] T006 Update apps/db-setup/package.json with test target and add pnpm script to root package.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Create TypeScript interfaces for all 6 table schemas in apps/db-setup/src/types/schemas.ts
- [x] T008 [P] Implement DynamoDB client initialization with modular imports in apps/db-setup/src/services/dynamodb-client.ts
- [x] T009 [P] Implement credential validator using STS GetCallerIdentity in apps/db-setup/src/services/credential-validator.ts
- [x] T010 [P] Create logger utility with Chalk colors (success/error/warning/info) in apps/db-setup/src/utils/logger.ts
- [x] T011 [P] Create error handler utility with remediation messages in apps/db-setup/src/utils/error-handler.ts
- [x] T012 Create table waiter utility wrapping waitUntilTableExists in apps/db-setup/src/utils/table-waiter.ts
- [x] T013 Define all 6 table schemas (Users, Teams, AssessmentPlans, Assessments, AssessmentReports, ConfigVersions) in apps/db-setup/src/config/table-schemas.ts
- [x] T014 [P] Define environment configurations (dev/staging/prod naming, regions) in apps/db-setup/src/config/environments.ts
- [x] T015 Setup Commander.js CLI structure with main entry point in apps/db-setup/src/main.ts
- [x] T016 [P] Add pnpm script `db-setup` to root package.json to execute compiled CLI tool

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Initial Database Setup (Priority: P1) 🎯 MVP

**Goal**: Core CLI tool that creates all 6 DynamoDB tables with proper schemas, partition keys, and GSIs

**Independent Test**: Run setup tool on fresh AWS account and verify all 6 tables exist with correct structure via AWS console or DescribeTable calls

### Implementation for User Story 1

- [x] T017 [P] [US1] Implement table-creator service with CreateTableCommand for single table in apps/db-setup/src/services/table-creator.ts
- [x] T018 [P] [US1] Implement idempotency logic (DescribeTable before CreateTable) in apps/db-setup/src/services/table-creator.ts
- [x] T019 [US1] Implement setup command handler (create all 6 tables sequentially) in apps/db-setup/src/commands/setup.ts
- [x] T020 [US1] Add AWS credential validation before table operations in apps/db-setup/src/commands/setup.ts
- [x] T021 [US1] Add table creation progress spinners (Ora) for each table in apps/db-setup/src/commands/setup.ts
- [x] T022 [US1] Add success/error logging with colored output (Chalk) in apps/db-setup/src/commands/setup.ts
- [x] T023 [US1] Implement exit code handling (0 success, 1 error, 2 partial) in apps/db-setup/src/commands/setup.ts
- [x] T024 [US1] Register setup command with Commander in apps/db-setup/src/main.ts
- [x] T025 [US1] Add error remediation messages for AWS credentials, permissions, and network errors in apps/db-setup/src/utils/error-handler.ts

### Integration Tests for User Story 1

- [ ] T026 [P] [US1] Setup DynamoDB Local Docker container in apps/db-setup/tests/setup-dynamodb-local.ts
- [ ] T027 [P] [US1] Write integration test for setup command creating all 6 tables in apps/db-setup/tests/integration/setup.test.ts
- [ ] T028 [P] [US1] Write integration test for idempotency (re-run setup, verify no errors) in apps/db-setup/tests/integration/idempotency.test.ts
- [ ] T029 [US1] Write integration test for credential validation failure in apps/db-setup/tests/integration/setup.test.ts

**Checkpoint**: At this point, User Story 1 should be fully functional - developers can run `pnpm db-setup setup` to create all 6 tables

---

## Phase 4: User Story 4 - Guided Manual Steps (Priority: P1)

**Goal**: Comprehensive README with all prerequisites, manual steps, IAM permissions, and troubleshooting

**Independent Test**: A developer unfamiliar with AWS follows only the README and successfully completes setup

### Implementation for User Story 4

- [x] T030 [US4] Create README.md with prerequisites section (Node.js, AWS CLI, AWS account) in apps/db-setup/README.md
- [x] T031 [US4] Document AWS credentials configuration (aws configure, environment variables, IAM roles) in apps/db-setup/README.md
- [x] T032 [US4] Document required IAM permissions (CreateTable, DescribeTable, UpdateTable) with minimal policy example in apps/db-setup/README.md
- [x] T033 [US4] Add installation steps (pnpm install from repo root) in apps/db-setup/README.md
- [x] T034 [US4] Add usage examples for setup command with all flags (--env, --region, --dry-run) in apps/db-setup/README.md
- [x] T035 [US4] Add troubleshooting section for common errors (credentials invalid, permissions denied, table limit exceeded) in apps/db-setup/README.md
- [x] T036 [US4] Add table naming convention documentation (osem-{env}-{Table}) in apps/db-setup/README.md
- [x] T037 [US4] Document exit codes (0, 1, 2) and what they mean in apps/db-setup/README.md

**Checkpoint**: README should enable a developer to complete setup without additional help

---

## Phase 5: User Story 2 - Environment-Specific Configuration (Priority: P2)

**Goal**: Support for dev/staging/prod environments with appropriate table naming and configurations

**Independent Test**: Run setup with `--env dev`, `--env staging`, `--env prod` and verify tables have correct prefixes and can coexist in same account

### Implementation for User Story 2

- [ ] T038 [US2] Add `--env` flag to setup command (dev, staging, prod) in apps/db-setup/src/commands/setup.ts
- [ ] T039 [US2] Implement environment-based table naming (osem-{env}-{Table}) in apps/db-setup/src/config/table-schemas.ts
- [ ] T040 [US2] Add `--region` flag to setup command with validation in apps/db-setup/src/commands/setup.ts
- [ ] T041 [US2] Add region mismatch warning for production environment in apps/db-setup/src/commands/setup.ts
- [ ] T042 [US2] Add `OSEM_DB_PREFIX` environment variable support for custom table prefixes in apps/db-setup/src/config/environments.ts
- [ ] T043 [US2] Update README with environment-specific setup examples in apps/db-setup/README.md

### Integration Tests for User Story 2

- [ ] T044 [P] [US2] Write integration test for dev environment table naming in apps/db-setup/tests/integration/environments.test.ts
- [ ] T045 [P] [US2] Write integration test for staging environment table naming in apps/db-setup/tests/integration/environments.test.ts
- [ ] T046 [P] [US2] Write integration test for custom prefix with OSEM_DB_PREFIX in apps/db-setup/tests/integration/environments.test.ts

**Checkpoint**: Developers can setup tables for multiple environments without conflicts

---

## Phase 6: User Story 3 - Setup Verification and Validation (Priority: P2)

**Goal**: Verify command that validates all tables exist with correct schemas (partition keys, GSIs, billing mode)

**Independent Test**: Run verify command after setup and confirm it reports all 6 tables as correct; run verify with missing table and confirm it identifies the issue

### Implementation for User Story 3

- [ ] T047 [P] [US3] Implement table-verifier service with DescribeTable schema comparison in apps/db-setup/src/services/table-verifier.ts
- [ ] T048 [US3] Implement verify command handler (check all 6 tables) in apps/db-setup/src/commands/verify.ts
- [ ] T049 [US3] Add schema validation checks (partition key, GSI count, GSI names, billing mode) in apps/db-setup/src/services/table-verifier.ts
- [ ] T050 [US3] Add verification progress output with checkmarks for each table in apps/db-setup/src/commands/verify.ts
- [ ] T051 [US3] Add remediation messages for schema mismatches (delete table, add GSI manually) in apps/db-setup/src/commands/verify.ts
- [ ] T052 [US3] Register verify command with Commander in apps/db-setup/src/main.ts
- [ ] T053 [US3] Update README with verify command usage and examples in apps/db-setup/README.md

### Integration Tests for User Story 3

- [ ] T054 [P] [US3] Write integration test for verify command with all tables correct in apps/db-setup/tests/integration/verify.test.ts
- [ ] T055 [P] [US3] Write integration test for verify command with missing table in apps/db-setup/tests/integration/verify.test.ts
- [ ] T056 [P] [US3] Write integration test for verify command with schema mismatch (wrong GSI count) in apps/db-setup/tests/integration/verify.test.ts

**Checkpoint**: Developers can verify setup completeness with confidence in accuracy

---

## Phase 7: User Story 5 - Setup Idempotency and Updates (Priority: P3)

**Goal**: Re-running setup tool safely handles existing tables without errors or data loss

**Independent Test**: Run setup twice against same database and verify no errors, no data loss, and schema matches expected state

### Implementation for User Story 5

- [ ] T057 [US5] Enhance idempotency logic to detect existing tables and verify schemas match in apps/db-setup/src/services/table-creator.ts
- [ ] T058 [US5] Add warning messages (yellow) for tables that already exist and are verified in apps/db-setup/src/commands/setup.ts
- [ ] T059 [US5] Add schema drift detection (compare existing vs desired schema) in apps/db-setup/src/services/table-verifier.ts
- [ ] T060 [US5] Update setup command summary to show counts (X created, Y verified) in apps/db-setup/src/commands/setup.ts
- [ ] T061 [US5] Update README with idempotency behavior documentation in apps/db-setup/README.md

### Integration Tests for User Story 5

- [ ] T062 [US5] Enhance idempotency test to verify schema validation on second run in apps/db-setup/tests/integration/idempotency.test.ts
- [ ] T063 [US5] Write integration test for schema drift detection (manually modify table, re-run setup) in apps/db-setup/tests/integration/idempotency.test.ts

**Checkpoint**: Setup tool can be safely re-run without issues

---

## Phase 8: Additional Commands & Features

**Purpose**: Supporting commands for completeness and developer experience

- [ ] T064 [P] Implement list-tables command to show existing tables in apps/db-setup/src/commands/list-tables.ts
- [ ] T065 [P] Implement delete-tables command (dev only) with confirmation prompt in apps/db-setup/src/commands/delete-tables.ts
- [ ] T066 Register list-tables and delete-tables commands with Commander in apps/db-setup/src/main.ts
- [ ] T067 [P] Add `--dry-run` flag to setup command (preview without creating) in apps/db-setup/src/commands/setup.ts
- [ ] T068 [P] Add `--json` flag for JSON output mode (CI/CD integration) in apps/db-setup/src/commands/setup.ts
- [ ] T069 [P] Add `--quiet` flag to suppress progress output in apps/db-setup/src/commands/setup.ts
- [ ] T070 [P] Add `--verbose` flag for detailed AWS API logging in apps/db-setup/src/commands/setup.ts
- [ ] T071 Update README with all command documentation and flags in apps/db-setup/README.md

### Integration Tests for Additional Features

- [ ] T072 [P] Write integration test for dry-run mode (no tables created) in apps/db-setup/tests/integration/dry-run.test.ts
- [ ] T073 [P] Write integration test for JSON output mode parsing in apps/db-setup/tests/integration/json-output.test.ts
- [ ] T074 [P] Write integration test for list-tables command in apps/db-setup/tests/integration/list-tables.test.ts
- [ ] T075 [P] Write integration test for delete-tables command in apps/db-setup/tests/integration/delete-tables.test.ts

**Checkpoint**: All CLI commands are functional and tested

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, documentation, and validation

- [ ] T076 [P] Add unit tests for logger utility in apps/db-setup/tests/unit/logger.test.ts
- [ ] T077 [P] Add unit tests for error-handler utility in apps/db-setup/tests/unit/error-handler.test.ts
- [ ] T078 [P] Add unit tests for table-waiter utility in apps/db-setup/tests/unit/table-waiter.test.ts
- [ ] T079 Document single-org assumption with code comments per constitution in apps/db-setup/src/config/table-schemas.ts
- [ ] T080 Run quickstart.md validation with a fresh developer following instructions
- [ ] T081 Add CLI help text improvements (--help output for each command)
- [ ] T082 [P] Add TypeScript strict mode compliance checks
- [ ] T083 [P] Run ESLint and fix any warnings in apps/db-setup/src/
- [ ] T084 Test setup tool against real AWS account (dev environment)
- [ ] T085 Test setup tool in CI/CD environment with JSON output
- [ ] T086 Create example GitHub Actions workflow using setup tool in .github/workflows/example-db-setup.yml

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order: US1 (P1) → US4 (P1) → US2 (P2) → US3 (P2) → US5 (P3)
- **Additional Commands (Phase 8)**: Depends on US1, US2, US3 completion
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 4 (P1)**: Can start in parallel with US1 (documentation task) - No code dependencies
- **User Story 2 (P2)**: Depends on US1 completion (extends setup command)
- **User Story 3 (P2)**: Depends on US1 completion (verifies tables created by US1)
- **User Story 5 (P3)**: Depends on US1 and US3 completion (enhances idempotency with verification)

### Within Each User Story

- Tests (if included) can be written in parallel with implementation or before (TDD approach)
- Models/types before services
- Services before commands
- Core implementation before integration tests
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1 Setup**: Tasks T002-T005 can run in parallel (different dependencies)
- **Phase 2 Foundational**: Tasks T008-T011, T014 can run in parallel (different files)
- **User Story 1**: Tasks T017-T018 (service), T026-T028 (tests) can run in parallel
- **User Story 2**: Tasks T044-T046 (tests) can run in parallel
- **User Story 3**: Tasks T047-T048 (service), T054-T056 (tests) can run in parallel
- **User Story 4**: Can run entirely in parallel with US1-US3 (documentation only)
- **Phase 8**: Tasks T064-T065 (commands), T067-T070 (flags), T072-T075 (tests) can run in parallel
- **Phase 9**: Tasks T076-T078 (unit tests), T082-T083 (linting) can run in parallel

---

## Parallel Example: User Story 1 (Core Setup)

```bash
# Developer 1: Core table creator service
git checkout -b feat/us1-table-creator
# Work on T017, T018, T019

# Developer 2: Command integration
git checkout -b feat/us1-setup-command
# Work on T020, T021, T022, T023, T024

# Developer 3: Integration tests
git checkout -b feat/us1-integration-tests
# Work on T026, T027, T028, T029

# All three branches can be developed in parallel and merged independently
```

---

## Implementation Strategy

### MVP (Minimum Viable Product)

**Recommended MVP Scope**: User Story 1 + User Story 4 only

- **Phase 1**: Setup (T001-T006)
- **Phase 2**: Foundational (T007-T016)
- **Phase 3**: User Story 1 - Initial Database Setup (T017-T029)
- **Phase 4**: User Story 4 - Guided Manual Steps (T030-T037)

**MVP Delivers**: Functional CLI tool that creates all 6 DynamoDB tables with comprehensive README documentation

**Estimated Effort**: 2-3 days

**Validation**: Run `pnpm db-setup setup` on fresh AWS account, verify 6 tables exist via AWS console

### Post-MVP Increments

**Increment 1** (Priority P2):
- User Story 2: Environment-Specific Configuration (T038-T046)
- User Story 3: Setup Verification (T047-T056)
- **Estimated Effort**: +1 day

**Increment 2** (Priority P3):
- User Story 5: Idempotency (T057-T063)
- Phase 8: Additional Commands (T064-T075)
- **Estimated Effort**: +1 day

**Increment 3** (Polish):
- Phase 9: Polish & Cross-Cutting (T076-T086)
- **Estimated Effort**: +0.5 days

---

## Success Criteria Validation

| Success Criterion (from spec.md) | Tasks That Validate |
|----------------------------------|---------------------|
| SC-001: Setup completes in <10 minutes | T027 (integration test with timer) |
| SC-002: All tables created on first run | T027 (integration test checks 6 tables) |
| SC-003: 100% manual steps documented | T030-T037 (README comprehensive coverage) |
| SC-004: Verification accurate | T054-T056 (verify command tests) |
| SC-005: Works across 3 environments | T044-T046 (environment-specific tests) |
| SC-006: Actionable error messages | T025 (error handler with remediation) |
| SC-007: Idempotent execution | T028, T062-T063 (idempotency tests) |

---

## Task Summary

**Total Tasks**: 86
**MVP Tasks**: 37 (Phase 1 + Phase 2 + US1 + US4)
**Parallelizable Tasks**: 47 (marked with [P])

**Tasks by User Story**:
- US1 (Initial Setup): 13 implementation + 4 tests = 17 tasks
- US2 (Environments): 6 implementation + 3 tests = 9 tasks
- US3 (Verification): 7 implementation + 3 tests = 10 tasks
- US4 (Documentation): 8 tasks
- US5 (Idempotency): 5 implementation + 2 tests = 7 tasks
- Additional Commands: 8 implementation + 4 tests = 12 tasks
- Setup: 6 tasks
- Foundational: 10 tasks
- Polish: 11 tasks

**Independent Test Criteria**:
- US1: Run setup, verify 6 tables in AWS console
- US2: Run setup with 3 environments, verify distinct table names
- US3: Run verify after setup, verify all checks pass
- US4: New developer follows README successfully
- US5: Run setup twice, verify no errors or data loss

**Format Validation**: ✅ All tasks follow `- [ ] [ID] [P?] [Story] Description with file path` format
