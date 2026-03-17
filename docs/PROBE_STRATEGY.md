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

## 6. Probe Types

### Touch-Trigger Probes

- **Mechanical**: Simple switch-based probes that physically contact the surface.
- **Magnetic**: Probes that use magnets to trigger the switch.
- **Optical**: Probes that use light to detect contact.
- **Strain-Gauge**: Probes that measure the force of contact.

### Non-Contact Probes

- **Laser**: Probes that use a laser to measure the distance to the surface.
- **Inductive**: Probes that use an electromagnetic field to detect the presence of a conductive surface.
- **Capacitive**: Probes that use an electric field to detect the presence of a surface.
- **Ultrasonic**: Probes that use sound waves to measure the distance to the surface.

### Wireless Probes

- **Radio Frequency**: Probes that use radio waves to communicate with the controller.
- **Infrared**: Probes that use infrared light to communicate with the controller.
- **Inductive**: Probes that use electromagnetic induction to communicate with the controller.
- **Optical**: Probes that use light to communicate with the controller.

## 7. Categorization and Terminology

In CNC machining, probes and plates are essential for finding "zeros" (offsets) and measuring workpieces or tools. They are generally categorized by what they measure (Workpiece vs. Tool) and how they detect contact (Contact vs. Non-contact).

### 7.1 Workpiece Probes (Spindle-Mounted)

These are held in the machine spindle and used to find the location of the part or measure its dimensions.

- **Touch-Trigger Probes**: The most common type. They send a single signal (trigger) the moment they touch a surface.
  - **Official Names**: Kinematic Probe, 3D Touch Probe, Job Contact Probe.
  - **Variations**:
    - **Kinematic Probes**: Use a mechanical switch (often "six-point" contact) to break a circuit.
    - **Strain Gauge Probes**: Use sensors to detect the force of contact; these are much more accurate and used for high-precision inspection.
- **Scanning Probes**: Unlike touch-trigger probes, these stay in contact with the part and "trace" the surface to gather thousands of data points.
  - **Official Names**: Analog Scanning Probe, Continuous Scanning Probe.
- **3D Sensors (Mechanical/Analog)**: These are often manual tools (like the famous Haimer 3D-Sensor) with a physical dial. They allow the operator to manually "zero" the machine by watching a needle align.

### 7.2 Tool Setters (Table-Mounted)

These stay on the machine table and are used to measure the length and diameter of the cutting tools.

- **Contact Tool Setters**: The tool physically touches a pad on the setter.
  - **Official Names**: Tool Height Setter, Auto Tool Zero, Tool Presetter (on-machine).
- **Non-Contact (Laser) Tool Setters**: A laser beam passes over the table. The machine detects when the cutting tool "breaks" the beam.
  - **Official Names**: Laser Tool Setter, NC (Non-Contact) Tool Probe. These are ideal for measuring very small or fragile tools that might break a physical probe.

### 7.3 Touch Plates (Zeroing Plates)

Often used in hobbyist or router-based CNCs, these are simple metal plates used to set the Z-axis (height) or corner (X and Y) offsets.

- **Z-Zero Plate**: A simple flat plate. You place it on the workpiece, and the machine lowers the tool until it makes an electrical connection with the plate.
  - **Official Names**: Auto Z-Touch Plate, Tool Setting Block.
- **3-Axis / Corner Finders**: An L-shaped or "puck" style plate with a lip. It allows the machine to find the Z-height AND the corner of the material (X and Y) in one routine.
  - **Official Names**: 3-Axis Zero Plate, Corner Finding Touch Plate.

### 7.4 Summary: Official Names vs. Common Terms

| Category | Common Term | Official/Technical Names |
| :--- | :--- | :--- |
| **Workpiece** | Edge Finder / Probe | Touch-Trigger Probe, Kinematic Probe, 3D Sensor |
| **Tooling** | Tool Zero / Height Setter | Tool Setter, Tool Presetter, Laser Tool Probe |
| **Plates** | Z-Plate / Puck | Zeroing Plate, 3-Axis Zero Plate, Auto Z-Plate |
| **Technology** | "Clicky" Probe | Kinematic (Mechanical) Trigger |
| **Technology** | "Eye" Probe | Optical / Vision Probe |
