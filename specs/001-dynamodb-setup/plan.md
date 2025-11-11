# Implementation Plan: DynamoDB Setup Tool

**Branch**: `001-dynamodb-setup` | **Date**: 2025-11-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-dynamodb-setup/spec.md`

## Summary

Create an automated setup tool for initializing DynamoDB tables required by the OSEM Ladders organizational assessment platform. The tool will create tables for Users, Teams, Assessment Plans, Assessments, Reports, and Config Versions with appropriate partition keys, sort keys, and Global Secondary Indexes. Includes comprehensive README with manual prerequisites and troubleshooting guidance. Supports multiple environments (dev/staging/prod) with idempotent execution.

**Technical Approach**: Node.js/TypeScript CLI tool using AWS SDK v3 for DynamoDB, leveraging existing Nx monorepo structure. Will be located in `apps/setup/` to align with future Lambda functions in `apps/` directory.

## Technical Context

**Language/Version**: TypeScript 5.5.3 with Node.js 18+ (align with existing web app)
**Primary Dependencies**:
- `@aws-sdk/client-dynamodb` v3.x (table management)
- `@aws-sdk/lib-dynamodb` v3.x (Document Client for testing)
- `@aws-sdk/client-sts` v3.x (credential validation)
- `commander` v12.x (CLI argument parsing)
- `chalk` v5.x (colored terminal output)
- `ora` v8.x (loading spinners)

**Storage**: DynamoDB (6 tables: Users, Teams, AssessmentPlans, Assessments, AssessmentReports, ConfigVersions)
**Testing**: Vitest (existing monorepo standard) with integration tests against DynamoDB Local
**Target Platform**: Linux/macOS/Windows CLI, Node.js 18+ runtime, AWS SDK environment
**Project Type**: Nx monorepo - new app in `apps/db-setup/` directory
**Performance Goals**:
- Table creation completes in <60 seconds (all 6 tables + GSIs)
- Verification mode completes in <10 seconds
- Setup tool startup time <2 seconds

**Constraints**:
- Must use DynamoDB on-demand billing mode (per constitution)
- Must follow AWS SDK v3 best practices (modular imports)
- Must work with AWS credentials from environment, config files, or IAM roles
- Must not require compilation for end users (distribute compiled JS)
- Must support CI/CD non-interactive mode

**Scale/Scope**:
- 6 DynamoDB tables with 8 Global Secondary Indexes total
- README with ~15 manual setup steps
- ~500 lines of TypeScript code
- 5 CLI commands (setup, verify, list-tables, delete-tables, help)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principles Alignment

**I. Phased Organizational Platform Delivery** ✅ PASS
- This feature is a **Phase 1 prerequisite** (Backend Foundation per REDESIGN.md lines 122-123)
- Independently testable and deployable
- Delivers value: DynamoDB tables ready before any backend Lambda development
- **Justification**: Setup tool MUST exist before Phase 2 (User/Team Management) can begin

**II. Role-Based Security Model** ⚠️ DEFERRED
- Setup tool creates tables but does NOT implement authorization logic
- Authorization enforcement happens in Lambda functions (Phase 2+)
- **Justification**: Infrastructure setup precedes application logic. No security violation.

**III. Assessment Workflow Integrity** ⚠️ DEFERRED
- Setup tool creates Assessment/Report tables but does NOT enforce workflows
- Workflow state machine implemented in Lambda functions (Phase 5)
- **Justification**: Database schema creation precedes business logic. No workflow violation.

**IV. Serverless-First Architecture** ✅ PASS
- Creates DynamoDB tables (serverless NoSQL database)
- No EC2 instances or containers
- **Justification**: Aligns with constitution requirement for DynamoDB storage

**V. API-First Development** ⚠️ NOT APPLICABLE
- Setup tool is CLI utility, not API endpoint
- Does not interact with frontend
- **Justification**: Infrastructure tool, not application feature

**VI. Team-Centric Data Model** ✅ PASS
- Creates Teams table with `teamId` partition key
- Creates GSIs for team-based queries (`teamId` on AssessmentPlans, etc.)
- **Justification**: Implements data model foundation per REDESIGN.md

### Data Model Governance Alignment

**Entity Design Requirements** ✅ PASS
- Setup tool creates tables with audit fields: `createdAt`, `updatedAt`, `createdBy`
- All timestamps use Unix milliseconds (Number type)
- UUIDs for all IDs (String type)
- Boolean flags (`isActive`, `isArchived`) explicit, not inferred
- **Justification**: Table schemas match REDESIGN.md data model exactly

**DynamoDB Schema Standards** ✅ PASS
- Single-attribute partition keys (`userId`, `teamId`, `planId`, `assessmentId`, `reportId`, `configId`)
- Composite sort keys with `#` delimiter where needed (future enhancement)
- GSIs for all access patterns: `managerId` (Teams), `planId` (Assessments), `teamMemberId` (Assessments), etc.
- **Justification**: Implements REDESIGN.md DynamoDB schema lines 166-172

### Security Requirements Alignment

**Authentication & Authorization** ⚠️ NOT APPLICABLE
- Setup tool runs with AWS IAM credentials, not Cognito JWT
- No authorization logic (creates empty tables)
- **Justification**: Infrastructure tool for developers with AWS access

**Data Protection** ✅ PASS
- DynamoDB encryption at rest enabled by default (AWS-managed keys)
- TLS 1.2+ enforced by AWS SDK
- **Justification**: Follows AWS best practices

### Development Workflow Alignment

**Phase-Based Delivery** ✅ PASS
- This is Phase 1 work (Backend Foundation per REDESIGN.md)
- Blocks Phase 2+ (cannot create users/teams without database)
- **Justification**: Explicitly required as foundation phase

**Testing Requirements** ✅ PASS
- Integration tests with DynamoDB Local
- Idempotency tests (re-run setup without errors)
- Contract validation (table schemas match REDESIGN.md)
- **Justification**: Independently testable per constitution

### Open Questions Prerequisites

**Phase 1 Prerequisite (REDESIGN.md line 175)**: Multi-org support - MUST decide before Phase 1
- **DECISION REQUIRED**: Single organization vs. multi-tenant SaaS?
- **Impact**: Affects whether tables need `orgId` partition key prefix
- **Assumption for this feature**: Single organization (no `orgId` field). Tables can be migrated later with GSIs if multi-org needed.
- **Documented in**: constitution.md line 189, will be tagged in code comments

### Constitution Compliance Summary

| Checkpoint | Status | Notes |
|------------|--------|-------|
| Core Principles | ✅ PASS | Aligns with Phases, Serverless, Team-Centric |
| Data Model Governance | ✅ PASS | Matches REDESIGN.md schema exactly |
| Security Requirements | ⚠️ DEFERRED | Authorization happens in Lambda (Phase 2+) |
| Phase Prerequisites | ✅ PASS | Phase 1 foundation work |
| Open Questions | ⚠️ ASSUMPTION | Single-org assumed, multi-org deferred |

**GATE RESULT**: ✅ PASS WITH ASSUMPTIONS
- Proceed to Phase 0 (research)
- Document single-org assumption in code comments
- Re-evaluate after Phase 1 design for any schema changes

---

### Post-Phase 1 Constitution Check Re-Evaluation

**Date**: 2025-11-10
**Status**: Phase 0 (Research) and Phase 1 (Data Model & Contracts) Complete

#### Design Artifacts Generated

- ✅ `research.md`: AWS SDK v3 patterns, DynamoDB best practices, CLI tool design
- ✅ `data-model.md`: 6 tables, 8 GSIs, complete schema specifications
- ✅ `contracts/setup-command.md`: CLI setup command contract
- ✅ `contracts/verify-command.md`: CLI verify command contract
- ✅ `contracts/cli-output-format.md`: Output format specification
- ✅ `quickstart.md`: 5-minute setup guide with prerequisites

#### Schema Design Review

**Data Model Governance** ✅ CONFIRMED
- All 6 tables follow single-attribute partition key design
- 8 GSIs cover all query access patterns from REDESIGN.md
- On-demand billing mode (constitution requirement)
- ALL projection for GSIs (no base table lookups)
- Audit fields (createdAt, updatedAt, createdBy) on all tables
- Unix milliseconds for timestamps, UUIDs for IDs, explicit booleans

**DynamoDB Schema Standards** ✅ CONFIRMED
- No hot partitions (UUID partition keys)
- GSI naming conventions match REDESIGN.md
- Map types for nested structures (feedback, variance, parsedConfig)
- Table naming: `osem-{env}-{EntityName}`
- Tags: Environment, Application

**Single-Org Assumption** ✅ DOCUMENTED
- All tables designed without `orgId` field
- Migration path identified in data-model.md
- Code comments to tag assumption: `// ASSUMPTION: Single org - see constitution.md line 189`

#### Technical Decisions Review

**AWS SDK v3 Patterns** ✅ APPROVED
- Modular imports (tree-shakeable)
- waitUntilTableExists for table readiness
- Inline GSI creation (faster than UpdateTable)
- DescribeTable before CreateTable (idempotency)

**CLI Tool Design** ✅ APPROVED
- Commander.js for multi-command CLI
- Chalk v5 for colored output
- Ora for loading spinners
- Exit codes: 0 (success), 1 (error), 2 (partial)
- JSON mode for CI/CD integration

**Testing Strategy** ✅ APPROVED
- DynamoDB Local for integration tests
- Vitest (monorepo standard)
- Idempotency tests (re-run setup twice)
- Schema validation tests (detect drift)

#### Constitution Compliance Post-Design

| Checkpoint | Initial Status | Post-Design Status | Changes |
|------------|----------------|-------------------|---------|
| Core Principles | ✅ PASS | ✅ PASS | No changes - design aligns |
| Data Model Governance | ✅ PASS | ✅ PASS | Schemas match REDESIGN.md exactly |
| Security Requirements | ⚠️ DEFERRED | ⚠️ DEFERRED | Still deferred to Lambda (Phase 2+) |
| Phase Prerequisites | ✅ PASS | ✅ PASS | Phase 1 foundation work complete |
| Open Questions | ⚠️ ASSUMPTION | ✅ RESOLVED | Single-org assumption documented |

**FINAL GATE RESULT**: ✅ PASS - READY FOR IMPLEMENTATION

**No schema violations or constitution conflicts identified during Phase 0/1 design.**

**Next Step**: Run `/speckit.tasks` to generate actionable implementation tasks

## Project Structure

### Documentation (this feature)

```text
specs/001-dynamodb-setup/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - AWS SDK patterns, DynamoDB best practices
├── data-model.md        # Phase 1 output - Table schemas matching REDESIGN.md
├── quickstart.md        # Phase 1 output - How to run setup tool
├── contracts/           # Phase 1 output - CLI command contracts
│   ├── setup-command.md
│   ├── verify-command.md
│   └── cli-output-format.md
├── checklists/
│   └── requirements.md  # Already exists from /speckit.specify
└── spec.md              # Feature specification (already exists)
```

### Source Code (repository root)

```text
apps/db-setup/               # NEW Nx application
├── src/
│   ├── commands/            # CLI command implementations
│   │   ├── setup.ts         # Main setup command
│   │   ├── verify.ts        # Verification command
│   │   ├── list-tables.ts   # List existing tables
│   │   └── delete-tables.ts # Cleanup command (dev only)
│   ├── config/              # Table definitions
│   │   ├── table-schemas.ts # DynamoDB table/GSI schemas from REDESIGN.md
│   │   └── environments.ts  # Environment-specific configs
│   ├── services/            # AWS SDK wrappers
│   │   ├── dynamodb-client.ts    # Initialized DynamoDB client
│   │   ├── table-creator.ts      # Table creation logic
│   │   ├── table-verifier.ts     # Verification logic
│   │   └── credential-validator.ts # AWS credential checks
│   ├── utils/               # Helpers
│   │   ├── logger.ts        # Colored console output
│   │   ├── error-handler.ts # Error formatting with remediation
│   │   └── table-waiter.ts  # Wait for table ACTIVE status
│   ├── types/               # TypeScript interfaces
│   │   └── schemas.ts       # Table schema types
│   └── main.ts              # CLI entry point (commander setup)
├── tests/                   # Vitest tests
│   ├── integration/         # Tests against DynamoDB Local
│   │   ├── setup.test.ts
│   │   ├── verify.test.ts
│   │   └── idempotency.test.ts
│   └── unit/                # Unit tests for utilities
│       ├── logger.test.ts
│       └── error-handler.test.ts
├── README.md                # User-facing setup documentation
├── package.json             # Dependencies (AWS SDK v3, commander, etc.)
├── project.json             # Nx project configuration
├── tsconfig.json            # TypeScript config
└── vite.config.ts           # Build configuration (Nx + Vite)

apps/web/                    # EXISTING - no changes for this feature
├── ... (existing structure)

libs/                        # FUTURE - shared types between db-setup and Lambda functions
└── (empty for now, will be created in Phase 2)
```

**Structure Decision**: Nx monorepo with new `apps/setup/` application
- **Rationale**:
  - Aligns with CLAUDE.md architecture (apps/ for future Lambda functions)
  - Keeps setup tool separate from web app but within same workspace
  - Enables code sharing via `libs/` in future (table schemas can be shared with Lambdas)
  - Nx provides build caching and dependency management
  - Single `pnpm install` for all dependencies across repo

## Complexity Tracking

**No violations requiring justification** - Constitution Check passed with assumptions only.

**Single-Org Assumption**: Documented per Open Questions (REDESIGN.md line 189). Tables designed for single organization initially. Migration path: Add `orgId` to partition keys or create new GSI with `orgId` if multi-org support needed in future.

---

## Phase 0: Research & Design Decisions

### Research Topics

1. **AWS SDK v3 DynamoDB Patterns**
   - Modern SDK v3 vs legacy v2 differences
   - Best practices for table creation with `CreateTableCommand`
   - Waiting for table ACTIVE status with `DescribeTableCommand` vs `waitUntilTableExists`
   - GSI creation strategies (inline vs update-table)
   - Error handling for `ResourceInUseException` (table exists)

2. **DynamoDB Table Design Validation**
   - Partition key design for even distribution (no hot partitions)
   - GSI key design for query access patterns from REDESIGN.md
   - On-demand vs provisioned billing (constitution mandates on-demand)
   - Attribute types for nested structures (Map vs JSON strings)
   - Secondary index projection types (KEYS_ONLY, INCLUDE, ALL)

3. **CLI Tool Best Practices**
   - Commander.js patterns for multi-command CLI
   - Chalk color conventions for success/error/warning
   - Ora spinner patterns for long-running operations
   - Exit codes for CI/CD integration (0=success, 1=error, 2=partial)
   - Environment variable handling (AWS_REGION, NODE_ENV, custom vars)

4. **Testing Against DynamoDB**
   - DynamoDB Local setup for integration tests
   - Vitest configuration for async AWS operations
   - Mocking strategies (AWS SDK client mock vs real DynamoDB Local)
   - Cleanup between tests (delete-table in afterEach)

5. **Idempotency Patterns**
   - Check table exists before CreateTable (DescribeTable)
   - Handle ResourceInUseException gracefully
   - Compare existing schema vs desired schema (detect drift)
   - Update GSI if missing (UpdateTable with GlobalSecondaryIndexUpdates)

6. **AWS Credential Resolution**
   - Credential chain order (env vars > config file > IAM role > ECS/EC2 metadata)
   - Validate credentials before table operations (STS GetCallerIdentity)
   - Region selection (env var > config file > default us-east-1)
   - Error messages for expired/invalid credentials

### Decisions to Document in research.md

- SDK v3 modular imports vs full import
- GSI creation strategy (inline vs separate update)
- Table naming convention (prefix with environment?)
- Billing mode (on-demand per constitution)
- Error recovery strategy (fail-fast vs continue-on-error)
- Logging verbosity levels (quiet, normal, verbose)

---

## Phase 1: Data Model & Contracts

### Data Model (data-model.md)

Extract from REDESIGN.md and formalize:
- 6 DynamoDB tables with partition keys, sort keys (if any), and attribute types
- 8 Global Secondary Indexes with projection types
- On-demand billing mode
- Encryption at rest (AWS-managed keys)
- Point-in-time recovery (PITR) disabled initially (cost optimization)
- Table tags for environment identification

### Contracts (contracts/)

**CLI Command Interface**:

1. **setup-command.md**:
   - Command: `pnpm setup --env <dev|staging|prod> [--region <region>] [--dry-run]`
   - Outputs: Spinner for each table, success/error messages, final summary
   - Exit codes: 0 (success), 1 (error), 2 (partial - some tables failed)

2. **verify-command.md**:
   - Command: `pnpm verify --env <dev|staging|prod>`
   - Outputs: Checklist of table existence, GSI status, schema validation
   - Exit codes: 0 (all checks pass), 1 (failures detected)

3. **cli-output-format.md**:
   - JSON output option (`--json`) for CI/CD parsing
   - Human-readable colored output (default)
   - Error format with remediation steps

### Quickstart (quickstart.md)

- Prerequisites checklist (AWS account, Node.js 18+, AWS CLI configured)
- Installation steps (pnpm install from repo root)
- First-time setup walkthrough (5-minute quick start)
- Common use cases (setup dev environment, verify production, troubleshoot)
- Links to full README for manual steps

### Agent Context Update

Run `.specify/scripts/bash/update-agent-context.sh claude` to add:
- Technology: DynamoDB table management with AWS SDK v3
- CLI tool pattern with commander/chalk/ora
- Nx monorepo app structure in `apps/db-setup/`

---

## Phase 2: Implementation Tasks

**NOTE**: Phase 2 (tasks.md generation) is handled by the `/speckit.tasks` command, NOT by `/speckit.plan`. This section is informational only.

### Estimated Task Breakdown (for reference)

1. **Setup Nx app structure** - Create `apps/db-setup/` with Nx generators
2. **Install dependencies** - AWS SDK v3, commander, chalk, ora
3. **Implement table schemas** - TypeScript interfaces from REDESIGN.md
4. **Create DynamoDB client service** - SDK v3 initialization with credential validation
5. **Implement setup command** - Table creation with idempotency
6. **Implement verify command** - Schema validation against REDESIGN.md
7. **Implement error handling** - Remediation messages for common errors
8. **Write README** - Manual prerequisites and troubleshooting guide
9. **Add integration tests** - DynamoDB Local tests for setup/verify/idempotency
10. **Add CLI documentation** - contracts/ directory with command specs
11. **Test in real AWS environment** - Validate against actual DynamoDB service
12. **Create quickstart guide** - 5-minute getting started doc

**Estimated Effort**: 2-3 days for P1 features (setup, verify, README), +1 day for P2/P3 features (environments, idempotency)

---

## Success Criteria Mapping

| Success Criterion (from spec.md) | Implementation Validation |
|----------------------------------|---------------------------|
| SC-001: Setup completes in <10 minutes | Timed integration test with real DynamoDB |
| SC-002: All tables created on first run | Integration test checks 6 tables exist after setup |
| SC-003: 100% manual steps documented | README review checklist |
| SC-004: Verification has zero false positives | Verify command integration tests |
| SC-005: Works across 3 environments | Test with --env dev/staging/prod flags |
| SC-006: Actionable error messages | Error handler unit tests + manual review |
| SC-007: Idempotent execution | Re-run setup twice, verify no errors/data loss |

---

## Next Steps

After `/speckit.plan` completes:
1. Review research.md for technology decisions
2. Review data-model.md for table schemas
3. Review contracts/ for CLI command specifications
4. Run `/speckit.tasks` to generate actionable tasks.md with dependency ordering
5. Begin implementation starting with P1 user stories (Initial Setup + Documentation)