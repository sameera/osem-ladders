# OSEM Ladders

This project is a full-stack application for assessing and tracking engineering career ladders. It's a monorepo managed with `pnpm` and `nx`, containing a React-based web frontend and a Node.js backend API.

## Project Overview

*   **Purpose**: To provide a tool for engineers and managers to assess and track competency levels against a defined career ladder.
*   **Technologies**:
    *   **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
    *   **Backend**: Node.js, Fastify, TypeScript, esbuild, DynamoDB
    *   **Monorepo**: pnpm, nx
*   **Architecture**:
    *   `apps/web`: A React single-page application that provides the user interface for the career ladder assessment.
    *   `apps/api`: A Node.js application that serves as the backend API, handling data storage and business logic. It uses Fastify as the web framework and interacts with AWS DynamoDB for data persistence.
    *   `libs/*`: A directory for shared libraries (currently empty).

## Building and Running

### Prerequisites

*   Node.js (v18+)
*   pnpm

### Development

1.  **Install Dependencies**:
    ```bash
    pnpm install
    ```

2.  **Run the entire application (frontend and backend)**:
    *   **Frontend**:
        ```bash
        pnpm dev
        ```
        This will start the web app on `http://localhost:8080`.
    *   **Backend**:
        ```bash
        cd apps/api
        pnpm dev
        ```
        This will start the API server in development mode, watching for changes.

### Building for Production

*   **Build the web app**:
    ```bash
    pnpm build
    ```
*   **Build the API**:
    ```bash
    cd apps/api
    pnpm build
    ```

### Testing

*   **Run web app tests**:
    ```bash
    pnpm test
    ```
*   **Run API tests**:
    ```bash
    cd apps/api
    pnpm test
    ```

## Development Conventions

*   **Code Style**: The project uses ESLint for code linting. Run `pnpm lint` in the root directory to check the web app's code style.
*   **Commits**: (No explicit commit message convention found, but you can infer from `git log` if needed).
*   **Testing**: Both the web and API applications use Vitest for testing. Test files are located in the `tests` directory within each application.
*   **Authentication**: Authentication is handled via AWS Cognito with Microsoft 365 OIDC. See `apps/web/AUTHENTICATION_SETUP.md` for more details.
*   **Database**: The backend uses AWS DynamoDB for data storage. There is a `db-setup` script in the root `package.json` that can be run with `pnpm db-setup`.
