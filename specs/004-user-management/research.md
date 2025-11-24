# Research: Administrator User Management

**Feature**: 004-user-management | **Date**: 2025-11-20
**Purpose**: Resolve technical unknowns and establish best practices before design phase

## Research Questions Resolved

### 1. DynamoDB User Table Schema

**Question**: What is the exact structure of the Users table defined in spec 003-backend-data-model?

**Decision**: Users table schema (from spec 003):
- **Partition Key**: `userId` (String) - email address
- **Attributes**:
  - `name` (String) - user's full name
  - `roles` (String Array) - e.g., ["manager"], ["admin"], ["manager", "admin"], or empty array
  - `team` (String) - team ID (e.g., "engineering", "marketing")
  - `isActive` (Boolean) - activation status for soft delete
  - `createdAt` (Number) - Unix milliseconds timestamp
  - `updatedAt` (Number) - Unix milliseconds timestamp
  - `createdBy` (String) - userId of creator

**Rationale**: Aligns with existing data model. Email addresses are immutable (spec 003 FR-017). Users without elevated roles default to standard user access (empty roles array).

**Alternatives Considered**: Adding a separate "status" enum field was rejected because `isActive` boolean is simpler and sufficient for soft delete pattern.

---

### 2. Fastify Route Structure and Admin Authorization

**Question**: How to integrate admin-only routes into existing Fastify application with proper authorization middleware?

**Decision**: Extend existing Fastify auth middleware to check for "admin" role:
```typescript
// apps/api/src/middleware/auth.ts (EXTEND)
export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await authenticateRequest(request, reply); // Existing Cognito JWT validation
  const user = request.user; // Set by authenticateRequest
  if (!user.roles.includes('admin')) {
    return reply.code(403).send({ error: 'Admin access required' });
  }
}

// apps/api/src/app.ts (ADD routes)
app.register(async (fastify) => {
  fastify.addHook('preHandler', requireAdmin);
  fastify.get('/admin/users', listUsersHandler);
  fastify.post('/admin/users', createUserHandler);
  fastify.patch('/admin/users/:userId', updateUserHandler);
  fastify.delete('/admin/users/:userId', deactivateUserHandler);
}, { prefix: '/api' });
```

**Rationale**: Reuses existing JWT authentication. Groups admin routes under `/api/admin/*` prefix with shared `preHandler` hook for DRY principle. Returns HTTP 403 (not 404) per constitution security requirements.

**Alternatives Considered**:
- Decorator-based authorization (@RequireAdmin) rejected - adds complexity without benefit for single role check
- Route-level middleware rejected - shared preHandler hook is cleaner for multiple admin routes

---

### 3. React Query Patterns for User Management

**Question**: What are the best practices for React Query mutations with optimistic updates for user CRUD operations?

**Decision**: Use React Query's `useMutation` with optimistic updates and rollback:
```typescript
// apps/web/src/hooks/useUsers.ts
export function useUpdateUserRoles(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roles: string[]) => updateUserRoles(userId, roles),
    onMutate: async (newRoles) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['users'] });

      // Snapshot previous value
      const previousUsers = queryClient.getQueryData(['users']);

      // Optimistically update
      queryClient.setQueryData(['users'], (old: User[]) =>
        old.map(u => u.userId === userId ? { ...u, roles: newRoles } : u)
      );

      return { previousUsers };
    },
    onError: (err, newRoles, context) => {
      // Rollback on error
      queryClient.setQueryData(['users'], context.previousUsers);
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
```

**Rationale**: Optimistic updates provide instant feedback (SC-001: <30s user creation). Rollback ensures UI consistency on errors. Cache invalidation ensures fresh data after mutations.

**Alternatives Considered**:
- No optimistic updates rejected - slower perceived performance
- Manual state management (useState) rejected - React Query provides better caching, loading states, and error handling

---

### 4. Email Validation Strategy

**Question**: Should email validation be client-side only, server-side only, or both?

**Decision**: Implement validation at both layers:
- **Client-side**: HTML5 email input type + regex validation for instant feedback
- **Server-side**: AWS SDK DynamoDB conditional write + email format validation

```typescript
// Frontend validation (apps/web/src/components/admin/UserForm.tsx)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
<input type="email" pattern={EMAIL_REGEX.source} required />

// Backend validation (apps/api/src/services/user-service.ts)
function validateEmail(email: string): boolean {
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return EMAIL_REGEX.test(email);
}

// DynamoDB duplicate check using conditional write
await dynamoDb.putItem({
  TableName: 'Users',
  Item: { userId: email, ... },
  ConditionExpression: 'attribute_not_exists(userId)', // Prevents duplicates
});
```

**Rationale**: Client-side validation prevents unnecessary API calls and provides instant feedback (SC-003: 100% invalid format prevention). Server-side validation enforces business rules even if client bypassed (security requirement). DynamoDB conditional write atomically prevents race conditions.

**Alternatives Considered**:
- Client-side only rejected - can be bypassed via API calls
- Server-side only rejected - poor UX (no instant feedback)

---

### 5. Deactivation vs. Deletion Strategy

**Question**: How to implement soft delete while preventing login and preserving historical data?

**Decision**: Use `isActive: false` flag with multi-layer enforcement:
1. **DynamoDB**: Set `isActive: false` (no actual deletion)
2. **Cognito**: Disable user in Cognito User Pool via `adminDisableUser` API
3. **Frontend**: Filter out inactive users in admin UI (show separately)
4. **Authorization**: Auth middleware checks `isActive` flag from Users table

```typescript
// apps/api/src/services/user-service.ts
export async function deactivateUser(userId: string, adminUserId: string) {
  // Check if user is team manager
  const teams = await getTeamsByManagerId(userId);
  if (teams.length > 0) {
    throw new Error('Cannot deactivate team manager. Reassign teams first.');
  }

  // Update DynamoDB
  await dynamoDb.updateItem({
    TableName: 'Users',
    Key: { userId },
    UpdateExpression: 'SET isActive = :false, updatedAt = :now, updatedBy = :admin',
    ConditionExpression: 'userId <> :admin', // Prevent self-deactivation
    ExpressionAttributeValues: {
      ':false': false,
      ':now': Date.now(),
      ':admin': adminUserId,
    },
  });

  // Disable in Cognito
  await cognitoClient.send(new AdminDisableUserCommand({
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Username: userId,
  }));
}
```

**Rationale**: Soft delete preserves historical assessment data (FR-014, SC-005). Cognito disable prevents authentication (FR-013, SC-004). DynamoDB condition prevents self-deactivation (FR-015, SC-008). Team manager check ensures assessment integrity (FR-016, SC-009).

**Alternatives Considered**:
- Hard delete rejected - violates FR-014 (preserve historical data)
- DynamoDB-only flag rejected - doesn't prevent Cognito authentication
- Cognito-only disable rejected - no audit trail of deactivation in DynamoDB

---

### 6. User List Pagination Strategy

**Question**: How to efficiently paginate 1000 users while supporting search/filter?

**Decision**: Use server-side pagination with DynamoDB `Scan` + `LastEvaluatedKey`:
```typescript
// Backend pagination (apps/api/src/handlers/users.ts)
export async function listUsers(request: FastifyRequest<{
  Querystring: { limit?: number; nextToken?: string; search?: string };
}>) {
  const { limit = 100, nextToken, search } = request.query;

  const params: ScanCommandInput = {
    TableName: 'Users',
    Limit: limit,
    ExclusiveStartKey: nextToken ? JSON.parse(nextToken) : undefined,
  };

  if (search) {
    params.FilterExpression = 'contains(#name, :search) OR contains(userId, :search)';
    params.ExpressionAttributeNames = { '#name': 'name' };
    params.ExpressionAttributeValues = { ':search': search };
  }

  const result = await dynamoDb.scan(params);

  return {
    users: result.Items,
    nextToken: result.LastEvaluatedKey ? JSON.stringify(result.LastEvaluatedKey) : null,
  };
}

// Frontend infinite scroll (apps/web/src/hooks/useUsers.ts)
export function useUsers(search: string) {
  return useInfiniteQuery({
    queryKey: ['users', search],
    queryFn: ({ pageParam }) => fetchUsers({ search, nextToken: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextToken,
    staleTime: 60000, // 1 minute cache per constitution
  });
}
```

**Rationale**: Server-side pagination keeps response sizes manageable. DynamoDB `Scan` with `FilterExpression` supports search (SC-006: <1s for 95% of queries). React Query's `useInfiniteQuery` provides built-in infinite scroll. 100-item limit balances performance and UX.

**Alternatives Considered**:
- Client-side pagination (fetch all users) rejected - violates SC-002 (1000 users responsive)
- Offset-based pagination rejected - DynamoDB doesn't support offset, only LastEvaluatedKey
- Global Secondary Index for search rejected - overkill for Phase 2, `FilterExpression` sufficient for 1000 users

---

## Best Practices Summary

### Frontend Development
1. **Component Structure**: Separate concerns - `UserTable` (display), `UserForm` (create/edit), `UserRoleBadge` (UI)
2. **State Management**: React Query for server state, local useState only for form inputs
3. **Validation**: HTML5 validation + regex for instant feedback
4. **Authorization**: Wrap `/admin/*` routes with `<RequireRole role="admin">` component
5. **Error Handling**: Display user-friendly messages from API error responses

### Backend Development
1. **Authorization**: Use Fastify preHandler hook for route-level admin checks
2. **DynamoDB Patterns**: Conditional writes for atomicity, soft deletes via `isActive` flag
3. **Error Responses**: Return HTTP 403 for unauthorized, 400 for validation, 409 for conflicts
4. **Logging**: Log userId only (no PII like email/name) per constitution security requirements
5. **Connection Reuse**: Initialize DynamoDB client outside Lambda handler for connection reuse

### Testing
1. **Unit Tests**: Test user service business logic (validation, deactivation rules)
2. **Integration Tests**: Test full API flows with admin authorization checks
3. **Component Tests**: Test user form validation and error states
4. **Required Scenarios** (per constitution):
   - Admin authorization (403 for non-admin)
   - Self-deactivation prevention (400 error)
   - Team manager deactivation check (400 if teams assigned)
   - Email duplicate detection (409 conflict)

## Dependencies
- **New Dependencies**: None (all dependencies already in project)
- **Environment Variables**: Existing Cognito variables (no new vars required)
- **AWS Permissions**: Lambda execution role needs `cognito-idp:AdminDisableUser` permission (NEW)

## Open Questions for Implementation Phase
None - all research questions resolved.
