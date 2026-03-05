# Gtaurus

**Gtaurus** is a high-performance, lightweight CNC Desktop Controller designed for MKS DLC32 v2.1 boards running FluidNC. It is built on the **T3-Tauri Stack** (Tauri v2, Rust, React, TypeScript, Tailwind CSS).

## 🚀 Technical Architecture

Gtaurus uses a modular architecture to share core CNC logic across different deployment targets.

### 📦 Shared Core Library (`gtaurus_common`)

- **Location**: `deps/gtaurus_lib` (Submodule)
- **Functions**:
  - Cross-platform **FluidNC Driver** implementation.
  - **Buffering**: Implements **Character Counting Protocol** with a 127-byte lookahead buffer.
  - **Connection Management**: Abstracted traits for Serial and Telnet/TCP communication.
  - **Observer Pattern**: Platform-agnostic event emission (Tauri events vs. Terminal/WebSocket streams).

### 🖥️ Desktop App (`gtaurus-app`)

- **Frontend**: React + Vite + TypeScript.
  - `Zustand` for UI state, `TanStack Query` for server state.
  - `dockview` for customizable, draggable panels.
- **Backend**: Tauri v2 (Rust).
  - Wraps `gtaurus_common` to provide desktop-integrated CNC control.
  - Emits all controller traffic as `fluidnc://rx` Tauri events.

### 🌐 Standalone Server (`gtaurus_server`)

- **Location**: `deps/gtaurus_server` (Submodule)
- **Functions**:
  - Headless WebSocket bridge for remote web access.
  - Wraps `gtaurus_common` to provide hardware access to browser clients.

## 🛠️ Prerequisites

- **Node.js** (v18 or later recommended)
- **Rust** (Stable toolchain)
- **Git** (Required for submodules)
- **Visual Studio Code** (Recommended IDE) with Tauri and Rust Analyzer extensions.

### 📷 Camera Support (Optional)

To use the built-in Camera Viewer and hardware settings manager in Gtaurus:

- You must have a camera physically connected to your CNC host machine.
- **Dependency**: [Crowsnest](https://github.com/mainsail-crew/crowsnest) must be installed on your Linux host (specifically v4+ supporting `ustreamer` or `camera-streamer`).
- **Configuration Path**: The server expects your Crowsnest config to be located at `~/printer_data/config/crowsnest.conf` (standard for Moonraker/Mainsail setups).
- **Auto-Bootstrapping**: If Crowsnest is installed globally via root, Gtaurus Server will automatically migrate it to a user-level `systemd` service (`systemctl --user ...`) on startup. This enables seamless, passwordless camera restarts when adjusting settings (brightness, exposure, etc.) from the UI.
- **Conflict Warning**: You must manually stop and disable the global system-level Crowsnest service entirely (`sudo systemctl disable --now crowsnest`) to prevent port conflicts with the new local user-level process driving the Gtaurus controls.

## 📦 Installation & Setup

1. **Clone the repository with submodules**:

    ```bash
    git clone --recursive https://github.com/moffatted/gtaurus.git
    cd gtaurus
    ```

2. **Install Dependencies & Build Core Components**:

    ```bash
    npm install
    ```

    *Note: The `postinstall` script automatically builds the shared library and the standalone server.*

## 🏃‍♂️ Usage

Gtaurus supports **two deployment modes**: Desktop (Tauri) and Web (via Server Bridge).

### 1. Desktop Mode (Tauri) - Recommended

Runs as a native application with full hardware access.

```bash
npm run tauri:dev   # Development
npm run tauri:build # Production Build
```

### 2. Web Mode & Remote Access

Allows control via any device on your network (phone, tablet, etc.).

1. **Start the Server Bridge** (Handles USB/Serial communication):

    ```bash
    npm run server
    # OR manually via cargo:
    cd deps/gtaurus_server && cargo run
    ```

2. **Start the Web Frontend**:

    ```bash
    npm run dev
    ```

## 🛠️ Build & Run Commands

| Command | Description |
| --- | --- |
| `npm install` | Installs JS deps and builds Rust library/server |
| `npm run build:all` | Builds Lib, Server, and Web frontend |
| `npm run server` | Starts the bridge server via `cargo run` |
| `npm run tauri:dev` | Launches the desktop app in dev mode |
| `npm run dev` | Launches the web frontend in dev mode |

| To recursively update submodules:

  ```bash
  git submodule update --init --recursive
  ```

## 📂 Project Structure

```text
gtaurus/
├── deps/                   # Shared Dependencies (Git Submodules)
│   ├── gtaurus_lib/        # Core G-code Driver & Protocol Logic
│   └── gtaurus_server/     # Headless WebSocket Server
├── src/                    # Frontend React Code
├── src-tauri/              # Desktop App Backend (Rust)
├── docs/                   # Documentation & Guides
└── package.json            # Unified build and dependency management
```

## 🧪 Testing

Gtaurus has a multi-layered testing strategy covering frontend, shared logic, and backend.

- **Frontend**: `npm run test` (Vitest + React Testing Library)
  - **Coverage**: `npm run test:coverage` (Target: 80% stores/components)
- **Shared Driver Logic** (`gtaurus_lib`): `npm run test:rust` (Cargo tests)
  - **Coverage**: ~73% (Measured via `cargo tarpaulin` in `deps/gtaurus_lib`)
- **Standalone Server** (`gtaurus_server`): Cargo tests in `deps/gtaurus_server`
  - **Coverage**: ~58%
- **End-to-End**: `npm run test:e2e` (WebdriverIO + Tauri integration)

---

## 🤝 Contributing

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request.

---

## 🔌 FluidNC References

| Resource | URL |
| --- | --- |
| FluidNC Wiki | <http://wiki.fluidnc.com> |
| Gtaurus Alarm Guide | [docs/FLUIDNC_ALARM_GUIDE.md](docs/FLUIDNC_ALARM_GUIDE.md) |
