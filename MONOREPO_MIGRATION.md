# Nx Monorepo Migration Summary

This document summarizes the migration from a standalone React application to an Nx monorepo with pnpm.

## What Changed

### Repository Structure

**Before:**
```
osem-ladders/
├── src/
├── public/
├── package.json
├── vite.config.ts
└── ...config files
```

**After:**
```
osem-ladders/
├── apps/
│   └── web/              # React application
│       ├── src/
│       ├── public/
│       ├── package.json
│       ├── project.json  # Nx project config
│       └── ...config files
├── libs/                 # Shared libraries (future)
├── nx.json              # Nx workspace config
├── pnpm-workspace.yaml  # pnpm workspace config
└── package.json         # Root package.json
```

### Package Manager

- **Changed from:** npm
- **Changed to:** pnpm
- **Benefit:** Faster installs, better disk space usage, strict dependency management

### Build System

- **Added:** Nx build system
- **Benefits:**
  - Computation caching (faster builds)
  - Dependency graph visualization
  - Affected command support (only build/test what changed)
  - Better monorepo tooling for adding Lambda functions and shared libraries

### Commands

| Action | Old Command | New Command |
|--------|------------|-------------|
| Install | `npm install` | `pnpm install` |
| Dev server | `npm run dev` | `pnpm dev` or `nx serve web` |
| Build | `npm run build` | `pnpm build` or `nx build web` |
| Test | `npm test` | `pnpm test` or `nx test web` |
| Lint | `npm run lint` | `pnpm lint` or `nx lint web` |
| Deploy | `npm run deploy` | `pnpm deploy` or `nx deploy web` |

### Configuration Changes

1. **Root `package.json`**
   - Now contains workspace-level scripts that delegate to Nx
   - Dependencies hoisted to root for sharing across projects

2. **`apps/web/project.json`**
   - New file: Nx project configuration
   - Defines build targets, executors, and options

3. **`apps/web/vite.config.ts`**
   - Added `root: __dirname` to ensure proper path resolution
   - Updated `build.outDir` to output to `dist/apps/web`

4. **`apps/web/postcss.config.js`**
   - Explicitly specifies Tailwind config path for monorepo compatibility

5. **`pnpm-workspace.yaml`**
   - New file: Defines pnpm workspace packages

6. **`nx.json`**
   - New file: Nx workspace configuration with caching and plugin settings

### Documentation Updates

- **`README.md`** - Updated with monorepo setup and commands
- **`CLAUDE.md`** - Updated with monorepo structure and Nx commands
- **`apps/web/README.md`** - New: Web app-specific documentation
- **App-specific docs** moved to `apps/web/`:
  - `AUTHENTICATION_SETUP.md`
  - `SETUP_SUMMARY.md`

## Benefits of This Migration

### 1. **Scalability**
- Easy to add new applications (Lambda functions, APIs, etc.)
- Shared libraries can be created in `libs/` for code reuse
- Each app maintains its own configuration while sharing dependencies

### 2. **Performance**
- Nx caching speeds up builds (only rebuild what changed)
- pnpm is faster than npm and uses less disk space
- Affected commands only run tasks on changed projects

### 3. **Developer Experience**
- Clear project boundaries and organization
- Nx graph visualization shows project dependencies
- Better tooling for code generation and project scaffolding

### 4. **Future-Ready**
- Ready to add Lambda functions as separate apps
- Can create shared libraries for common code
- Easy to add new frontend apps if needed

## Next Steps

### Adding a Lambda Function

```sh
# Install Node.js plugin (if not already installed)
pnpm add -D @nx/node

# Generate a new Node.js application
nx g @nx/node:application my-lambda --directory=apps/my-lambda

# The new Lambda will be created at apps/my-lambda/
```

### Adding a Shared Library

```sh
# Generate a shared TypeScript library
nx g @nx/js:library my-lib --directory=libs/my-lib

# Use it in your apps
# import { something } from '@osem-ladders/my-lib';
```

### Useful Nx Commands

```sh
# View dependency graph
nx graph

# Build only what's affected by changes
nx affected:build

# Test only what's affected
nx affected:test

# Run multiple tasks in parallel
nx run-many -t build test lint

# Clear Nx cache
nx reset
```

## Troubleshooting

### Build Fails

1. Clear Nx cache: `nx reset`
2. Clear node_modules: `rm -rf node_modules pnpm-lock.yaml`
3. Reinstall: `pnpm install`

### Dev Server Issues

- Ensure you're in the monorepo root
- Check that `apps/web/.env` exists with proper configuration
- Try: `nx serve web --verbose` for detailed output

### Import Path Issues

- The `@/` alias still works within the web app
- For importing from libs, use `@osem-ladders/lib-name`

## Migration Checklist

- [x] Initialize Nx workspace
- [x] Install pnpm as package manager
- [x] Move app to `apps/web/`
- [x] Create Nx project configuration
- [x] Update build configuration
- [x] Fix Tailwind/PostCSS paths
- [x] Test build process
- [x] Test dev server
- [x] Update documentation
- [x] Clean up old configuration

## Rollback

If you need to rollback this migration, check out the commit before this change:

```sh
git log --oneline  # Find the commit hash before migration
git checkout <commit-hash>
```
