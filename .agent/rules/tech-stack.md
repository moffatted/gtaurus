---
trigger: always_on
---

# Tech Stack

This project is a Tauri desktop app with a TypeScript frontend and Rust backends.

## Core Frameworks

- **Vite 7**: Frontend build and dev server.
- **React 19**: Frontend UI library.
- **Tauri v2**: Desktop runtime and command bridge (`src-tauri` directory).

## Languages

- **TypeScript 5.8**: Strict mode enabled.
- **Rust**: Native backend logic for Tauri and service crates.
- **Node.js**: Tooling/runtime for frontend and scripts.

## Styling

- **Tailwind CSS 4.0**: Utility-first CSS framework.
- **PostCSS**: CSS transformation tool.

## State & Data

- **Zustand**: Client state management.
- **TanStack Query v5**: Async data and cache management.

## Rust Crates In Repo

- **gtaurus_server** (`deps/gtaurus_server`): Standalone Rust bridge/service.
- **gtaurus_lib** (`deps/gtaurus_lib`): Shared Rust library abstractions and transport logic.

## Validation

- **Zod**: TypeScript schema/input validation.
- **Rust type system + `Result`**: Backend validation and error handling.

## Icons

- **Lucide React**: Icon library.

## Testing & Quality

- **Vitest + Testing Library**: Frontend unit/integration tests.
- **WebdriverIO**: Desktop E2E test flow.
- **Cargo test/check**: Rust verification for `src-tauri`, `deps/gtaurus_lib`, and `deps/gtaurus_server`.

## Engineering Direction

- Apply T3 principles where practical: strict typing, validated boundaries, predictable data flow.
- Prefer narrow, typed Tauri commands and explicit error mapping between Rust and TypeScript.
- Use Tauri v2 APIs and avoid legacy v1 patterns.
