# Research: Administrator Team Management

**Feature**: 005-team-management
**Date**: 2025-11-24
**Purpose**: Resolve NEEDS CLARIFICATION items from Technical Context and constitution check

## Research Questions

### 1. Team Archival / Soft Delete Requirement

**Question**: Should teams support soft delete (isActive flag) or are hard deletes acceptable?

**Research Findings**:
- **Constitution Section: Data Model Governance** states: "Soft deletes (via `isActive: false`) are REQUIRED for teams and assessment plans (no hard deletes)"
- **001-dynamodb-setup**: Teams table schema does NOT include isActive field in current implementation
- **Spec.md Edge Cases**: "How does the system handle deleting a team that has historical assessment data? The system should archive the team and preserve all historical data while preventing new activities"

**Decision**: IMPLEMENT SOFT DELETES for Teams
- Add `isActive: boolean` field to Teams table schema
- Default to `true` for new teams
- Implement "Archive Team" operation that sets `isActive: false`
- Filter archived teams from default team list views
- Preserve all historical data when team is archived

**Rationale**:
1. Constitution explicitly requires soft deletes for teams
2. Spec edge case implies archival rather than deletion
3. Historical assessment data integrity depends on teams existing
4. Enables "unarchive" workflows if team accidentally archived
5. Audit trail preservation for compliance

**Alternatives Considered**:
- Hard delete: Rejected per constitution requirement
- No delete at all: Rejected as doesn't address organizational restructuring needs

**Action Items**:
1. Update Teams table schema to include `isActive: boolean` field
2. Add archive/unarchive endpoints to API
3. Update team queries to filter by isActive unless explicitly requesting archived teams
4. Document in data-model.md

---

### 2. Team Structure Assumptions

**Question**: Confirm team structure: single manager per team? flat structure (no nested teams)?

**Research Findings**:
- **Spec FR-006**: "System MUST allow administrators to assign a user with 'manager' role as THE team manager" (singular)
- **Spec FR-008**: "System MUST allow a user to be manager of multiple teams"
- **Spec User Story 3**: "When they choose a user with 'manager' role and assign them as team manager" (singular manager)
- **Spec Edge Cases**: "How does the system handle assigning a user as manager to multiple teams? The system should allow this, as a user can manage multiple teams"
- **001-dynamodb-setup Teams table**: `managerId?: string | null;` (single manager, optional)
- **Constitution Open Questions**: "Team structure (nested teams allowed? multiple managers per team?)" - Listed as Phase 2 prerequisite

**Decision**: SINGLE MANAGER PER TEAM, FLAT STRUCTURE
- Each team has exactly zero or one manager (optional)
- A user can be manager of multiple teams
- No nested team hierarchy (teams are peers)
- Changing team manager replaces the previous manager

**Rationale**:
1. Spec consistently uses singular "manager" throughout
2. DynamoDB schema supports single managerId field
3. Flat structure simplifies authorization and reporting
4. Multi-team management per user supports matrix org structures
5. Aligns with typical organizational patterns (one direct manager, can oversee multiple teams)

**Alternatives Considered**:
- Multiple managers per team: Rejected - adds complexity, not requested in requirements
- Nested teams: Rejected - not mentioned in spec, adds significant complexity to queries and authorization
- Required manager: Rejected - spec FR-006 and edge cases imply optional manager

**Action Items**:
1. Document assumption in code comments: `// ASSUMPTION: Single manager per team, flat structure - see constitution`
2. Update data-model.md to clarify single manager constraint
3. UI should show "Replace Manager" when team already has manager
4. Validation: Prevent assigning multiple managers (not applicable - schema enforces this)

---

### 3. Team Member Count Calculation

**Question**: Should team member count be stored (denormalized) or calculated on-the-fly?

**Research Findings**:
- **Spec FR-015**: "System MUST update team member counts in real-time as members are added or removed"
- **Spec SC-005**: "Team member additions and removals update team member counts within 5 seconds"
- **004-user-management**: Users table has `team?: string | null` field
- **Pattern**: No members array stored in Teams table, team membership derived from Users table query
- **Constitution Performance Standards**: "p95 response time <500ms for assessment workflows"

**Decision**: CALCULATE ON-THE-FLY with caching
- Do NOT store memberCount field in Teams table (avoid denormalization sync issues)
- Calculate member count by querying Users table: `Count where team === teamId AND isActive === true`
- Use React Query cache on frontend (1-minute TTL per constitution)
- Backend can cache in Lambda execution context if needed

**Rationale**:
1. Source of truth is Users table (team field)
2. Avoids synchronization bugs between Teams.memberCount and Users.team
3. DynamoDB Query with Count projection is efficient (<100ms typically)
4. SC-005 requires 5-second update - caching doesn't violate this (1-minute cache acceptable)
5. Follows 004 pattern (user-centric queries, not team-centric denormalization)

**Alternatives Considered**:
- Store memberCount: Rejected - requires transaction to update both Users and Teams on every add/remove, prone to sync bugs
- DynamoDB Streams to update count: Over-engineered for current scale (<100 teams, <1000 users)

**Action Items**:
1. Implement `getTeamMemberCount(teamId)` helper function
2. Include member count in team list response (calculated per team)
3. Use DynamoDB Query with Count projection for efficiency
4. Document in contracts/ API response

---

### 4. Team Members List Storage

**Question**: Should Teams table store members array or derive from Users table?

**Research Findings**:
- **001-dynamodb-setup Teams table**: Does NOT include members array field
- **001-dynamodb-setup Users table**: Includes `team?: string | null` field
- **Spec FR-010**: "System MUST support users belonging to only one team at a time"
- **Spec FR-011**: "System MUST automatically move users from their previous team when assigned to a new team"
- **Constitution Team-Centric Data Model**: "Team-centric queries enable efficient team-scoped operations"

**Decision**: DERIVE FROM USERS TABLE (current design)
- Teams table does NOT store members array
- Team membership is determined by Users.team field
- Query pattern: Scan/Query Users table filtered by team === teamId
- "Add member" operation updates User.team field
- "Remove member" operation sets User.team = null

**Rationale**:
1. Single source of truth (Users table) prevents synchronization bugs
2. Supports FR-010 (one team per user) naturally - user has single team field
3. Supports FR-011 (automatic move) - updating user.team automatically "removes" from old team
4. Avoids complex array manipulation in DynamoDB
5. Matches existing 001-dynamodb-setup schema

**Alternatives Considered**:
- Store members array in Teams: Rejected - requires transaction to update both Users.team and Teams.members, violates single source of truth
- Separate TeamMembers table: Over-engineered for simple one-to-many relationship

**Action Items**:
1. Implement `getTeamMembers(teamId)` query function
2. Use Users table GSI if available, otherwise Scan with filter (acceptable for admin operations)
3. Document query pattern in data-model.md
4. Update Users.team field for add/remove member operations

---

### 5. Active Assessment Tracking

**Question**: How to track and display "active assessment" for each team?

**Research Findings**:
- **Spec FR-004**: "System MUST display a list of all teams showing ID, name, assigned manager, member count, and active assessment"
- **003-backend-data-model**: Assessments table schema includes `teamId` and `status` fields
- **Constitution Assessment Workflow**: Status values: `not_started`, `in_progress`, `submitted`
- **Pattern**: Assessment plans belong to teams, assessments track individual completions

**Decision**: QUERY ASSESSMENTS TABLE with GSI
- Do NOT store activeAssessmentId in Teams table (denormalization)
- Calculate active assessment by querying Assessments table: `teamId-status GSI where status IN ('not_started', 'in_progress')`
- "Active assessment" = most recent assessment plan with incomplete assessments
- Display assessment plan name and completion percentage (calculated)

**Rationale**:
1. Assessments table is source of truth for assessment state
2. Avoids sync issues between Teams and Assessments
3. "Active" is derived state (can be calculated from assessment status)
4. GSI query efficient for team-based lookup
5. Aligns with Phase 4 (Assessment Plans) design

**Alternatives Considered**:
- Store activeAssessmentPlanId: Rejected - requires updating Teams table when assessment created/submitted
- No active assessment display: Rejected - explicit requirement in FR-004

**Action Items**:
1. Document assumption: "Active assessment" = assessment plan with any incomplete assessments
2. Implement `getActiveAssessment(teamId)` helper (placeholder - full implementation in Phase 4)
3. Phase 3 implementation: Return `null` for active assessment (assessment plans not implemented yet)
4. Phase 4 implementation: Update to query Assessments table via teamId-status GSI
5. Document as `// TODO: Phase 4 - implement active assessment query`

---

## Research Summary

### Decisions Made

1. **Team Archival**: Implement soft deletes with `isActive` field per constitution requirement
2. **Team Structure**: Single manager per team, flat structure (no nesting)
3. **Member Count**: Calculate on-the-fly from Users table with React Query caching
4. **Members List**: Derive from Users.team field, not stored in Teams table
5. **Active Assessment**: Placeholder null in Phase 3, implement in Phase 4

### Technical Approach Validated

- **Backend**: Reuse requireAdmin middleware, follow user-management patterns (team-service.ts, admin-teams.ts handlers)
- **Frontend**: React Query hooks with optimistic updates, shadcn/ui components matching user management UI
- **Storage**: Teams table (soft deletes), Users table queries for members, Assessments table queries for active assessment (Phase 4)
- **Authorization**: Admin-only for all team management operations

### No Blocking Issues

All research questions resolved. Proceed to Phase 1 (Design & Contracts).
