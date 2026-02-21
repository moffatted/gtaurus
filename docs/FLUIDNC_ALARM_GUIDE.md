# FluidNC Alarm & Alert Guide

This guide provides instructions on how to clear alerts (alarms) and manage critical states in FluidNC.

## Clearing Alarms

To clear alerts (alarms) in FluidNC, you can use the following commands:

- **`$X` or `$Alarm/Disable`**: This is the most common command used to try and clear the alarm state (unlock the machine).
- **`0x18` (Ctrl+X)**: This performs a **Soft Reset**. It immediately halts motion and resets the firmware. This is often necessary for critical alarms like a "Hard Limit" trigger where a simple unlock isn't enough.

## Common Alarm Commands

| Command | Action | Description |
| :--- | :--- | :--- |
| **`$X`** | Unlock/Clear Alarm | Tries to clear the alarm state and return the machine to an Idle state. |
| **`Ctrl+X`** | Soft Reset | Stops the machine immediately and resets FluidNC. You will likely need to re-home after this. |
| **`$A`** | List Alarms | Displays a list of alarm descriptions so you can identify what caused the alert. |
| **`$A=number`** | View Specific Alarm | Shows the description for a specific alarm code (e.g., `$A=2`). |
| **`$H`** | Homing | Often required after clearing an alarm to re-establish the machine's position. |

## Why an alarm might not clear

If sending `$X` does not work, it is usually because the condition that triggered the alarm is still active. Common reasons include:

- **Hard Limits**: If a limit switch is still being pressed, the alarm will re-trigger immediately. You may need to manually move the axis away from the switch or use a soft reset.
- **Emergency Stop**: If a physical E-Stop button is engaged or a `reset_pin` is active, the controller will stay in an alarm or reset state until the button is released.
- **Unhomed**: If your configuration requires homing (`must_home: true`), the machine will remain in an alarm state at startup until you run the `$H` command.

---

For more details on specific error codes, refer to the [FluidNC Alarm and Error Codes documentation](http://wiki.fluidnc.com/en/features/commands_and_settings).
