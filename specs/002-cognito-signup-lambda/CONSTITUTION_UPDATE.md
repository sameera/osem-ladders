# Constitutional Update: Email-Based User Identity

**Feature**: 002-cognito-signup-lambda
**Date**: 2025-11-12
**Status**: Requires Constitution Update

## Architectural Decision

This feature implements email addresses as immutable user identifiers (`userId`) throughout the OSEM Ladders platform.

## Constitutional Addition Required

Add the following to `.specify/memory/constitution.md` in the **Data Model Governance** section:

### User Identity Model

**Decision**: User identifiers (`userId`) are email addresses, not UUIDs.

**Rationale**:
- Simplifies user-facing displays (no email lookups required)
- Email is the natural identifier from Microsoft 365 authentication
- Reduces join complexity across tables
- Aligns with single-organization assumption (corporate email domains are stable)

**Implications**:
- Email addresses are immutable; changes in Microsoft 365 create new user records
- All foreign key references use email strings (Teams.memberIds, Assessments.teamMemberId, etc.)
- Cognito `sub` UUID stored as `cognitoSub` attribute for reference only
- Previous assessment history remains under old email if user changes email
- Data orphaning risk if email addresses change (acceptable tradeoff per Option A)

**Schema Impact**:
- Users table: `userId` (String, partition key) = email address
- Users table: `cognitoSub` (String) = Cognito sub UUID for reference
- All tables with user references: use email addresses as foreign keys

**Affected Tables**: Users, Teams, AssessmentPlans, Assessments, AssessmentReports, ConfigVersions

### User Onboarding Flow

**Decision**: Two-tier onboarding approach with administrator-controlled role assignment.

**Primary Flow**:
1. Administrators pre-create user records in Users table with appropriate roles (admin, manager, team_member)
2. Users authenticate via Microsoft 365/Cognito for the first time
3. Lambda links Cognito `sub` to existing user record while preserving pre-assigned roles

**Fallback Flow**:
1. User authenticates without pre-created record
2. Lambda auto-provisions user with default `team_member` role
3. Administrator upgrades roles as needed through admin UI

**Rationale**:
- Eliminates race conditions for first-admin detection
- Provides explicit, secure role assignment by administrators
- Allows self-service onboarding for users not yet in the system
- Maintains security with minimal default permissions

**Implications**:
- Initial system bootstrap requires manual creation of first admin user in DynamoDB
- Lambda never automatically assigns admin or manager roles
- Pre-created users authenticate seamlessly with correct roles from first login
- Auto-provisioned users have limited access until administrator upgrades their roles

## Related Files Requiring Updates

1. `.specify/memory/constitution.md` - Add User Identity Model section
2. `specs/001-dynamodb-setup/data-model.md` - Update Users table schema (lines 22-65)
3. All table schemas referencing `userId` in data-model.md

## Update Checklist

- [ ] Add User Identity Model to constitution.md
- [ ] Add User Onboarding Flow to constitution.md
- [ ] Update data-model.md Users table schema
- [ ] Update all foreign key references in data-model.md
- [ ] Verify schema changes propagate to db-setup tool
- [ ] Document manual bootstrap process for first admin user
- [ ] Update CLAUDE.md Active Technologies section if needed
