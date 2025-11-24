# Tasks: Administrator User Management

**Input**: Design documents from `/specs/004-user-management/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: This feature does NOT require comprehensive test coverage per the specification. Only critical integration tests for business rules will be included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is an Nx monorepo with separate apps:
- **Backend**: `apps/api/src/` (Fastify + Lambda)
- **Frontend**: `apps/web/src/` (React SPA)
- **Tests**: `apps/api/tests/` and `apps/web/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project structure verification and type definitions

- [x] T001 Copy shared type definitions from contracts/users-types.ts to apps/api/src/types/users.ts
- [x] T002 Copy shared type definitions from contracts/users-types.ts to apps/web/src/types/users.ts
- [x] T003 [P] Verify DynamoDB Users table exists with correct schema per spec 003-backend-data-model

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Extend auth middleware to add requireAdmin() function in apps/api/src/middleware/auth.ts
- [x] T005 [P] Create user service skeleton with validation helper functions in apps/api/src/services/user-service.ts
- [x] T006 [P] Create user handlers skeleton for Fastify routes in apps/api/src/handlers/admin-users.ts
- [x] T007 Register /api/admin/users routes with requireAdmin preHandler hook in apps/api/src/app.ts
- [x] T008 [P] Create user API client skeleton for frontend in apps/web/src/services/user-api.ts
- [x] T009 [P] Create React Query hooks skeleton in apps/web/src/hooks/useUsers.ts
- [x] T010 Add /admin/users route to React Router with admin role requirement in apps/web/src/router.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Add New User (Priority: P1) 🎯 MVP

**Goal**: Administrators can add new users by email with optional role assignments, creating functional accounts that can authenticate immediately

**Independent Test**: Log in as admin, navigate to /admin/users, click "Add User", enter valid email and name (with or without roles), submit form, verify user appears in list and can successfully log in with assigned permissions

### Implementation for User Story 1

- [x] T011 [P] [US1] Implement createUser() function in apps/api/src/services/user-service.ts with email validation, duplicate check, and DynamoDB PutItem
- [x] T012 [P] [US1] Implement getUserById() function in apps/api/src/services/user-service.ts with DynamoDB GetItem
- [x] T013 [US1] Implement POST /admin/users handler in apps/api/src/handlers/admin-users.ts calling createUser service
- [x] T014 [US1] Implement GET /admin/users/:userId handler in apps/api/src/handlers/admin-users.ts calling getUserById service
- [x] T015 [P] [US1] Implement createUser() API client function in apps/web/src/services/user-api.ts
- [x] T016 [P] [US1] Implement useCreateUser() React Query mutation hook in apps/web/src/hooks/useUsers.ts with optimistic updates
- [x] T017 [P] [US1] Create UserForm component with email/name/roles inputs and validation in apps/web/src/components/admin/UserForm.tsx
- [x] T018 [P] [US1] Create UserRoleBadge component for visual role display in apps/web/src/components/admin/UserRoleBadge.tsx
- [x] T019 [US1] Create UserManagement container component integrating UserForm in apps/web/src/components/admin/UserManagement.tsx
- [x] T020 [US1] Update AdminUsersPage connecting UserManagement component in apps/web/src/pages/AdminUsersPage.tsx
- [x] T021 [US1] Add error handling for duplicate email (409), invalid email (400), and unauthorized (403) in frontend
- [x] T022 [US1] Add success toast notification after user creation in UserManagement component
- [x] T023 [US1] Integration test for admin authorization (403 for non-admin) in apps/api/tests/integration/users.test.ts
- [x] T024 [US1] Integration test for email duplicate detection (409 error) in apps/api/tests/integration/users.test.ts

**Checkpoint**: ✅ User Story 1 is fully functional - admins can add users who can immediately log in

---

## Phase 4: User Story 2 - View All Users (Priority: P2)

**Goal**: Administrators can see a paginated, searchable list of all users with their email, name, roles, team, and status to understand current user base

**Independent Test**: Log in as admin, navigate to /admin/users page, verify all existing users display with complete information, test search by email/name, verify pagination works with 100+ users, confirm inactive users are visually distinguished

### Implementation for User Story 2

- [x] T025 [P] [US2] Implement listUsers() function in apps/api/src/services/user-service.ts with DynamoDB Scan, pagination, and search filter
- [x] T026 [US2] Implement GET /admin/users handler in apps/api/src/handlers/admin-users.ts calling listUsers service with query params
- [x] T027 [P] [US2] Implement fetchUsers() API client function in apps/web/src/services/user-api.ts with pagination support
- [x] T028 [P] [US2] Implement useUsers() React Query infinite query hook in apps/web/src/hooks/useUsers.ts with 1-minute cache TTL
- [x] T029 [P] [US2] Create UserTable component with columns for email, name, roles, team, status in apps/web/src/components/admin/UserTable.tsx
- [x] T030 [US2] Add search input with 300ms debounce to UserManagement component
- [x] T031 [US2] Add infinite scroll pagination to UserTable component using React Query's useInfiniteQuery
- [x] T032 [US2] Add status filter dropdown (all/active/inactive) to UserManagement component
- [x] T033 [US2] Add visual styling to distinguish inactive users (gray text, inactive badge) in UserTable
- [x] T034 [US2] Add empty state when no users found in search results
- [x] T035 [US2] Add loading skeleton for user list initial load and pagination

**Checkpoint**: ✅ User Stories 1 AND 2 both work independently - admins can add users and view the full user list

---

## Phase 5: User Story 3 - Update User Role (Priority: P3)

**Goal**: Administrators can modify existing users' role assignments to adjust permissions as organizational responsibilities change

**Independent Test**: From user list, select a user, open role editor, add/remove manager or admin roles, save changes, verify roles update immediately in UI and user's permissions reflect changes on next action

### Implementation for User Story 3

- [x] T036 [P] [US3] Implement updateUserRoles() function in apps/api/src/services/user-service.ts with DynamoDB UpdateItem
- [x] T037 [US3] Implement PATCH /admin/users/:userId handler in apps/api/src/handlers/admin-users.ts calling updateUserRoles service
- [x] T038 [P] [US3] Implement updateUserRoles() API client function in apps/web/src/services/user-api.ts
- [x] T039 [P] [US3] Implement useUpdateUserRoles() React Query mutation hook in apps/web/src/hooks/useUsers.ts with optimistic updates and rollback
- [x] T040 [US3] Add role editor modal/popover to UserTable rows with checkboxes for manager and admin roles
- [x] T041 [US3] Add save/cancel actions to role editor with loading state during mutation
- [x] T042 [US3] Add success toast notification after role update in RoleEditor component
- [x] T043 [US3] Add error handling for not found (404) and validation errors (400) in role editor
- [x] T044 [US3] Add confirmation dialog when removing all roles (defaulting to standard user access)

**Checkpoint**: ✅ All user stories 1-3 are independently functional - admins can add, view, and update user roles

---

## Phase 6: User Story 4 - Deactivate User (Priority: P4)

**Goal**: Administrators can deactivate users who should no longer have access while preserving their historical assessment data for audit purposes

**Independent Test**: From user list, select active user, click deactivate button, confirm action, verify user marked inactive in list, attempt login as deactivated user (should fail), confirm historical assessment reports remain accessible to team managers

### Implementation for User Story 4

- [x] T045 [P] [US4] Implement getTeamsByManagerId() helper function in apps/api/src/services/user-service.ts to check if user manages teams
- [x] T046 [US4] Implement deactivateUser() function in apps/api/src/services/user-service.ts with self-deactivation check, team manager check, DynamoDB UpdateItem, and Cognito AdminDisableUser
- [x] T047 [US4] Implement DELETE /admin/users/:userId handler in apps/api/src/handlers/admin-users.ts calling deactivateUser service
- [x] T048 [P] [US4] Implement deactivateUser() API client function in apps/web/src/services/user-api.ts
- [x] T049 [P] [US4] Implement useDeactivateUser() React Query mutation hook in apps/web/src/hooks/useUsers.ts with cache invalidation
- [x] T050 [US4] Add deactivate button to UserTable rows (only for active users)
- [x] T051 [US4] Add confirmation dialog for deactivation with warning text
- [x] T052 [US4] Add error handling for self-deactivation (400 with clear message) in deactivation flow
- [x] T053 [US4] Add error handling for team manager violation (400 with team count and reassignment instruction)
- [x] T054 [US4] Add error handling for already inactive user (400 with status message)
- [x] T055 [US4] Add success toast notification after deactivation with user email
- [x] T056 [US4] Update auth middleware to check isActive flag from DynamoDB in apps/api/src/middleware/auth.ts
- [x] T057 [US4] Integration test for self-deactivation prevention (400 error) in apps/api/tests/integration/users.test.ts
- [x] T058 [US4] Integration test for team manager deactivation check (400 error) in apps/api/tests/integration/users.test.ts
- [ ] T059 [US4] Manual test: Verify deactivated user cannot authenticate via Cognito

**Checkpoint**: All user stories should now be independently functional - full CRUD cycle complete

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T060 [P] Add responsive design adjustments for mobile viewport (<768px) in UserTable and UserManagement components
- [x] T061 [P] Add loading states for all mutations (create, update, deactivate) with disabled buttons
- [x] T062 [P] Add error boundary component to catch and display API errors gracefully
- [x] T063 Add keyboard accessibility (Tab navigation, Enter to submit) to UserForm and role editor
- [x] T064 Add ARIA labels and semantic HTML for screen reader support in all admin components
- [ ] T065 [P] Verify email validation prevents 100% of invalid formats (SC-003) - MANUAL TEST REQUIRED
- [ ] T066 [P] Performance test: Verify user list responsive with 1000 users (SC-002) - MANUAL TEST REQUIRED
- [ ] T067 [P] Performance test: Verify search returns results <1s for 95% of queries (SC-006) - MANUAL TEST REQUIRED
- [x] T068 Verify no PII (emails, names) logged in CloudWatch - only userId per constitution
- [ ] T069 Add Lambda execution role permission for cognito-idp:AdminDisableUser in infrastructure - INFRASTRUCTURE TASK
- [ ] T070 Run quickstart.md manual validation for all test scenarios - MANUAL TEST REQUIRED

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Uses User entity and routes from US1 but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Uses user list from US2 but independently testable
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Uses user list from US2 and role updates from US3 but independently testable

### Within Each User Story

**User Story 1 (Add New User)**:
1. Backend service functions (T011-T012) can run in parallel
2. Backend handlers (T013-T014) depend on services
3. Frontend API client (T015) can run in parallel with backend handlers
4. Frontend hooks (T016) depend on API client
5. Frontend components (T017-T018) can run in parallel
6. Integration (T019-T022) depends on all frontend components
7. Tests (T023-T024) can run in parallel at end

**User Story 2 (View All Users)**:
1. Backend service (T025) and handler (T026) can run sequentially
2. Frontend API client (T027) and hook (T028) can run in parallel after backend complete
3. Frontend components (T029-T035) depend on hooks

**User Story 3 (Update User Role)**:
1. Backend service (T036) and handler (T037) can run sequentially
2. Frontend API client (T038) and hook (T039) can run in parallel after backend complete
3. Frontend UI (T040-T044) depends on hooks

**User Story 4 (Deactivate User)**:
1. Backend helper (T045) then service (T046) then handler (T047) sequentially
2. Frontend API client (T048) and hook (T049) can run in parallel after backend complete
3. Frontend UI (T050-T055) depends on hooks
4. Auth middleware update (T056) can run in parallel
5. Tests (T057-T059) can run in parallel at end

### Parallel Opportunities

- All Setup tasks (T001-T003) can run in parallel
- Within Foundational: T005-T006, T008-T009 can run in parallel (different files)
- Once Foundational completes, ALL user stories (Phase 3-6) can start in parallel if team capacity allows
- Within each user story, tasks marked [P] can run in parallel
- Polish tasks (T060-T070) marked [P] can run in parallel

---

## Parallel Example: User Story 1 (Add New User)

```bash
# Launch backend service functions together:
Task T011: "Implement createUser() function in apps/api/src/services/user-service.ts"
Task T012: "Implement getUserById() function in apps/api/src/services/user-service.ts"

# Then launch frontend API and hooks:
Task T015: "Implement createUser() API client in apps/web/src/services/user-api.ts"
Task T016: "Implement useCreateUser() React Query hook in apps/web/src/hooks/useUsers.ts"

# Launch UI components together:
Task T017: "Create UserForm component in apps/web/src/components/admin/UserForm.tsx"
Task T018: "Create UserRoleBadge component in apps/web/src/components/admin/UserRoleBadge.tsx"

# Launch integration tests together:
Task T023: "Test admin authorization (403 for non-admin) in apps/api/tests/integration/users.test.ts"
Task T024: "Test email duplicate detection (409) in apps/api/tests/integration/users.test.ts"
```

---

## Parallel Example: User Story 2 (View All Users)

```bash
# Launch frontend client and hook together:
Task T027: "Implement fetchUsers() in apps/web/src/services/user-api.ts"
Task T028: "Implement useUsers() infinite query in apps/web/src/hooks/useUsers.ts"

# Launch UI components together:
Task T029: "Create UserTable component in apps/web/src/components/admin/UserTable.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T010) - CRITICAL - blocks all stories
3. Complete Phase 3: User Story 1 (T011-T024)
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Admin can add user with email and optional roles
   - User appears in Cognito
   - User can successfully log in
   - Admin authorization works (non-admins get 403)
   - Email validation prevents duplicates (409)
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational (T001-T010) → Foundation ready
2. Add User Story 1 (T011-T024) → Test independently → Deploy/Demo (MVP! Admins can onboard users)
3. Add User Story 2 (T025-T035) → Test independently → Deploy/Demo (Admins can view all users)
4. Add User Story 3 (T036-T044) → Test independently → Deploy/Demo (Admins can update roles)
5. Add User Story 4 (T045-T059) → Test independently → Deploy/Demo (Admins can deactivate users)
6. Add Polish (T060-T070) → Test cross-cutting concerns → Deploy/Demo (Production-ready)

Each story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T010)
2. Once Foundational is done (Checkpoint reached):
   - **Developer A**: User Story 1 (T011-T024) - Add users
   - **Developer B**: User Story 2 (T025-T035) - View users (needs stub data initially)
   - **Developer C**: User Story 3 (T036-T044) - Update roles (needs stub data initially)
   - **Developer D**: User Story 4 (T045-T059) - Deactivate users (needs stub data initially)
3. Stories complete and integrate independently
4. Team converges on Polish tasks (T060-T070)

---

## Notes

- [P] tasks = different files, no dependencies within the phase
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests are minimal per spec - only critical integration tests for business rules
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Constitution requirement: All endpoints require Cognito JWT with "admin" role
- Constitution requirement: No PII logging (use userId only in CloudWatch)
- Constitution requirement: API response times <500ms p95 (lambda 512MB minimum)
- Constitution requirement: React Query cache TTL = 1 minute for user lists
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Summary

- **Total Tasks**: 70
- **Setup Phase**: 3 tasks
- **Foundational Phase**: 7 tasks (BLOCKS all user stories)
- **User Story 1 (P1 - MVP)**: 14 tasks (T011-T024)
- **User Story 2 (P2)**: 11 tasks (T025-T035)
- **User Story 3 (P3)**: 9 tasks (T036-T044)
- **User Story 4 (P4)**: 15 tasks (T045-T059)
- **Polish Phase**: 11 tasks (T060-T070)

**Parallel Opportunities**: 30+ tasks marked [P] can run in parallel within their phase

**MVP Scope**: Phases 1-3 only (24 tasks) - Enables administrators to add new users

**Full Feature**: All phases (70 tasks) - Complete CRUD user management with role-based access control

**Estimated Total Implementation Time**: 18-24 hours
- Setup + Foundational: 3-4 hours
- User Story 1 (MVP): 4-6 hours
- User Story 2: 3-4 hours
- User Story 3: 2-3 hours
- User Story 4: 4-5 hours
- Polish: 2-3 hours
