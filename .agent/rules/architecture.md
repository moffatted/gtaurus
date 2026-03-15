# Architecture Rules

This project follows a TypeScript + Rust desktop architecture using Vite + React + Tauri v2.

## Directory Structure

### Root

- `/src`: React frontend application.
- `/src-tauri`: Main Rust backend for Tauri commands and app state.
- `/deps/gtaurus_lib`: Shared Rust transport/domain abstractions.
- `/deps/gtaurus_server`: Standalone Rust bridge/server executable.

### Frontend (`/src`)

- **`components/`**: Reusable UI components.
- **`hooks/`**: React hooks for view logic.
- **`services/`**: External and command-facing service wrappers.
- **`stores/`**: Zustand stores for shared UI/app state.
- **`utils/`**: Pure helpers and utility logic.
- Keep feature behavior close together and keep view components thin.

### Tauri Backend (`/src-tauri/src`)

- **`commands/`**: Tauri command handlers exposed to the frontend.
- **`driver.rs`**: Device/transport coordination and high-level runtime operations.
- **`state.rs`**: Shared process state and synchronization primitives.
- **`lib.rs`**: Command registration and app wiring.
- Keep command modules focused on transport-safe, validated boundary handling.

### Rust Shared/Server Crates

- **`deps/gtaurus_lib/src`**: Traits, transport implementations, and domain types.
- **`deps/gtaurus_server/src`**: Bridge/server APIs (for example websocket and surfacing helpers).

## Architecture Patterns

- **Typed Boundary Contracts**: Keep TypeScript and Rust contracts explicit and stable.
- **Validation At Edges**: Validate user/config input in TS before invoke and in Rust at command entry.
- **Separation Of Concerns**: UI state in frontend stores, machine/transport state in Rust.
- **Error Mapping**: Convert Rust errors into structured, user-actionable frontend errors.
- **Testability**: Keep pure logic isolated from I/O so it can be unit tested without hardware.
