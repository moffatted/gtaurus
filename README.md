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
  - Headless WebSocket bridge for remote web access, ideal for running on small Single Board Computers (like a Raspberry Pi) connected directly to your CNC machine.
  - Wraps `gtaurus_common` to provide hardware access to browser clients.

## 🛠️ Prerequisites

- **Node.js** (v18 or later recommended)
- **Rust** (Stable toolchain)
- **Git** (Required for submodules)
- **Visual Studio Code** (Recommended IDE) with Tauri and Rust Analyzer extensions.

### ⚡ System Requirements

Because Gtaurus splits its architecture between a bridging server and a heavy visual client, hardware requirements differ based on where components run:

- **Backend Host (`gtaurus_server`)**: Extremely lightweight headless Rust binary. It can comfortably run on older hardware or low-power Single Board Computers (like a Raspberry Pi 3 or Pi Zero 2 W) strapped directly to the CNC machine.
- **Frontend Client (Browser / Tauri App)**: The UI utilizes WebGL-based hardware acceleration (Three.js) for real-time, million-point 3D rendering of the Carve Preview and stock displacement.
  - *Standard PC / Mac*: Any moderately modern machine with integrated graphics or a dedicated GPU will handle this effortlessly.
  - *Raspberry Pi Client*: If you are running the frontend UI directly on a Raspberry Pi (e.g. attached to a touchscreen), you must use a **Raspberry Pi 4B (4GB+ RAM)** or **Raspberry Pi 5** for a smooth framerate during complex 3D simulation playback.

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

Before running the application, decide how Gtaurus will connect to your CNC machine. We support three primary connection methods to match how your workshop is set up:

1. **USB (Serial) Connection**: Best for rock-solid reliability.
   - **Scenario**: Your laptop/desktop (or a Raspberry Pi) is sitting right next to your CNC machine and plugged in directly using a USB cable.
   - **Why use it?**: This is the traditional, bulletproof way to stream G-code. It requires zero network setup and drops the risk of a Wi-Fi disconnect ruining a 3-hour carve.

2. **Telnet (Wi-Fi) Connection**: Best for clean, wire-free workshops.
   - **Scenario**: Your CNC controller (like an ESP32-based MKS DLC32) is joined to your shop's Wi-Fi network. You want to sit at a desk across the room with your laptop.
   - **Why use it?**: You hate tripping over cables. Modern FluidNC boards can receive streaming G-code over Wi-Fi via Telnet. You simply type your CNC's IP address (e.g., `192.168.1.55`) into the Gtaurus connection panel and gain full control instantly without stringing out a long USB cord.
   - **Default Port**: FluidNC uses Telnet port **23** by default.

3. **Bridge Server Connection**: Best for remote access using tablets or older laptops.
   - **Scenario**: You have a tiny, heavily-protected Raspberry Pi plugged into the CNC via USB in the dusty shop. You want to use a nice iPad or your powerful office PC to actually run the UI and complex 3D visualizations.
   - **Why use it?**: The iPad connects to the Raspberry Pi over the network. The Pi runs the lightweight `gtaurus_server` bridge, which securely handles the physical USB connection to the CNC. If your iPad goes to sleep or disconnects from Wi-Fi, the Pi keeps running the G-code safely in the background.
   - **Default Ports**: The `gtaurus_server` bridge accepts real-time WebSocket connections on port **9001** and simultaneously hosts a basic HTTP server for the web app UI on port **1420**.
   - **Changing Ports**: If these default ports conflict with other services running on your network/host, you can easily change them by editing the `server_config.json` file that is automatically generated next to the compiled `gtaurus_server` binary upon its first run. Simply edit the `"port"` (WebSocket) or `"http_port"` (Web UI) fields and restart the server.

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

## 🛠️ Build & Run Commands

| Command | Description |
| --- | --- |
| `npm install` | Installs JS deps and builds Rust library/server |
| `npm run build:all` | Builds Lib, Server, and Web frontend |
| `npm run server` | Starts the bridge server via `cargo run` |
| `npm run tauri:dev` | Launches the desktop app in dev mode |
| `npm run dev` | Launches the web frontend in dev mode |
| `npm run dev:all` | Launches both the bridge server and web frontend concurrently |

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

## 🔙 Retroactive GRBL 1.1 Compatibility

Because FluidNC is a direct descendant/port of Grbl v1.1, the core communication protocol between the two is identical. That means Gtaurus is highly reverse-compatible with any standard Grbl v1.1 board (e.g. older Arduino Uno CNC shields) via USB connection:

- **What Works Perfectly:** The 127-byte lookahead buffering, real-time polling/status reporting, jogging, probing, and the complete 3D Carve Visualizer feature set.
- **What Does NOT Work:** The FluidNC Config Editor panel (standard GRBL still uses `$x=y` numerical settings, whereas FluidNC uses a YAML tree), FluidNC-specific Alarm Code interpretation, and Telnet network connectivity (unless you have a custom Wi-Fi bridge).

*Note: You can turn on the "Enable Legacy GRBL 1.1 Mode" toggle in the Gtaurus Machine Settings panel to automatically hide unsupported FluidNC features.*

---

## 🔌 FluidNC References

| Resource | URL |
| --- | --- |
| FluidNC Wiki | <http://wiki.fluidnc.com> |
| Gtaurus Alarm Guide | [docs/FLUIDNC_ALARM_GUIDE.md](docs/FLUIDNC_ALARM_GUIDE.md) |
