# Skills Guide for This Workspace (T3 + Tauri)

## Note

This file is a human-facing engineering guide.

Agent-loadable skills should be defined as `SKILL.md` files under
`.agent/skills/<skill-name>/SKILL.md`.

## Purpose

This file defines the engineering skills and standards expected for this project.
It is tuned for a T3-style TypeScript stack running as a Tauri desktop app with Rust services.

## Project Skill Areas

### 1. Type-Safe API Design

- Prefer end-to-end type safety for all app-server boundaries.
- Keep request/response schemas explicit and versionable.
- Validate all external input at the boundary layer before business logic.
- Return typed error shapes instead of unstructured strings.

### 2. Frontend Architecture (React + TypeScript)

- Keep components small and composable; move logic into hooks or services.
- Co-locate UI, hooks, and tests by feature when possible.
- Use strict TypeScript patterns (no implicit any, avoid unsafe casts).
- Favor derived state over duplicated state.

### 3. State and Data Fetching

- Separate server state from local UI state.
- Use clear cache keys and consistent invalidation strategy.
- Handle loading, empty, success, and error states explicitly in UI.
- Avoid hidden side effects in rendering paths.

### 4. Tauri Integration

- Keep Tauri command contracts narrow, typed, and documented.
- Treat all command inputs as untrusted; validate in Rust.
- Minimize privileged command surface area.
- Keep command names stable and avoid breaking changes without migration notes.

### 5. Rust Service Layer

- Use Result-based error flow and map errors to stable app-facing codes.
- Keep transport concerns isolated from domain logic.
- Prefer traits for hardware/transport abstractions to enable mocking.
- Add integration tests for critical protocol paths (serial, tcp, websocket).

### 6. Reliability and Observability

- Add structured logs for command entry, exits, and failures.
- Include correlation ids for multi-step operations where practical.
- Fail fast on invalid configuration with actionable messages.
- Add retries only where idempotency and timing are understood.

### 7. Testing Strategy

- Unit tests for pure logic and parsing/validation.
- Integration tests for transport boundaries and command flows.
- UI tests for critical desktop paths (startup, connect, job run, resume).
- Add regression tests for every production bug fix.

### 8. Security Posture

- No secrets in source control, logs, or client config.
- Sanitize file paths, shell-like inputs, and user-provided identifiers.
- Restrict filesystem and network access to only required scope.
- Review dependency risk regularly for JS and Rust crates.

### 9. Source Control and GitHub Workflow

- Create short-lived feature branches from main with focused scope.
- Keep commits atomic and descriptive; each commit should compile and test.
- Rebase or merge main frequently to reduce integration drift.
- Open pull requests early and update them incrementally.
- Require CI status checks before merge and avoid bypassing protections.
- Capture architecture-impacting decisions in pull request descriptions.
- Use CODEOWNERS and review assignment rules for critical areas.
- Prefer squash merge for small linear changes, merge commit for grouped work.

### 10. Full-Stack Testing for T3 + Tauri + Rust

- Test frontend behavior with component and integration tests for critical flows.
- Test API contracts with schema validation and typed response assertions.
- Test Tauri command handlers for success, validation failures, and permission errors.
- Test Rust service logic with unit tests and transport-level integration tests.
- Add end-to-end desktop tests for startup, connect, run, pause, resume, and stop.
- Mock hardware and transport boundaries to keep CI deterministic.
- Include regression tests for every bug that crossed frontend-backend boundaries.
- Keep test data versioned and reusable across JS and Rust test suites.

## Coding Standards

- Prefer small, focused commits.
- Document behavior changes in README or docs when user-visible.
- Keep public interfaces stable; deprecate before removal when possible.
- Avoid large refactors mixed with behavior changes in one PR.
- After creating or editing any .md file, run markdownlint CLI and fix all warnings.

## Definition of Done Checklist

- Feature is typed end-to-end.
- Error handling is explicit and user-actionable.
- Tests added or updated at the right layer.
- Logging added for important failure paths.
- Docs updated for new commands, settings, or workflows.
- No lint/type/test regressions.

## T3 + Tauri Review Heuristics

Use this quick review lens before merging:

- Is every cross-boundary payload validated?
- Are command failures recoverable in UI?
- Are transport retries bounded and observable?
- Is state ownership clear between UI, cache, and backend?
- Can this behavior be tested without hardware when needed?
