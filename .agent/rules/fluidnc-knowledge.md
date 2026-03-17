---
trigger: always_on
---

# FluidNC Command & Alarm Knowledge

This rule ensures the agent follows best practices for managing FluidNC alarms and commands.

## Clearing Alarms

- **Unlock**: Use `$X` or `$Alarm/Disable` to clear soft alarms.
- **Soft Reset**: Use `0x18` (Ctrl+X) for critical halts (e.g., Hard Limit triggers).
- **Homing**: Often required after clearing to re-establish the coordinate system.

## Command Reference

- `?`: Status report (Real-time).
- `!`: Feed hold (Real-time).
- `~`: Resume (Real-time).
- `$A`: List all alarm code descriptions.
- `$A=[num]`: Show description for a specific alarm number.
- `$H`: Execute homing cycle.

## Troubleshooting Alarm Persistence

- If `$X` fails, the trigger condition is likely still active (e.g., limit switch pressed, E-Stop engaged).
- `must_home: true` in config will keep the machine in Alarm state at startup until `$H` is run.

For deeper troubleshooting, refer to `docs/FLUIDNC_ALARM_GUIDE.md`.
