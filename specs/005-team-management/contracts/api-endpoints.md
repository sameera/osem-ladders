# Team Management API Endpoints

**Base Path**: `/growth/admin/teams`
**Authentication**: All endpoints require valid Cognito JWT token with "admin" role
**Authorization**: Admin-only (403 for non-admin users)

## Endpoints

### 1. Create Team (User Story 1)

Creates a new team with a unique team ID and name.

**Endpoint**: `POST /growth/admin/teams`

**Request Headers**:
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body**:
```typescript
{
  "teamId": "engineering-platform",   // Required, 2-50 chars, lowercase alphanumeric + hyphens
  "name": "Engineering - Platform"    // Required, 2-100 chars
}
```

**Success Response** (201 Created):
```typescript
{
  "success": true,
  "data": {
    "teamId": "engineering-platform",
    "name": "Engineering - Platform",
    "managerId": null,
    "isActive": true,
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "createdBy": "admin@example.com"
  }
}
```

**Error Responses**:
- **400 Bad Request** - Invalid team ID format or name length
  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_TEAM_ID",
      "message": "Team ID must be 2-50 characters, lowercase alphanumeric and hyphens only"
    }
  }
  ```

- **401 Unauthorized** - Missing or invalid JWT token
  ```json
  {
    "success": false,
    "error": {
      "code": "UNAUTHORIZED",
      "message": "Authentication required"
    }
  }
  ```

- **403 Forbidden** - User does not have admin role
  ```json
  {
    "success": false,
    "error": {
      "code": "FORBIDDEN",
      "message": "Admin access required"
    }
  }
  ```

- **409 Conflict** - Team ID already exists
  ```json
  {
    "success": false,
    "error": {
      "code": "TEAM_EXISTS",
      "message": "A team with ID 'engineering-platform' already exists"
    }
  }
  ```

**Test Scenarios**:
- ✓ Create team with valid teamId and name
- ✓ Duplicate teamId returns 409
- ✓ Invalid teamId format returns 400
- ✓ Name too short/long returns 400
- ✓ Non-admin user returns 403

---

### 2. List Teams (User Story 2)

Retrieves a list of all teams with their details.

**Endpoint**: `GET /growth/admin/teams`

**Request Headers**:
```
Authorization: Bearer <jwt-token>
```

**Query Parameters**:
- `search` (optional): Search by team ID or name (case-insensitive partial match)
- `includeArchived` (optional): Include archived teams (default: `false`)
- `managerId` (optional): Filter by manager user ID

**Example Request**:
```
GET /growth/admin/teams?search=engineering&includeArchived=false
```

**Success Response** (200 OK):
```typescript
{
  "success": true,
  "data": {
    "teams": [
      {
        "teamId": "engineering-platform",
        "name": "Engineering - Platform",
        "managerId": "alice@example.com",
        "managerName": "Alice Smith",        // Resolved from Users table
        "memberCount": 12,                   // Calculated from Users table
        "activeAssessment": null,            // Phase 4 implementation
        "isActive": true,
        "createdAt": 1700000000000,
        "updatedAt": 1700000100000,
        "createdBy": "admin@example.com"
      },
      {
        "teamId": "engineering-frontend",
        "name": "Engineering - Frontend",
        "managerId": null,
        "managerName": null,
        "memberCount": 8,
        "activeAssessment": null,
        "isActive": true,
        "createdAt": 1700001000000,
        "updatedAt": 1700001000000,
        "createdBy": "admin@example.com"
      }
    ],
    "total": 2
  }
}
```

**Error Responses**:
- **401 Unauthorized** - Missing or invalid JWT token
- **403 Forbidden** - User does not have admin role

**Performance**:
- Target: <1s for 95% of queries (SC-007)
- Responsive with up to 100 teams (SC-002)

---

### 3. Get Team Details

Retrieves detailed information about a specific team.

**Endpoint**: `GET /growth/admin/teams/:teamId`

**Request Headers**:
```
Authorization: Bearer <jwt-token>
```

**Path Parameters**:
- `teamId`: Team identifier (URL-encoded)

**Example Request**:
```
GET /growth/admin/teams/engineering-platform
```

**Success Response** (200 OK):
```typescript
{
  "success": true,
  "data": {
    "teamId": "engineering-platform",
    "name": "Engineering - Platform",
    "managerId": "alice@example.com",
    "managerName": "Alice Smith",
    "memberCount": 12,
    "members": [                          // Array of team members
      {
        "userId": "bob@example.com",
        "name": "Bob Johnson",
        "roles": ["user"],
        "isActive": true
      },
      {
        "userId": "charlie@example.com",
        "name": "Charlie Davis",
        "roles": ["user", "manager"],
        "isActive": true
      }
    ],
    "activeAssessment": null,
    "isActive": true,
    "createdAt": 1700000000000,
    "updatedAt": 1700000100000,
    "createdBy": "admin@example.com"
  }
}
```

**Error Responses**:
- **401 Unauthorized** - Missing or invalid JWT token
- **403 Forbidden** - User does not have admin role
- **404 Not Found** - Team does not exist
  ```json
  {
    "success": false,
    "error": {
      "code": "TEAM_NOT_FOUND",
      "message": "Team 'engineering-platform' not found"
    }
  }
  ```

---

### 4. Assign Team Manager (User Story 3)

Assigns or unassigns a user as the team manager.

**Endpoint**: `PATCH /growth/admin/teams/:teamId/manager`

**Request Headers**:
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Path Parameters**:
- `teamId`: Team identifier

**Request Body**:
```typescript
{
  "managerId": "alice@example.com"   // User ID (email) or null to unassign
}
```

**Success Response** (200 OK):
```typescript
{
  "success": true,
  "data": {
    "teamId": "engineering-platform",
    "name": "Engineering - Platform",
    "managerId": "alice@example.com",
    "managerName": "Alice Smith",
    "memberCount": 12,
    "activeAssessment": null,
    "isActive": true,
    "createdAt": 1700000000000,
    "updatedAt": 1700000100000,
    "createdBy": "admin@example.com"
  }
}
```

**Error Responses**:
- **400 Bad Request** - User does not have manager role
  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_MANAGER_ROLE",
      "message": "User 'bob@example.com' does not have the manager role"
    }
  }
  ```

- **400 Bad Request** - Manager user is deactivated (SC-008)
  ```json
  {
    "success": false,
    "error": {
      "code": "MANAGER_DEACTIVATED",
      "message": "User 'alice@example.com' is deactivated and cannot be assigned as manager"
    }
  }
  ```

- **401 Unauthorized** - Missing or invalid JWT token
- **403 Forbidden** - User does not have admin role
- **404 Not Found** - Team or manager user not found

**Test Scenarios**:
- ✓ Assign user with manager role as team manager
- ✓ Unassign manager (set to null)
- ✓ Replace existing manager with new manager
- ✓ Assign manager to multiple teams (same user)
- ✗ Assign user without manager role returns 400
- ✗ Assign deactivated user returns 400

---

### 5. Add Team Members (User Story 4)

Adds one or more users to a team.

**Endpoint**: `POST /growth/admin/teams/:teamId/members`

**Request Headers**:
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Path Parameters**:
- `teamId`: Team identifier

**Request Body**:
```typescript
{
  "userIds": [                 // 1-50 user IDs (emails)
    "bob@example.com",
    "charlie@example.com"
  ]
}
```

**Success Response** (200 OK):
```typescript
{
  "success": true,
  "data": {
    "teamId": "engineering-platform",
    "addedCount": 2,
    "movedCount": 1,           // Users moved from another team
    "memberCount": 14,         // Updated member count
    "message": "Added 2 members to team. 1 user moved from another team."
  }
}
```

**Error Responses**:
- **400 Bad Request** - Invalid request (empty array, >50 users, invalid emails)
  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_REQUEST",
      "message": "User IDs array must contain 1-50 valid email addresses"
    }
  }
  ```

- **401 Unauthorized** - Missing or invalid JWT token
- **403 Forbidden** - User does not have admin role
- **404 Not Found** - Team or one or more users not found
  ```json
  {
    "success": false,
    "error": {
      "code": "USER_NOT_FOUND",
      "message": "Users not found: invalid@example.com"
    }
  }
  ```

**Business Rules**:
- Users already in this team: Idempotent, no error
- Users in different team: Automatically moved (FR-011), previous team cleared
- Member count updated within 5 seconds (SC-005)

**Test Scenarios**:
- ✓ Add multiple users to team
- ✓ Add user already in team (idempotent)
- ✓ Move user from one team to another (automatic)
- ✗ Add >50 users returns 400
- ✗ Add non-existent user returns 404

---

### 6. Remove Team Members (User Story 5)

Removes one or more users from a team.

**Endpoint**: `DELETE /growth/admin/teams/:teamId/members`

**Request Headers**:
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Path Parameters**:
- `teamId`: Team identifier

**Request Body**:
```typescript
{
  "userIds": [                 // 1-50 user IDs (emails)
    "bob@example.com",
    "charlie@example.com"
  ]
}
```

**Success Response** (200 OK):
```typescript
{
  "success": true,
  "data": {
    "teamId": "engineering-platform",
    "removedCount": 2,
    "memberCount": 12,         // Updated member count
    "message": "Removed 2 members from team. Historical data preserved."
  }
}
```

**Error Responses**:
- **400 Bad Request** - Cannot remove team manager (SC-009, FR-013)
  ```json
  {
    "success": false,
    "error": {
      "code": "MANAGER_IS_MEMBER",
      "message": "Cannot remove team manager 'alice@example.com'. Please unassign manager role first."
    }
  }
  ```

- **400 Bad Request** - Invalid request (empty array, >50 users, invalid emails)
- **401 Unauthorized** - Missing or invalid JWT token
- **403 Forbidden** - User does not have admin role
- **404 Not Found** - Team or one or more users not found

**Business Rules**:
- Cannot remove team manager: Must unassign manager first (FR-013)
- Historical data preserved: All past assessments and reports remain (FR-014, SC-006)
- Users not in team: Idempotent, no error
- Member count updated within 5 seconds (SC-005)

**Test Scenarios**:
- ✓ Remove multiple users from team
- ✓ Remove user not in team (idempotent)
- ✓ Historical assessment data preserved after removal
- ✗ Remove team manager returns 400
- ✗ Remove non-existent user returns 404

---

### 7. Archive Team (Soft Delete)

Archives a team (sets isActive to false) or unarchives it.

**Endpoint**: `PATCH /growth/admin/teams/:teamId/archive`

**Request Headers**:
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Path Parameters**:
- `teamId`: Team identifier

**Request Body**:
```typescript
{
  "archive": true   // true to archive, false to unarchive
}
```

**Success Response** (200 OK):
```typescript
{
  "success": true,
  "data": {
    "teamId": "engineering-platform",
    "isActive": false,         // Archived
    "message": "Team archived successfully. Historical data preserved."
  }
}
```

**Error Responses**:
- **401 Unauthorized** - Missing or invalid JWT token
- **403 Forbidden** - User does not have admin role
- **404 Not Found** - Team not found

**Business Rules**:
- Archived teams hidden from default lists (unless includeArchived=true)
- All historical data preserved (constitution requirement)
- Archived teams cannot be used in new assessments (Phase 4)
- Can unarchive by setting archive=false

---

## Response Structure

All API responses follow a standardized structure:

**Success**:
```typescript
{
  "success": true,
  "data": { /* endpoint-specific data */ }
}
```

**Error**:
```typescript
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",      // Enum value from TeamErrorCode
    "message": "Human-readable error message"
  }
}
```

## Authentication & Authorization

**Authentication**:
- All endpoints require `Authorization: Bearer <jwt-token>` header
- JWT token issued by AWS Cognito
- Token validated via `jose` library (existing auth plugin)

**Authorization**:
- All endpoints require user to have "admin" role
- Implemented via `requireAdmin` middleware (from 004-user-management)
- Non-admin users receive 403 Forbidden
- Unauthenticated requests receive 401 Unauthorized

## Rate Limiting

- Not implemented in Phase 3 (future consideration)
- DynamoDB on-demand billing handles traffic spikes
- Client-side: React Query cache reduces redundant requests (1-minute TTL)

## Caching

**Client-Side** (React Query):
- Team lists: 1-minute cache TTL (per constitution)
- Team details: 1-minute cache TTL
- Optimistic updates for mutations (create, update, delete)
- Automatic cache invalidation on mutations

**Server-Side**:
- Lambda execution context caching for DynamoDB client
- No application-level caching (DynamoDB provides low-latency reads)

## Error Handling

**Client Responsibilities**:
- Display user-friendly error messages from error.message
- Handle network errors and timeouts gracefully
- Implement retry logic for transient failures (5xx errors)
- Show validation errors inline for form fields

**Server Responsibilities**:
- Validate all inputs before DynamoDB operations
- Return specific error codes for client error handling
- Log errors to CloudWatch (no PII in logs)
- Use transactions where atomicity required (e.g., batch member updates)

## Performance Targets

Per constitution and success criteria:
- API response time: p95 <500ms (SC)
- Team list display: Responsive with 100 teams (SC-002)
- Search operations: <1s for 95% of queries (SC-007)
- Member count updates: <5 seconds (SC-005)
- Manager assignment: Effect within 1 minute (SC-004)

## Security Considerations

- Admin-only endpoints (no team-level or user-level access)
- Input validation on all request fields
- DynamoDB encryption at rest (AWS-managed keys)
- TLS 1.2+ for all API traffic (API Gateway)
- No PII in CloudWatch logs (team IDs and user IDs only)
- Audit trail via createdBy, createdAt, updatedAt fields
