# Web & WebSocket Integration Strategy

When running a Tauri app (or any web application) in a standard web browser, the "superpowers" provided by the Tauri Rust backend are restricted. In desktop (native) mode, Tauri acts as a bridge, allowing the frontend to call Rust functions with full system access (e.g., USB ports via `hidapi` or `rusb`). In a browser, this bridge is unavailable due to the security sandbox.

Below are the primary bridging strategies for achieving hardware or system access from a web context.

## 1. The WebUSB / WebHID API (Pure Browser)

If you want your app to work in a browser without any local software installed, you can use the WebUSB or WebHID APIs directly in your JavaScript/TypeScript frontend.

- **How it works**: Modern browsers (Chrome, Edge, Opera) allow websites to request permission to talk to specific USB devices directly.
- **Limitation**: Only works in Chromium-based browsers. Safari and Firefox do not support WebUSB for security reasons.
- **Best for**: Web-first apps where you want to avoid local installations.

## 2. Sidecar / Local Server Bridge

If your app must run in a browser but also needs native Rust capabilities, you can run a local background process (written in Rust) that exposes a WebSocket or HTTP server.

- **How it works**:
    1. Your Rust backend runs as a standalone "driver" or "agent" on the machine.
    2. Your browser-based frontend connects to `localhost:port` via WebSockets.
    3. The frontend sends commands over the socket; the Rust agent executes the USB call and sends data back.
- **Best for**: Hardware-heavy tools (e.g., 3D printer interfaces) where the UI is in the cloud but the "brain" is local.

## 3. Tauri "Remote" or HTTP Invoke

Tauri V2 supports patterns (and plugins like `tauri-invoke-http`) designed to bridge the gap during development or specific deployment scenarios.

- **The Concept**: Allows your frontend to send "invokes" over a standard HTTP port that the Tauri backend listens to.
- **Catch**: This still requires the Tauri Rust application to be running on the host machine to catch those requests.

## Summary Comparison

| Feature | Desktop Tauri (Native) | WebUSB (Browser) | Local Bridge (WebSocket) |
| :--- | :--- | :--- | :--- |
| **USB Access** | Full (via Rust crates) | Limited (Chromium only) | Full (via Rust agent) |
| **Sandbox** | None (Rust side) | Very Strict | None (Agent side) |
| **Ease of Use** | High (Integrated) | High (No install) | Medium (Requires 2 parts) |
| **Browser Support** | N/A | Chrome/Edge only | All |
