# Camera Viewer Editor Strategy

To implement a streaming and control strategy for gtaurus (running in WebView2) from your Mac Mini (Ubuntu), you need to bridge the gap between the web-based frontend and the local OS using the `gtaurus_server`.

Since WebView2 cannot interact with hardware directly, the service on Port 9001 must act as a Web API/WebSocket Proxy to interact with the camera settings.

Here is the recommended strategy:

## 1. Architecture Overview

**Producer (Mac Mini/Ubuntu):** Utilize the rust service to interact with the camera settings.

- **Transport:** The camera stream itself is on `http://[IP_ADDRESS]:8080/stream`
- **Control:** A REST API or WebSocket for controlling camera settings.

**Consumer (gtaurus/WebView2):** A React/JS frontend that consumes the stream and sends JSON commands to Port 9001.

## 2. The Streaming Strategy (Video)

Crowsnest only supports UVC cameras through the ustreamer backend, not libcamera. The camera for testing is a USB Camera / USB Microscope / Generic UVC device.

Crowsnest gives you:

- A lightweight MJPEG stream.
- Auto‑start as a system service.
- A stable URL you can view remotely.
- Integration with Mainsail/Fluidd (optional).
- Low CPU usage (ustreamer is extremely efficient).

## 3. The Control Strategy (Camera Settings)

To modify settings (Brightness, Contrast, Exposure, Resolution), you must extend the Port 9001 service to handle Control Commands.

### Step 1: Define the API Endpoints

Modify the service to listen for POST requests:

- `GET /settings`: Returns current camera capabilities and values.
- `POST /settings`: Accepts JSON to update parameters (e.g., `{"exposure": 100, "zoom": 2}`).

### Step 2: Backend Hardware Interaction

On Ubuntu, the service should use `v4l2-ctl` (Video4Linux) to apply changes without interrupting the stream:

```python
# Example Python snippet for the service
import subprocess

def set_camera_setting(setting_name, value):
    # Calls the Ubuntu system utility to change hardware settings
    subprocess.run(['v4l2-ctl', '-d', '/dev/video0', '--set-ctrl', f'{setting_name}={value}'])
```

## 4. Implementation Steps

### Phase 1: Enhance the Port 9001 Service

1. **Wrap the Stream:** If you are using ffmpeg or libcamera, wrap it in a web server (like Flask, FastAPI, or Express).
2. **Add Setting Hooks:** Map incoming web requests to `v4l2-ctl` commands or OpenCV `cap.set()` properties.

### Phase 2: Update gtaurus (WebView2)

1. **UI Components:** Create a "Camera Settings" panel with sliders and toggles.
2. **CORS Handling:** Ensure the service on 9001 has CORS enabled, otherwise WebView2 will block the requests from the gtaurus origin.
3. **State Management:** Use `fetch()` to send the slider values to `http://[Mac-Mini-IP]:9001/camera_settings`.

## Summary of Workflow

1. `gtaurus` loads in WebView2 or the web page.
2. `gtaurus` requests `GET http://macmini:9001/settings`.
3. Service queries the existing camera settings via the `gtaurus_server` API. The camera settings are returned as text and made available for the user to edit and save the settings back to host running the camera, should be the same host as gtaurus server.

**Assumptions:**

- If the `gtaurus` tauri app is running on the same host as the camera, the user should be able to edit the camera settings themselves.
- If the `gtaurus` tauri app is running on a different host than the camera, the user should be able to edit the camera settings remotely.
- The user should be able to use a slider to zoom in/out the camera and adjust other camera settings allowed by crowsnest.

## Additional Information

Since you are building a Tauri (Rust) application that can also run as a web server, you have some very powerful low-level options that a standard web developer wouldn't have. You can bridge the gap between the "dumb" USB hardware and your custom UI perfectly.

Here is how to optimize your setup specifically for a **Tauri/Rust environment**:

## 1. Handling the "Snap" Button in Rust

Instead of relying on browser events, you can use a Rust crate like `inputbot` or `enigo` (within your Tauri Command) to listen for the specific HID signal the microscope sends.

> [!TIP]
> **The Trick:** Many of these microscopes emulate a "Volume Up" or "F12" key when the button is pressed.

- **Tauri Implementation:** You can create a "Global Shortcut" or a background listener in your `main.rs` that calls your "Zeroize" function whenever that HID event is detected.

## 2. Low-Latency Video Stream (The "Crosshair" Layer)

In Tauri, you’re likely using an `<img src="http://crowsnest-url:8080/?action=stream">` or a `<video>` tag.

- **The SVG Overlay:** Don't try to draw the crosshair in Rust. In your frontend (React/Vue/Svelte), wrap your webcam feed in a relative `div` and place an absolute SVG crosshair over it.
- **Dynamic Calibration:** Since you wrote the app, you can add a "Calibration Mode" where the user can drag the SVG crosshair with their mouse to align it with a physical mark. Save these top/left pixel offsets in your app's local storage.

## 3. The FluidNC "Macro" Sequence

Since you are using FluidNC, your Rust backend is likely sending G-Code over Serial (or Websocket). You should implement the "Zeroing" as a **State Machine** in your Rust code to ensure it's "blocking" and safe.

### Suggested Logic Flow

1. **User presses button** (Microscope is over the corner).
2. **App sends:** `G10 L20 P1 X0 Y0` (Zeroes G54 at the camera position).
3. **App calculates move:** Read your `config.toml` for the `camera_offset_x`.
4. **App sends:** `G91 G0 X{offset_x} Y{offset_y} F1000` (The "Jump" move).
5. **App sends:** `G90 G10 L20 P1 X0 Y0` (Final zeroing).

> [!NOTE]
> **Safety:** Add a popup in your Tauri UI: *"Spindle moved to Camera Offset. Zeroed."*

## 4. 3D Print Design: "The Spindle-Sleeve"

Since you have a 3D printer, design a split-ring clamp that goes around the 52mm or 65mm (standard) spindle body.

> [!IMPORTANT]
> **The "Droop" Factor:** Make sure the microscope is mounted as close to the spindle axis as possible. The further away it is, the more a tiny 0.5-degree tilt in your Z-axis will ruin your accuracy (this is called **Abbe Error**).

- **Target Working Distance:** For that Cainda X10, aim for a mount that puts the lens exactly **25mm - 40mm** above the workpiece. This usually hits the "sweet spot" where you get enough magnification to see a pencil line, but enough field of view to see the corner of the stock.

## 5. Multi-Platform Considerations (Tauri vs. Web)

- **In Tauri:** Use the `serialport` crate to talk directly to FluidNC. You'll get much better response times than a web server.
- **On Web:** You'll need to proxy your Serial commands through a Websocket (which FluidNC provides natively).

---

> [!TIP]
> **One final tip for a CNC gSender:** Add a "Probe" button right next to your "Camera Zero" button. Sometimes you'll want to use the camera to find the location (XY), but you'll still want to use your touchplate for the depth (Z). Your Tauri app can easily orchestrate this "Combo Zeroing" routine!
