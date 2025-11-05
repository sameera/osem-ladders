# OSEM Ladders Monorepo

Engineering career ladder assessment application - Nx monorepo with pnpm.

## Monorepo Structure

This repository uses **Nx** as the build system and **pnpm** as the package manager.

```
osem-ladders/
├── apps/
│   └── web/          # Main React application (career ladder assessment)
├── libs/             # Shared libraries (future)
├── nx.json           # Nx workspace configuration
└── pnpm-workspace.yaml
```

## Prerequisites

- **Node.js** (v18+) - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **pnpm** - Install with: `npm install -g pnpm`

## Getting Started

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd osem-ladders

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

The development server will start on [http://localhost:8080](http://localhost:8080).

## Available Commands

### Development
- `pnpm dev` - Start development server for web app
- `pnpm build` - Build web app for production
- `pnpm build:dev` - Build web app in development mode
- `pnpm lint` - Lint web app
- `pnpm test` - Run tests for web app
- `pnpm preview` - Preview production build

### Nx Commands
- `nx serve web` - Start dev server
- `nx build web` - Build web application
- `nx test web` - Run tests
- `nx lint web` - Lint application
- `nx graph` - View project dependency graph
- `nx affected:build` - Build only affected projects
- `nx affected:test` - Test only affected projects

### Deployment
- `pnpm deploy` - Deploy to GitHub Pages

## Technologies

- **Nx** - Monorepo build system
- **pnpm** - Fast, disk space efficient package manager
- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Radix UI component library
- **AWS Cognito** - Authentication (Microsoft 365 OIDC)

## Applications

### Web App (`apps/web`)

Career ladder assessment application for engineering competency tracking.

See [apps/web/AUTHENTICATION_SETUP.md](apps/web/AUTHENTICATION_SETUP.md) for authentication configuration.

## Adding New Projects

### Add a Lambda Function

```sh
# Create a new Node.js application
nx g @nx/node:application my-lambda --directory=apps/my-lambda

# Or use the Nx console in your IDE
```

### Add a Shared Library

```sh
# Create a new TypeScript library
nx g @nx/js:library my-lib --directory=libs/my-lib
```

## Project Documentation

- [CLAUDE.md](CLAUDE.md) - Development guide for AI assistants
- [apps/web/AUTHENTICATION_SETUP.md](apps/web/AUTHENTICATION_SETUP.md) - Authentication setup instructions
- [apps/web/SETUP_SUMMARY.md](apps/web/SETUP_SUMMARY.md) - Web app setup summary
