# Gtaurus Test Implementation Plan

This document outlines the step-by-step technical plan for implementing the
testing strategy detailed in `GTAURUS_TEST_STRATEGY.md`. The plan targets a
Next.js/React frontend with Tailwind CSS and a Tauri v2 / Rust backend.

## Phase 1: Foundation Setup

Currently, some dependencies for testing exist (e.g., `vitest`,
`@testing-library/react`, `webdriverio` for E2E). Phase 1 ensures these are
fully functional and correctly configured.

### 1.1 Frontend (Vitest & React Testing Library)

- **Action**: Verify `vitest.config.ts` (or `vite.config.ts` test block) is
  accurately bridging with Node and JSDOM environments.
- **Action**: Complete `src/setupTests.ts` to include standard matchers
  extending `@testing-library/jest-dom`.
- **Action**: Add global mocks for Tauri v2 IPC (`__TAURI_INTERNALS__` or
  `__TAURI_INVOKE__`) to prevent UI components from crashing when rendered in
  tests due to missing native Tauri APIs.

### 1.2 Backend (Rust)

- **Action**: Update `src-tauri/Cargo.toml` to include testing dependencies:
  - `mockall` for creating robust mock structs.
  - `tokio-test` if needing to step through asynchronous tasks artificially.
- **Action**: Create a `tests/` directory within `src-tauri/` for integration
  tests that span multiple Rust modules.

## Phase 2: Hardware Abstraction Layer & Mocking

Before extensive tests can be written, the core communication logic must be
decoupled to allow testing without physical MKS DLC32 hardware.

### 2.1 The `GCodeConnection` Trait (Rust)

- **Action**: Define a generic asynchronous trait `GCodeConnection` with
  methods like `connect`, `disconnect`, `send`, `read_response`.
- **Action**: Refactor the existing USB Serialport logic to implement this
  trait.
- **Action**: Refactor the existing WebSocket/TCP logic to implement this trait.
- **Action**: Create a `MockController` that implements this trait, returning
  simulated Grbl/FluidNC responses to test parsing rules.

### 2.2 Tauri IPC Mock (TypeScript)

- **Action**: Create `src/utils/testUtils.tsx` containing helper functions
  that override the global Tauri `invoke`.
- **Action**: Create custom test renders that wrap components in necessary
  context providers (TRPC, Zustand stores).

## Phase 3: Writing Core Logic Tests

### 3.1 G-Code Parser & Status Reporting

- **Action**: Write Vitest specs for `parseStatusReport` to guarantee all
  edge-case FluidNC status strings (e.g., missing `<` or split packets) are
  handled without crashing the UI thread.
- **Action**: Write Cargo unit tests validating checksum calculations and basic
  G-Code sanitization (e.g., stripping comments).

### 3.2 Buffer Management & Streamer Logic

- **Action**: Test the "Character Counting Queue" logic. Ensure that standard
  Grbl 128-byte chunk limits wait accurately for the `ok` responses before
  flushing further blocks to the hardware.

## Phase 4: Component & UI Testing

### 4.1 React Component Tests

- **Action**: Write tests for the `ControlsPanel` (spindle toggle, jogging
  controls) to verify clicks dispatch correct IPC commands.
- **Action**: Ensure Tailwind UI conditional rendering behaves as expected for
  standard states (Idle -> Green, Alarm -> Red/Emergency UI).
- **Action**: Test TRPC query/mutation hooks using Mock Service Worker (MSW).

### 4.2 Zustand/Jotai Store Tests

- **Action**: Test state mutability decoupled from UI elements. Feed simulated
  IPC callbacks to stores and verify store parameters update flawlessly.

## Phase 5: End-to-End (E2E) Automation

### 5.1 WebDriverIO / Playwright Configuration

- **Action**: Review and harden `wdio.conf.ts` for automated UI driver
  execution against the Tauri binary.
- **Action**: Write a "Happy Path" smoke test: Application launch -> Virtual
  Connect -> Load simple G-code file -> Emulate job completion.
- **Action**: Write an "Emergency Halt" test: Verifying `$X` clears simulated
  hardware alarms.

## Summary Checklist for Next Execution Step

- [x] Implement `GCodeConnection` Trait in Rust and refactor existing connections to use it.
- [x] Create the `MockController` implementation for Cargo tests.
- [x] Establish base Tauri mock environment in `setupTests.ts` and write a basic parser test.
- [x] Write Vitest specs for `parseStatusReport` to guarantee all edge cases.
- [x] Test the "Character Counting Queue" logic.
- [x] Write React UI tests for `ControlsPanel`.
- [ ] Configure WebDriverIO/Playwright for E2E testing against the Tauri binary.
- [ ] Write a "Happy Path" smoke test: Application launch -> Virtual Connect -> Load simple G-code.
