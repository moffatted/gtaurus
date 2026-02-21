---
trigger: always_on
---

# Tech Stack

This project uses the T3 Stack extended with Tauri for desktop support.

## Core Frameworks
- **Next.js 15**: Using the App Router (`app` directory).
- **React 19**: Frontend UI library.
- **Tauri v2**: For building the desktop application (`src-tauri` directory).

## Languages
- **TypeScript 5.8**: Strict mode enabled.
- **Node.js**: Runtime environment.

## Styling
- **Tailwind CSS 4.0**: Utility-first CSS framework.
- **PostCSS**: CSS transformation tool.

## API & Data Fetching
- **tRPC v11**: End-to-end typesafe APIs.
- **TanStack Query v5 (React Query)**: For data fetching and state management (integrated via `trpc-react-query`).
- **SuperJSON**: For data serialization.

## Database
- **PostgreSQL**: Relational database.
- **Drizzle ORM**: TypeScript ORM.
- **postgres**: PostgreSQL client for Node.js.

## Validation
- **Zod**: Schema validation for environment variables and API inputs.
- **@t3-oss/env-nextjs**: Type-safe environment variable management.

## Icons
- **Lucide React**: Icon library.

## Tauri V2
"Always refer to Tauri V2 documentation at https://v2.tauri.app/ and avoid using v1 'tauri::Command' patterns."