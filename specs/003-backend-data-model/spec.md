# Feature Specification: Backend Data Model Overhaul

**Feature Branch**: `003-backend-data-model`
**Created**: 2025-11-17
**Status**: Draft
**Input**: User description: "We are going to overhaul the backend data model and the backend API itself. User IDs will be the user email addresses. Where ever possible we will use content address storage. There will be the following tables: Table 1: Users * userId - email address - partition key * name - user's full name * roles - string array * team - string; Table 2: AssessmentReports * id - string CAS key - <userid>|<assessment_id>|<assessment-type> - Partition key * type - "self" | "manager" * userId - string * assessmentId: UUID; Table 3: Teams * id - string - e.g. engineering, marketing * name - string * managerId - string, user ID - GST * activeAssessmentId: UUID; Table 4: Assessments * id: UUID * name: string * plan: Category[]"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - User Profile Management (Priority: P1)

Team members and managers need to access and manage user profiles with team assignments and role information to enable proper authorization and organizational structure.

**Why this priority**: This is the foundation for all other features - without users being properly stored and identified, no assessments, teams, or reports can function.

**Independent Test**: Can be fully tested by creating, retrieving, and updating user profiles via the API and verifies that user data is correctly stored with email-based identification.

**Acceptance Scenarios**:

1. **Given** a new team member joins, **When** their profile is created with email, name, roles, and team, **Then** the system stores their information with email as the unique identifier
2. **Given** an existing user, **When** their profile is retrieved by email, **Then** the system returns their complete profile including name, roles, and team assignment
3. **Given** a user changes teams, **When** their team assignment is updated, **Then** the system reflects the new team assignment in their profile
4. **Given** a user's roles change, **When** role array is modified, **Then** the system updates their authorization permissions accordingly
5. **Given** an authenticated user, **When** they request GET /me, **Then** the system returns their profile with userId, name, roles, and a populated team object containing only id, name, managerId, and activeAssessmentId fields

---

### User Story 2 - Team Structure and Management (Priority: P2)

Managers and administrators need to organize users into teams, assign team managers, and track which assessment is currently active for the team.

**Why this priority**: Teams are required to organize users and enable manager-level functionality, but users can exist before teams are fully configured.

**Independent Test**: Can be fully tested by creating teams, assigning managers, setting active assessments, and verifying team member associations work correctly.

**Acceptance Scenarios**:

1. **Given** an organization needs to structure its workforce, **When** a team is created with a name and manager, **Then** the system stores the team and enables querying users by team
2. **Given** a team exists, **When** a manager is assigned using their user ID, **Then** the system enables the manager to access team-level functions
3. **Given** a team has members, **When** an assessment is set as active for the team, **Then** all team members can participate in that assessment
4. **Given** a manager leaves, **When** a new manager is assigned to the team, **Then** the system transfers manager permissions to the new user

---

### User Story 3 - Assessment Management (Priority: P3)

Administrators need to create and manage assessment templates with defined competency categories and levels that can be used across multiple teams.

**Why this priority**: Assessments define what is being evaluated, but they require users and teams to already exist to be useful.

**Independent Test**: Can be fully tested by creating assessments with category structures, retrieving them, and verifying the plan data is correctly stored and retrievable.

**Acceptance Scenarios**:

1. **Given** a new career ladder framework is designed, **When** an assessment is created with a name and category structure, **Then** the system stores the assessment template with a unique identifier
2. **Given** an assessment template exists, **When** it is retrieved by ID, **Then** the system returns the complete assessment including all category definitions
3. **Given** multiple teams use the same framework, **When** an assessment is assigned to different teams, **Then** each team can independently use the same assessment structure
4. **Given** assessment frameworks evolve, **When** a new version is created, **Then** the system maintains both old and new versions for historical integrity

---

### User Story 4 - Assessment Report Generation (Priority: P4)

Team members and managers need to create and access assessment reports for individual users, supporting both self-assessments and manager assessments.

**Why this priority**: This is the end-to-end functionality that delivers value, but requires all other components (users, teams, assessments) to be in place first.

**Independent Test**: Can be fully tested by creating self and manager assessment reports, retrieving them by the composite key, and verifying content-addressed storage prevents duplication.

**Acceptance Scenarios**:

1. **Given** a team member completes a self-assessment, **When** the report is submitted, **Then** the system stores it with a content-addressed key combining user ID, assessment ID, and type
2. **Given** a manager evaluates a team member, **When** the manager assessment is submitted, **Then** the system stores it separately from the self-assessment using the manager type identifier
3. **Given** identical assessment data is submitted twice, **When** content-addressed storage is applied, **Then** the system recognizes the duplicate and avoids redundant storage
4. **Given** a user has multiple assessment reports, **When** reports are queried by user ID, **Then** the system returns all reports for that user across different assessments and types
5. **Given** a specific assessment report is needed, **When** queried by the composite key (userId|assessmentId|type), **Then** the system returns the exact report efficiently

---

### Edge Cases

- What happens when a user attempts to change their email address? Email addresses are immutable and cannot be changed once a profile is created
- How does the system handle assessment reports when the referenced assessment or user is deleted? Orphaned records are allowed, and queries must gracefully handle missing references
- What happens when a team manager is also a team member being assessed?
- How does the system handle content-addressed keys when the assessment type field contains special characters or variations in casing?
- What happens when a team's active assessment is changed while members have pending reports for the previous assessment?
- What happens when a user belongs to multiple teams? Users can only belong to one team at a time (team is stored as a single string value)

## Clarifications

### Session 2025-11-17

- Q: GET /me endpoint - Team object fields to include? → A: Return only essential team fields (id, name, managerId, activeAssessmentId) excluding audit fields (createdAt, updatedAt, createdBy, isActive)
- Q: GET /me endpoint - Should assessment be populated? → A: Do not include assessment attribute in GET /me response

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST identify users uniquely by their email address as the user ID
- **FR-002**: System MUST store user profiles containing name, roles (as an array), and team assignment
- **FR-003**: System MUST support role-based access control using the roles array stored in user profiles
- **FR-004**: System MUST create assessment reports using content-addressed storage with keys formatted as `<userid>|<assessment_id>|<assessment-type>`
- **FR-005**: System MUST distinguish between self-assessment and manager assessment report types
- **FR-006**: System MUST store assessment report metadata including type, userId, and assessmentId
- **FR-007**: System MUST organize users into teams with unique team identifiers (e.g., "engineering", "marketing")
- **FR-008**: System MUST assign exactly one manager per team using the manager's user ID
- **FR-009**: System MUST enable querying users by their assigned manager using a global secondary index
- **FR-010**: System MUST track one active assessment per team at any given time
- **FR-011**: System MUST store assessments with unique identifiers (UUID), name, and structured plan data (Category array)
- **FR-012**: System MUST support querying assessment reports by the composite content-addressed key
- **FR-013**: System MUST support querying assessment reports by user ID to retrieve all reports for a given user
- **FR-014**: System MUST support querying users by team to retrieve all team members
- **FR-015**: System MUST prevent duplicate storage of identical assessment content through content addressing
- **FR-016**: System MUST allow orphaned records - assessment reports can reference deleted users or assessments, with queries handling missing references gracefully
- **FR-017**: System MUST prohibit email address changes once a user profile is created, treating email as an immutable identifier
- **FR-018**: System MUST provide a GET /me endpoint that returns the authenticated user's profile enriched with their team data (containing id, name, managerId, activeAssessmentId fields only, excluding audit fields)

### Key Entities

- **User**: Represents a team member or manager, uniquely identified by email address, contains name, assigned roles for authorization, and team affiliation
- **AssessmentReport**: Represents a completed assessment for a specific user, uses content-addressed storage to prevent duplication, differentiates between self and manager evaluations, references both the user being assessed and the assessment template used
- **Team**: Represents an organizational unit, groups users together, designates a manager from the user pool, tracks which assessment is currently active for team members
- **Assessment**: Represents an assessment template or framework, contains structured competency data (Category array), can be reused across multiple teams and assessment cycles, identified by UUID for clear versioning

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can be uniquely identified and retrieved using their email address with 100% accuracy
- **SC-002**: Assessment reports with identical content are stored only once through content addressing, reducing storage by at least 30% compared to non-deduplicated storage
- **SC-003**: All team members for a given manager can be retrieved in a single query operation
- **SC-004**: Assessment report retrieval by composite key (userId|assessmentId|type) completes in under 100 milliseconds for 95% of requests
- **SC-005**: The system gracefully handles queries involving orphaned records, returning meaningful results or appropriate notifications when referenced entities are missing
- **SC-006**: Team managers can view all assessment reports for their team members with no missing data
- **SC-007**: Migration from the existing data model to the new structure completes without data loss for 100% of existing records
