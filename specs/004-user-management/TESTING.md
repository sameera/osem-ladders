# User Management Feature - Testing Guide

## Implementation Status: ✅ COMPLETE

All 7 phases of implementation have been completed (63/70 tasks). The remaining 7 tasks require manual testing, infrastructure configuration, or validation that cannot be automated during implementation.

## Completed Implementation (63 tasks)

### Phase 1: Setup ✅
- Type definitions copied to apps/api and apps/web
- DynamoDB Users table configuration verified

### Phase 2: Foundational ✅
- Auth middleware with `requireAdmin()` function
- Complete user-service.ts with CRUD operations
- Admin handlers for 5 endpoints
- API routes registered with admin protection
- Frontend API client and React Query hooks
- AdminRoute component and page

### Phase 3: User Story 1 (Add New User) ✅
- UserForm component with validation
- UserRoleBadge component
- Full integration with toast notifications
- Integration tests for authorization

### Phase 4: User Story 2 (View All Users) ✅
- Responsive UserTable (desktop/mobile)
- Search with 300ms debounce
- Status filter dropdown
- Infinite scroll pagination
- Visual styling for inactive users

### Phase 5: User Story 3 (Update User Role) ✅
- RoleEditor dialog component
- Edit Roles button in UserTable
- Confirmation dialog for removing all roles
- Comprehensive error handling

### Phase 6: User Story 4 (Deactivate User) ✅
- Deactivate button (desktop and mobile)
- Confirmation dialog with warning
- Error handling for self-deactivation, team manager violations
- Success toast notifications
- Integration tests for deactivation rules

### Phase 7: Polish & Cross-Cutting Concerns ✅
- Responsive design for mobile viewports
- Loading states for all mutations
- ErrorBoundary component for graceful error handling
- Keyboard accessibility (Tab, Enter)
- ARIA labels and semantic HTML
- PII logging audit (passed - no PII logged)

## Remaining Manual Tasks (7 tasks)

### T059: Cognito Authentication Test
**Type**: Manual Test
**Status**: Pending

**Test Steps**:
1. Create a test user via the admin interface
2. Deactivate the user
3. Attempt to log in as the deactivated user
4. **Expected**: Login should fail with appropriate error message
5. **Verify**: User is disabled in AWS Cognito console

### T065: Email Validation Test
**Type**: Manual Test
**Status**: Pending
**Success Criteria**: SC-003 - Email validation prevents 100% of invalid formats

**Test Cases**:
```
Valid emails:
✓ user@example.com
✓ first.last@company.co.uk
✓ user+tag@domain.com
✓ 123@domain.com

Invalid emails (should be rejected):
✗ invalid-email
✗ @domain.com
✗ user@
✗ user @domain.com (space)
✗ user@domain (no TLD)
✗ user@@domain.com (double @)
```

**How to Test**:
1. Open User Management page
2. Try creating users with each test case
3. Verify invalid emails show error message
4. Verify valid emails are accepted

### T066: Performance Test - 1000 Users
**Type**: Manual Test
**Status**: Pending
**Success Criteria**: SC-002 - User list remains responsive with 1000 users

**Test Steps**:
1. Create test script to generate 1000 users in DynamoDB
2. Load User Management page
3. Measure initial load time
4. Scroll through the list
5. Test pagination/infinite scroll
6. **Expected**: UI remains responsive, no lag or freezing

**Performance Benchmarks**:
- Initial page load: < 3 seconds
- Scroll performance: 60fps
- Load more button response: < 1 second

### T067: Search Performance Test
**Type**: Manual Test
**Status**: Pending
**Success Criteria**: SC-006 - Search returns results <1s for 95% of queries

**Test Steps**:
1. With 1000 users in database
2. Perform various search queries:
   - Single character (e.g., "a")
   - Partial email (e.g., "john")
   - Partial name (e.g., "smith")
   - Full email
3. Measure response time for each query
4. **Expected**: 95% of queries return results within 1 second

**Metrics to Collect**:
- Average query time
- 95th percentile query time
- Slowest query time

### T069: Infrastructure - IAM Permissions
**Type**: Infrastructure Task
**Status**: Pending

**Action Required**:
Add the following IAM policy to the Lambda execution role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:AdminDisableUser"
      ],
      "Resource": "arn:aws:cognito-idp:REGION:ACCOUNT_ID:userpool/USER_POOL_ID"
    }
  ]
}
```

**Why Needed**:
The `deactivateUser` function in user-service.ts calls `AdminDisableUser` to disable users in Cognito. Without this permission, user deactivation will update DynamoDB but fail to disable the Cognito user.

**How to Apply**:
1. Navigate to AWS IAM Console
2. Find the Lambda execution role for your API
3. Add the above policy (replace REGION, ACCOUNT_ID, USER_POOL_ID)
4. Verify permission is attached

### T070: Quickstart Validation
**Type**: Manual Test
**Status**: Pending

**Action Required**:
Run through all test scenarios in `quickstart.md` to verify end-to-end functionality.

**Test Scenarios**:
1. **Add New User**
   - Create user with no roles
   - Create user with manager role
   - Create user with admin role
   - Attempt duplicate email (should fail with 409)
   - Attempt invalid email (should fail with validation error)

2. **View All Users**
   - Verify all users displayed
   - Test search by name
   - Test search by email
   - Test status filter (active/inactive/all)
   - Test infinite scroll pagination

3. **Update User Role**
   - Add role to user
   - Remove role from user
   - Remove all roles (confirm warning dialog)
   - Verify changes persist after refresh

4. **Deactivate User**
   - Attempt to deactivate own account (should fail)
   - Attempt to deactivate team manager (should fail if user manages teams)
   - Successfully deactivate regular user
   - Verify user marked inactive in list
   - Verify deactivated user cannot log in (T059)

5. **Error Handling**
   - Test all error scenarios from each user story
   - Verify appropriate error messages displayed
   - Verify error boundary catches unexpected errors

6. **Accessibility**
   - Navigate entire interface with keyboard only
   - Test with screen reader (VoiceOver/NVDA)
   - Verify all interactive elements are accessible
   - Check color contrast meets WCAG standards

## Success Metrics

Once all manual tasks are complete, the feature should meet these criteria:

1. ✅ All 4 user stories fully functional
2. ⏳ Email validation prevents 100% of invalid formats (T065)
3. ⏳ Responsive with 1000+ users (T066)
4. ⏳ Search performs <1s for 95% of queries (T067)
5. ✅ No PII logged to CloudWatch (T068)
6. ⏳ Deactivated users cannot authenticate (T059)
7. ⏳ IAM permissions configured (T069)
8. ⏳ All quickstart scenarios pass (T070)

## Next Steps

1. **Deploy to Development Environment**
   - Apply infrastructure changes (T069)
   - Deploy API and web applications
   - Verify environment connectivity

2. **Run Manual Tests**
   - Execute T059, T065, T066, T067, T070
   - Document any issues or failures
   - Fix bugs and retest

3. **Performance Testing**
   - Load test with realistic data volumes
   - Optimize if performance targets not met
   - Monitor CloudWatch metrics

4. **Security Review**
   - Verify admin authorization on all endpoints
   - Test rate limiting (if configured)
   - Review CloudWatch logs for sensitive data

5. **User Acceptance Testing**
   - Have stakeholders review the interface
   - Gather feedback on UX
   - Make final adjustments

## Known Limitations

- **T059**: Requires deployed environment with Cognito to test
- **T065-T067**: Require production-like data volumes
- **T069**: Requires AWS infrastructure access
- **T070**: Depends on quickstart.md being created/updated

## Contact

For questions or issues during testing, refer to:
- Technical specification: `specs/004-user-management/plan.md`
- Task breakdown: `specs/004-user-management/tasks.md`
- Implementation details: Git commit history for branch `004-user-management`
