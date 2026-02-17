# Architecture Rules

This project follows the **T3 Stack** architecture with **Next.js App Router**.

## Directory Structure

### Root
- `/app`: Contains the main Next.js and Tauri application source code.
- `/app/src`: Source code root.
- `/app/src-tauri`: Rust backend for Tauri.

### Source Code (`/app/src`)
- **`app/`**: Next.js App Router pages, layouts, and route groups.
  - Use `page.tsx` for views.
  - Use `layout.tsx` for layouts.
  - Collocate components in `_components/` directories within routes when specific to that route.
- **`server/`**: Backend logic.
  - **`api/`**: tRPC routes and definitions.
    - `root.ts`: Root tRPC router.
    - `trpc.ts`: tRPC initialization.
    - `routers/`: Domain-specific routers.
  - **`db/`**: Database configuration and schema (`schema.ts`, `index.ts`).
- **`trpc/`**: Client-side tRPC configuration (`react.tsx`, `server.ts`).
- **`styles/`**: Global styles (`globals.css`).
- **`lib/`**: Shared utilities.
- **`env.js`**: Environment variable schema and validation.

## Architecture Patterns
- **Full-stack Type Safety**: Use tRPC to share types between frontend and backend.
- **Server Actions vs tRPC**: Prefer tRPC for structured API interactions.
- **Database Access**: All database access should go through the Drizzle ORM instance in `server/db`.
- **Environment**: Access environment variables via the `env` object from `~/env`, ensuring validation at runtime.
