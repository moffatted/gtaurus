# Gtaurus

**Gtaurus** is a high-performance, lightweight CNC Desktop Controller designed for MKS DLC32 v2.1 boards running FluidNC. It is built on the **T3-Tauri Stack** (Tauri v2, Rust, React, TypeScript, Tailwind CSS).

## 🚀 Technical Architecture

### Frontend (User Interface)
-   **Framework**: React + Vite + TypeScript
-   **State Management**: 
    -   `Zustand` for UI state (sidebar toggles, active tabs, theme preferences).
    -   `TanStack Query` for server state (serial ports, connection status).
    -   `Tauri Store Plugin` for persistent configuration (theme settings).
-   **Styling**: Tailwind CSS + `clsx`/`tailwind-merge` with CSS variables for theming.
-   **Icons**: Lucide React.
-   **Window Docking**: \`dockview\` for customizable, draggable panels.
-   **Testing**: \`vitest\` with \`@testing-library/react\` and \`jsdom\` for component and unit testing.
-   **Communication**: Invokes Tauri commands to communicate with the Rust backend.

### Backend (System Layer)
-   **Core**: Rust (`src-tauri`).
-   **Async Runtime**: `tokio` for non-blocking I/O.
-   **Serial Communication**: `serialport` crate.
-   **Driver Logic**: Custom `CNCController` trait and `FluidNCDriver` struct.
    -   **Buffering**: Implements **Character Counting Protocol** with a 127-byte lookahead buffer to prevent overflowing the ESP32's RX buffer.
    -   **Streaming**: dedicated thread for streaming G-code files line-by-line.
    -   **Realtime**: Bypass channel for immediate commands (`!`, `~`, `?`).

## 🛠️ Prerequisites

-   **Node.js** (v18 or later recommended)
-   **Rust** (Stable toolchain)
-   **Visual Studio Code** (Recommended IDE) with Tauri and Rust Analyzer extensions.

## 📦 Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/gtaurus.git
    cd gtaurus/gtaurus-app
    ```

2.  Install Frontend Dependencies:
    ```bash
    npm install
    ```

3.  (Optional) Install Rust Dependencies manually (usually handled automatically by Tauri):
    ```bash
    cd src-tauri
    cargo check
    cd ..
    ```

## 🏃‍♂️ Usage

Gtaurus supports **two deployment modes**: Desktop (Tauri) and Web (Browser).

### Desktop Mode (Tauri) - Full Features

**Development:**
```bash
npm run tauri:dev
```
This runs the React dev server and opens the Tauri application window with hot-reloading enabled.

**Production Build:**
```bash
npm run tauri:build
```
Creates an optimized release build for your OS. The executable will be located in `src-tauri/target/release/bundle/`.

**Features Available:**
- ✅ **FluidNC Manager**: Execute commands and manage configuration files.
- ✅ **Emergency Stop**: Software E-Stop button sending immediate Soft Reset (`0x18`).
- ✅ **Integrated Consoles**: G-code terminal with history and real-time control buttons.
- ✅ **Digital Readout (DRO)**: Real-time axis positions (WPos/MPos), feed rate, and spindle speed.
- ✅ **Tooltip System**: Contextual help throughout the interface.
- ✅ **DockView Layout**: Rearrangeable and dockable windows for maximum workspace customization.
- ✅ **Tool Changer**: Integrated panel for tool changing setup.
- ✅ **Bed Visualizer**: 3D interactive viewer (`@react-three/fiber`) of the CNC bed, spindle position, toolpaths, and autolevel meshes.
- ✅ Serial port communication with CNC hardware
- ✅ Theme persistence via Tauri Store
- ✅ Full desktop integration

---

### Web Mode (Browser) - Limited Features

**Development:**
```bash
npm run dev
```
Starts the Vite dev server on `http://localhost:3000`. Open in your browser.

**Production Build:**
```bash
npm run build:web
npm run preview
```
Creates an optimized web build in the `dist/` directory.

**Important Note on Web Mode:**
Because Gtaurus uses Tauri's Inter-Process Communication (IPC) to talk to the Rust serial driver, opening the web version in a standard browser means **USB Serial communication is disabled**. The frontend cannot talk to your local USB ports without the Rust backend.
*(If you need to talk to the CNC without the desktop app, FluidNC has its own built-in web server you can connect to by typing the CNC's IP address into your browser).*

**Features Available:**
- ✅ Theme switching (persisted via localStorage)
- ✅ UI preview and testing
- ❌ Serial port communication (requires desktop app)

**Note:** Serial communication features are disabled in web mode with an informational message displayed in the sidebar.

## 🛑 Stopping the Application
-   **Development**: Close the application window or press `Ctrl+C` in the terminal where `npm run tauri dev` is running.
-   **Production**: Simply close the application window.

## 📝 Logging
Logs are generally output to the terminal in development mode.
-   **Frontend Logs**: Inspect Element -> Console.
-   **Backend Logs**: Visible in the terminal that launched the app.

## 📂 Project Structure

```
gtaurus-app/
├── src/                # Frontend React Code
│   ├── components/     # UI Components (Sidebar, Terminal, etc.)
│   ├── App.tsx         # Main Layout
│   └── main.tsx        # Entry Point
├── src-tauri/          # Backend Rust Code
│   ├── src/
│   │   ├── driver.rs   # FluidNC Driver & Buffering Logic
│   │   └── lib.rs      # Tauri Command Exports
│   └── Cargo.toml      # Rust Derivatives
└── package.json        # Node Dependencies
```

## 🤝 Contributing
1.  Fork the project.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request.

---

## 🔌 FluidNC References

Gtaurus is purpose-built for boards running **FluidNC** firmware.

| Resource | URL |
|---|---|
| FluidNC Firmware | https://github.com/bdring/FluidNC |
| FluidNC Web UI (ESP3D-WEBUI) | https://github.com/michmela44/ESP3D-WEBUI |
| FluidNC Wiki (Commands, Settings, Config) | http://wiki.fluidnc.com |
| FluidNC Wiki — Commands & Settings | http://wiki.fluidnc.com/en/features/commands_and_settings |
| Gtaurus FluidNC Alarm Guide | [docs/FLUIDNC_ALARM_GUIDE.md](docs/FLUIDNC_ALARM_GUIDE.md) |

### Target Hardware
- **Board**: MKS DLC32 v2.1 running FluidNC
- **USB**: Connected to 2010 Mac Mini
- **WiFi**: `192.168.68.64` (local network, used for remote development/testing)

### Connection Modes
| Mode | Address | Notes |
|---|---|---|
| Serial/USB | e.g. `/dev/cu.usbserial-...` | 115200 baud, Grbl character-counting protocol |
| WiFi WebSocket | `ws://192.168.68.64/ws` | Same text protocol over WebSocket; preferred for remote dev |
| WiFi HTTP | `http://192.168.68.64/command?commandText=<cmd>` | One-shot commands only |

### FluidNC Protocol Notes
- **Wire format**: Grbl-compatible line-based text (`command\n` → `ok\n` or `error:N\n`)
- **Realtime bytes**: `?` (status), `!` (feed hold), `~` (resume), `0x18` (soft reset) — sent without `\n`, bypass the buffer
- **`$` commands**: FluidNC-specific actions (`$Home`, `$MD`, `$G`, `$I`, etc.). Machine config is in `config.yaml`, not `$$` numbered settings.
- **Event format**: Tauri backend emits all received lines as `fluidnc://rx` events to the frontend

## 🧪 Testing Infrastructure

Gtaurus uses a comprehensive testing strategy covering the frontend, backend, and end-to-end (E2E) integration.

### Frontend Unit & Component Tests

We use **Vitest**, **React Testing Library**, and **JSDOM** to test React components and TypeScript utilities.
- **Run fast tests in watch mode:** `npm run test:watch`
- **Run tests once:** `npm run test`
- **Run tests with UI:** `npm run test:ui`

### Backend Rust Tests

Rust core logic, including the FluidNC driver, buffering, and commands, are tested with cargo's built-in test runner.
- **Run Rust tests:** `npm run test:rust` (or `cargo test` from the `src-tauri` directory)

### End-to-End (E2E) Desktop Tests

We use **WebdriverIO (WDIO)** to run automated E2E tests against the compiled Tauri desktop application. This ensures all parts of the tech stack (React + Tauri + Rust) communicate correctly in a real operating system environment.
- **Run E2E tests:** `npm run test:e2e`

*Note: running the E2E tests will automatically build a debug version of the Tauri application before executing the WebDriverIO test suite.*
