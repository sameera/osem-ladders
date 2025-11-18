# API Contracts

This directory contains the OpenAPI 3.0 specification for the OSEM Ladders backend API.

## Files

- `api-spec.yaml` - Complete OpenAPI 3.0 specification for all endpoints

## Viewing the Specification

You can view and interact with this API specification using:

### Swagger UI (Browser)
```bash
npx @open api-tools/swagger-ui --port 8081 api-spec.yaml
```

### Swagger Editor
```bash
docker run -p 8080:8080 -e SWAGGER_FILE=/api-spec.yaml -v $(pwd):/api swaggerapi/swagger-editor
```

### Online Viewers
Upload `api-spec.yaml` to:
- https://editor.swagger.io/
- https://redocly.com/redoc/

## API Overview

### Authentication
All endpoints require Bearer authentication with Cognito JWT token from Microsoft 365.

### Base URL
- Production: `https://api.osem-ladders.example.com/v1` (placeholder)
- Development: `https://api-dev.osem-ladders.example.com/v1` (placeholder)

### Endpoints Summary

#### Users (`/users`)
- `GET /users` - List all users (admin only)
- `POST /users` - Create user (admin only)
- `GET /users/{userId}` - Get user by email
- `PUT /users/{userId}` - Update user

**Authorization**:
- TeamMembers: Can only view/edit their own profile
- Managers: Can view their team members
- Admins: Can view/edit all users

#### Teams (`/teams`)
- `GET /teams` - List all teams
- `POST /teams` - Create team (admin or manager)
- `GET /teams/{teamId}` - Get team by ID
- `PUT /teams/{teamId}` - Update team (admin or team manager)

**Authorization**:
- All authenticated users can list/view teams
- Only admins and team managers can modify teams

#### Assessments (`/assessments`)
- `GET /assessments` - List all assessment templates
- `POST /assessments` - Create assessment template (admin only)
- `GET /assessments/{assessmentId}` - Get assessment by ID

**Authorization**:
- All authenticated users can view assessments
- Only admins can create assessment templates

#### Reports (`/reports`)
- `GET /reports` - List reports (filtered by authorization)
- `POST /reports` - Create assessment report
- `GET /reports/{reportId}` - Get report by content-addressed ID
- `PUT /reports/{reportId}` - Update report (only if not submitted)

**Authorization**:
- TeamMembers: Can create/edit own self-assessments
- Managers: Can create/edit manager-assessments for their team members
- Admins: Can view all reports (read-only)
- Submitted reports are immutable (returns 403 if edit attempted)

## Response Format

All responses follow a standard structure:

### Success Response
```json
{
  "success": true,
  "data": {
    // Resource-specific data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional additional context
  }
}
```

## Error Codes

| HTTP Status | Error Code | Description |
|-------------|-----------|-------------|
| 400 | VALIDATION_ERROR | Request validation failed |
| 401 | UNAUTHORIZED | Missing or invalid JWT token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource already exists |
| 500 | INTERNAL_ERROR | Server error |

## Content-Addressed Keys

Assessment reports use content-addressed keys with format:
```
<userId>|<assessmentId>|<type>
```

Example:
```
john.doe@example.com|123e4567-e89b-12d3-a456-426614174000|self
```

This format:
- Prevents duplicate submissions (PutItem overwrites)
- Is human-readable for debugging
- Deterministically unique per user/assessment/type combination

## Implementation Notes

1. **Email Immutability**: `userId` (email) cannot be changed after user creation
2. **Soft Deletes**: All entities support `isActive` flag for soft deletion
3. **Audit Fields**: All entities include `createdAt`, `updatedAt`, `createdBy`
4. **Immutable Submissions**: Reports with `status="submitted"` cannot be edited (403)
5. **Orphaned Records**: Queries must handle missing references gracefully
6. **Performance**: Report retrieval by composite key must be <100ms p95

## Contract Testing

Contract tests should verify:
- Request/response schemas match OpenAPI spec
- Required fields are present
- Field types and formats are correct
- Enum values are valid
- Error responses follow standard format

Example using `jest-openapi`:
```typescript
import { matchers } from 'jest-openapi';
expect.extend(matchers);

test('GET /users/{userId} returns valid User', async () => {
  const res = await request(app).get('/users/john.doe@example.com');
  expect(res.status).toEqual(200);
  expect(res.body).toSatisfyApiSpec();
});
```

## Generating TypeScript Types

Use `openapi-typescript` to generate TypeScript types from the spec:

```bash
npx openapi-typescript api-spec.yaml --output types.ts
```

This generates type-safe interfaces for all schemas, requests, and responses.
