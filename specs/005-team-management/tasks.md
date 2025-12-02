# Tasks: Administrator Team Management

**Input**: Design documents from `/specs/005-team-management/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Integration tests included for critical authorization and validation scenarios.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app (Nx monorepo)**: `apps/api/src/`, `apps/web/src/`
- Backend: Fastify + Lambda (TypeScript)
- Frontend: React + Vite (TypeScript)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and type definitions

- [x] T001 [P] Copy Team type definitions from contracts/team-types.ts to apps/api/src/types/teams.ts
- [x] T002 [P] Copy Team type definitions from contracts/team-types.ts to apps/web/src/types/teams.ts
- [x] T003 Verify DynamoDB Teams table schema includes isActive field (from research.md soft delete requirement)

**Checkpoint**: Type definitions synchronized, schema verified

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Verify requireAdmin middleware exists in apps/api/src/middleware/auth.ts (reuse from 004-user-management)
- [x] T005 Implement createTeam() function in apps/api/src/services/team-service.ts with validation (teamId uniqueness, name length)
- [x] T006 Implement getTeamById() function in apps/api/src/services/team-service.ts
- [x] T007 Implement listTeams() function in apps/api/src/services/team-service.ts with search and filter support
- [x] T008 Implement createTeamHandler() in apps/api/src/handlers/admin-teams.ts calling createTeam service
- [x] T009 Implement getTeamHandler() in apps/api/src/handlers/admin-teams.ts
- [x] T010 Implement listTeamsHandler() in apps/api/src/handlers/admin-teams.ts
- [x] T011 Register team routes in apps/api/src/app.ts with requireAdmin preHandler (POST /growth/admin/teams, GET /growth/admin/teams, GET /growth/admin/teams/:teamId)
- [x] T012 [P] Extend useApi hook to include PATCH support if not already present in apps/web/src/hooks/useApi.ts (reuse from 004)
- [x] T013 [P] Implement team API client factory in apps/web/src/services/team-api.ts (fetchTeams, fetchTeam, createTeam functions)
- [x] T014 [P] Implement useTeams() React Query hook in apps/web/src/hooks/useTeams.ts with infinite query for team list
- [x] T015 [P] Implement useTeam() React Query hook in apps/web/src/hooks/useTeams.ts for single team details
- [x] T016 [P] Implement useCreateTeam() React Query mutation hook in apps/web/src/hooks/useTeams.ts with cache invalidation
- [x] T017 Create AdminRoute component wrapper if not exists in apps/web/src/components/AdminRoute.tsx (reuse from 004)
- [x] T018 Create placeholder AdminTeamsPage in apps/web/src/pages/AdminTeamsPage.tsx
- [x] T019 Add /admin/teams route in apps/web/src/router.tsx with AdminRoute wrapper

**Checkpoint**: Foundation ready - team CRUD infrastructure complete, user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create New Team (Priority: P1) 🎯 MVP

**Goal**: Administrators can create teams with unique IDs and names, enabling organizational structure setup

**Independent Test**: From team management page, create team with valid teamId and name, verify team appears in list with no manager, no members, active status. Try duplicate teamId (should fail with 409). Try invalid teamId format (should fail with validation error).

### Tests for User Story 1

- [x] T020 [P] [US1] Integration test for admin authorization (non-admins get 403) in apps/api/tests/integration/teams.test.ts
- [x] T021 [P] [US1] Integration test for team ID uniqueness (409 on duplicate) in apps/api/tests/integration/teams.test.ts

### Implementation for User Story 1

- [x] T022 [P] [US1] Create TeamForm component in apps/web/src/components/admin/TeamForm.tsx with teamId and name inputs, validation (TEAM_ID_REGEX, name length)
- [x] T023 [P] [US1] Create TeamBadge component in apps/web/src/components/admin/TeamBadge.tsx for displaying team status (active/archived)
- [x] T024 [US1] Create TeamManagement container component in apps/web/src/components/admin/TeamManagement.tsx integrating TeamForm with useCreateTeam hook
- [x] T025 [US1] Update AdminTeamsPage in apps/web/src/pages/AdminTeamsPage.tsx to render TeamManagement component
- [x] T026 [US1] Add error handling for duplicate team ID (409) in TeamForm with user-friendly message
- [x] T027 [US1] Add error handling for validation failures (400) in TeamForm with inline error display
- [x] T028 [US1] Add success toast notification after team creation using useToast hook
- [x] T029 [US1] Clear form after successful team creation

**Checkpoint**: At this point, administrators can create teams. User Story 1 should be fully functional and independently testable. Test SC-001 (creation <20 seconds), SC-003 (100% duplicate prevention).

---

## Phase 4: User Story 2 - View All Teams (Priority: P2)

**Goal**: Administrators can view a list of all teams with their details (ID, name, manager, member count, active assessment)

**Independent Test**: Navigate to team management page, verify all existing teams displayed with complete information (ID, name, manager name or "None", member count, active assessment). Test search by name and ID (partial match, case-insensitive). Test status filter (active/archived). Verify performance with team list loading.

### Implementation for User Story 2

- [x] T030 [P] [US2] Implement getTeamMemberCount() helper function in apps/api/src/services/team-service.ts querying Users table
- [x] T031 [P] [US2] Implement getTeamMembers() helper function in apps/api/src/services/team-service.ts querying Users.team field
- [x] T032 [US2] Update listTeams() in apps/api/src/services/team-service.ts to include memberCount and managerName (resolved from Users table)
- [x] T033 [US2] Update listTeamsHandler() to return TeamWithDetails array including calculated fields
- [x] T034 [P] [US2] Create TeamTable component in apps/web/src/components/admin/TeamTable.tsx with responsive design (desktop table, mobile cards)
- [x] T035 [P] [US2] Add search input with debounce to TeamManagement component (300ms debounce using useDebounce hook)
- [x] T036 [P] [US2] Add status filter dropdown in TeamManagement (all/active/archived using isActive field)
- [x] T037 [US2] Update useTeams() hook to accept search and status filter parameters
- [x] T038 [US2] Integrate TeamTable into TeamManagement with infinite scroll (Load More button using fetchNextPage)
- [x] T039 [US2] Display team details in table: ID, name, manager name or "None", member count, active assessment (null in Phase 3), status badge
- [x] T040 [US2] Add loading skeleton for team list initial load
- [x] T041 [US2] Add empty state message when no teams match filters
- [x] T042 [US2] Visual styling for archived teams (opacity or badge)

**Checkpoint**: At this point, administrators can view and search all teams. Test SC-002 (responsive with 100 teams), SC-007 (search <1s for 95% of queries).

---

## Phase 5: User Story 3 - Assign Team Manager (Priority: P3)

**Goal**: Administrators can assign users with "manager" role as team managers, enabling team oversight

**Independent Test**: Select team, choose user with manager role from dropdown, assign as manager, verify team list shows assigned manager name. Try assigning user without manager role (should fail). Try assigning deactivated user (should fail). Replace existing manager with new one. Unassign manager (set to null).

### Implementation for User Story 3

- [x] T043 [P] [US3] Implement updateTeamManager() function in apps/api/src/services/team-service.ts with validation (manager role check, isActive check)
- [x] T044 [US3] Implement updateManagerHandler() in apps/api/src/handlers/admin-teams.ts for PATCH /growth/admin/teams/:teamId/manager endpoint
- [x] T045 [US3] Register PATCH /growth/admin/teams/:teamId/manager route in apps/api/src/app.ts with requireAdmin
- [x] T046 [P] [US3] Add updateTeamManager() to team API client in apps/web/src/services/team-api.ts
- [x] T047 [P] [US3] Implement useUpdateTeamManager() React Query mutation hook in apps/web/src/hooks/useTeams.ts with cache invalidation
- [x] T048 [P] [US3] Create ManagerSelector component in apps/web/src/components/admin/ManagerSelector.tsx (dropdown of users with manager role, includes "None" option)
- [x] T049 [US3] Integrate ManagerSelector into TeamTable row actions or team details view
- [x] T050 [US3] Add validation error handling for INVALID_MANAGER_ROLE (400) with clear message
- [x] T051 [US3] Add validation error handling for MANAGER_DEACTIVATED (400) per SC-008 with clear message
- [x] T052 [US3] Add success toast notification after manager assignment
- [x] T053 [US3] Update team list to reflect assigned manager name immediately (optimistic update with rollback)

**Checkpoint**: At this point, administrators can assign team managers. Test SC-004 (manager permissions within 1 minute), SC-008 (zero deactivated managers assigned).

---

## Phase 6: User Story 4 - Add Team Members (Priority: P4)

**Goal**: Administrators can add users to teams, defining team membership for team-based workflows

**Independent Test**: Select team, choose users to add (single or multiple), save changes, verify users' profiles show correct team assignment and member count updates. Try adding user already in team (idempotent). Try adding user from different team (should move, automatic team switch per FR-011).

### Implementation for User Story 4

- [ ] T054 [P] [US4] Implement addTeamMembers() function in apps/api/src/services/team-service.ts updating Users.team field for multiple users
- [ ] T055 [US4] Implement addMembersHandler() in apps/api/src/handlers/admin-teams.ts for POST /growth/admin/teams/:teamId/members endpoint
- [ ] T056 [US4] Register POST /growth/admin/teams/:teamId/members route in apps/api/src/app.ts with requireAdmin
- [ ] T057 [P] [US4] Add addTeamMembers() to team API client in apps/web/src/services/team-api.ts
- [ ] T058 [P] [US4] Implement useAddTeamMembers() React Query mutation hook in apps/web/src/hooks/useTeams.ts with cache invalidation
- [ ] T059 [P] [US4] Create MemberSelector component in apps/web/src/components/admin/MemberSelector.tsx (multi-select dropdown of all active users, max 50 per operation)
- [ ] T060 [US4] Integrate MemberSelector into team details view with "Add Members" action
- [ ] T061 [US4] Add validation for batch size limit (1-50 users) with error message
- [ ] T062 [US4] Add validation for user existence (404) with list of not-found users
- [ ] T063 [US4] Add success toast showing added count and moved count (users from other teams)
- [ ] T064 [US4] Update member count in team list within 5 seconds per SC-005 (optimistic update + cache invalidation)
- [ ] T065 [US4] Display confirmation message explaining automatic team move (FR-011) when adding users from other teams

**Checkpoint**: At this point, administrators can add team members. Test SC-005 (member count updates <5 seconds), FR-011 (automatic team move).

---

## Phase 7: User Story 5 - Remove Team Members (Priority: P5)

**Goal**: Administrators can remove users from teams when membership changes, while preserving historical data

**Independent Test**: Select team with members, remove one or more users, verify users no longer show team assignment and member count updates. Try removing user not in team (idempotent). Try removing team manager while assigned (should fail per SC-009). Verify historical assessment data preserved (Phase 4 dependency).

### Implementation for User Story 5

- [ ] T066 [P] [US5] Implement removeTeamMembers() function in apps/api/src/services/team-service.ts setting Users.team = null, check if removing team manager (reject with MANAGER_IS_MEMBER)
- [ ] T067 [US5] Implement removeMembersHandler() in apps/api/src/handlers/admin-teams.ts for DELETE /growth/admin/teams/:teamId/members endpoint
- [ ] T068 [US5] Register DELETE /growth/admin/teams/:teamId/members route in apps/api/src/app.ts with requireAdmin
- [ ] T069 [P] [US5] Add removeTeamMembers() to team API client in apps/web/src/services/team-api.ts
- [ ] T070 [P] [US5] Implement useRemoveTeamMembers() React Query mutation hook in apps/web/src/hooks/useTeams.ts with cache invalidation
- [ ] T071 [US5] Add "Remove Members" action to team details view with multi-select of current members
- [ ] T072 [US5] Add confirmation dialog for member removal with warning about manager restriction
- [ ] T073 [US5] Add error handling for MANAGER_IS_MEMBER (400) per SC-009 with clear instruction to unassign manager first
- [ ] T074 [US5] Add success toast showing removed count and historical data preservation message per FR-014
- [ ] T075 [US5] Update member count in team list within 5 seconds per SC-005

**Checkpoint**: At this point, all user stories should be independently functional - full team management CRUD cycle complete. Test SC-009 (zero managers removed without unassignment).

---

## Phase 8: Team Archival (Soft Delete)

**Purpose**: Implement team archival to support organizational restructuring while preserving historical data

- [ ] T076 [P] Implement archiveTeam() function in apps/api/src/services/team-service.ts setting isActive = true/false
- [ ] T077 Implement archiveTeamHandler() in apps/api/src/handlers/admin-teams.ts for PATCH /growth/admin/teams/:teamId/archive endpoint
- [ ] T078 Register PATCH /growth/admin/teams/:teamId/archive route in apps/api/src/app.ts with requireAdmin
- [ ] T079 [P] Add archiveTeam() to team API client in apps/web/src/services/team-api.ts
- [ ] T080 [P] Implement useArchiveTeam() React Query mutation hook in apps/web/src/hooks/useTeams.ts
- [ ] T081 Add "Archive Team" action to team row/details with confirmation dialog
- [ ] T082 Add "Unarchive Team" action for archived teams
- [ ] T083 Update team list queries to filter by isActive unless includeArchived=true
- [ ] T084 Add "Show Archived Teams" toggle in TeamManagement UI
- [ ] T085 Add archived badge styling in TeamTable for archived teams

**Checkpoint**: Team archival complete, teams can be soft-deleted with data preservation

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T086 [P] Add responsive design adjustments for mobile viewport (<768px) in TeamTable and TeamManagement components
- [ ] T087 [P] Add loading states for all mutations (create, update manager, add/remove members, archive) with disabled buttons
- [ ] T088 [P] Add error boundary component integration to AdminTeamsPage (reuse ErrorBoundary from 004)
- [ ] T089 Add keyboard accessibility (Tab navigation, Enter to submit) to TeamForm and ManagerSelector
- [ ] T090 Add ARIA labels and semantic HTML for screen reader support in all team components
- [ ] T091 [P] Add integration test for manager role validation (users without manager role rejected) in apps/api/tests/integration/teams.test.ts
- [ ] T092 [P] Add integration test for team manager removal prevention (SC-009) in apps/api/tests/integration/teams.test.ts
- [ ] T093 Verify no PII (team names, user emails) logged in CloudWatch - only teamId and userId per constitution
- [ ] T094 Run quickstart.md manual validation for all test scenarios
- [ ] T095 Document active assessment placeholder (returns null in Phase 3, to be implemented in Phase 4)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - Can proceed in priority order (P1 → P2 → P3 → P4 → P5)
  - Or in parallel if team capacity allows (after Foundational complete)
- **Team Archival (Phase 8)**: Can proceed in parallel with user stories or after
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories ✅ INDEPENDENT
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Builds on US1 (team list display) but can test independently with existing teams ✅ MOSTLY INDEPENDENT
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Requires teams from US1 but independently testable ✅ MOSTLY INDEPENDENT
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Requires teams from US1, can test member addition independently ✅ MOSTLY INDEPENDENT
- **User Story 5 (P5)**: Can start after Foundational (Phase 2) - Requires teams and members from US1/US4, but removal logic independently testable ✅ MOSTLY INDEPENDENT

**Note**: While user stories build on each other logically (need teams before assigning managers), each story's functionality can be tested independently with appropriate test data setup.

### Within Each User Story

**User Story 1 (Create Team)**:
1. Tests (T020-T021) can run in parallel
2. TeamForm and TeamBadge (T022-T023) can be built in parallel
3. Integration (T024-T029) sequential

**User Story 2 (View Teams)**:
1. Helper functions (T030-T031) can run in parallel
2. Service updates (T032-T033) sequential
3. TeamTable and search/filter UI (T034-T036) can run in parallel
4. Integration (T037-T042) builds on above

**User Story 3 (Assign Manager)**:
1. Service and handler (T043-T044) sequential
2. Route registration (T045) after handler
3. API client and hook (T046-T047) can run in parallel
4. ManagerSelector (T048) parallel with hooks
5. Integration (T049-T053) after components ready

**User Story 4 (Add Members)**:
1. Service and handler (T054-T055) sequential
2. Route registration (T056) after handler
3. API client and hook (T057-T058) can run in parallel
4. MemberSelector (T059) parallel with hooks
5. Integration (T060-T065) after components ready

**User Story 5 (Remove Members)**:
1. Service and handler (T066-T067) sequential
2. Route registration (T068) after handler
3. API client and hook (T069-T070) can run in parallel
4. Integration (T071-T075) after API ready

### Parallel Opportunities

- All Setup tasks (T001-T003) can run in parallel
- Within Foundational: T005-T007 (service functions), T008-T010 (handlers), T012-T016 (frontend hooks) can run in parallel within their groups
- Once Foundational completes, ALL user stories (Phase 3-7) can start in parallel if team capacity allows
- Within each user story, tasks marked [P] can run in parallel
- Polish tasks (T086-T093) marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch tests together:
Task: "Integration test for admin authorization in apps/api/tests/integration/teams.test.ts"
Task: "Integration test for team ID uniqueness in apps/api/tests/integration/teams.test.ts"

# Launch components together:
Task: "Create TeamForm component in apps/web/src/components/admin/TeamForm.tsx"
Task: "Create TeamBadge component in apps/web/src/components/admin/TeamBadge.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T019) - CRITICAL - blocks all stories
3. Complete Phase 3: User Story 1 (T020-T029)
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Admin can create team with teamId and name
   - Team appears in DynamoDB
   - Duplicate teamId rejected (409)
   - Invalid teamId format rejected (400)
   - Non-admin users get 403
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational (T001-T019) → Foundation ready
2. Add User Story 1 (T020-T029) → Test independently → Deploy/Demo (MVP! Admins can create teams)
3. Add User Story 2 (T030-T042) → Test independently → Deploy/Demo (Admins can view all teams)
4. Add User Story 3 (T043-T053) → Test independently → Deploy/Demo (Admins can assign managers)
5. Add User Story 4 (T054-T065) → Test independently → Deploy/Demo (Admins can add members)
6. Add User Story 5 (T066-T075) → Test independently → Deploy/Demo (Admins can remove members)
7. Add Team Archival (T076-T085) → Test independently → Deploy/Demo (Admins can archive teams)
8. Add Polish (T086-T095) → Test cross-cutting concerns → Deploy/Demo (Production-ready)

Each story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T019)
2. Once Foundational is done (Checkpoint reached):
   - Developer A: User Story 1 (T020-T029)
   - Developer B: User Story 2 (T030-T042) - can start after US1 creates first team
   - Developer C: User Story 3 (T043-T053) - can start after US1 creates first team
3. Once US1-3 complete:
   - Developer A: User Story 4 (T054-T065)
   - Developer B: User Story 5 (T066-T075)
   - Developer C: Team Archival (T076-T085)
4. All developers: Polish tasks (T086-T095) in parallel

---

## Notes

- [P] tasks = different files, no dependencies, can run concurrently
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests validate authorization, validation, and business rules
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Reuse patterns from 004-user-management (requireAdmin, React Query hooks, optimistic updates)
- Phase 4 (Assessment Plans) will implement active assessment display (currently placeholder null)
