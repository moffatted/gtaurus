# Gtaurus

**Gtaurus** is a high-performance, lightweight CNC Desktop Controller designed for MKS DLC32 v2.1 boards running FluidNC. It is built on the **T3-Tauri Stack** (Tauri v2, Rust, React, TypeScript, Tailwind CSS).

## ✨ Features

- **Carve Wizard** — Step-by-step guided setup for sending a G-code file to the machine.
- **Surfacing Wizard** — Generates raster fly-cut / spoilboard surfacing G-code directly in the app. Configurable step-over, angle, depth-per-pass, bidirectional/unidirectional motion, finish pass, and over-travel. Work origin auto-syncs to your configured stock zero position. Opens the result directly in the 3D visualizer. See [docs/CNC_SURFACING_STRATEGY.md](docs/CNC_SURFACING_STRATEGY.md).
- **3D Carve Visualizer** — WebGL-based real-time simulation with height-map displacement, operation playback, and tool-change pausing.
- **Job Resume & Recovery** — Intelligent wizard-driven recovery system for interrupted jobs. Automatically detects interruptions, guides users through safe state reconstruction, performs automatic collision detection, and safely repositions the tool before resuming carving. Features 8-step guided wizard with visual toolpath highlighting. See [docs/JOB_RESUME_STRATEGY.md](docs/JOB_RESUME_STRATEGY.md).
- **AI Assistant** — Integrated AI chat for G-code help and machine troubleshooting.
- **Tool Library** — Manage your bit collection with per-tool type, diameter, and notes.
- **FluidNC Config Manager** — Edit and push FluidNC YAML configuration directly from the UI.
- **Probing** — Guided Z-probe and corner-finding workflows.
- **Camera Viewer** — Live feed from a Crowsnest-managed camera.
- **AutoLevel** — Height-map probing and G-code mesh compensation.
- **Legacy GRBL 1.1 Support** — Compatibility mode for non-FluidNC boards.

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
  - Headless WebSocket bridge for remote web access, ideal for running on small Single Board Computers (like a Raspberry Pi) connected directly to your CNC machine.
  - Wraps `gtaurus_common` to provide hardware access to browser clients.

## 🛠️ Prerequisites

- **Node.js** (v18 or later recommended)
- **Rust** (Stable toolchain)
- **Git** (Required for submodules)
- **Visual Studio Code** (Recommended IDE) with Tauri and Rust Analyzer extensions.

### ⚡ System Requirements

| Component | Hardware | Performance Notes |
|-----------|----------|-------------------|
| **Backend Server** (`gtaurus_server`) | Raspberry Pi 3 / Pi Zero 2 W / older PC | Lightweight headless Rust binary; extremely efficient |
| **Frontend UI** (Browser / Tauri) | Standard PC / Mac with GPU | WebGL-accelerated, handles million-point 3D rendering effortlessly |
| **Frontend UI** (Raspberry Pi) | **Pi 4B (4GB+ RAM)** or **Pi 5** only | Required for smooth 3D simulation playback when running UI directly on Pi |

**Architecture Note**: Gtaurus splits between a lightweight backend server and a heavy visual client, allowing flexible deployment across different hardware capabilities.

### 🖥️ OS-Specific Dependencies

Gtaurus is built with **Tauri v2** and **Rust**, which require native platform components to compile the backend:

#### Windows

- **[Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)**: Required for compiling the Rust backend. (Make sure to check "Desktop development with C++").
- **WebView2**: Required for the frontend to render (Usually pre-installed on modern Windows 10/11 installations).

#### macOS

- **Xcode Command Line Tools**: Required for compiling C/C++ dependencies. Install via terminal:

  ```bash
  xcode-select --install
  ```

#### Linux (Debian/Ubuntu)

You must install the system dependencies required by Tauri's webkit integration. Run the following command:

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

*For Arch, Fedora, or other distributions, check the [Tauri v2 Prerequisites Guide](https://v2.tauri.app/start/prerequisites/#linux).*

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

### 🔌 Connection Scenarios (How & Why)

Before running the application, decide how Gtaurus will connect to your CNC machine. We support three primary connection methods:

#### 1. USB (Serial) Connection — **Rock-Solid Reliability**

- **Setup**: Laptop/desktop (or Raspberry Pi) sits next to CNC machine, connected via USB cable
- **Best for**: Traditional, bulletproof G-code streaming with zero network setup
- **Why?**: Eliminates risk of Wi-Fi disconnect ruining a multi-hour carve

#### 2. Telnet (Wi-Fi) Connection — **Cable-Free Workshops**

- **Setup**: CNC controller (ESP32-based MKS DLC32, etc.) joined to shop Wi-Fi; you control from desk across room
- **Best for**: Modern FluidNC boards with remote control capability
- **Why?**: No tripping hazards, instant IP-based control (e.g., `192.168.1.55:23`)
- **Default Port**: FluidNC Telnet uses port **23**

#### 3. Bridge Server Connection — **Remote Access & Tablet Support**

- **Setup**: Raspberry Pi plugged into CNC via USB in workshop; iPad or office PC controls UI remotely
- **Best for**: Separating heavy UI rendering from the CNC machine connection
- **Why?**: If iPad sleeps or disconnects, Pi continues running G-code safely in background
- **Default Ports**:
  - WebSocket (real-time commands): **9001**
  - HTTP (web UI): **1420**
- **Customizing Ports**: Edit `server_config.json` (auto-generated next to binary) to change `"port"` (WebSocket) or `"http_port"` (Web UI) values

### 1. Desktop Mode (Tauri) - Recommended

Runs as a native application with full hardware access.

```bash
npm run tauri:dev   # Development
npm run tauri:build # Production Build
```

### 2. Web Mode & Remote Access

Allows control via any device on your network (tablet, laptop, or desktop computer). *Note: The complex grid UI is currently optimized for larger screens and is not recommended for mobile phones.* This architecture is split into two parts: the backend server (running on the machine connected to the CNC) and the frontend UI.

1. **Start the Server Bridge** (Handles USB/Serial communication):

    If you are developing or running on a full OS with Node installed:

    ```bash
    npm run server
    ```

    **Headless Host Deployment (e.g., Raspberry Pi)**:
    When deploying purely for remote access on a headless host, you only need the compiled Rust backend binary; Node.js is not required.

    ```bash
    cd deps/gtaurus_server
    cargo build --release
    # Run the compiled binary directly (you can also configure this as a systemd service)
    ./target/release/gtaurus_server
    ```

2. **Start the Web Frontend**:

    ```bash
    npm run dev
    ```

3. **Run Both Concurrently** (Faster):

    If you want to run the server bridge and the web frontend in a single terminal window:

    ```bash
    npm run dev:all
    ```

## � Job Resume & Recovery

Gtaurus includes an intelligent **Job Resume** system that automatically detects when a carving job has been interrupted and guides you through a safe, step-by-step recovery process. This is especially valuable for expensive jobs or long-running operations where starting over would be costly.

### When Job Resume is Triggered

The Job Resume wizard automatically activates when:

- A job is **paused and then interrupted**
- **Power loss** occurs (if checkpoint file exists)
- A **machine alarm** is triggered mid-carve
- A **manual stop** is initiated during an active job

### How to Use Job Resume

When an interruption is detected, Gtaurus will open the **Resume Wizard** with the following 8-step guided process:

1. **Checkpoint Summary** — Review job details (file, line number, tool, position)
2. **Machine Status Check** — Verify machine is in a recoverable state (Idle/Hold)
3. **File Validation** — Confirm the G-code file hasn't been modified
4. **Home Decision** — Determine if re-homing is necessary ($H)
5. **Modal State Restoration** — Restore G-code modes (units, distance mode, plane) with one click
6. **Safe Z Approach** — Automatically reposition tool in 3 stages:
   - Stage 1: Rapid to safe Z clearance (checkpoint Z + 10mm)
   - Stage 2: Rapid XY to checkpoint position
   - Stage 3: Feed move plunge to resume height
7. **Toolpath Analysis** — Analyze next 50 lines for collision risk and highlight resume segment
8. **Visual Confirmation** — Final user approval with 3D toolpath visualization

### Safety Features

- **Automatic Collision Detection** — Alerts if resuming could collide with remaining stock
- **Safe Z Clearance** — Always moves to safe height before XY repositioning
- **Visual Feedback** — 3D toolpath highlighted in amber at resume point
- **Modal Restoration** — All G-code modes explicitly restored (G20/G21, G90/G91, etc.)
- **File Integrity** — Verifies G-code hasn't been modified

### Recovery Best Practices

**✓ Do:**

- Allow the wizard to complete all steps
- Carefully review the 3D highlight before confirming
- Re-home if machine was moved while off or alarmed
- Ensure correct tool is still loaded

**✗ Don't:**

- Manually edit G-code between checkpoint and resume
- Skip step verification dialogs
- Resume if collision detection shows "High Collision Risk"
- Use a different tool than what was loaded when job interrupted

For detailed information about Job Resume, access the **Help Center** in the app (? button) and select the **"Job Resume & Recovery"** topic.

## �🛠️ Build & Run Commands

| Command | Description |
| --- | --- |
| `npm install` | Installs JS deps and builds Rust library/server |
| `npm run build:all` | Builds Lib, Server, and Web frontend |
| `npm run server` | Starts the bridge server via `cargo run` |
| `npm run tauri:dev` | Launches the desktop app in dev mode |
| `npm run dev` | Launches the web frontend in dev mode |
| `npm run dev:all` | Launches both the bridge server and web frontend concurrently |

To recursively update submodules:

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

Gtaurus has a multi-layered testing strategy covering frontend, shared logic, and backend:

### Test Layers & Coverage

- [x] **Frontend**: `npm run test` (Vitest + React Testing Library)
  - [x] Coverage target: 80% (stores/components) — `npm run test:coverage`
- [x] **Shared Driver Logic** (`gtaurus_lib`): `npm run test:rust` (Cargo tests)
  - [x] Coverage: ~73% (measured via `cargo tarpaulin`)
- [ ] **Standalone Server** (`gtaurus_server`): Cargo tests in `deps/gtaurus_server`
  - [ ] Coverage: ~58% (target: 80%+)
- [x] **End-to-End**: `npm run test:e2e` (WebdriverIO + Tauri integration)

---

## 🤝 Contributing

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request.

---

## 🔙 Retroactive GRBL 1.1 Compatibility

Because FluidNC is a direct descendant/port of Grbl v1.1, the core communication protocol between the two is identical. Gtaurus is highly reverse-compatible with any standard Grbl v1.1 board (e.g. older Arduino Uno CNC shields) via USB connection.

### Feature Compatibility

**✓ Works Perfectly:**

- 127-byte lookahead buffering
- Real-time polling/status reporting
- Jogging and probing workflows
- Complete 3D Carve Visualizer feature set

**✗ Not Supported:**

- ~~FluidNC Config Editor panel~~ (GRBL uses `$x=y` settings; FluidNC uses YAML)
- ~~FluidNC-specific Alarm Code interpretation~~ (different alarm systems)
- ~~Telnet network connectivity~~ (unless custom Wi-Fi bridge added)

**Tip**: Enable **"Legacy GRBL 1.1 Mode"** in Machine Settings to automatically hide unsupported FluidNC features.

---

## 🔌 FluidNC References

| Resource | URL |
| --- | --- |
| FluidNC Wiki | <http://wiki.fluidnc.com> |
| Gtaurus Alarm Guide | [docs/FLUIDNC_ALARM_GUIDE.md](docs/FLUIDNC_ALARM_GUIDE.md) |
