# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

This is an **Nx monorepo** with **pnpm** as the package manager.

### Repository Layout
- `apps/web/` - Main React application (career ladder assessment tool)
- `apps/` - Future applications (e.g., Lambda functions)
- `libs/` - Shared libraries (to be added as needed)

## Development Commands

### Core Commands
- `pnpm dev` - Start development server on port 8080 (runs `nx serve web`)
- `pnpm build` - Build web app for production (runs `nx build web`)
- `pnpm build:dev` - Build for development mode (runs `nx build web --mode development`)
- `pnpm lint` - Run ESLint on web app (runs `nx lint web`)
- `pnpm preview` - Preview production build (runs `nx preview web`)
- `pnpm test` - Run tests (runs `nx test web`)

### Nx Commands
- `nx serve web` - Start development server
- `nx build web` - Build web application
- `nx test web` - Run tests for web app
- `nx lint web` - Lint web application
- `nx graph` - View dependency graph
- `nx affected:build` - Build only affected projects
- `nx affected:test` - Test only affected projects

### Testing
- Tests are in `apps/web/src/test/` directory
- Test setup file: `apps/web/src/test/setup.ts`
- Uses jsdom environment for React component testing
- Vitest is configured for testing

### Deployment
- `pnpm predeploy` - Runs build automatically before deploy
- `pnpm deploy` - Deploy to GitHub Pages (runs `nx deploy web`)

## Project Architecture

### Tech Stack
- **Nx** - Monorepo build system
- **pnpm** - Package manager
- **React 18** with TypeScript and Vite
- **shadcn/ui** components with Radix UI primitives
- **Tailwind CSS** for styling
- **React Query** (@tanstack/react-query) for state management
- **React Router** for navigation
- **Vitest** for testing
- **react-oidc-context** and **AWS Cognito** for authentication with Microsoft 365 via standard OIDC
- **Supabase** integration for backend services (legacy)

### Application Structure

This is a **career ladder assessment application** that helps visualize and track engineering career progression through different levels and competencies.

#### Core Data Model (`apps/web/src/utils/model.ts`)
- `Expectation` - Individual competency level with content and description
- `Competence` - Group of levels for a specific competency area
- `Category` - Collection of competencies (e.g., Technical Execution, Impact, Leadership)

#### Key Directories
- `apps/web/src/components/` - Reusable React components
- `apps/web/src/components/ui/` - shadcn/ui component library
- `apps/web/src/components/assessment/` - Assessment-specific components
- `apps/web/src/contexts/` - React contexts (including AuthContext for authentication)
- `apps/web/src/config/` - Configuration files (including Cognito setup)
- `apps/web/src/pages/` - Page components (Index, Login, NotFound)
- `apps/web/src/hooks/` - Custom React hooks for state management
- `apps/web/src/utils/` - Utility functions including data models and parsers
- `apps/web/src/data/config.md` - Career ladder configuration in Markdown format
- `apps/web/src/integrations/supabase/` - Supabase client and types (legacy)

#### Assessment System
The app implements a multi-step assessment wizard:
- **Configuration parsing** (`apps/web/src/utils/configParser.ts`) - Parses Markdown config into data structures
- **Assessment state management** - Custom hooks handle navigation, completion tracking, and local storage
- **Data visualization** - Radar charts, level charts, and tables show assessment results
- **Report generation** - PDF export functionality for assessment results

#### Component Architecture
- Uses **ThemeProvider** with next-themes for dark/light mode
- **AuthProvider** with AWS Cognito for Microsoft 365 authentication
- **ProtectedRoute** component for route-level authentication
- **React Query** for server state management
- **React Router** with catch-all route handling
- **Local storage** hooks for persistent state
- **Responsive design** with mobile-first approach using Tailwind

#### Authentication
- **AWS Cognito** configured with Microsoft 365 (Azure AD) OIDC provider
- All routes except `/login` require authentication
- OAuth 2.0 authorization code flow with PKCE
- See [AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md) for detailed setup instructions
- Environment variables required (see `.env.example`):
  - `VITE_BRANDING_APP_NAME` - Application display name shown in UI
  - `VITE_COGNITO_REGION`
  - `VITE_COGNITO_USER_POOL_ID`
  - `VITE_COGNITO_USER_POOL_CLIENT_ID`
  - `VITE_COGNITO_DOMAIN`

### Key Configuration Files
- `nx.json` - Nx workspace configuration
- `pnpm-workspace.yaml` - pnpm workspace configuration
- `apps/web/project.json` - Nx project configuration for web app
- `apps/web/vite.config.ts` - Vite configuration with path aliases (`@/` → `./src/`)
- `apps/web/vitest.config.ts` - Test configuration
- `apps/web/tailwind.config.ts` - Tailwind CSS configuration
- `apps/web/components.json` - shadcn/ui configuration

### Path Aliases
- `@/` resolves to `apps/web/src/` for clean imports within the web app

This application focuses on engineering career development, providing structured assessment tools and visualization of competency progression across technical execution, impact, collaboration, and leadership domains.

## Active Technologies
- TypeScript 5.5.3 with Node.js 18+ (align with existing web app) (001-dynamodb-setup)
- DynamoDB (6 tables: Users, Teams, AssessmentPlans, Assessments, AssessmentReports, ConfigVersions) (001-dynamodb-setup)

## Recent Changes
- 001-dynamodb-setup: Added TypeScript 5.5.3 with Node.js 18+ (align with existing web app)
