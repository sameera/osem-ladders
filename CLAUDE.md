# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm run dev` - Start development server on port 8080
- `npm run build` - Build for production
- `npm run build:dev` - Build for development mode
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Testing
- `vitest` - Run tests (Vitest is configured but no test command in package.json)
- Tests are in `src/test/` directory
- Test setup file: `src/test/setup.ts`
- Uses jsdom environment for React component testing

### Deployment
- `npm run predeploy` - Runs build automatically before deploy
- `npm run deploy` - Deploy to GitHub Pages

## Project Architecture

### Tech Stack
- **React 18** with TypeScript and Vite
- **shadcn/ui** components with Radix UI primitives
- **Tailwind CSS** for styling
- **React Query** (@tanstack/react-query) for state management
- **React Router** for navigation
- **Vitest** for testing
- **AWS Amplify** and **AWS Cognito** for authentication with Microsoft 365
- **Supabase** integration for backend services (legacy)

### Application Structure

This is a **career ladder assessment application** that helps visualize and track engineering career progression through different levels and competencies.

#### Core Data Model (`src/utils/model.ts`)
- `Expectation` - Individual competency level with content and description
- `Competence` - Group of levels for a specific competency area
- `Category` - Collection of competencies (e.g., Technical Execution, Impact, Leadership)

#### Key Directories
- `src/components/` - Reusable React components
- `src/components/ui/` - shadcn/ui component library
- `src/components/assessment/` - Assessment-specific components
- `src/contexts/` - React contexts (including AuthContext for authentication)
- `src/config/` - Configuration files (including Cognito setup)
- `src/pages/` - Page components (Index, Login, NotFound)
- `src/hooks/` - Custom React hooks for state management
- `src/utils/` - Utility functions including data models and parsers
- `src/data/config.md` - Career ladder configuration in Markdown format
- `src/integrations/supabase/` - Supabase client and types (legacy)

#### Assessment System
The app implements a multi-step assessment wizard:
- **Configuration parsing** (`src/utils/configParser.ts`) - Parses Markdown config into data structures
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
- `vite.config.ts` - Vite configuration with path aliases (`@/` → `./src/`)
- `vitest.config.ts` - Test configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `components.json` - shadcn/ui configuration

### Path Aliases
- `@/` resolves to `./src/` for clean imports

This application focuses on engineering career development, providing structured assessment tools and visualization of competency progression across technical execution, impact, collaboration, and leadership domains.