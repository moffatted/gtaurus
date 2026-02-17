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

### Start Development Server
This runs the React dev server and opens the Tauri application window with hot-reloading enabled.
```bash
npm run tauri dev
```

### Build for Production
Creates an optimized release build for your OS.
```bash
npm run tauri build
```
The executable will be located in `src-tauri/target/release/bundle/`.

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
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.
