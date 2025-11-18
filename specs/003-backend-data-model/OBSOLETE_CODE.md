# Obsolete Code and Migration Notes

**Feature**: Backend Data Model Overhaul
**Date**: 2025-11-17
**Purpose**: Document code that becomes obsolete with the new DynamoDB backend

## Summary

This feature introduces a new 4-table DynamoDB backend architecture that replaces the current data storage approach. This document tracks what becomes obsolete and what needs to be migrated or removed.

## Already Removed

The following have already been removed from the repository:

### 1. apps/db-setup/
**Status**: ✅ Already removed
**Description**: Previous database setup project (likely related to old schema)
**Evidence**: Directory does not exist in current repository state

### 2. apps/status-lambda/
**Status**: ✅ Already removed
**Description**: Status Lambda function (unrelated to data model, but no longer exists)
**Evidence**: Directory does not exist in current repository state

### 3. Supabase Integration
**Status**: ✅ Already removed
**Description**: Legacy Supabase backend services mentioned in CLAUDE.md
**Evidence**: No Supabase references found in apps/web codebase
**CLAUDE.md Quote**: "**Supabase** integration for backend services (legacy)"

## To Be Removed

The following will become obsolete once the new backend is implemented:

### 1. Local Storage for Assessment Data
**Location**: `apps/web/src/hooks/` (assessment state hooks)
**Current Behavior**: Uses browser localStorage for assessment state
**Why Obsolete**: New backend stores all assessment data in DynamoDB AssessmentReports table
**Migration Plan**:
- Replace localStorage hooks with React Query hooks calling backend API
- Migrate any existing localStorage data to DynamoDB during first backend deployment
- Remove local storage keys after migration

**Files to Review**:
```bash
# Find hooks using localStorage
grep -r "localStorage" apps/web/src/hooks/
```

### 2. Frontend Data Models (if duplicated)
**Location**: `apps/web/src/utils/model.ts` and related files
**Current Behavior**: Defines Expectation, Competence, Category types
**Why May Be Obsolete**: New shared types in `libs/shared-types` will be canonical
**Migration Plan**:
- Compare frontend models with new `libs/shared-types` interfaces
- If compatible, replace imports to use shared types
- If incompatible, create adapter/mapper functions
- Remove duplicate type definitions

**Files to Review**:
```bash
# Check current data models
apps/web/src/utils/model.ts
apps/web/src/utils/configParser.ts
```

### 3. Mock/Fixture Data (if exists)
**Location**: TBD (to be determined during implementation)
**Why Obsolete**: Backend will provide real data via API
**Migration Plan**:
- Replace with API calls during development
- Use DynamoDB Local or test environment for E2E tests
- Remove fixture files once backend endpoints are stable

## To Be Updated

The following will need updates (not full removal):

### 1. apps/web/src/data/config.md
**Status**: 📝 To be migrated
**Current Role**: Defines career ladder framework in Markdown
**New Role**: Seed data for initial Assessment template in DynamoDB
**Migration Plan**:
- Parse config.md into Assessment.plan structure
- Create initial Assessment record in DynamoDB Assessments table
- Frontend will fetch assessments from backend instead of parsing config.md
- Keep config.md as documentation and seed data source

**Script**: See `apps/api/src/scripts/migrate-data.ts` in quickstart.md

### 2. Authentication Context
**Location**: `apps/web/src/contexts/AuthContext.tsx`
**Current Behavior**: Handles Cognito authentication
**Required Changes**:
- Add API client instance (with token injection)
- Expose `getIdToken()` method for API calls
- No changes to authentication flow itself

**Example**:
```typescript
// Before
export function useAuth() {
  const { user } = useAuthContext();
  return { user };
}

// After
export function useAuth() {
  const { user } = useAuthContext();
  return {
    user,
    getIdToken: () => user.getIdToken(),
    apiClient: new ApiClient(() => user.getIdToken())
  };
}
```

### 3. Assessment State Hooks
**Location**: `apps/web/src/hooks/` (assessment-related hooks)
**Current Behavior**: Manages assessment state in memory/localStorage
**Required Changes**:
- Replace with React Query hooks (`useQuery`, `useMutation`)
- Call backend API endpoints instead of localStorage
- Maintain same hook interface for minimal component changes

**Example**:
```typescript
// Before
export function useAssessment(assessmentId: string) {
  const [data, setData] = useState(getFromLocalStorage(assessmentId));
  // ...
}

// After
export function useAssessment(assessmentId: string) {
  return useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => apiClient.getAssessment(assessmentId),
  });
}
```

## New Code to Be Added

The following new projects/code will be created:

### 1. libs/shared-types/
**Status**: 🆕 New project
**Purpose**: Shared TypeScript interfaces for Users, Teams, Assessments, Reports
**Consumers**: Both `apps/api` (backend) and `apps/web` (frontend)
**Source**: TypeScript interfaces from [data-model.md](data-model.md#typescript-interfaces)

### 2. apps/api/
**Status**: 🆕 New project
**Purpose**: Backend Lambda functions for DynamoDB access
**Structure**:
```
apps/api/
├── src/
│   ├── models/         # TypeScript interfaces (import from shared-types)
│   ├── repositories/   # DynamoDB access layer
│   ├── handlers/       # Lambda handlers
│   ├── middleware/     # Auth middleware
│   └── utils/          # Helpers
└── tests/
    ├── integration/    # DynamoDB integration tests
    ├── contract/       # API contract tests
    └── unit/           # Unit tests
```

### 3. infrastructure/
**Status**: 🆕 New project
**Purpose**: AWS CDK/SAM infrastructure-as-code
**Contents**:
- DynamoDB table definitions with GSIs
- Lambda function definitions
- API Gateway REST API definition
- IAM roles and policies

### 4. API Client in Frontend
**Location**: `apps/web/src/services/api-client.ts` (new file)
**Purpose**: Type-safe API client for calling backend
**Features**:
- Automatic token injection from AuthContext
- Type-safe request/response (using shared-types)
- Error handling and retries
- Response normalization

## Migration Checklist

Before deploying to production:

- [ ] Deploy new DynamoDB tables (Phase 1)
- [ ] Seed initial Assessment from config.md (Phase 2)
- [ ] Create initial Teams and Users (Phase 2)
- [ ] Deploy backend Lambda functions (Phase 3)
- [ ] Deploy API Gateway (Phase 3)
- [ ] Migrate existing localStorage data to DynamoDB (Phase 4)
- [ ] Update frontend hooks to use backend API (Phase 4)
- [ ] Remove localStorage fallback code (Phase 5)
- [ ] Remove duplicate type definitions (Phase 5)
- [ ] Update CLAUDE.md to reflect new architecture (Phase 5)
- [ ] Remove obsolete dependencies from package.json (Phase 5)

## Verification Steps

After migration:

1. **Data Integrity**: Verify all users, teams, and assessments migrated correctly
2. **Access Patterns**: Test all query patterns from [data-model.md](data-model.md)
3. **Authorization**: Verify role-based access control works per constitution
4. **Performance**: Measure p95 latency for report retrieval (<100ms target)
5. **Frontend**: Verify all assessment workflows work with backend API
6. **E2E Tests**: Run full E2E test suite with real backend

## Rollback Plan

If issues arise during migration:

1. **Keep old code**: Do not delete old localStorage code until backend is proven stable
2. **Feature flags**: Use feature flags to toggle between old (localStorage) and new (API) backends
3. **Gradual rollout**: Enable new backend for subset of users first
4. **Data backup**: Backup localStorage data before migration
5. **Quick revert**: Disable feature flag to revert to localStorage if needed

## Questions for User

Before proceeding with implementation:

1. **Migration Timing**: Should we migrate in a single deployment or gradual rollout?
2. **Data Preservation**: Are there existing assessments in production that must be preserved?
3. **Backward Compatibility**: Do we need to support old localStorage format for a transition period?
4. **Testing Environment**: Is there a staging environment for testing the migration?

## References

- [spec.md](spec.md) - Feature specification
- [research.md](research.md) - Technical decisions
- [data-model.md](data-model.md) - DynamoDB table schemas
- [contracts/api-spec.yaml](contracts/api-spec.yaml) - REST API specification
- [quickstart.md](quickstart.md) - Implementation guide
