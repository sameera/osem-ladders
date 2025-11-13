# Application Redesign for Organizational Usage

## Executive Summary

This document outlines the architectural changes required to transform the current single-user, client-side career ladder assessment tool into a multi-tenant organizational platform with role-based access control, team management, and persistent server-side storage.

## Current Architecture

### What We Have

-   **Frontend**: React SPA with Vite, TypeScript, shadcn/ui components
-   **Authentication**: AWS Cognito with Microsoft 365 OIDC integration
-   **Storage**: Browser localStorage only (no backend)
-   **User Model**: Basic OIDC user profile (email, name from Microsoft 365)
-   **Assessment Flow**: Single-user self-assessment with local JSON export
-   **Data Model**: Categories → Competencies → Expectation Levels

### Key Limitations

1. No persistent server-side storage
2. No multi-user collaboration
3. No role-based access control
4. No team management
5. No assessment workflow (self + manager scoring)
6. Assessments live only in browser localStorage

---

## Target Architecture

### User Roles & Permissions

#### 1. **Admin**

-   Create and manage teams across the organization
-   Assign managers to teams
-   View all assessments across all teams
-   Manage assessment plans (templates)
-   Configure career ladder definitions (config.md)
-   View organizational analytics/dashboards

#### 2. **Manager**

-   Create and manage their own teams
-   Add/remove team members from their teams
-   Create assessment plans for their teams
-   View team member self-assessments
-   Complete manager assessments (score team members)
-   View team analytics and reports
-   Export final assessment reports

#### 3. **Team Member**

-   View teams they belong to
-   Complete self-assessments when assigned
-   View their own assessment history
-   Compare self-assessment vs manager assessment
-   View their career progression over time

### Data Model

#### Core Entities

```typescript
// User (extends Cognito user profile)
interface User {
    userId: string; // UUID - String (Partition Key)
    email: string; // From Cognito/Microsoft 365 - String
    name: string; // Display name - String
    roles: UserRole[]; // ['admin', 'manager', 'team_member'] - String Set
    createdAt: number; // Unix timestamp (milliseconds) - Number
    updatedAt: number; // Unix timestamp (milliseconds) - Number
}

type UserRole = "admin" | "manager" | "team_member";

// Team
interface Team {
    teamId: string; // UUID - String (Partition Key)
    teamName: string; // String
    description?: string; // String (optional)
    managerId: string; // User ID of manager - String (GSI)
    memberIds: string[]; // Array of User IDs - String Set
    createdBy: string; // User ID (admin or manager) - String
    createdAt: number; // Unix timestamp - Number
    updatedAt: number; // Unix timestamp - Number
    isActive: boolean; // Boolean
}

// Assessment Plan (seasonal/periodic)
interface AssessmentPlan {
    planId: string; // UUID - String (Partition Key)
    teamId: string; // String (GSI)
    planName: string; // e.g., "Q1 2025 Review" - String
    description?: string; // String (optional)
    season: string; // e.g., "2025-Q1", "H1-2025" - String
    startDate: number; // Unix timestamp - Number
    endDate: number; // Unix timestamp - Number
    status: "draft" | "active" | "completed" | "archived"; // String (GSI)
    configVersion: string; // Reference to career ladder config version - String
    createdBy: string; // User ID - String
    createdAt: number; // Unix timestamp - Number
    updatedAt: number; // Unix timestamp - Number
}

// Assessment (individual assessment instance)
interface Assessment {
    assessmentId: string; // UUID - String (Partition Key)
    planId: string; // Reference to AssessmentPlan - String (GSI)
    teamId: string; // String
    teamMemberId: string; // User ID being assessed - String (GSI)
    assessmentType: "self" | "manager"; // String
    assessorId: string; // User ID who did the assessment - String

    // Assessment data (current structure) - Stored as Map (DynamoDB Map type)
    selections: Record<string, Record<string, number>>; // Map of Maps with Number values
    feedback: Record<
        string,
        Record<
            string,
            Record<
                number,
                {
                    evidence?: string;
                    nextLevelFeedback?: string;
                }
            >
        >
    >; // Nested Map structure
    currentLevel: number; // Number
    wayForward?: string; // String (optional)

    status: "not_started" | "in_progress" | "submitted"; // String
    submittedAt?: number; // Unix timestamp - Number (optional)
    createdAt: number; // Unix timestamp - Number
    updatedAt: number; // Unix timestamp - Number
}

// Final Assessment Report (combines self + manager)
interface AssessmentReport {
    reportId: string; // UUID - String (Partition Key)
    planId: string; // String (GSI)
    teamMemberId: string; // String (GSI)
    selfAssessmentId: string; // Reference to self Assessment - String
    managerAssessmentId: string; // Reference to manager Assessment - String

    // Computed fields
    finalLevel: number; // Based on manager assessment - Number
    selfAssessedLevel: number; // For comparison - Number
    variance: Record<
        string,
        Record<
            string,
            {
                // Map of Maps
                selfScore: number; // Number
                managerScore: number; // Number
                difference: number; // Number (can be negative)
            }
        >
    >;

    generatedAt: number; // Unix timestamp - Number
    exportedAt?: number; // Unix timestamp - Number (optional)
}

// Career Ladder Configuration (versioned)
interface ConfigVersion {
    configId: string; // UUID - String (Partition Key)
    version: string; // Semantic version (e.g., "1.0.0") - String
    configContent: string; // Markdown content (config.md) - String
    parsedConfig: {
        // Cached parsed structure - Map
        categories: Category[]; // List of Maps
    };
    createdBy: string; // User ID - String
    createdAt: number; // Unix timestamp - Number
    isActive: boolean; // Boolean (GSI)
}
```

---

## Backend Architecture

### Technology Stack

#### Database: **DynamoDB**

-   **Users Table**: Partition key: `userId`
-   **Teams Table**: Partition key: `teamId`, GSI: `managerId`
-   **AssessmentPlans Table**: Partition key: `planId`, GSI: `teamId`, GSI: `status`
-   **Assessments Table**: Partition key: `assessmentId`, GSI: `planId-teamMemberId`, GSI: `teamMemberId`
-   **AssessmentReports Table**: Partition key: `reportId`, GSI: `planId`, GSI: `teamMemberId`
-   **ConfigVersions Table**: Partition key: `configId`, GSI: `isActive`

#### Compute: **AWS Lambda Functions**

All Lambda functions should:

-   Validate Cognito JWT tokens for authentication
-   Implement role-based authorization
-   Return standardized JSON responses
-   Handle errors gracefully with proper HTTP status codes

##### User Management

-   `GET /users/me` - Get current user profile with roles
-   `POST /users` - Create/update user profile (first login)
-   `GET /users/{userId}` - Get user by ID (admin only)
-   `GET /users` - List users (admin/manager - with filtering)

##### Team Management

-   `POST /teams` - Create team (admin/manager)
-   `GET /teams/{teamId}` - Get team details
-   `PUT /teams/{teamId}` - Update team (manager/admin)
-   `DELETE /teams/{teamId}` - Delete team (admin only)
-   `GET /teams` - List teams (filtered by role)
-   `POST /teams/{teamId}/members` - Add team member
-   `DELETE /teams/{teamId}/members/{userId}` - Remove team member
-   `GET /teams/my-teams` - Get teams for current user

##### Assessment Plan Management

-   `POST /teams/{teamId}/plans` - Create assessment plan (manager/admin)
-   `GET /plans/{planId}` - Get plan details
-   `PUT /plans/{planId}` - Update plan
-   `DELETE /plans/{planId}` - Delete plan (only if draft)
-   `GET /teams/{teamId}/plans` - List plans for team
-   `GET /plans/{planId}/activate` - Activate plan (sets status to active)
-   `GET /plans/active` - Get active plans for user's teams

##### Assessment Management

-   `POST /plans/{planId}/assessments` - Start new assessment
-   `GET /assessments/{assessmentId}` - Get assessment
-   `PUT /assessments/{assessmentId}` - Update assessment (save progress)
-   `POST /assessments/{assessmentId}/submit` - Submit assessment
-   `GET /plans/{planId}/assessments` - List assessments for plan
-   `GET /members/{userId}/assessments` - Get user's assessments

##### Report Management

-   `POST /plans/{planId}/reports/{memberId}` - Generate report (combines self + manager)
-   `GET /reports/{reportId}` - Get report
-   `GET /plans/{planId}/reports` - List reports for plan
-   `GET /members/{userId}/reports` - Get user's report history
-   `POST /reports/{reportId}/export` - Export report as PDF/JSON

##### Configuration Management

-   `POST /configs` - Upload new config version (admin only)
-   `GET /configs/{configId}` - Get config version
-   `GET /configs/active` - Get active config
-   `PUT /configs/{configId}/activate` - Set as active config

#### API Gateway

-   RESTful API with Lambda proxy integration
-   Cognito Authorizer for JWT validation
-   CORS configuration for web app domain
-   Request/response validation
-   Rate limiting and throttling

#### Infrastructure as Code

Recommend using AWS CDK or SAM for:

-   DynamoDB table definitions with GSIs
-   Lambda function deployment
-   API Gateway configuration
-   IAM roles and policies
-   Cognito integration

---

## Frontend Changes

### New Pages

#### 1. **Dashboard** (`/dashboard`)

-   Role-based landing page
-   **Admin**: Overview of all teams, recent assessments, system health
-   **Manager**: My teams, active assessment plans, pending assessments
-   **Team Member**: My teams, assigned assessments, my progress

#### 2. **Teams Management** (`/teams`)

-   **Manager/Admin**: List teams, create/edit teams
-   **Team Member**: View teams I belong to
-   Components:
    -   TeamList - Grid/table of teams
    -   TeamForm - Create/edit team modal
    -   TeamDetails - View team members, assessment plans
    -   MemberSelector - Add/remove team members

#### 3. **Assessment Plans** (`/plans`)

-   **Manager/Admin**: Create and manage seasonal assessment plans
-   List active/past plans per team
-   Components:
    -   PlanList - Table of plans with filters
    -   PlanForm - Create/edit plan (name, season, dates)
    -   PlanDetails - View assigned assessments, progress tracking

#### 4. **Assessment Wizard** (`/assessments/{assessmentId}`)

-   Updated version of current Index.tsx
-   Pre-loaded with assessment context (plan, team member, type)
-   Auto-save progress to backend (not localStorage)
-   Show whether it's self-assessment or manager assessment
-   Components:
    -   AssessmentHeader - Shows context (who, what, type)
    -   CategoryAssessment - Current screen with auto-save
    -   AssessmentSummary - Review before submit

#### 5. **Reports** (`/reports`)

-   **Manager**: View/export final reports for team members
-   **Team Member**: View own reports (comparison view)
-   Components:
    -   ReportList - Filter by plan, team member
    -   ReportView - Side-by-side self vs manager assessment
    -   ReportExport - PDF/JSON download
    -   ProgressChart - Historical trend over multiple assessments

#### 6. **Admin Panel** (`/admin`)

-   User role management
-   Config version management
-   System-wide analytics
-   Components:
    -   UserRoleEditor
    -   ConfigUploader
    -   AnalyticsDashboard

### Updated Components

#### Authentication

-   Add role checking to ProtectedRoute
-   Create RoleGuard component for admin/manager-only routes
-   Add user profile dropdown with role badges

#### Navigation

-   Dynamic navigation based on user roles
-   Active assessment indicators
-   Notification badges for pending actions

#### State Management

-   Replace localStorage hooks with React Query hooks
-   Create API client layer (axios/fetch wrapper)
-   Implement optimistic updates for better UX
-   Cache invalidation strategies

### New Hooks

```typescript
// API Hooks (React Query)
- useUser() - Current user with roles
- useTeams() - List teams for user
- useTeam(teamId) - Single team details
- useAssessmentPlans(teamId) - Plans for team
- useAssessment(assessmentId) - Single assessment
- useAssessments(planId) - Assessments for plan
- useReport(reportId) - Single report
- useReports(filters) - List reports
- useConfig() - Active config

// Mutation Hooks
- useCreateTeam()
- useUpdateTeam()
- useCreatePlan()
- useCreateAssessment()
- useUpdateAssessment()
- useSubmitAssessment()
- useGenerateReport()

// Permission Hooks
- useHasRole(role) - Check if user has role
- useCanManageTeam(teamId) - Check team management permission
- useCanViewAssessment(assessmentId) - Check assessment view permission
```

---

## Assessment Workflow

### Flow Diagram

```
1. Manager creates Assessment Plan for Team
   ↓
2. System creates Assessment instances:
   - Self-assessment for each team member
   - Manager-assessment for each team member
   ↓
3. Team Members complete self-assessments
   - Save progress (in_progress)
   - Submit when complete (submitted)
   ↓
4. Manager reviews self-assessments (optional)
   ↓
5. Manager completes manager-assessments
   - Can see team member's self-assessment
   - Provides own scores and feedback
   - Submits assessment
   ↓
6. System generates Final Report
   - Combines self + manager assessments
   - Highlights variances
   - Uses manager scores as final
   ↓
7. Report available to:
   - Team Member (view only)
   - Manager (view + export)
   - Admin (view + export)
```

### Assessment States

| State         | Description                       | Actions Available |
| ------------- | --------------------------------- | ----------------- |
| `not_started` | Assessment created but not opened | Start assessment  |
| `in_progress` | User has started, auto-saving     | Continue, Submit  |
| `submitted`   | User has submitted, locked        | View only         |

### Report Generation Rules

1. Report can only be generated when both assessments are `submitted`
2. Manager assessment scores are used as the final/official scores
3. Self-assessment scores are shown for comparison
4. Variance calculation: `managerScore - selfScore` per competency
5. Large variances (>2 levels) should be highlighted

---

## Migration Strategy

### Phase 1: Backend Foundation (Weeks 1-2)

-   [ ] Design and create DynamoDB tables
-   [ ] Implement User and Team Lambda functions
-   [ ] Set up API Gateway with Cognito authorizer
-   [ ] Create initial API client in frontend
-   [ ] Implement user profile creation on first login

### Phase 2: Team Management (Week 3)

-   [ ] Build team management UI
-   [ ] Implement team CRUD operations
-   [ ] Add role-based access controls
-   [ ] Create admin panel for role assignment

### Phase 3: Assessment Plans (Week 4)

-   [ ] Implement Assessment Plan backend
-   [ ] Build plan creation/management UI
-   [ ] Create plan listing and filtering

### Phase 4: Assessment Flow (Weeks 5-6)

-   [ ] Migrate assessment storage to backend
-   [ ] Update assessment wizard with auto-save
-   [ ] Implement assessment submission workflow
-   [ ] Build assessment listing views

### Phase 5: Reports (Week 7)

-   [ ] Implement report generation logic
-   [ ] Build report viewing UI (comparison view)
-   [ ] Add PDF export functionality
-   [ ] Create historical trends view

### Phase 6: Polish & Launch (Week 8)

-   [ ] Admin dashboard and analytics
-   [ ] User testing and bug fixes
-   [ ] Performance optimization
-   [ ] Documentation and training materials

---

## Security Considerations

### Authentication & Authorization

-   All API endpoints require valid Cognito JWT token
-   Lambda authorizer validates token and extracts user ID and roles
-   Row-level security: users can only access data they have permission for
-   Audit logging for sensitive operations (role changes, deletions)

### Data Access Rules

1. **Users**: Can only see their own profile unless admin
2. **Teams**: Can only see teams they belong to or manage
3. **Assessments**:
    - Team members: Only their own assessments
    - Managers: All assessments for their teams
    - Admins: All assessments
4. **Reports**: Same as assessments

### PII Handling

-   Assessment feedback may contain sensitive data
-   Use DynamoDB encryption at rest
-   API Gateway TLS for data in transit
-   Consider GDPR compliance for EU users

---

## Performance Considerations

### DynamoDB Design

-   Use partition keys for even data distribution
-   Create GSIs for common query patterns:
    -   `teamId-status` for active plans
    -   `managerId` for manager's teams
    -   `teamMemberId-planId` for user assessments
-   Consider on-demand billing for unpredictable workload

### Caching Strategy

-   React Query cache for frequently accessed data (5-minute default)
-   Aggressive caching for config (rarely changes)
-   Optimistic updates for better perceived performance
-   CloudFront CDN for static assets

### Lambda Optimization

-   Keep functions warm with CloudWatch scheduled rules
-   Use Lambda layers for shared dependencies
-   Implement connection pooling for DynamoDB client
-   Set appropriate memory/timeout values

---

## Cost Estimation (Monthly, 100 users)

| Service     | Usage                               | Estimated Cost    |
| ----------- | ----------------------------------- | ----------------- |
| DynamoDB    | 10GB storage, 1M reads, 100K writes | ~$5-10            |
| Lambda      | 100K invocations, 512MB, 3s avg     | ~$2-5             |
| API Gateway | 100K requests                       | ~$1               |
| Cognito     | 100 MAUs (Microsoft 365 federation) | Free tier         |
| CloudFront  | 10GB data transfer                  | ~$1-2             |
| **Total**   |                                     | **~$10-20/month** |

(Scales with usage, but remains cost-effective)

---

## Open Questions / Decisions Needed

1. **Role Assignment**: How are admin/manager roles initially assigned? Via Cognito groups? Manual admin panel?

2. **Team Structure**: Can teams be nested? Can a user be a manager of multiple teams?

3. **Assessment Templates**: Should there be reusable assessment templates? Or is the config.md version enough?

4. **Notifications**: Should users receive email notifications for:

    - New assessment assigned?
    - Assessment deadline approaching?
    - Manager has completed their assessment?

5. **Assessment Deadlines**: Should assessment plans have hard deadlines? What happens if not completed?

6. **Historical Data**: How many years of assessment history to retain? Archive old assessments?

7. **Config Versioning**: When config changes, what happens to in-progress assessments using old config?

8. **Multi-org Support**: Is this for a single organization or multi-tenant SaaS? Affects data model significantly.

9. **Feedback Visibility**: Can team members see their manager's feedback immediately or only after review meeting?

10. **Assessment Editing**: Can managers edit submitted assessments? Can team members revise after submission?

---

## Success Metrics

### Technical KPIs

-   API response time <500ms (p95)
-   Frontend page load <2s
-   Zero data loss (DynamoDB backups)
-   99.9% uptime

### Business KPIs

-   Assessment completion rate >80%
-   Manager assessment completion within 2 weeks of plan activation
-   User satisfaction score >4/5
-   Reduction in manual assessment tracking time

---

## Conclusion

This redesign transforms the application from a single-user tool into a collaborative organizational platform with:

-   **Multi-tenancy**: Support for multiple teams and users
-   **Role-based access**: Admin, Manager, Team Member with appropriate permissions
-   **Workflow automation**: Seasonal assessment plans with self + manager scoring
-   **Persistent storage**: DynamoDB backend replacing localStorage
-   **Scalability**: Serverless architecture that grows with usage
-   **Security**: Proper authentication, authorization, and data protection

The phased migration approach allows incremental delivery of value while maintaining the existing assessment UX that users are familiar with.

Next steps: Review this proposal, answer open questions, and begin Phase 1 implementation.
