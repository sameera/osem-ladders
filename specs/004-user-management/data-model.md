# Data Model: Administrator User Management

**Feature**: 004-user-management | **Date**: 2025-11-20
**Purpose**: Define entities, relationships, validation rules, and state transitions

## Entity Definitions

### User (Existing - defined in spec 003-backend-data-model)

**Description**: Represents a person in the system with authentication credentials, role assignments, and team affiliation.

**Storage**: DynamoDB Users table

**Attributes**:
| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `userId` | String | Yes | User's email address (immutable) | Email format, unique, max 254 chars |
| `name` | String | Yes | User's full name | Min 1 char, max 255 chars |
| `roles` | String[] | Yes | Elevated roles (e.g., ["manager", "admin"]) | Each value must be "manager" or "admin", can be empty array |
| `team` | String | No | Team ID user belongs to | Must exist in Teams table if set, null for no team |
| `isActive` | Boolean | Yes | Activation status (soft delete flag) | true (active) or false (deactivated) |
| `createdAt` | Number | Yes | Unix milliseconds timestamp of creation | Positive integer |
| `updatedAt` | Number | Yes | Unix milliseconds timestamp of last update | Positive integer, >= createdAt |
| `createdBy` | String | Yes | userId of user who created this record | Must exist in Users table |

**Partition Key**: `userId` (String)
**Sort Key**: None
**Global Secondary Indexes**: None (for user management feature)

**Relationships**:
- **One-to-Many**: User → AssessmentReports (one user can have many reports)
- **Many-to-One**: User → Team (many users belong to one team)
- **One-to-Many**: User (as manager) → Team (one user can manage multiple teams)

---

## Validation Rules

### User Entity Validation

#### Email Format Validation
```typescript
function validateEmail(email: string): boolean {
  // RFC 5322 simplified pattern
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return EMAIL_REGEX.test(email) && email.length <= 254;
}
```

#### Role Validation
```typescript
const VALID_ROLES = ['manager', 'admin'] as const;

function validateRoles(roles: string[]): boolean {
  return roles.every(role => VALID_ROLES.includes(role));
}
```

#### Name Validation
```typescript
function validateName(name: string): boolean {
  return name.trim().length > 0 && name.length <= 255;
}
```

#### Deactivation Preconditions
```typescript
async function canDeactivateUser(userId: string, adminUserId: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  // Rule 1: Cannot deactivate self (FR-015)
  if (userId === adminUserId) {
    return { allowed: false, reason: 'Cannot deactivate your own account' };
  }

  // Rule 2: Cannot deactivate if user is team manager (FR-016)
  const managedTeams = await getTeamsByManagerId(userId);
  if (managedTeams.length > 0) {
    return {
      allowed: false,
      reason: `User is manager of ${managedTeams.length} team(s). Reassign teams before deactivating.`,
    };
  }

  return { allowed: true };
}
```

---

## State Transitions

### User Activation State Machine

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  [NEW USER]                                     │
│      │                                          │
│      │ Admin creates user                       │
│      │ (POST /admin/users)                      │
│      ▼                                          │
│  ┌────────────────┐                             │
│  │  Active        │ ◄──────────────────┐        │
│  │  (isActive =   │                    │        │
│  │   true)        │                    │        │
│  └────────────────┘                    │        │
│      │                                 │        │
│      │ Admin deactivates              │        │
│      │ (DELETE /admin/users/:id)      │        │
│      │ - Check: not self              │        │
│      │ - Check: not team manager      │        │
│      │                                │        │
│      ▼                                │        │
│  ┌────────────────┐                  │        │
│  │  Deactivated   │                  │        │
│  │  (isActive =   │                  │        │
│  │   false)       │                  │        │
│  └────────────────┘                  │        │
│      │                                │        │
│      │ [Future: Reactivation]        │        │
│      │ (Not in scope for this       │        │
│      │  feature - requires spec     │        │
│      │  amendment)                   │        │
│      └──────────────────────────────┘        │
│                                                 │
└─────────────────────────────────────────────────┘
```

**State Descriptions**:

1. **Active** (`isActive = true`):
   - User can authenticate via Cognito
   - User can access system based on their roles
   - User appears in standard user list queries
   - Transitions to: Deactivated (via admin action)

2. **Deactivated** (`isActive = false`):
   - User cannot authenticate (Cognito user disabled)
   - User's historical data is preserved (assessment reports remain)
   - User appears in "Inactive Users" filter in admin UI
   - No transitions defined in this spec (permanent state for Phase 2)

**Transition Guards**:
- **Active → Deactivated**: Requires admin role, user must not be self, user must not be team manager
- **Deactivated → Active**: Not supported in this feature (future enhancement)

---

## Role Management State

### Role Assignment State (no explicit FSM - set-based)

Users have a set of zero or more elevated roles: `[]`, `["manager"]`, `["admin"]`, or `["manager", "admin"]`.

**Role Addition Rules**:
- Admin can add "manager" or "admin" role to any user
- Users can have both roles simultaneously (dual-role scenario)
- Empty roles array = default user-level access (no special permissions)

**Role Removal Rules**:
- Admin can remove "manager" or "admin" role from any user
- Removing all roles leaves empty array (user keeps default access)
- No validation needed - users always have at least default access level

**Authorization Matrix**:

| Role Combination | Can Access User Management | Can Manage Teams | Can Create Assessments |
|------------------|---------------------------|------------------|------------------------|
| `[]` (default user) | No | No | No |
| `["manager"]` | No | Yes (own teams only) | Yes (for own teams) |
| `["admin"]` | Yes | Yes (all teams) | Yes (all teams) |
| `["manager", "admin"]` | Yes | Yes (all teams) | Yes (all teams) |

---

## DynamoDB Access Patterns

### Query Patterns for User Management Feature

1. **List All Users** (for admin user list page)
   - Operation: `Scan` on Users table
   - Filter: None (admin sees all users)
   - Sort: Client-side by name or createdAt
   - Pagination: `Limit` + `LastEvaluatedKey`

2. **Get User by Email** (for user details, duplicate check)
   - Operation: `GetItem`
   - Key: `{ userId: email }`
   - Consistent Read: Yes (for duplicate detection during creation)

3. **Create User** (add new user)
   - Operation: `PutItem`
   - Condition: `attribute_not_exists(userId)` (prevent duplicates)
   - Attributes: All required fields + audit fields

4. **Update User Roles** (change user permissions)
   - Operation: `UpdateItem`
   - Key: `{ userId: email }`
   - Update Expression: `SET roles = :roles, updatedAt = :now, updatedBy = :admin`

5. **Deactivate User** (soft delete)
   - Operation: `UpdateItem`
   - Key: `{ userId: email }`
   - Update Expression: `SET isActive = :false, updatedAt = :now, updatedBy = :admin`
   - Condition: `userId <> :adminUserId` (prevent self-deactivation)

6. **Search Users by Name/Email** (admin search feature)
   - Operation: `Scan` with `FilterExpression`
   - Filter: `contains(#name, :search) OR contains(userId, :search)`
   - Note: For 1000 users, FilterExpression is acceptable. For larger scale, consider GSI.

7. **Check if User is Team Manager** (pre-deactivation check)
   - Operation: Query Teams table (different table)
   - GSI: `managerId-index` on Teams table
   - Filter: `managerId = :userId AND isActive = :true`

---

## Data Consistency Rules

### Consistency Guarantees

1. **Email Uniqueness**: Enforced by DynamoDB conditional write (`attribute_not_exists(userId)`)
2. **Audit Trail**: `createdAt`, `updatedAt`, `createdBy` are immutable except `updatedAt` and `updatedBy` on updates
3. **Role Integrity**: Validated application-side before write (DynamoDB stores as string array)
4. **Team Reference**: Not enforced by DynamoDB (eventual consistency) - application validates team exists before assignment
5. **Manager Deactivation**: Application-level check before deactivation (query Teams table first)

### Eventual Consistency Considerations

- User list queries use `Scan` which reads from any replica (eventually consistent by default)
- For critical operations (duplicate email check), use `ConsistentRead: true` on `GetItem`
- Role changes may take up to 5 minutes to propagate to active user sessions (per SC-007)

---

## Error Scenarios

### Validation Errors (HTTP 400)

| Scenario | Error Code | Error Message |
|----------|------------|---------------|
| Invalid email format | `INVALID_EMAIL` | "Email address format is invalid" |
| Empty name | `INVALID_NAME` | "Name cannot be empty" |
| Invalid role value | `INVALID_ROLE` | "Role must be 'manager' or 'admin'" |
| User already exists | `USER_EXISTS` | "User with this email already exists" |

### Business Rule Violations (HTTP 400)

| Scenario | Error Code | Error Message |
|----------|------------|---------------|
| Self-deactivation attempt | `SELF_DEACTIVATION` | "Cannot deactivate your own account" |
| Deactivate team manager | `USER_IS_MANAGER` | "User is manager of N team(s). Reassign teams before deactivating." |
| Deactivate already inactive user | `ALREADY_INACTIVE` | "User is already deactivated" |

### Authorization Errors (HTTP 403)

| Scenario | Error Code | Error Message |
|----------|------------|---------------|
| Non-admin access attempt | `FORBIDDEN` | "Admin access required" |

---

## Schema Evolution Considerations

### Future Enhancements (Not in Scope for this Feature)

1. **Reactivation**: Add `reactivatedAt` timestamp and allow Active → Deactivated → Active transitions
2. **User Deletion**: Add `deletedAt` timestamp for hard delete after retention period
3. **Role History**: Add `roleHistory` array to track role changes over time
4. **Custom Roles**: Extend beyond "manager" and "admin" to custom organizational roles
5. **GSI for Search**: Add GSI on `name` field if user count exceeds 10,000 for faster search

### Backward Compatibility

- Adding new optional fields is safe (existing records can omit them)
- Changing `roles` from string array to object would require migration (NOT planned)
- Changing `userId` (email) is explicitly forbidden by spec 003-backend-data-model FR-017

---

## Type Definitions

### TypeScript Interfaces

```typescript
// apps/api/src/types/users.ts (EXISTING - reference only)
export interface User {
  userId: string; // Email address
  name: string;
  roles: ('manager' | 'admin')[]; // Empty array = default user
  team?: string; // Optional team ID
  isActive: boolean;
  createdAt: number; // Unix milliseconds
  updatedAt: number; // Unix milliseconds
  createdBy: string; // userId of creator
}

// apps/api/src/types/users.ts (NEW - for API request/response)
export interface CreateUserRequest {
  email: string;
  name: string;
  roles?: ('manager' | 'admin')[]; // Defaults to [] if omitted
  team?: string;
}

export interface UpdateUserRolesRequest {
  roles: ('manager' | 'admin')[];
}

export interface ListUsersResponse {
  users: User[];
  nextToken?: string; // For pagination
}

export interface DeactivateUserResponse {
  userId: string;
  deactivatedAt: number;
}
```

---

## Summary

This data model builds on the existing Users table schema defined in spec 003-backend-data-model. Key design decisions:

1. **Soft Delete**: `isActive` flag preserves historical data while preventing authentication
2. **Role Flexibility**: Empty array for default users, string array for elevated roles
3. **Validation Layers**: Client-side (instant feedback) + Server-side (security) + DynamoDB (atomicity)
4. **State Simplicity**: Two states (Active/Deactivated) with clear transition guards
5. **Eventual Consistency**: Acceptable for user lists, strong consistency for duplicate detection

No new tables or indexes required. All operations use existing DynamoDB Users table infrastructure.
