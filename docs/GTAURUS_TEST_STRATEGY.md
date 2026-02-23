# Gtaurus Test Strategy

## 1. Vision & Scope

Gtaurus is a cross-platform G-code sender (Windows, Linux, macOS, Browser). The strategy ensures that UI updates do not break hardware communication and that the transition between Native (Serialport) and Web (WebSerial/Websockets) is seamless. The application utilizes a T3-Tauri stack (Next.js, React, Tailwind, and Rust for the desktop core).

## 2. The Testing Pyramid

### A. Unit Testing (Logic & Protocols)

- **Rust Core**: Use `cargo test` for G-code parsing, checksum calculations, and state machine transitions (e.g., Idle -> Run -> Hold). Test logic in complete isolation from the Tauri runtime where possible.
- **Frontend (TS/React)**: Use **Vitest** for running tests and `@testing-library/react` for UI component behavior. Ensure Tailwind classes define the layout correctly without relying on visual regressions where functional tests suffice.
- **Status Parser**: Verify that FluidNC-specific status strings (e.g., `<Idle|MPos:0,0,0|Bf:15,128|FS:0,0|WCO:0,0,0>`) are correctly mapped to the UI state stores (Zustand/Jotai).
- **Zod Validation**: Isolate schema definition tests to ensure validation edges (e.g. malformed inputs for CNC movements) are handled appropriately.

### B. Integration Testing (The Bridge)

- **Tauri IPC**: Mock the Rust backend (via the `@tauri-apps/api/mocks` API or v2 equivalents using `mockIPC`) to test if the Frontend correctly invokes commands (`open_port`, `send_gcode`, `toggle_spindle`) and processes Rust-emitted events.
- **tRPC Integration**: Ensure end-to-end type safety between the frontend data fetching layer (via React Query) and any inner Next.js routers. Use `createCaller` in test files to test server-side logic independently without a server. Mock `tRPC` procedures using `msw` (Mock Service Worker) for frontend components.

### C. Hardware-In-The-Loop (HITL) & Emulation

- **Virtual Controller**: Implement a "Mock Controller" struct in Rust that mimics an ESP32/FluidNC board. This enables testing "Job Completion" and dynamic response parsing without physical hardware.
- **Buffer Management**: Test the "Character Counting" protocol to ensure we do not overflow the MKS DLC32 RX buffer.

## 3. Cross-Platform Validation Matrix

| Platform    | Tech Stack           | Primary Test Focus                                         |
| ----------- | -------------------- | ---------------------------------------------------------- |
| **Windows** | Tauri v2 / WebView2  | Serial Port Latency & Driver compatibility (CH340/CP2102). |
| **macOS**   | Tauri v2 / WKWebView | App Bundling and Permissions for USB Serial access.        |
| **Linux**   | Tauri v2 / WebKitGTK | Udev rules and user permissions for `/dev/ttyUSB0`.        |
| **Browser** | WASM / WebSerial     | Web Worker stability for non-blocking G-code streaming.    |

## 4. Specific Test Scenarios (The "Must-Haves")

1. **The "Safety First" Test**
   - _Scenario_: Connection is lost mid-job, or emergency stop triggers.
   - _Expected_: The UI enters an "Emergency State" (`$Alarm`), Rust attempts a soft-stop if reachable, and the UI prevents further commands until re-synchronized (`$X`).
2. **The FluidNC Config Test**
   - _Scenario_: User requests `$Dump` or `$LocalFS/List`.
   - _Expected_: The parser correctly handles the non-standard Grbl responses, grouping the returned lines into an array / JSON for UI presentation.
3. **High-Speed Streaming**
   - _Scenario_: Streaming a 50,000-line laser engraving file.
   - _Expected_: UI remains responsive (60fps); the Rust backend maintains the hardware buffer at optimal capacity without stalling or crashing.

## 5. Automation Pipeline (CI/CD)

- **Linting & Formatting**: Enforce `cargo clippy`, `cargo fmt`, `eslint`, and `prettier` checks.
- **Type Checking**: Run `tsc --noEmit` to catch TypeScript anomalies before any UI build.
- **Headless Testing (E2E)**: Implement **Playwright** coupled with `tauri-driver` to orchestrate end-to-end interactions across the UI and mocked Rust backend in a virtualized pipeline.
- **Build Checks**: Matrix builds for `.exe` (Windows), `.dmg` (macOS), and `.AppImage`/`.deb` (Linux) via GitHub Actions.

## 6. Implementation Notes for Antigravity Agent

- **Priority 1**: Abstract the "Serial Interface" into a Rust Trait (e.g., `GCodeConnection`). Use this abstract interface in the core business logic, facilitating trivial swapping with a `MockController`.
- **Priority 2**: Use a **Web Worker** or dedicated Tokio tasks for the G-code streamer to prevent UI "jank" and main-thread blocking during intense G-code transmissions.
- **Priority 3**: Include a "Dry Run" (`$C`) mode in the test suite to validate parsed G-code files prior to physical motor engagement.

## 7. Network Resiliency & WiFi Strategy

A. **The "Socket-Drop" Test**

- _Scenario_: The TCP/Websocket connection is dropped due to signal loss.
- _Requirement_: The system must detect the drop within 1.5 seconds via watchdog implementation.
- _Recovery_: Attempt an "Auto-Resume" of the socket. Since MKS DLC32 tracks its own state, query the last processed line number or current WPos to seamlessly update the UI sequence.

B. **Latency-Aware Streaming**

- _Thresholds_:
  - `< 50ms`: Green (Stable).
  - `50ms - 250ms`: Yellow (Warning - Potential stuttering on curves).
  - `> 250ms`: Red (Danger - Buffer underrun likely).
- _Strategy_: If high latency is detected, lower the frequency of status requests (`?`) to prioritize the bandwidth allocated for motion commands.

C. **Handshake Validation**

- _Scenario_: Initial Wi-Fi connection to the ESP32 IP.
- _Requirement_: Acknowledge the FluidNC welcome message via TCP/WebSocket before permitting "Cycle Start", mitigating the risk of issuing movements to standard non-CNC network endpoints.

## 8. T3-Tauri-Rust Best Practices Summary

- **Hardware Traits**: Implement dependency injection pattern in Rust. Use traits (`pub trait CNCController`) so your tests can run seamlessly against a `MockController` that implements the same standard serial / websocket functions.
- **Mocking Tauri IPC in Vitest**: Use `@tauri-apps/api/mocks` or custom global mock bindings (`vi.stubGlobal('__TAURI_INVOKE__', mockFn)`) to simulate responses from Tauri Core in the TS frontend.
- **Mocking tRPC / React Query**: Use Mock Service Worker (MSW) or stub queries directly inside test wrappers to prevent rendering components from performing spurious backend or database calls.
- **Isolate Rust Modules**: Keep Tauri setup code separate from core logic. Move serialization, CRC operations, and text parsing to independent modules to test them without needing `tauri::Builder`.
