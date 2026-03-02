# Tool Changer Implementation Strategy

In CNC machining, an Automatic Tool Changer (ATC) eliminates manual bit swaps. However, for a basic machine with manual changes, a **Tool Changer Service** provides critical functions to ensure the process is safe, fast, and accurate.

## Core Functions for Manual Assistance

### 1. Automated Positioning

The system automatically moves the spindle to a pre-defined **Tool Change Position**.

* **Manual Assistance**: Moves the spindle to an easily accessible area (e.g., front of the machine) so the user doesn't have to reach over workpieces or clamps.

### 2. Automatic Tool Length Measurement (Z-Zeroing)

This is the most helpful feature for manual users. Every bit has a different length; changing a bit usually requires re-zeroing the Z-axis.

* **The Assist**: Uses a fixed **Electronic Tool Setter (ETS)**. After the new bit is loaded, the machine moves to the probe, measures the new length, and updates the **Tool Length Offset (TLO)**. This ensures cut depths remain perfectly accurate across tool changes.

### 3. Safety Lockouts

* **Spindle Control**: Ensures the spindle is at 0 RPM before moving.
* **Interlocks**: Prevents machine movement while the user is swapping the bit.

### 4. Software Management

* **Tool Table**: The software tracks the current tool ID (e.g., "Tool #3: 1/4 inch End Mill").
* **User Prompts**: Pauses the job and displays clear instructions: *"Please insert Tool #5 (V-Bit) and press Resume."*

---

## FluidNC Manual Tool Change (atc_manual)

FluidNC provides an `atc_manual` feature specifically for machines like yours (MKS DLC32). It automates the "homing" and "probing" steps of a manual change.

## Implementation on MKS DLC32 v2.1

Your MKS DLC32 board has a dedicated **Probe (S-G)** port. You can use this for a fixed touch probe (ETS).

### 1. Hardware Connection

* Connect a fixed touch probe to the `Probe` port on your DLC32.
* Ensure the probe is securely mounted at a constant location on your machine bed (outside the working area but within reach of the spindle).

### 2. Configuration (config.yaml)

You would configure the `atc_manual` section in your FluidNC config:

```yaml
atc_manual:
  tool_change_mpos: [10.0, 10.0, -5.0]  # Safe spot to change bit (Machine Coords)
  probe_mpos: [50.0, 50.0, -10.0]       # Location of your fixed ETS probe
  probe_feed_rate: 100                  # Probing speed
  probe_seek_rate: 500                  # Initial search speed
  probe_clearance: 5.0                  # Distance to retract after probe
```

### 3. The Workflow

1. **Initial Setup**: Prompt the user to zero the workpiece (G54) with the first tool.
2. **M6 Command**: When G-code calls `T2 M6`, FluidNC pauses and moves to `tool_change_mpos`.
3. **Swap Bit**: User replaces the tool.
4. **Resume**: User clicks Resume in GTaurus.
5. **Auto-Probe**: The machine moves to `probe_mpos`, probes the new tool, and calculates the difference from the initial tool length.
6. **TLO Applied**: `G43.1` (Dynamic Tool Length Offset) is applied to keep the original Z-Zero valid.
7. **Job Resumes**: Machining continues with the new tool at the correct height.

## Summary for GTaurus

GTaurus can assist by monitoring the `M6` state, providing a dedicated "Swap Tool" popup with a "Probe & Resume" button, and managing the Tool Table visualization for the user.
