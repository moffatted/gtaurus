# Job Resume Strategy: Guided State Reconstruction

Building a robust "Job Resume" system requires a multi-layered approach to ensure machine safety and state integrity. Unlike traditional senders that treat G-code as a simple text stream, Gtaurus treats every job as a **structured, visual, and host-managed process**.

## Philosophy: The Guided State Reconstruction

The most effective way to think about a resume wizard is as a **Guided State Reconstruction System**. It restores the machine to the exact modal, spatial, and tool state it inhabited at the last confirmed line, then safely repositions and continues the job.

### Why Gtaurus is Uniquely Positioned

- **Visual Context**: Click any segment on the 3D toolpath to resume from that exact spot.
- **Material Awareness**: Use volumetric carve simulation to detect if the resume path avoids unintended contact with remaining material.
- **Tool-Aware Context**: Track mid-tool-change states and resume from the appropriate phase.
- **AR/Camera Verification**: Overlay the resume point on the live camera feed for physical alignment checks.
- **Wizard-Driven UX**: Guide the user step-by-step through re-homing, re-probing, and state verification.

---

## 1. Tracking: The Host-Side Checkpoint

A robust resume system depends on capturing a complete snapshot of the machine state at the moment of interruption.

### Essential State Elements

Every time FluidNC acknowledges a line, Gtaurus captures:

- **Acknowledged State**: The last fully confirmed G-code line and command text.
- **Machine Position**: XYZ coordinates in machine or work offsets.
- **Active Coordinate System**: The current work offset (`G54`–`G59`).
- **Modal State**: Motion (`G0`/`G1`), planes (`G17`/`G18`/`G19`), distance mode (`G90`/`G91`), feed mode, and units.
- **Tool State**: Current tool number, tool length offset, and "mid-change" status.
- **Spindle & Feed**: Spindle state (on/off), RPM, and active feed rate (`F` value).
- **Job Metadata**: File hash, bounding box, total lines, and current toolpath index.

**Implementation Detail**: This state should be persisted to a `.resume.json` file every $N$ seconds (e.g., 5s) or on critical events to ensure recovery after power loss.

---

## 2. The Recovery Wizard Flow

A good resume wizard is a conversation between the sender and the machine, with the user validating each step.

### Step-by-Step Recovery

1. **FluidNC State Check**: Detect if the controller is in an `ALARM` state.
    - Use `$X` or `$Alarm/Disable` to clear soft alarms.
    - Use `0x18` (Ctrl+X) for critical halts (e.g., Hard Limit triggers).
2. **File Validation**: Confirm the current G-code file matches the `.resume.json` original hash.
3. **State Reconstruction**: The wizard guides the user through restoring the environment:
    - **Re-home** (`$H`): Mandatory if power was lost or manual movement occurred.
    - **Re-probe Z**: Recommended if the tool was changed or position is suspect.
    - **Restore Modals**: Reapply necessary G-code modal commands (G90, G21, G17, etc.).
    - **Load Tool**: Ensure the correct tool is physically and logically loaded.
    - **Spindle Prep**: Reapply RPM but keep the spindle off until the final resume.
4. **Safe Positioning**:
    - Move to a designated **Safe Z Height**.
    - Rapid to the last known **XY coordinate**.
    - Plunge to the last known **Z coordinate**.
5. **Visual Confirmation**: Final user check via 3D toolpath overlay, simulation state, and camera feed.
6. **Resume Streaming**: Skip all lines preceding the checkpoint and begin re-streaming from the next valid motion command.

---

## 3. Implementation Architecture

### The Wizard State Machine

Defined explicit steps for the UI logic:

- `CHECK_FILE`: Verify hash and metadata.
- `RESTORE_HOME`: Run homing cycle if required.
- `RESTORE_PROBE`: Guide Z-probe sequence.
- `RESTORE_MODAL`: Batch send modal and state commands.
- `MOVE_SAFE_Z`: Initial vertical clearance.
- `MOVE_TO_XY`: Horizontal alignment.
- `MOVE_TO_Z`: Final approach.
- `VISUAL_CONFIRM`: Wait for user validation.
- `RESUME_STREAM`: Execute the remaining job.

### Visual Feedback Layers

Enhanced overlays to build user confidence:

- **Toolpath Overlay**: Highlight the resume segment in a distinct color (e.g., pulse orange).
- **Simulation Overlay**: Sync the volumetric stock view to the resume state.
- **Camera View**: Project the recovery point onto the physical workspace.

---

## 4. Safety & Edge Cases

- **Collision Prevention**: The recovery path must be checked against the volumetric stock to ensure the tool doesn't "plunge" through un-carved material during XY positioning.
- **Power Loss Persistence**: The `.resume.json` is the source of truth. It must be flushed to disk frequently.
- **Manual Intervention**: If the machine was moved manually while off/alarmed, **Re-homing is MANDATORY**.
- **State Back-scanning**: If a checkpoint is unavailable, `src/utils/parser.ts` can scan the file from the start to reconstruct the expected modal state at any given line.
