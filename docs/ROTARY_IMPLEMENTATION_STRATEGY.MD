# Rotary Implementation Strategy

Implementing a rotary device on a CNC or laser machine requires thoughtful configuration of kinematics, hardware setup, and firmware state. This guide covers best practices for implementing a rotary axis, with special considerations for FluidNC (our primary target) while fully supporting generic GRBL controllers.

## 1. Types of Rotary Devices (Crucial Distinction)

Before configuring your software or firmware, you must understand how your rotary drives the workpiece:

- **Roller Rotary:** The workpiece rests on driven rollers. Surface speed matches the roller speed.
  - *Key Trait:* The step calibration is tied to the **roller diameter**. Changing the object size does **not** require recalibrating your steps/unit.
- **Chuck Rotary:** The workpiece is clamped in a chuck. The chuck rotates the object from its center.
  - *Key Trait:* The step calibration for linear mapping (Strategy A) is tied to the **object diameter**. If the object diameter changes, the surface distance traveled per rotation changes, meaning you **must** recalibrate.

## 2. Strategy A: Axis Replacement (The "Y-Axis Swap")

This method temporarily "sacrifices" a linear axis (usually Y) to drive the rotary. Most CAM software (like LightBurn) expects this out-of-the-box when enabling "Rotary Mode".

### Strategy A Setup & Calibration

- **Hardware:** Disconnect the Y-axis stepper and connect the rotary motor to the Y-axis port.
- **Generic GRBL ($101):** You must change the Y-axis steps/mm.
- **FluidNC:** Instead of using `$101`, modify the `steps_per_mm` under the `axes:` -> `y:` node in your active `config.yaml`.

### Formulas (Y-Axis Swap)

**For Roller Rotaries:**
`Steps per mm = (Steps per Revolution * Microstepping) / Circumference of ROLLER`

**For Chuck Rotaries:**
`Steps per mm = (Steps per Revolution * Microstepping) / Circumference of OBJECT`
*(Note: Chucks are better suited for Strategy B. If you must use a chuck on Y, you have to recalculate this every time you engrave a new object size).*

## 3. Strategy B: Dedicated 4th Axis (A-Axis)

Retaining X, Y, and Z axes while adding a rotary (A-axis) provides the most flexibility without the need to unplug stepper motors.

### Strategy B Setup & Calibration

- **Generic GRBL (Mega/grblHAL):** Connect to dedicated A-axis outputs. Set `$103` (A-axis steps/unit) to steps **per degree**.
- **FluidNC:** Define an `a:` axis within your `config.yaml`. Connect your step/direction pins to any available ESP32 GPIOs and map them appropriately in the YAML configuration.

### Formula (A-Axis / Chuck)

`Steps per Degree = (Steps per Rev * Microstepping) / 360`
*(Example: 1.8° stepper = 200 steps. With 16x microstepping = 3200 steps/rev. 3200 / 360 = 8.889 steps/degree).*

## 4. Firmware Configurations and Best Practices

### FluidNC Specific Strategy

FluidNC's robust configuration management makes it ideal for handling rotary setups:

1. **Multiple Configurations:** Instead of sending GRBL `$101` codes to swap steps/mm back and forth, maintain two separate configuration files on the controller (e.g., `standard.yaml` and `rotary.yaml`). You can switch between them seamlessly.
2. **YAML Kinematics:** When setting up a dedicated A-axis, ensure your motion kinematics handle rotational limits correctly.
3. **Macros:** Because rotaries don't have limit switches, create a custom macro in the WebUI to "Zero Rotary Axis" which sends `G10 L20 P1 A0` (or Y0) to establish a repeatable work coordinate zero.

### Generic GRBL Modifications ($ Settings)

When adjusting your configuration via `$xxx` parameters or `config.yaml` equivalents:

- **Steps per unit (`$100/$101/$103`):** Adjust based on the formulas above (mm or degrees).
- **Max rate (`$110/$111/$113`):** Rotaries generally require a lower ceiling on speed than linear axes to prevent missed steps due to rotational mass.
- **Acceleration (`$120/$121/$123`):** **CRITICAL:** High acceleration on a rotary causes objects to slip, entirely ruining a roller rotary job. Drop acceleration significantly (e.g., `50–100 mm/s²`) for reliable tracking.

## 5. Operations Checklist

| Action | Command / Note |
| :--- | :--- |
| **Set Current (Vref)** | Ensure the rotary motor's current limit is acceptable for your stepper drivers (whether via trimpot or UART config in FluidNC). |
| **Manage Homing** | Disable homing cycle for the A-axis, or ignore the Y-axis limit during rotary mode, as rotaries lack limit switches. |
| **Set Work Zero** | Use `G92 Y0` or `G10 L20 P1 Y0` (Y-swap) / `G10 L20 P1 A0` (Dedicated) to set your origin position. |
| **Command Movement** | Ensure CAM correctly issues `G1 Y90` (Swap) or `G1 A90` (Dedicated) depending on your configuration. |
| **Roller Tension** | Make sure object weighs enough to grip roller cleanly; apply rubber bands or weights if needed for light objects. |
