<!--
Sync Impact Report (2025-11-10)

Version Change: None → 1.0.0 (Initial ratification)

Changes Summary:
- Initial constitution creation
- Established 6 core principles for organizational career ladder assessment platform
- Defined security, data model, and workflow governance
- Full transformation to multi-tenant organizational platform (no legacy single-user support)
- Clarified role-based permissions with dual-role scenarios (team member who is also manager)

Modified Principles: N/A (Initial version)
Added Sections: All sections (initial creation)
Removed Sections: None

Template Consistency Status:
- ✅ spec-template.md: Reviewed - User stories and acceptance criteria align with workflow principles
- ✅ plan-template.md: Reviewed - Technical context and constitution check section compatible
- ✅ tasks-template.md: Reviewed - User story organization aligns with phased delivery principle

Follow-up TODOs:
- None
-->

# OSEM Ladders Constitution

## Core Principles

### I. Phased Organizational Platform Delivery

The platform MUST be built as a multi-tenant organizational tool from the ground up. Feature development MUST follow the 8-phase migration plan (REDESIGN.md) where each phase delivers independently valuable organizational capabilities. Each phase MUST be deployable and testable before the next phase begins. MVP (Phase 1-4) MUST establish: user/team management, role-based access, and backend storage foundation.

**Rationale**: Systematic phased delivery ensures the organizational platform is built on solid foundations. User/team management and authentication MUST precede assessment workflows. Each phase checkpoint validates the platform works for actual organizational multi-user scenarios before adding complexity.

### II. Role-Based Security Model (NON-NEGOTIABLE)

All backend endpoints MUST validate Cognito JWT tokens and enforce role-based authorization. User permissions are determined by the union of their roles:

**Team Member Role**: Users can ONLY view and complete their own self-assessments. Users CANNOT view other team members' assessments, even within the same team.

**Manager Role**: Users can view and manage ALL assessments for team members in teams they manage (including creating assessment plans, viewing self-assessments, completing manager assessments). Managers CANNOT access assessments for teams they don't manage.

**Admin Role**: Users can view and manage ALL assessments across ALL teams in the organization.

**Dual-Role Scenario**: If a user has BOTH Team Member and Manager roles, they can view their own assessments (Team Member permission) AND all assessments for their managed team members (Manager permission). Effective permissions are the union of all assigned roles.

Authorization checks MUST occur at both API Gateway (authentication) and Lambda function (role-based filtering). Every DynamoDB query MUST include authorization filters based on `userId` and team membership/ownership.

**Rationale**: Multi-tenant organizational platform requires strict access controls to protect sensitive career assessment data. Team members MUST NOT see peers' assessments to maintain confidentiality. Managers need visibility into their team to fulfill assessment responsibilities. Dual-role users are common (senior engineers who manage small teams) and must have appropriate permissions for both contexts.

### III. Assessment Workflow Integrity (NON-NEGOTIABLE)

Assessment workflow state transitions MUST be enforced server-side: `not_started` → `in_progress` → `submitted`. Submitted assessments MUST be immutable (read-only). Final reports can ONLY be generated when both self-assessment AND manager-assessment are in `submitted` state. Manager assessment scores are the authoritative final scores. Any modification to submitted assessments MUST be rejected with HTTP 403.

**Role-Specific Workflow Rules**:
- Team members can ONLY edit their own self-assessments (type: 'self') and ONLY while status is `not_started` or `in_progress`
- Managers can ONLY edit manager-assessments (type: 'manager') for their team members and ONLY while status is `not_started` or `in_progress`
- Managers CANNOT edit team members' self-assessments
- Team members CANNOT edit manager assessments
- Admins CANNOT edit assessments (view-only for compliance/audit)

**Rationale**: Career assessments affect promotions, compensation, and career development. Immutability and server-side validation prevent data tampering and ensure assessment integrity. Strict separation of self-assessment vs. manager-assessment editing prevents managers from manipulating team member input and vice versa. Clear workflow states provide audit trail for compliance and fairness.

### IV. Serverless-First Architecture

All backend logic MUST run on AWS Lambda functions with API Gateway for RESTful endpoints. Storage MUST use DynamoDB with appropriate partition keys, sort keys, and Global Secondary Indexes for multi-tenant access patterns. Infrastructure MUST be defined as code (AWS CDK or SAM). No EC2 instances or containerized services allowed without explicit constitutional amendment.

**Rationale**: Serverless architecture provides automatic scaling, cost-efficiency for variable workload (seasonal assessments creating traffic spikes), and reduced operational overhead. DynamoDB single-table design with GSIs supports efficient multi-tenant queries without joins. Lambda eliminates server management and scales per-team concurrently.

### V. API-First Development

All features MUST be designed as backend API endpoints first, then consumed by frontend. API contracts (request/response schemas) MUST be documented before implementation begins (in `contracts/` directory). Frontend components MUST use React Query for all server state management (no localStorage for server data). Optimistic updates SHOULD be used for better UX but MUST have rollback on server error.

**Rationale**: API-first ensures platform can support future clients (mobile apps, CLI tools, integrations). Contract documentation enables parallel frontend/backend development. React Query eliminates useState/useEffect anti-patterns and provides consistent loading/error/cache patterns across the organizational platform.

### VI. Team-Centric Data Model

All assessment-related entities (AssessmentPlan, Assessment, Report) MUST include `teamId` for filtering and authorization. DynamoDB queries MUST use team-based GSIs (e.g., `teamId-status`, `teamId-planId`) to enable efficient team-scoped queries. Cross-team queries are ONLY permitted for Admin role with explicit authorization check.

**Rationale**: Teams are the fundamental organizational unit. Team-centric queries prevent accidental data leakage across teams and enable horizontal scaling (different teams can query concurrently). Admin cross-team queries support organizational analytics while maintaining team data isolation by default.

## Data Model Governance

### Entity Design Requirements

All entities MUST include audit fields: `createdAt`, `updatedAt`, `createdBy` (User ID). Timestamps MUST be Unix milliseconds (Number type in DynamoDB). UUIDs MUST be used for all IDs except where Cognito provides userId. Boolean flags (e.g., `isActive`, `isArchived`) MUST be explicit, not inferred from null values. Soft deletes (via `isActive: false`) are REQUIRED for teams and assessment plans (no hard deletes).

**Rationale**: Audit fields enable compliance reporting, debugging, and understanding data lineage. Explicit timestamps and UUIDs prevent conflicts in distributed serverless environment. Soft deletes preserve historical assessment data integrity and allow "undelete" workflows for accidental deletions.

### DynamoDB Schema Standards

Tables MUST use single-attribute partition keys for even distribution (e.g., `teamId`, `userId`, `assessmentId`). Composite sort keys SHOULD use `#` delimiter (e.g., `PLAN#planId#MEMBER#userId`). Global Secondary Indexes MUST be created for all query access patterns identified in REDESIGN.md (managerId for teams, planId for assessments, etc.). Nested structures (e.g., assessment feedback Map) MUST use DynamoDB Map type, not JSON strings.

**Rationale**: Proper key design prevents hot partitions (e.g., all teams under one partition key would bottleneck). GSIs eliminate expensive scans and enable access pattern flexibility. Native Map types enable atomic updates to nested feedback and avoid JSON parse/stringify overhead.

## Security Requirements

### Authentication & Authorization

All API requests MUST include valid Cognito JWT token in `Authorization: Bearer <token>` header. Lambda authorizer MUST extract `userId` and `roles` (array) from token claims. Lambda functions MUST validate user has permission for requested resource before DynamoDB access:

**Authorization Patterns**:
- `GET /assessments/{assessmentId}`: Allow if (user is team member AND assessment.teamMemberId === userId) OR (user is manager AND assessment.teamId in user's managed teams) OR (user is admin)
- `PUT /assessments/{assessmentId}`: Allow if (assessment.type === 'self' AND assessment.teamMemberId === userId AND status !== 'submitted') OR (assessment.type === 'manager' AND user is manager of assessment.teamId AND status !== 'submitted')
- `POST /teams/{teamId}/plans`: Allow if (user is manager of teamId) OR (user is admin)

Authorization violations MUST return HTTP 403 with error message, not 404 (prevents resource existence inference).

### Data Protection

Assessment feedback containing sensitive performance data MUST use DynamoDB encryption at rest (AWS-managed keys minimum). All data in transit MUST use TLS 1.2+ (enforced by API Gateway). User emails and names from Microsoft 365 MUST NOT be logged in CloudWatch logs (use userId only). PII access MUST be logged for audit trail. GDPR compliance considerations for EU users MUST be documented before Phase 6.

**Rationale**: Career assessments contain PII and sensitive feedback that could affect careers if leaked. Encryption at rest/in-transit reduces breach impact. Returning 403 instead of 404 prevents attackers from inferring resource existence. Audit logging enables investigation of unauthorized access attempts.

## Development Workflow

### Phase-Based Delivery

Feature development MUST follow 8-phase migration plan in REDESIGN.md:

1. **Phase 1-2 (Weeks 1-2)**: Backend foundation (DynamoDB, Lambda, API Gateway, User/Team management) - BLOCKS all subsequent phases
2. **Phase 3 (Week 3)**: Team management UI and role-based access
3. **Phase 4 (Week 4)**: Assessment plan creation and management
4. **Phase 5-6 (Weeks 5-7)**: Assessment workflow and report generation
5. **Phase 7-8 (Week 8)**: Admin dashboard, analytics, polish

Each phase MUST have completion criteria verified before next phase begins. Phase boundaries are NOT negotiable without constitutional amendment.

**Rationale**: Backend foundation (Phase 1-2) MUST be complete before any UI work to prevent building UI on unstable contracts. Team management MUST precede assessment plans (teams own plans). Assessment plans MUST precede assessments (plans spawn assessments).

### Testing Requirements

User stories MUST be independently testable with Given-When-Then acceptance criteria. API endpoints MUST have contract tests validating request/response schemas match `contracts/` documentation. Assessment workflow state transitions MUST have integration tests. Role-based authorization MUST have integration tests for all dual-role scenarios.

**Mandatory Integration Tests**:
- Team member cannot view other team member's assessment (same team)
- Team member who is also a manager CAN view assessments for their managed team
- Manager cannot view assessments for teams they don't manage
- Manager cannot edit team member's self-assessment (type: 'self')
- Team member cannot edit manager assessment (type: 'manager')
- Manager cannot submit team member's self-assessment
- Report cannot be generated if self-assessment not submitted
- Submitted assessment cannot be edited (HTTP 403)

**Rationale**: Authorization bugs in multi-tenant systems are critical security vulnerabilities. Dual-role scenarios are complex and error-prone. Integration tests catch logic errors that unit tests miss. Workflow integrity tests ensure assessment fairness and data integrity.

### Code Review Standards

Pull requests MUST verify:
- Role-based authorization correctly implemented for new endpoints
- Dual-role scenarios tested (user with both Team Member and Manager roles)
- DynamoDB queries use GetItem/Query (no Scan operations except admin analytics)
- API responses follow standardized `{ success, data, error }` structure
- Sensitive data (feedback, scores) not logged to CloudWatch
- New endpoints documented in `contracts/` directory

## Performance Standards

API endpoints MUST target p95 response time <500ms for assessment workflows, <1000ms for report generation. DynamoDB tables MUST use on-demand billing initially until access patterns stabilize (switch to provisioned after 3 months if cost-effective). React Query cache TTL MUST be: 5 minutes for config data, 1 minute for team lists, 30 seconds for assessment lists, 0 (always fresh) for in-progress assessments being edited.

Lambda functions MUST:
- Reuse DynamoDB client connections across invocations (initialize outside handler)
- Use 512MB memory minimum (faster CPU for same cost)
- Set timeout based on operation: 10s for CRUD, 30s for report generation
- Implement connection warming for critical paths if cold start >1s

**Rationale**: Career assessments are not latency-critical but users expect reasonable responsiveness. On-demand billing prevents over-provisioning during unpredictable seasonal assessment periods. Cache TTLs balance freshness with reduced backend load. Connection reuse and memory optimization reduce Lambda costs.

## Open Questions & Decision Framework

Constitution amendments MUST address the 10 open questions in REDESIGN.md before dependent phases begin:

**Phase 2 Prerequisites (User/Team Management)**:
1. Role assignment mechanism (Cognito groups vs. admin panel) - MUST decide before Phase 1
2. Team structure (nested teams allowed? multiple managers per team?) - MUST decide before Phase 2

**Phase 3 Prerequisites (Assessment Plans)**:
3. Assessment templates vs. config.md versioning strategy - MUST decide before Phase 4
4. Notification requirements (email alerts for assignments, deadlines) - MUST decide before Phase 4
5. Assessment deadline enforcement (hard deadlines vs. soft) - MUST decide before Phase 4

**Phase 5 Prerequisites (Assessment Workflow)**:
6. Historical data retention policy (how many years?) - MUST decide before Phase 5
7. Config versioning for in-progress assessments (locked to config version?) - MUST decide before Phase 5
8. Feedback visibility rules (immediate vs. after manager review meeting) - MUST decide before Phase 6

**Phase 6+ Prerequisites (Reports & Launch)**:
9. Multi-org support (single organization vs. multi-tenant SaaS) - MUST decide before Phase 1 (affects data model)
10. Assessment editing permissions post-submission (allowed for managers? audited?) - MUST decide before Phase 5

**Decision Process**: Each question MUST be resolved via explicit user confirmation or documented assumption (tagged `// ASSUMPTION: <decision> - see constitution`) before dependent phase implementation begins.

## Governance

This constitution supersedes all other development practices. Amendments require:

1. Documented rationale referencing specific pain point, user requirement, or architectural constraint
2. Review of impact on existing principles and dependent templates (spec.md, plan.md, tasks.md)
3. Migration plan for in-flight features if breaking change to existing principles
4. Version increment per semantic versioning rules (MAJOR for principle removal/redefinition, MINOR for new principle/section, PATCH for clarifications)
5. User approval for MAJOR/MINOR changes

**Constitution Compliance**:
- All pull requests implementing user stories from spec.md MUST verify alignment with Core Principles I-VI
- Security Requirements (role-based authorization, data protection) MUST be verified via code review checklist
- Dual-role authorization scenarios MUST be tested in integration tests
- Performance Standards MUST be validated via load testing before production deployment (Phase 8)
- Phase boundaries MUST be respected (no Phase 4 work until Phase 3 complete)

**Runtime Guidance**: This constitution governs feature design, architecture, and security. For implementation-level coding guidance (React patterns, DynamoDB query examples, Nx commands), refer to CLAUDE.md and REDESIGN.md technical sections.

**Version**: 1.0.0 | **Ratified**: 2025-11-10 | **Last Amended**: 2025-11-10