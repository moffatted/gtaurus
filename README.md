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
    npm run build:server
    # Then run the binary from deps/gtaurus_server/target/debug/gtaurus_server
    ```

2. **Start the Web Frontend**:

    ```bash
    npm run dev
    ```

## 🛠️ Build Commands

| Command | Description |
| --- | --- |
| `npm install` | Installs JS deps and builds Rust library/server |
| `npm run build:all` | Builds Lib, Server, and Web frontend |
| `npm run build:lib` | Builds the shared `gtaurus_common` library |
| `npm run build:server` | Builds the standalone WebSocket server |
| `npm run tauri:dev` | Launches the desktop app in dev mode |

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

- **Frontend**: `npm run test` (Vitest + React Testing Library)
- **Backend Logic**: `npm run test:rust` (Cargo tests for driver logic)
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
