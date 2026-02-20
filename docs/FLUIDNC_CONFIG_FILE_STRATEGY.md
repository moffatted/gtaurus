# FluidNC Configuration Management

In FluidNC, the `config.yaml` file is stored in the local flash file system (SPIFFS/LittleFS) on the ESP32. You can access it through the Web UI or via terminal commands.

## 1. Where to find it in the Web UI

The file is managed under the FluidNC tab (sometimes labeled "Files" or "SD" depending on the UI version):

- **Location**: Navigate to the FluidNC or SD Card tab in the web interface.
- **Accessing Local Files**: Look for a green folder icon or a button labeled "Manage Local Files". This opens the list of files stored directly on the ESP32's internal flash memory.
- **Download**: Click on the filename (e.g., `config.yaml`) in the list to download it to your computer for editing.
- **Upload**: Click the Upload button (often represented by a cloud or folder icon with an up arrow) within that same "Manage Local Files" window and select your edited `.yaml` file.

## 2. Setting the Active Config

FluidNC can store multiple config files, but it only uses one at a time. After uploading a new file, you must tell the firmware to use it:

- **Command**: In the Web UI console/terminal, type:

  ```gcode
  $Config/Filename=your_filename.yaml
  ```

  *(If you named it exactly `config.yaml`, it is usually the default, but this command ensures it points to the right file.)*

- **Restart**: You must restart the controller for the new settings to take effect.

## 3. Saving "Live" Changes

If you modify settings via the "Settings" tab in the Web UI, these changes are often only applied to the running memory (volatile). To save these live changes permanently back into your `config.yaml` file:

- **Command**: Send `$CD=config.yaml` in the console. This "dumps" the current running configuration into the specified file on the flash memory.

---

## Summary of Web Service Interaction

| Action | Web UI Step / Terminal Command |
| :--- | :--- |
| **Download** | FluidNC Tab → Manage Local Files → Click `config.yaml` |
| **Upload** | FluidNC Tab → Manage Local Files → Upload button → Select file |
| **Apply** | Console → `$Config/Filename=config.yaml` → Restart |
| **Save Live Edits** | Console → `$CD=config.yaml` |

---

## Upload Methods

It can be uploaded via multiple methods, each serving different purposes:

### 1. Via Web Service (Recommended)

This is the standard way to update your configuration without needing special software or physical access to the controller's USB port.

- **How**: Use the FluidNC Web UI browser interface.
- **Pros**: Fast, wireless, and allows you to keep multiple versions of config files on the device.

### 2. Via Serial Port (USB)

Typically used during initial setup or if the Web UI is inaccessible.

- **How**: Use a tool like **FluidTerm** or the **Web Installer** ([install.fluidnc.com](https://install.fluidnc.com)). In FluidTerm, `CTRL+U` initiates a file upload over serial.
- **Pros**: Works even if WiFi is down; essential for "first-time" installation.

### 3. Via SD Card

If your hardware has an SD card slot:

- **How**: Copy `config.yaml` to the SD card manually, then tell FluidNC to use it:

  ```gcode
  $Config/Filename=/sd/config.yaml
  ```

- **Pros**: Fastest for very large files.

> [!IMPORTANT]
> Regardless of how you upload it, you must restart the ESP32 (or send the `$Bye` command) for the new `config.yaml` settings to be parsed and applied by the firmware.
