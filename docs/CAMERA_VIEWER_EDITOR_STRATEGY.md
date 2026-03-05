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
