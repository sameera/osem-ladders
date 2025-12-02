# Quickstart: Administrator Team Management

**Feature**: 005-team-management
**Purpose**: Manual testing guide for validating all user stories and acceptance criteria

## Prerequisites

1. **Environment Setup**:
   - Backend API deployed and accessible
   - Frontend web app deployed and accessible
   - AWS Cognito configured with Microsoft 365 integration
   - DynamoDB Teams and Users tables created (from 001-dynamodb-setup)

2. **Test Users**:
   - `admin@example.com` - Admin role (for all team management operations)
   - `manager1@example.com` - Manager role (for assignment as team manager)
   - `manager2@example.com` - Manager role (for multi-team manager scenario)
   - `user1@example.com`, `user2@example.com`, `user3@example.com` - Regular users (for team membership)
   - `deactivated-manager@example.com` - Manager role, isActive=false (for validation test)

3. **Initial State**:
   - All test users exist in Users table (created via 004-user-management)
   - No teams exist initially (clean state for testing)

---

## Test Scenario 1: Create New Team (User Story 1, P1)

**Goal**: Verify administrators can create teams with unique IDs and names

### Test Case 1.1: Create Valid Team

**Steps**:
1. Log in as `admin@example.com`
2. Navigate to `/admin/teams` (Team Management page)
3. Enter team details:
   - Team ID: `engineering-platform`
   - Team Name: `Engineering - Platform Team`
4. Click "Create Team"

**Expected Results**:
- ✓ Success message displayed: "Team created successfully"
- ✓ New team appears in team list
- ✓ Team details show:
  - ID: `engineering-platform`
  - Name: `Engineering - Platform Team`
  - Manager: (none)
  - Members: 0
  - Active Assessment: (none)
  - Status: Active
- ✓ Team creation completes in <20 seconds (SC-001)

**Actual Results**: _______

---

### Test Case 1.2: Duplicate Team ID

**Steps**:
1. Still logged in as `admin@example.com`
2. Try to create another team:
   - Team ID: `engineering-platform` (duplicate)
   - Team Name: `Duplicate Team`
3. Click "Create Team"

**Expected Results**:
- ✗ Error message displayed: "A team with ID 'engineering-platform' already exists"
- ✗ HTTP 409 Conflict response
- ✗ Team NOT created
- ✗ Team list unchanged

**Actual Results**: _______

---

### Test Case 1.3: Invalid Team ID Format

**Steps**:
1. Try to create team with invalid ID:
   - Team ID: `Engineering Platform` (uppercase, spaces)
   - Team Name: `Valid Name`
2. Click "Create Team"

**Expected Results**:
- ✗ Validation error: "Team ID must be lowercase alphanumeric and hyphens only"
- ✗ HTTP 400 Bad Request
- ✗ Team NOT created

**Actual Results**: _______

---

### Test Case 1.4: Create Multiple Teams

**Steps**:
1. Create additional teams:
   - Team ID: `sales-west`, Name: `Sales - West Coast`
   - Team ID: `sales-east`, Name: `Sales - East Coast`
   - Team ID: `marketing`, Name: `Marketing Team`

**Expected Results**:
- ✓ All 4 teams created successfully
- ✓ All teams visible in team list
- ✓ Form cleared after each successful creation

**Actual Results**: _______

---

## Test Scenario 2: View All Teams (User Story 2, P2)

**Goal**: Verify administrators can view and search all teams

### Test Case 2.1: View Team List

**Steps**:
1. Navigate to `/admin/teams`
2. Observe team list display

**Expected Results**:
- ✓ All 4 created teams displayed
- ✓ Each team shows:
  - Team ID
  - Team Name
  - Manager (currently none for all)
  - Member Count (currently 0 for all)
  - Active Assessment (currently none)
  - Status (Active)
- ✓ List remains responsive with 100 teams (SC-002) - *requires 100 teams for full test*
- ✓ Page loads in reasonable time (<3 seconds)

**Actual Results**: _______

---

### Test Case 2.2: Search by Name

**Steps**:
1. Enter "Sales" in search box
2. Observe filtered results

**Expected Results**:
- ✓ Only `sales-west` and `sales-east` teams displayed
- ✓ Search case-insensitive
- ✓ Results returned <1s (SC-007)

**Actual Results**: _______

---

### Test Case 2.3: Search by Team ID

**Steps**:
1. Enter "engineering" in search box
2. Observe filtered results

**Expected Results**:
- ✓ Only `engineering-platform` team displayed
- ✓ Partial match works

**Actual Results**: _______

---

### Test Case 2.4: Clear Search

**Steps**:
1. Clear search box
2. Observe results

**Expected Results**:
- ✓ All teams displayed again
- ✓ No teams hidden

**Actual Results**: _______

---

## Test Scenario 3: Assign Team Manager (User Story 3, P3)

**Goal**: Verify administrators can assign managers to teams

### Test Case 3.1: Assign Manager to Team

**Steps**:
1. Select `engineering-platform` team
2. Click "Assign Manager" or equivalent action
3. Select `manager1@example.com` from dropdown
4. Save changes

**Expected Results**:
- ✓ Success message: "Manager assigned successfully"
- ✓ Team list updates to show manager name
- ✓ Team details show:
  - Manager: `manager1@example.com` / "Manager One Name"
- ✓ Manager assignment takes effect within 1 minute (SC-004)

**Actual Results**: _______

---

### Test Case 3.2: Assign Manager to Multiple Teams

**Steps**:
1. Assign `manager2@example.com` to `sales-west`
2. Assign `manager2@example.com` to `sales-east`
3. Verify both assignments

**Expected Results**:
- ✓ Same manager assigned to both teams successfully
- ✓ No error messages
- ✓ Both teams show `manager2@example.com` as manager

**Actual Results**: _______

---

### Test Case 3.3: Replace Existing Manager

**Steps**:
1. For `engineering-platform` team (currently manager1)
2. Assign `manager2@example.com` as manager
3. Confirm replacement

**Expected Results**:
- ✓ Manager updated to `manager2@example.com`
- ✓ Previous manager (`manager1@example.com`) no longer shows

**Actual Results**: _______

---

### Test Case 3.4: Unassign Manager

**Steps**:
1. For `engineering-platform` team
2. Click "Remove Manager" or set manager to null
3. Save changes

**Expected Results**:
- ✓ Manager field cleared (shows "None")
- ✓ Team still exists and functions

**Actual Results**: _______

---

### Test Case 3.5: Assign User Without Manager Role

**Steps**:
1. Try to assign `user1@example.com` (regular user) as manager of `marketing` team
2. Attempt to save

**Expected Results**:
- ✗ Validation error: "User does not have the manager role"
- ✗ HTTP 400 Bad Request
- ✗ Manager assignment rejected

**Actual Results**: _______

---

### Test Case 3.6: Assign Deactivated Manager (SC-008)

**Steps**:
1. Try to assign `deactivated-manager@example.com` as manager
2. Attempt to save

**Expected Results**:
- ✗ Validation error: "User is deactivated and cannot be assigned as manager"
- ✗ HTTP 400 Bad Request
- ✗ Zero deactivated users assigned as managers (SC-008)

**Actual Results**: _______

---

## Test Scenario 4: Add Team Members (User Story 4, P4)

**Goal**: Verify administrators can add users to teams

### Test Case 4.1: Add Single Member

**Steps**:
1. Select `engineering-platform` team
2. Click "Add Members"
3. Select `user1@example.com`
4. Save changes

**Expected Results**:
- ✓ Success message: "Added 1 member to team"
- ✓ Member count updates to 1
- ✓ User's profile shows team: `engineering-platform`
- ✓ Update completes within 5 seconds (SC-005)

**Actual Results**: _______

---

### Test Case 4.2: Add Multiple Members

**Steps**:
1. Select `engineering-platform` team
2. Add members:
   - `user2@example.com`
   - `user3@example.com`
   - `manager1@example.com` (manager can also be member)
3. Save changes

**Expected Results**:
- ✓ Success message: "Added 3 members to team"
- ✓ Member count updates to 4 (total)
- ✓ All users' profiles show team: `engineering-platform`

**Actual Results**: _______

---

### Test Case 4.3: Add Already-Assigned Member (Idempotent)

**Steps**:
1. Try to add `user1@example.com` again to `engineering-platform`
2. Save changes

**Expected Results**:
- ✓ No error
- ✓ Member count remains 4
- ✓ Operation idempotent

**Actual Results**: _______

---

### Test Case 4.4: Move Member Between Teams

**Steps**:
1. Add `user1@example.com` to `marketing` team
2. Verify previous team assignment cleared

**Expected Results**:
- ✓ `user1@example.com` moved from `engineering-platform` to `marketing`
- ✓ `engineering-platform` member count decreases to 3
- ✓ `marketing` member count increases to 1
- ✓ User profile shows team: `marketing`
- ✓ Previous team automatically cleared (FR-011)

**Actual Results**: _______

---

### Test Case 4.5: Add >50 Members (Batch Limit)

**Steps**:
1. Try to add 51 users at once (if 51 test users available)
2. Attempt to save

**Expected Results**:
- ✗ Validation error: "Maximum 50 users per operation"
- ✗ HTTP 400 Bad Request

**Actual Results**: _______

---

## Test Scenario 5: Remove Team Members (User Story 5, P5)

**Goal**: Verify administrators can remove users from teams while preserving data

### Test Case 5.1: Remove Single Member

**Steps**:
1. Select `marketing` team (currently has `user1`)
2. Remove `user1@example.com`
3. Save changes

**Expected Results**:
- ✓ Success message: "Removed 1 member from team. Historical data preserved."
- ✓ Member count updates to 0
- ✓ User profile shows team: (none)
- ✓ Update completes within 5 seconds (SC-005)

**Actual Results**: _______

---

### Test Case 5.2: Remove Multiple Members

**Steps**:
1. Select `engineering-platform` team
2. Remove:
   - `user2@example.com`
   - `user3@example.com`
3. Save changes

**Expected Results**:
- ✓ Success message: "Removed 2 members from team"
- ✓ Member count updates accordingly
- ✓ Users' profiles show team: (none)

**Actual Results**: _______

---

### Test Case 5.3: Remove User Not in Team (Idempotent)

**Steps**:
1. Try to remove `user1@example.com` from `engineering-platform` (already removed)
2. Save changes

**Expected Results**:
- ✓ No error
- ✓ Member count unchanged
- ✓ Operation idempotent

**Actual Results**: _______

---

### Test Case 5.4: Historical Data Preservation (SC-006, FR-014)

**Prerequisites**:
- User `user1@example.com` previously had assessments in `marketing` team (Phase 4)

**Steps**:
1. Remove `user1@example.com` from `marketing` team
2. Query historical assessment reports for `user1`

**Expected Results**:
- ✓ All historical reports preserved (SC-006)
- ✓ Past team association still visible in reports
- ✓ 100% of historical data retained (SC-006)

**Actual Results**: _______ (Deferred to Phase 4)

---

### Test Case 5.5: Cannot Remove Team Manager (SC-009, FR-013)

**Steps**:
1. Assign `manager1@example.com` as manager of `engineering-platform`
2. Add `manager1@example.com` as member of `engineering-platform`
3. Try to remove `manager1@example.com` from members
4. Attempt to save

**Expected Results**:
- ✗ Validation error: "Cannot remove team manager. Please unassign manager role first."
- ✗ HTTP 400 Bad Request (code: MANAGER_IS_MEMBER)
- ✗ Zero managers successfully removed without unassignment (SC-009)
- ✗ Manager remains in team

**Actual Results**: _______

---

### Test Case 5.6: Remove Manager After Unassignment

**Steps**:
1. Unassign `manager1@example.com` from manager role
2. Remove `manager1@example.com` from members
3. Save changes

**Expected Results**:
- ✓ Removal successful (manager no longer assigned)
- ✓ Member count updates

**Actual Results**: _______

---

## Test Scenario 6: Team Archival (Soft Delete)

**Goal**: Verify teams can be archived while preserving historical data

### Test Case 6.1: Archive Team

**Steps**:
1. Select `marketing` team
2. Click "Archive Team"
3. Confirm action

**Expected Results**:
- ✓ Success message: "Team archived successfully"
- ✓ Team marked as inactive (isActive=false)
- ✓ Team hidden from default team list
- ✓ All historical data preserved

**Actual Results**: _______

---

### Test Case 6.2: View Archived Teams

**Steps**:
1. Enable "Show Archived Teams" filter
2. Observe team list

**Expected Results**:
- ✓ `marketing` team visible with "Archived" badge
- ✓ Other active teams still visible

**Actual Results**: _______

---

### Test Case 6.3: Unarchive Team

**Steps**:
1. Select archived `marketing` team
2. Click "Unarchive Team"
3. Confirm action

**Expected Results**:
- ✓ Success message: "Team unarchived successfully"
- ✓ Team marked as active (isActive=true)
- ✓ Team visible in default list again

**Actual Results**: _______

---

## Test Scenario 7: Error Handling & Edge Cases

**Goal**: Verify robust error handling for edge cases

### Test Case 7.1: Non-Admin Access (Authorization)

**Steps**:
1. Log out
2. Log in as `user1@example.com` (regular user, no admin role)
3. Try to access `/admin/teams`

**Expected Results**:
- ✗ Redirected to access denied page or 403 error
- ✗ "Admin access required" message
- ✗ No team management UI visible

**Actual Results**: _______

---

### Test Case 7.2: Unauthenticated Access

**Steps**:
1. Log out
2. Try to access `/admin/teams` without logging in

**Expected Results**:
- ✗ Redirected to login page
- ✗ HTTP 401 Unauthorized for API calls

**Actual Results**: _______

---

### Test Case 7.3: Network Error Handling

**Steps**:
1. Disconnect network (or simulate via DevTools)
2. Try to create a team

**Expected Results**:
- ✗ User-friendly error: "Network error. Please check your connection."
- ✗ No silent failures
- ✗ Retry option available

**Actual Results**: _______

---

### Test Case 7.4: Concurrent Edits (Optimistic Locking)

**Steps**:
1. Admin A opens team `engineering-platform`
2. Admin B opens same team
3. Admin A assigns manager1
4. Admin B assigns manager2 (before A's changes sync)
5. Both save

**Expected Results**:
- ⚠️ Last write wins OR conflict warning displayed
- ✓ Data consistency maintained
- ✓ No data corruption

**Actual Results**: _______

---

## Test Scenario 8: Performance Validation

**Goal**: Verify performance meets success criteria

### Test Case 8.1: Team Creation Speed (SC-001)

**Steps**:
1. Measure time from "Create Team" click to success message

**Expected Results**:
- ✓ Team creation <20 seconds (SC-001)

**Actual Results**: _______ seconds

---

### Test Case 8.2: Large Team List (SC-002)

**Prerequisites**: 100 teams in database

**Steps**:
1. Load team management page with 100 teams
2. Scroll through list
3. Interact with UI (search, filters)

**Expected Results**:
- ✓ Page loads without lag
- ✓ Scrolling smooth (60fps)
- ✓ UI remains responsive (SC-002)

**Actual Results**: _______

---

### Test Case 8.3: Search Performance (SC-007)

**Prerequisites**: 100 teams in database

**Steps**:
1. Enter search query
2. Measure time to results display

**Expected Results**:
- ✓ Results returned <1s for 95% of queries (SC-007)
- ✓ No UI freezing

**Actual Results**: _______ seconds

---

### Test Case 8.4: Member Count Update Speed (SC-005)

**Steps**:
1. Add members to a team
2. Measure time until member count updates in UI

**Expected Results**:
- ✓ Member count updates within 5 seconds (SC-005)
- ✓ Optimistic UI update immediate
- ✓ Server sync within 5 seconds

**Actual Results**: _______ seconds

---

### Test Case 8.5: Manager Assignment Effect (SC-004)

**Steps**:
1. Assign manager to team
2. Log in as assigned manager
3. Verify manager can access team features

**Expected Results**:
- ✓ Manager permissions active within 1 minute (SC-004)
- ✓ Manager can view managed team (Phase 4)

**Actual Results**: _______ seconds

---

## Test Scenario 9: Accessibility

**Goal**: Verify keyboard navigation and screen reader support

### Test Case 9.1: Keyboard Navigation

**Steps**:
1. Navigate entire team management page using Tab key only
2. Create team using keyboard (no mouse)

**Expected Results**:
- ✓ All interactive elements reachable via Tab
- ✓ Focus indicators visible
- ✓ Enter key submits forms
- ✓ Escape key closes dialogs

**Actual Results**: _______

---

### Test Case 9.2: Screen Reader

**Steps**:
1. Enable screen reader (VoiceOver/NVDA)
2. Navigate team management page

**Expected Results**:
- ✓ All elements have ARIA labels
- ✓ Form fields announced correctly
- ✓ Errors announced via aria-live
- ✓ Table structure readable

**Actual Results**: _______

---

## Summary Checklist

### User Stories Validated

- [ ] **US1**: Create New Team (P1) - Test Cases 1.1-1.4
- [ ] **US2**: View All Teams (P2) - Test Cases 2.1-2.4
- [ ] **US3**: Assign Team Manager (P3) - Test Cases 3.1-3.6
- [ ] **US4**: Add Team Members (P4) - Test Cases 4.1-4.5
- [ ] **US5**: Remove Team Members (P5) - Test Cases 5.1-5.6

### Success Criteria Validated

- [ ] **SC-001**: Team creation <20 seconds
- [ ] **SC-002**: Responsive with 100 teams
- [ ] **SC-003**: Team ID validation 100% (duplicate prevention)
- [ ] **SC-004**: Manager permissions within 1 minute
- [ ] **SC-005**: Member count updates <5 seconds
- [ ] **SC-006**: 100% historical data preserved
- [ ] **SC-007**: Search <1s for 95% of queries
- [ ] **SC-008**: Zero deactivated managers assigned
- [ ] **SC-009**: Zero managers removed without unassignment

### Edge Cases Validated

- [ ] Duplicate team IDs rejected (409)
- [ ] Manager assigned to multiple teams (allowed)
- [ ] User moved between teams (automatic)
- [ ] Manager removal blocked (400)
- [ ] Deactivated manager assignment blocked (400)
- [ ] Archived teams hidden by default
- [ ] Historical data preserved on archival

### Issues Found

| Test Case | Issue Description | Severity | Status |
|-----------|------------------|----------|--------|
| ___ | ___ | ___ | ___ |

---

## Notes for Testers

1. **Test Data Cleanup**: After testing, you may want to delete test teams to reset the environment
2. **Phase 4 Dependencies**: Some test cases (historical data, active assessments) require Phase 4 implementation
3. **Performance Tests**: Require data generation scripts to create 100 teams
4. **Browser Compatibility**: Test in Chrome, Firefox, Safari, Edge
5. **Mobile Testing**: Verify responsive design on mobile devices

## Next Steps After Testing

1. Document all issues found in issue tracker
2. Verify all SC (Success Criteria) met
3. Obtain stakeholder approval for deployment
4. Deploy to production environment
5. Monitor CloudWatch logs for errors
6. Proceed to Phase 4 (Assessment Plan Management)
