# Quick Start: Administrator User Management

**Feature**: 004-user-management | **Date**: 2025-11-20
**Purpose**: Get started implementing the user management feature

## Prerequisites

Before starting implementation, ensure you have:

1. **Development Environment**:
   - Node.js 18+ installed
   - pnpm package manager installed
   - Nx CLI installed (globally or via pnpm)
   - Git configured

2. **Project Setup**:
   - Repository cloned: `git clone <repo-url>`
   - Dependencies installed: `pnpm install`
   - Branch checked out: `git checkout 004-user-management`

3. **AWS Resources** (from previous specs):
   - DynamoDB Users table created and deployed (spec 003-backend-data-model)
   - AWS Cognito User Pool configured (spec 002-cognito-signup-lambda)
   - Lambda execution role with required permissions

4. **Environment Variables**:
   ```bash
   # apps/api/.env
   COGNITO_USER_POOL_ID=<your-pool-id>
   COGNITO_REGION=<your-region>
   DYNAMODB_USERS_TABLE=Users

   # apps/web/.env
   VITE_API_BASE_URL=http://localhost:3000/api
   VITE_COGNITO_USER_POOL_ID=<your-pool-id>
   VITE_COGNITO_USER_POOL_CLIENT_ID=<your-client-id>
   VITE_COGNITO_DOMAIN=<your-cognito-domain>
   VITE_COGNITO_REGION=<your-region>
   ```

## Implementation Order

Follow this sequence to implement the feature efficiently:

### Phase 1: Backend API (Priority: High)
Build the API foundation first to enable frontend development.

1. **Step 1.1: Extend Auth Middleware** (15 min)
   ```bash
   # Edit: apps/api/src/middleware/auth.ts
   ```
   - Add `requireAdmin()` function to check for "admin" role
   - Test: Non-admin users get HTTP 403

2. **Step 1.2: Create User Service** (45 min)
   ```bash
   # Create: apps/api/src/services/user-service.ts
   ```
   - Implement `listUsers(query)` with pagination
   - Implement `getUserById(userId)`
   - Implement `createUser(data)` with validation
   - Implement `updateUserRoles(userId, roles)`
   - Implement `deactivateUser(userId, adminUserId)`
   - Test: Unit tests for all service methods

3. **Step 1.3: Create User Handlers** (30 min)
   ```bash
   # Create: apps/api/src/handlers/users.ts
   ```
   - Wire up Fastify routes to service methods
   - Add error handling and response formatting
   - Test: Integration tests for all endpoints

4. **Step 1.4: Register Routes** (10 min)
   ```bash
   # Edit: apps/api/src/app.ts
   ```
   - Register `/api/admin/users/*` routes with `requireAdmin` preHandler
   - Test: Swagger/OpenAPI docs reflect new endpoints

**Checkpoint**: Backend API complete, ready for frontend integration

---

### Phase 2: Frontend Components (Priority: High)
Build React components using the completed API.

5. **Step 2.1: Create User API Client** (20 min)
   ```bash
   # Create: apps/web/src/services/user-api.ts
   ```
   - Implement `fetchUsers(query)` with pagination
   - Implement `createUser(data)`
   - Implement `updateUserRoles(userId, roles)`
   - Implement `deactivateUser(userId)`
   - Use existing auth token from AuthContext

6. **Step 2.2: Create React Query Hooks** (30 min)
   ```bash
   # Create: apps/web/src/hooks/useUsers.ts
   ```
   - `useUsers(query)` - List users with infinite query
   - `useUser(userId)` - Get single user
   - `useCreateUser()` - Mutation for creating users
   - `useUpdateUserRoles(userId)` - Mutation for role updates
   - `useDeactivateUser(userId)` - Mutation for deactivation

7. **Step 2.3: Create UI Components** (2 hours)
   ```bash
   # Create: apps/web/src/components/admin/UserManagement.tsx
   # Create: apps/web/src/components/admin/UserTable.tsx
   # Create: apps/web/src/components/admin/UserForm.tsx
   # Create: apps/web/src/components/admin/UserRoleBadge.tsx
   ```
   - `UserManagement`: Main container component
   - `UserTable`: Table with search, filter, sort
   - `UserForm`: Create/edit user form with validation
   - `UserRoleBadge`: Visual badge for roles (manager, admin)

8. **Step 2.4: Create Admin Page** (20 min)
   ```bash
   # Create: apps/web/src/pages/AdminUsersPage.tsx
   # Edit: apps/web/src/App.tsx
   ```
   - Add `/admin/users` route to React Router
   - Wrap with `<RequireRole role="admin">` component
   - Test: Non-admin users redirected

**Checkpoint**: Frontend UI complete, end-to-end flow working

---

### Phase 3: Testing & Polish (Priority: Medium)
Ensure quality and handle edge cases.

9. **Step 3.1: Write Integration Tests** (1 hour)
   ```bash
   # Create: apps/api/tests/integration/users.test.ts
   ```
   - Test admin authorization (403 for non-admin)
   - Test self-deactivation prevention (400 error)
   - Test team manager deactivation check
   - Test email duplicate detection (409 error)

10. **Step 3.2: Write Component Tests** (45 min)
    ```bash
    # Create: apps/web/tests/components/admin/UserManagement.test.tsx
    ```
    - Test form validation (invalid email, empty name)
    - Test optimistic updates and rollback
    - Test search and filter functionality

11. **Step 3.3: Manual Testing** (30 min)
    - Test full CRUD flow in browser
    - Test edge cases (concurrent edits, network errors)
    - Verify responsive design on mobile

12. **Step 3.4: Error Handling & UX Polish** (30 min)
    - Add toast notifications for success/error
    - Add loading states for all mutations
    - Add confirmation dialogs for deactivation
    - Add empty states for no users found

**Checkpoint**: Feature complete, tested, and polished

---

## Development Commands

### Backend Development
```bash
# Start API server in watch mode
cd apps/api
pnpm dev

# Run API tests
pnpm test

# Build API for deployment
pnpm build

# Lint API code
pnpm lint
```

### Frontend Development
```bash
# Start web app dev server
cd apps/web
pnpm dev

# Run web tests
pnpm test

# Build web app for production
pnpm build

# Lint web code
pnpm lint
```

### Monorepo Commands (from root)
```bash
# Start both API and web in parallel
pnpm dev

# Run all tests
pnpm test

# Build all apps
pnpm build

# Lint all code
pnpm lint

# View dependency graph
nx graph
```

## Testing the Feature

### 1. Create an Admin User (One-Time Setup)
```bash
# Manually add admin role to your user in DynamoDB
# (or use AWS Console to update User record)
aws dynamodb update-item \
  --table-name Users \
  --key '{"userId": {"S": "your-email@example.com"}}' \
  --update-expression "SET roles = :roles" \
  --expression-attribute-values '{":roles": {"L": [{"S": "admin"}]}}'
```

### 2. Test User Creation
1. Navigate to `http://localhost:8080/admin/users`
2. Click "Add User" button
3. Fill in email and name
4. Optionally select roles (manager, admin, or none)
5. Click "Create" button
6. Verify user appears in table

### 3. Test Role Updates
1. Find a user in the table
2. Click "Edit Roles" button
3. Add or remove manager/admin roles
4. Click "Save" button
5. Verify roles update immediately (optimistic update)

### 4. Test Deactivation
1. Find a user in the table
2. Click "Deactivate" button
3. Confirm in dialog
4. Verify user moves to "Inactive" section
5. Try logging in as that user → should fail

### 5. Test Edge Cases
- Try creating user with duplicate email → 409 error
- Try deactivating yourself → 400 error with message
- Try deactivating team manager → 400 error with message
- Try accessing page as non-admin → Redirect to home

## Debugging Tips

### Backend Issues

**Problem**: 403 Forbidden even though user is admin
- **Check**: User record in DynamoDB has `roles: ["admin"]`
- **Check**: Cognito JWT token includes admin role in claims
- **Check**: `requireAdmin()` middleware is correctly reading token claims

**Problem**: Deactivation not preventing login
- **Check**: Cognito user is disabled via `AdminDisableUserCommand`
- **Check**: Auth middleware checks `isActive` flag from DynamoDB
- **Check**: Cache invalidation after deactivation

**Problem**: Email duplicate not detected
- **Check**: DynamoDB conditional write uses `attribute_not_exists(userId)`
- **Check**: Using `ConsistentRead: true` for GetItem
- **Check**: Error handling converts DynamoDB `ConditionalCheckFailedException` to 409

### Frontend Issues

**Problem**: Infinite scroll not working
- **Check**: `nextToken` from API is being passed to next page
- **Check**: `getNextPageParam` returns correct token
- **Check**: React Query `useInfiniteQuery` configured correctly

**Problem**: Optimistic update not rolling back on error
- **Check**: `onError` callback restores previous data
- **Check**: `onSettled` invalidates query cache
- **Check**: Error response format matches `ApiError` interface

**Problem**: Role badges not displaying correctly
- **Check**: `roles` array is not undefined (should be empty array)
- **Check**: Badge component handles empty array case
- **Check**: CSS classes applied correctly

## Performance Optimization Tips

1. **Pagination**: Use `limit: 100` for initial load, increase if needed
2. **Cache**: React Query cache TTL set to 1 minute per constitution
3. **Debounce**: Add 300ms debounce to search input
4. **Virtual Scrolling**: Consider `react-virtual` for >500 users
5. **Lambda Memory**: Use 512MB minimum for faster DynamoDB queries

## Next Steps

After completing this feature:

1. **Deploy to Staging**:
   ```bash
   # Build and deploy via CI/CD pipeline
   pnpm build
   # Deploy Lambda functions and frontend assets
   ```

2. **Smoke Test in Staging**:
   - Verify admin page loads
   - Create test user
   - Verify email notifications work (future feature)

3. **Proceed to Feature 005**: Team Management
   - Depends on user management being complete
   - Reuses user list and role checks

## Common Pitfalls to Avoid

1. **Don't** use hard delete - always use `isActive: false` (soft delete)
2. **Don't** log PII (emails, names) in CloudWatch - use `userId` only
3. **Don't** allow self-deactivation - check `userId !== adminUserId`
4. **Don't** skip team manager check - query Teams table first
5. **Don't** use `Scan` without pagination - always use `Limit` + `LastEvaluatedKey`
6. **Don't** store user data in localStorage - use React Query cache
7. **Don't** skip client-side validation - provides instant feedback
8. **Don't** skip server-side validation - security requirement

## Documentation

- **API Contracts**: See `contracts/users.openapi.yaml`
- **Type Definitions**: See `contracts/users-types.ts`
- **Data Model**: See `data-model.md`
- **Research Decisions**: See `research.md`
- **Feature Spec**: See `spec.md`

## Support

If you encounter issues not covered in this guide:
1. Check constitution principles in `.specify/memory/constitution.md`
2. Review spec 003-backend-data-model for Users table schema
3. Consult CLAUDE.md for Nx monorepo patterns
4. Ask team for help in Slack #engineering-ladders channel

---

**Estimated Total Implementation Time**: 6-8 hours
- Backend: 2-3 hours
- Frontend: 3-4 hours
- Testing: 1-2 hours

Good luck! 🚀
