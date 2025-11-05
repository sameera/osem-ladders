# Web Application

Career ladder assessment application for engineering competency tracking and visualization.

## Overview

This React application helps engineers and managers assess career progression through different competency levels across various domains including:

- Technical Execution
- Impact
- Collaboration
- Leadership

## Local Development

From the monorepo root:

```sh
# Start development server
pnpm dev

# Or using Nx directly
nx serve web

# Build for production
nx build web

# Run tests
nx test web

# Lint code
nx lint web
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```
VITE_BRANDING_APP_NAME=Your App Name
VITE_COGNITO_REGION=your-region
VITE_COGNITO_USER_POOL_ID=your-pool-id
VITE_COGNITO_USER_POOL_CLIENT_ID=your-client-id
VITE_COGNITO_DOMAIN=your-cognito-domain
```

See [AUTHENTICATION_SETUP.md](./AUTHENTICATION_SETUP.md) for detailed authentication configuration.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and builds
- **Tailwind CSS** for styling
- **shadcn/ui** component library (Radix UI primitives)
- **React Query** for state management
- **React Router** for navigation
- **Vitest** for testing
- **AWS Cognito** for authentication (Microsoft 365 OIDC)

## Key Features

- Multi-step assessment wizard
- Competency level tracking
- Data visualization (radar charts, level charts)
- PDF report generation
- Dark/light mode
- Microsoft 365 authentication
- Responsive design

## Project Structure

```
src/
├── components/        # Reusable React components
│   ├── ui/           # shadcn/ui components
│   └── assessment/   # Assessment-specific components
├── contexts/         # React contexts (Auth, Theme)
├── config/           # Configuration files
├── pages/            # Page components
├── hooks/            # Custom React hooks
├── utils/            # Utility functions and parsers
└── data/             # Career ladder configuration
```

## Documentation

- [AUTHENTICATION_SETUP.md](./AUTHENTICATION_SETUP.md) - Authentication setup guide
- [SETUP_SUMMARY.md](./SETUP_SUMMARY.md) - Setup summary
