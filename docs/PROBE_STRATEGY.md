# Probe Configuration Strategy

Configuring a probe on a CNC machine involves several layers of settings, ranging from physical hardware behavior to the software parameters that control how the machine moves during a probe cycle.

Beyond just the **Type of Probe** (e.g., touch-trigger, strain-gauge, or laser), here are the typical configuration options and parameters grouped by category for implementation in Gtaurus.

## 1. Movement and Feedrate Parameters

These define how fast and how far the probe moves during a cycle.

- **Fast Feedrate (Search Feed)**: The speed at which the probe first moves toward the part until it makes contact.
- **Slow Feedrate (Measuring Feed)**: After the initial touch, the probe retracts and touches again more slowly to ensure high accuracy and repeatability.
- **Retract Distance**: How far the probe moves away from the surface after the first "fast" touch before performing the "slow" measurement touch.
- **Max Travel / Search Distance**: A safety limit defining how far the probe is allowed to travel without finding a surface. Triggering this prevents "poking" into empty space or crashing.

## 2. Physical and Transmission Settings

Controls the probe's electronics and communication with the CNC controller.

- **Signal State (NO/NC)**: Defines whether the "triggered" state occurs when the circuit is completed (Normally Open) or broken (Normally Closed).
- **Switch-Off Method**: For wireless/battery-powered probes (timer-based, optical signal, or physical move).
- **Transmission Power**: Adjustable levels to balance battery life against range.
- **Trigger Filter (Debounce)**: A delay setting that prevents false triggers caused by vibrations or coolant droplets.

## 3. Calibration Data (Offsets)

Calibration tells the machine the exact physical geometry of the probe relative to the spindle.

- **Stylus Ball Diameter**: The actual measured size of the probe tip.
- **Effective Length (Z-Offset)**: The distance from the spindle nose to the trigger point.
- **Concentricity/Runout**: Compensation for the probe not being perfectly centered.
- **Deflection Offsets (Lobing)**: Compensation for different trigger forces in X+/X- and Y+/Y- directions.

## 4. Safety and Interaction Settings

- **Protected Positioning**: A mode where the probe is "live" during regular positioning moves.
- **Overtravel Limits**: The distance the stylus can physically "bend" before damage occurs.
- **Hard Stop vs. Deceleration**: Choice between immediate emergency stop or controlled deceleration upon trigger.

## 5. Cycle Logic (Macro Variables)

Configures what the machine does with the result:

- **WCO (Work Coordinate Offset) Update**: Automate updating G54/G55 after a successful probe.
- **Tolerance Checks**: Define limits for a "failed" part measurement.
- **Tool Breakage Tolerance**: Max allowable difference in length for tool-setter probes.
