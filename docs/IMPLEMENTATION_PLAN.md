# Gtaurus Implementation Plan

## Goal Description
Build a high-performance, lightweight CNC Controller Desktop App ("Gtaurus") for MKS DLC32 v2.1 running FluidNC, using the T3-Tauri stack.

## Proposed Architecture

### Backend (Rust/Tauri)
- **Core Trait:** `CNCController`
    - `connect(&self, port: String, baud: u32) -> Result<()>`
    - `send_command(&self, cmd: String) -> Result<()>`
    - `stream_file(&self, path: String) -> Result<()>`
- **Driver:** `FluidNCDriver` (implements `CNCController`)
    - Handles Character Counting Protocol (buffer management).
    - Parses YAML configurations.
    - Manages state (Connected, Idle, Run, Alarm).
- **Commands:**
    - `list_serial_ports`: Returns available COM ports.
    - `connect_to_board`: Initializes the driver implementation.
    - `stream_gcode_file`: Spawns an async task to stream lines.
    - `send_realtime_command`: Immediate characters (e.g., `!`, `~`).

### Frontend (React/Vite/Tailwind)
- **State Management:**
    - `Zustand`: UI state (Sidebar open/closed, active tab).
    - `TanStack Query`: Server state (Port list, connection status).
- **Layout:**
    - Sidebar: Connection Manager (Port selector, Baud rate, Connect button).
    - Main Area: Tabs for Terminal, DRO, Configurator.
- **Components:**
    - `ConnectionManager`: Handles `list_serial_ports` and connection.
    - `Terminal`: Displays serial output.
    - `DRO`: Shows machine coordinates.

## Dependencies

### Rust
- `tauri`
- `serialport`: For COM port communication.
- `tokio`: For async runtime.
- `serde`, `serde_json`, `serde_yaml`: For serialization.

### Frontend
- `lucide-react`: Iconic interface.
- `zustand`: State management.
- `@tanstack/react-query`: Data fetching/caching.
- `clsx`, `tailwind-merge`: Class utility.

## User Review Required
- **Buffer Strategy:** Confirmation on the specific buffer size (254 chars usually for ESP32/FluidNC, but confirm if user wants configurable).
- **YAML Handling:** Validating `serde_yaml` usage for FluidNC's config format.

## Verification Plan
### Automated Tests
- Unit tests for `FluidNCDriver` logic (mocking the serial port).
- Jest/Vitest for Frontend components.

### Manual Verification
- Connect to a physical MKS DLC32 board if available (or loopback/mock).
- Verify "Plan-Ahead Buffer" logic doesn't overflow.
- Check YAML parsing against a sample `config.yaml`.
