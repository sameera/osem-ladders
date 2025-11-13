# Feature Specification: Cognito Post-Signup User Provisioning

**Feature Branch**: `002-cognito-signup-lambda`
**Created**: 2025-11-12
**Status**: Draft
**Input**: User description: "Create a lambda function that Cognito can trigger on successful signup. This would populate the User table. Check whether the user exists in the User db already and if so only populate the cognitoSub attribute with the current user's sub. The user would be assigned the roles that are already present in the user table. If the user does not exist, add the user to the table with the 'team_member' role."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Existing User Cognito Sync (Priority: P1)

When a user who already exists in the Users table (pre-populated by an administrator) signs up through Microsoft 365/Cognito for the first time, their Cognito sub should be linked to their existing user record so they can authenticate.

**Why this priority**: This is the primary onboarding flow. Administrators will pre-create user records with appropriate roles, then users authenticate via Cognito to link their accounts. This enables role-based access control from first login.

**Independent Test**: Can be fully tested by manually creating a user record in the Users table with email "jane.doe@company.com" and roles ['manager'], then having that user sign up via Microsoft 365. Verify the `cognitoSub` is populated and roles remain ['manager']. This delivers immediate value by enabling secure, role-based authentication.

**Acceptance Scenarios**:

1. **Given** a user record exists in the Users table with `userId: "jane.doe@company.com"` and `roles: ['manager']`, **When** that user completes Microsoft 365 authentication through Cognito with email "jane.doe@company.com", **Then** the existing user record is updated with `cognitoSub` from Cognito and `updatedAt` timestamp, while preserving existing `roles` and other attributes
2. **Given** a user record exists with no `cognitoSub` attribute, **When** the user authenticates via Cognito multiple times, **Then** the `cognitoSub` is set on first authentication and subsequent authentications are idempotent (no changes)

---

### User Story 2 - New User Auto-Provisioning (Priority: P2)

When a user who does not exist in the Users table signs up through Microsoft 365/Cognito, they should be automatically provisioned with basic team member access to allow immediate platform access.

**Why this priority**: This provides a fallback for users who authenticate before being pre-created by an administrator. They get minimal access automatically, then administrators can upgrade their roles as needed. This reduces friction in onboarding while maintaining security.

**Independent Test**: Can be tested independently by signing up a user with email "new.user@company.com" who has no record in the Users table and verifying a new DynamoDB record is created with `roles: ['team_member']`. This delivers value by allowing self-service onboarding without administrator intervention.

**Acceptance Scenarios**:

1. **Given** no user record exists in the Users table for email "new.user@company.com", **When** that user completes Microsoft 365 authentication through Cognito, **Then** a new user record is created with `userId` (email), `email`, `name`, `cognitoSub`, `roles: ['team_member']`, and proper timestamps
2. **Given** a new user is auto-provisioned with team_member role, **When** they sign in again, **Then** no duplicate user record is created (idempotent operation based on email)

---

### User Story 3 - User Profile Data Sync (Priority: P3)

When a user signs up, their profile information from Microsoft 365 (email, display name) should be automatically captured and stored in the Users table for use throughout the platform.

**Why this priority**: This reduces manual data entry and ensures consistent user identity across the platform. While important for user experience, the platform can function with basic auth before this is fully polished.

**Independent Test**: Can be tested by signing up with a Microsoft 365 account that has a specific display name and email, then verifying both values are correctly stored in the DynamoDB Users table. This delivers value by providing user-facing identity information in the UI.

**Acceptance Scenarios**:

1. **Given** a user signs up with email "jane.doe@company.com" and display name "Jane Doe" in Microsoft 365, **When** the post-signup Lambda executes, **Then** the Users table record has `userId: "jane.doe@company.com"`, `email: "jane.doe@company.com"`, and `name: "Jane Doe"`
2. **Given** a user's Microsoft 365 profile has no display name, **When** the post-signup Lambda executes, **Then** the `name` field defaults to the email prefix (e.g., "jane.doe" from "jane.doe@company.com")

---

### Edge Cases

- What happens when the Lambda function cannot connect to DynamoDB (network timeout, service unavailable)? Cognito signup should fail with an error, preventing authentication until the user record is successfully created or updated
- What happens when a user's email is missing from Cognito user attributes? Lambda should fail authentication as email is required for userId
- What happens when an existing user (with pre-assigned roles) signs up via Cognito? Lambda updates their record with cognitoSub while preserving their existing roles
- What happens when a user changes their email in Microsoft 365 and signs in again? The system treats them as a new user (email is immutable userId); their previous assessment history remains under the old email address
- What happens when the Lambda function times out while processing? Cognito signup fails, user can retry authentication which will re-trigger the Lambda
- What happens when a user with an existing email and cognitoSub tries to sign up again? Lambda is idempotent and returns success without making changes
- What happens when a pre-created user record has no name field? Lambda populates the name from Microsoft 365 or uses email prefix as fallback

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST create a Lambda function that responds to Cognito's Post Confirmation trigger event
- **FR-002**: Lambda MUST extract user attributes (`sub`, `email`, `name`) from the Cognito event payload
- **FR-003**: Lambda MUST use the user's email address as the `userId` (partition key) to look up existing user records
- **FR-004**: Lambda MUST check if a user record already exists by querying the Users table with the email as `userId`
- **FR-005**: Lambda MUST update existing user records by setting the `cognitoSub` attribute and `updatedAt` timestamp while preserving all other existing attributes (especially `roles`)
- **FR-006**: Lambda MUST create new user records if no existing record is found for the email address
- **FR-007**: Lambda MUST assign `roles: ['team_member']` to newly created users (auto-provisioned users)
- **FR-008**: Lambda MUST write new user records to the Users table with all required attributes: `userId` (email), `email`, `name`, `cognitoSub`, `roles` (String Set), `createdAt`, `updatedAt` (Unix milliseconds)
- **FR-009**: Lambda MUST populate the `name` attribute from Microsoft 365 display name when creating or updating records
- **FR-010**: Lambda MUST handle missing display name by falling back to email prefix (e.g., "jane.doe" from "jane.doe@company.com")
- **FR-011**: Lambda MUST be idempotent - repeated authentications by the same user should not modify existing records unnecessarily
- **FR-012**: Lambda MUST fail authentication if the email attribute is missing from Cognito event payload
- **FR-013**: Lambda MUST return success to Cognito only after the DynamoDB operation (update or create) succeeds
- **FR-014**: Lambda MUST return failure to Cognito if DynamoDB operations fail, preventing authentication
- **FR-015**: Lambda MUST log all operations (user creation, user updates, role preservation, errors) for audit purposes
- **FR-016**: Lambda MUST have appropriate IAM permissions to read and write to the Users DynamoDB table
- **FR-017**: Lambda MUST be configured with appropriate timeout and memory settings for DynamoDB operations
- **FR-018**: Lambda MUST support the Users table naming convention `osem-{env}-Users` where `{env}` is derived from environment variables

### Key Entities

- **Lambda Function**: AWS Lambda handler triggered by Cognito Post Confirmation event, responsible for provisioning user records
- **Users Table**: DynamoDB table storing user profiles with attributes defined in data-model.md (lines 22-65)
- **Cognito User Pool**: AWS Cognito service managing Microsoft 365 authentication, triggers Lambda on successful signup
- **Lambda Execution Role**: IAM role granting Lambda permissions to write to DynamoDB and log to CloudWatch

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Pre-created users (with admin or manager roles) signing up via Microsoft 365 retain their assigned roles after Cognito linking completes within 2 seconds
- **SC-002**: New users (not pre-created) signing up receive team member role within 2 seconds of authentication completion
- **SC-003**: Lambda function successfully handles concurrent signup attempts without creating duplicate user records (race condition test with 10 concurrent signups)
- **SC-004**: User profile data (email, display name, cognitoSub) from Microsoft 365 is correctly stored or updated in DynamoDB for 100% of successful signups
- **SC-005**: Lambda function failure rate is below 0.1% excluding external service failures (DynamoDB/Cognito outages)
- **SC-006**: Failed Lambda executions prevent user authentication (user cannot access the platform without a valid or updated Users table record)
- **SC-007**: Lambda execution duration is under 1 second for 95% of invocations (both update and create operations)
- **SC-008**: All Lambda operations (user creation, user updates, role preservation) are logged and available for audit within 1 minute in CloudWatch Logs

## Assumptions

- Cognito User Pool is already configured with Microsoft 365 as an OIDC provider (per existing architecture)
- Cognito User Pool has the Post Confirmation trigger configured to invoke the Lambda function
- Users table already exists in DynamoDB with `userId` (email) as partition key
- Users table schema has been updated to include `cognitoSub` attribute (deviation from original data-model.md)
- Email addresses from Microsoft 365 are treated as immutable identifiers; if a user changes their email in Microsoft 365, they will be treated as a new user
- Environment variable `ENV` or similar is available to construct table name `osem-{env}-Users`
- Cognito event payload includes required `email` attribute and `sub` UUID
- Cognito event payload optionally includes `name` or `preferred_username` for display name
- Lambda function will be deployed in the same AWS region as DynamoDB table for low latency
- CloudWatch Logs is enabled for Lambda function execution logs
- IAM role for Lambda is created with DynamoDB write permissions and CloudWatch Logs permissions
- Single AWS account and single organization deployment (per constitution assumption)
- Lambda runtime will be Node.js 18+ to align with TypeScript 5.5.3 tooling in the project

## Dependencies

- AWS Cognito User Pool must be operational and configured with Post Confirmation trigger
- DynamoDB Users table must exist with correct schema (`userId` as email-based partition key, includes `cognitoSub` attribute)
- Note: Original data-model.md (lines 22-65) will need updating to reflect `userId` as email instead of Cognito sub
- AWS SDK for JavaScript v3 must be available in Lambda runtime
- IAM permissions must allow Lambda to perform `dynamodb:GetItem`, `dynamodb:PutItem`, and `dynamodb:UpdateItem` operations on Users table
- CloudWatch Logs must be accessible for Lambda logging

## Out of Scope

- Cognito User Pool configuration and Microsoft 365 OIDC setup (already exists per AUTHENTICATION_SETUP.md)
- DynamoDB table creation (handled by separate feature 001-dynamodb-setup)
- User role management UI (changing roles after initial signup)
- Email verification or additional signup workflows beyond Cognito's built-in flow
- User profile updates after initial signup (handled separately)
- Email change handling and data migration (email is immutable per Option A)
- Multi-organization support (per constitution, single-org assumed)
- Custom user attributes beyond standard Cognito/Microsoft 365 fields
- Lambda deployment pipeline and infrastructure-as-code (IaC) setup

## Constitutional Updates Required

This feature introduces an architectural decision that must be documented in the project constitution:

**User Identity Model**: The system uses email addresses as immutable user identifiers (`userId` as partition key) rather than Cognito `sub` UUIDs. This decision has the following implications:

- Email addresses cannot be changed; if a user's email changes in Microsoft 365, they will be treated as a new user
- All foreign key references across tables (Teams, Assessments, etc.) use email addresses as user identifiers
- The Cognito `sub` UUID is stored as `cognitoSub` attribute for reference but is not used as the primary identifier
- This simplifies user-facing displays (no need to look up email from UUID) but creates data orphaning risk if email addresses change

This architectural decision should be added to the constitution's Data Model Governance section alongside existing decisions about UUID IDs, audit fields, and soft deletes.
