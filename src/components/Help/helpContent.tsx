/**
 * @file helpContent.tsx
 * @purpose Definitions and content for help topics, including safety checklists and UI overview.
 */
import { ReactNode } from 'react';
import { GcodeCheatSheet } from './GcodeCheatSheet';

export type HelpCategory = 'general' | 'cheat-sheets';

export interface HelpTopic {
  id: string;
  title: string;
  category: HelpCategory;
  content: ReactNode;
}

function HelpScreenshot({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <figure className="space-y-2 mt-4">
      <img
        src={src}
        alt={alt}
        className="w-full rounded border border-[var(--border-color)] bg-[var(--bg-tertiary)]"
      />
      <figcaption className="text-xs text-[var(--text-tertiary)]">{caption}</figcaption>
    </figure>
  );
}

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Welcome to Gtaurus</h2>
        <p>Gtaurus is a modern control dashboard for FluidNC and GRBL-based CNC machines.</p>
        
        <h3 className="text-lg font-semibold mt-6">Connecting to your Machine</h3>
        <p className="text-sm mb-2">Gtaurus supports three connection methods, each tailored for a specific setup:</p>
        <ul className="list-disc pl-5 space-y-3 text-sm">
          <li>
            <strong>Local USB / Serial:</strong> Direct physical connection to the controller. Offers the lowest latency and highest reliability. <em>Note: Not available when using Gtaurus in a standard web browser.</em>
          </li>
          <li>
            <strong>Local WiFi (Telnet):</strong> Connects directly to the FluidNC controller over your local Wi-Fi. Great for wireless setups without needing a dedicated PC attached to the machine.
          </li>
          <li>
            <strong>GTaurus Bridge (WebSocket):</strong> Used when accessing the dashboard via a web browser to control a machine remotely. Connects to a <code>gtaurus_server</code> running on a host computer physically wired to the CNC machine. Ensure the <code>gtaurus_server</code> is running on the host that is directly connected to the USB port. <strong>Important:</strong> If you are using the GTaurus Bridge to control the CNC, do not use the Local WiFi (Telnet) capability at the same time to avoid conflicts.
          </li>
        </ul>
        <p className="text-sm text-[var(--text-secondary)] mt-3">
          Use the <strong>Connection Panel</strong> in the sidebar to select your mode and connect.
        </p>

        <HelpScreenshot
          src="/help_images/sidebar-connection-panel.png"
          alt="Sidebar Connection panel"
          caption="Connection panel in the left sidebar, where you choose connection mode and initiate connect/disconnect."
        />

        <HelpScreenshot
          src="/help_images/top-menu-bar.png"
          alt="Top menu bar"
          caption="Top menu bar with status, emergency controls, quick-access tools, help, and settings."
        />

        <h3 className="text-lg font-semibold mt-4">Legacy GRBL Support</h3>
        <p className="text-sm mb-2">If you are using an older standard GRBL 1.1 controller instead of FluidNC:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--text-secondary)]">
          <li>Go to <strong>Settings</strong> &gt; <strong>Machine & System Settings</strong>.</li>
          <li>Turn on <strong>Enable Legacy GRBL 1.1 Mode</strong>.</li>
          <li>This will hide FluidNC-specific features (like the Config Editor) that are incompatible with your board.</li>
        </ul>

        <h3 className="text-lg font-semibold mt-4">Safety Checklist</h3>
        <ul className="list-disc pl-5 space-y-2 text-sm text-[var(--text-secondary)]">
          <li>Ensure your machine is properly <strong>Homed</strong> ($H) before starting any job.</li>
          <li>Verify the <strong>Active Tool</strong> matches the tool required by your G-code.</li>
          <li>Set your <strong>Work Zero</strong> (G10 L20) coordinates carefully.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'console',
    title: 'G-code Console',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">G-code Console</h2>
        <p>The console allows direct communication with your machine.</p>
        <ul className="list-disc pl-5 space-y-2">
            <li>Type G-code commands (e.g., <code>G0 X10</code>) and press Enter.</li>
            <li>Use the <strong>Up/Down arrows</strong> to cycle through command history.</li>
            <li>Real-time responses from the controller appear in the log.</li>
            <li><strong>Ctrl+L</strong> clears the console log.</li>
        </ul>
        <div className="bg-[var(--bg-tertiary)] p-3 rounded text-sm font-mono mt-4">
            $H  - Homing Cycle (Required for soft limits)<br/>
            $X  - Unlock Alarm (Use with caution)<br/>
            ?   - Real-time Status Report<br/>
            $I  - Build Info
        </div>

        <HelpScreenshot
          src="/help_images/dashboard-gcode-console-panel.png"
          alt="G-code Console panel"
          caption="Console panel with command input, command history, and controller response log."
        />
      </div>
    ),
  },
  {
    id: 'controls',
    title: 'Machine Controls',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Machine Controls</h2>
        <p>The <strong>Controls</strong> panel is the unified hub of your machine operations, integrating the Digital Readout (DRO) and manual Jogging controls into a single workspace.</p>
        
        <h3 className="text-lg font-semibold mt-4">1. Digital Readout (DRO) & Zeroing</h3>
        <p className="text-sm">The display shows <strong>Work Position (WPos)</strong> as the primary value and <strong>Machine Position (MPos)</strong> below it.</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li><strong>Zeroing:</strong> Click the <strong>Target</strong> icon next to an axis to set its Work Zero ($G10 L20$).</li>
          <li><strong>Zero All:</strong> Use the global zero button in the header (if enabled) to zero X, Y, and Z simultaneously.</li>
        </ul>

        <h3 className="text-lg font-semibold mt-4">2. Jogging & Speed</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>XY Pad & Z Column:</strong> Intuitive directional controls for manual tool positioning.</li>
            <li><strong>Step Size:</strong> Distance the machine moves per click (e.g., 0.1mm, 1mm, 10mm).</li>
            <li><strong>Jog Feed:</strong> The velocity of manual movement (mm/min or in/min).</li>
        </ul>

        <h3 className="text-lg font-semibold mt-4">3. File Selection & Job Status</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>File Selection:</strong> Click the file name or "Load" icon to choose a G-code file from your local system.</li>
            <li><strong>Safety Check:</strong> Gtaurus automatically scans the file for tool numbers and warns you of any mismatches with your active bit.</li>
        </ul>

        <h3 className="text-lg font-semibold mt-4">4. Execution Controls</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded">
            <strong>Start / Resume:</strong> Begins streaming G-code or resumes from a pause.
          </div>
          <div className="p-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded">
            <strong>Pause:</strong> Pauses movement immediately (Feed Hold).
          </div>
          <div className="p-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded">
            <strong>Stop:</strong> Halts the current job and clears the buffer.
          </div>
          <div className="p-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded">
            <strong>Sim (Simulation):</strong> Draws the toolpath in the 3D visualizer without moving the machine.
          </div>
        </div>
        <p className="text-sm">
          <strong>Simulation Speed:</strong> Use the slider to adjust how quickly the toolpath is rendered during simulation.
        </p>

        <HelpScreenshot
          src="/help_images/dashboard-machine-controls-panel.png"
          alt="Machine Controls panel"
          caption="Controls panel containing DRO, jogging controls, file controls, and execution buttons."
        />
      </div>
    ),
  },
  {
    id: 'workflow',
    title: 'Getting Ready to Carve',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Workflow: Getting Ready to Carve</h2>
        <p className="text-sm">Follow these steps in order to ensure a safe and accurate carve.</p>
        
        <div className="space-y-6 mt-4">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center shrink-0 font-bold">1</div>
            <div>
              <h4 className="font-bold">Homing ($H$)</h4>
              <p className="text-sm text-[var(--text-secondary)]">Start by homing your machine. This establishes the machine coordinate system and enables soft limits.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center shrink-0 font-bold">2</div>
            <div>
              <h4 className="font-bold">Load G-code & Bit</h4>
              <p className="text-sm text-[var(--text-secondary)]">Select your file and ensure the correct bit is physically installed and set as "Active" in the Bit Library.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center shrink-0 font-bold">3</div>
            <div>
              <h4 className="font-bold">Jogging to Origin</h4>
              <p className="text-sm text-[var(--text-secondary)]">Use the <strong>Jogging Controls</strong> to move the spindle to your workpiece's intended starting position (usually the bottom-left corner or center).</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center shrink-0 font-bold">4</div>
            <div>
              <h4 className="font-bold">Setting Zero or Probing</h4>
              <p className="text-sm text-[var(--text-secondary)]">Click the <strong>Zero</strong> icons in the DRO to set Work Zero, or use the <strong>Probe</strong> panel to automatically locate the surface of your material.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center shrink-0 font-bold">5</div>
            <div>
              <h4 className="font-bold">Verify & Run</h4>
              <p className="text-sm text-[var(--text-secondary)]">Run a <strong>Sim</strong> if you're unsure of the path, then click <strong>Start</strong> to begin your carve.</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'carve-wizard',
    title: 'Carve Wizard',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Carve Wizard: Step-by-Step</h2>
        <p className="text-sm">
          The Carve Wizard guides you through an 11-step preflight before streaming a job.
          Some steps can render different screens depending on your choices (manual zero vs probe, zero location selection, etc.).
        </p>

        <h3 className="text-lg font-semibold mt-4">Step 1: Power &amp; Homing</h3>
        <p className="text-sm">Confirm machine status and run homing ($H$) if needed before continuing.</p>
        <HelpScreenshot
          src="/help_images/wizards/carve-wizard-step-01-power-homing.png"
          alt="Carve Wizard step 1 power and homing"
          caption="Step 1 checks homing state and provides a direct action to run the homing cycle."
        />

        <h3 className="text-lg font-semibold mt-4">Step 2: Workpiece Placement</h3>
        <p className="text-sm">Physically secure the workpiece and acknowledge that it is clamped or fixtured safely.</p>
        <HelpScreenshot
          src="/help_images/wizards/carve-wizard-step-02-workpiece-placement.png"
          alt="Carve Wizard step 2 workpiece placement"
          caption="Step 2 requires user confirmation that the workpiece is securely placed."
        />

        <h3 className="text-lg font-semibold mt-4">Step 3: File &amp; Dimensions</h3>
        <p className="text-sm">Choose the active file and verify/edit actual workpiece dimensions used for carving setup.</p>
        <HelpScreenshot
          src="/help_images/wizards/carve-wizard-step-03-file-dimensions.png"
          alt="Carve Wizard step 3 file and dimensions"
          caption="Step 3 file selection and editable workpiece dimensions."
        />
        <HelpScreenshot
          src="/help_images/wizards/carve-wizard-step-03b-zero-position-variant.png"
          alt="Carve Wizard step 3 zero position variant"
          caption="Step 3 variant showing zero-position selection relative to the workpiece and fixed job bounds preview."
        />

        <h3 className="text-lg font-semibold mt-4">Step 4: Tooling</h3>
        <p className="text-sm">Verify the active tool and pick the correct tool from the library for this operation.</p>
        <HelpScreenshot
          src="/help_images/wizards/carve-wizard-step-04-tooling-selection.png"
          alt="Carve Wizard step 4 tooling selection"
          caption="Step 4 ensures the loaded physical tool matches the selected library tool."
        />

        <h3 className="text-lg font-semibold mt-4">Step 5: Zero Method</h3>
        <p className="text-sm">Choose how you want to set workspace zero: manual positioning or touch-probe workflow.</p>
        <HelpScreenshot
          src="/help_images/wizards/carve-wizard-step-05-zero-method.png"
          alt="Carve Wizard step 5 zero method"
          caption="Step 5 lets you choose between manual zero and probe-based zeroing."
        />

        <h3 className="text-lg font-semibold mt-4">Step 6: Position Tool</h3>
        <p className="text-sm">Jog to the intended origin using step size controls and XYZ jog buttons.</p>
        <HelpScreenshot
          src="/help_images/wizards/carve-wizard-step-06-position-tool.png"
          alt="Carve Wizard step 6 position tool"
          caption="Step 6 manual jogging interface for precise tool positioning at origin."
        />

        <h3 className="text-lg font-semibold mt-4">Step 7: Set Zero</h3>
        <p className="text-sm">Execute the zero action for the chosen method and confirm the resulting workspace coordinates.</p>
        <HelpScreenshot
          src="/help_images/wizards/carve-wizard-step-07-set-zero-manual.png"
          alt="Carve Wizard step 7 set zero manual"
          caption="Step 7 manual zero variant with explicit X0 Y0 Z0 action."
        />
        <HelpScreenshot
          src="/help_images/wizards/carve-wizard-step-07b-set-zero-probe-variant.png"
          alt="Carve Wizard step 7 set zero probe variant"
          caption="Step 7 probe variant running a touch-plate probe sequence before zero set confirmation."
        />

        <h3 className="text-lg font-semibold mt-4">Step 8: Surface Calibration</h3>
        <p className="text-sm">Select whether to run Auto Level mesh mapping before carving (recommended for uneven surfaces and PCB work).</p>
        <HelpScreenshot
          src="/help_images/wizards/carve-wizard-step-08-surface-calibration.png"
          alt="Carve Wizard step 8 surface calibration"
          caption="Step 8 Auto Level choice: map the surface or skip."
        />

        <h3 className="text-lg font-semibold mt-4">Step 9: End Job Options</h3>
        <p className="text-sm">Define post-job behavior such as optional macro execution at job completion.</p>
        <HelpScreenshot
          src="/help_images/wizards/carve-wizard-step-09-end-job-options.png"
          alt="Carve Wizard step 9 end job options"
          caption="Step 9 post-job action toggle for optional automation after carve completion."
        />

        <h3 className="text-lg font-semibold mt-4">Step 10: Safety Checks</h3>
        <p className="text-sm">Complete final safety confirmations before the machine is allowed to start carving.</p>
        <HelpScreenshot
          src="/help_images/wizards/carve-wizard-step-10-safety-checks.png"
          alt="Carve Wizard step 10 safety checks"
          caption="Step 10 checklist for personal safety, clamping, clearance, and coolant/dust readiness."
        />

        <h3 className="text-lg font-semibold mt-4">Step 11: Ready to Carve</h3>
        <p className="text-sm">Review final job details (file, RPM, feed rate) and press Start Carve when ready.</p>
        <HelpScreenshot
          src="/help_images/wizards/carve-wizard-step-11-ready-to-carve.png"
          alt="Carve Wizard step 11 ready to carve"
          caption="Step 11 final confirmation screen where carving starts."
        />
      </div>
    ),
  },
  {
    id: 'surfacing-wizard',
    title: 'Surfacing Wizard',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Surfacing Wizard: Step-by-Step</h2>
        <p className="text-sm">
          The Surfacing Wizard guides you through selecting a surfacing bit, defining pass parameters,
          previewing the raster toolpath, and generating a ready-to-run G-code file.
        </p>

        <h3 className="text-lg font-semibold mt-4">Step 1: Select Surfacing Bit</h3>
        <p className="text-sm">Choose the tool to use for surfacing. The selected bit diameter drives step-over and line-count calculations.</p>
        <HelpScreenshot
          src="/help_images/wizards/surfacing-wizard-step-01-select-tool.png"
          alt="Surfacing Wizard step 1 select surfacing bit"
          caption="Step 1 tool selection with active surfacing bit highlighted."
        />

        <h3 className="text-lg font-semibold mt-4">Step 2: Configure Pass</h3>
        <p className="text-sm">Set stock dimensions, origin, removal depth, and core toolpath parameters before generation.</p>
        <HelpScreenshot
          src="/help_images/wizards/surfacing-wizard-step-02-configure-pass-stock.png"
          alt="Surfacing Wizard step 2 configure stock and removal"
          caption="Step 2 configuration for stock size, work origin, removal depth, and step-over inputs."
        />
        <HelpScreenshot
          src="/help_images/wizards/surfacing-wizard-step-02b-configure-pass-motion.png"
          alt="Surfacing Wizard step 2 configure motion settings"
          caption="Step 2 continuation with motion settings such as safe Z, feed/plunge rates, spindle RPM, cut direction, and finish pass."
        />

        <h3 className="text-lg font-semibold mt-4">Step 3: Toolpath Preview</h3>
        <p className="text-sm">Review the 2D raster preview to validate line direction, coverage, and expected pass count.</p>
        <HelpScreenshot
          src="/help_images/wizards/surfacing-wizard-step-03-toolpath-preview.png"
          alt="Surfacing Wizard step 3 toolpath preview"
          caption="Step 3 preview of raster lines across the work area with computed summary values."
        />

        <h3 className="text-lg font-semibold mt-4">Step 4: Generate G-code</h3>
        <p className="text-sm">Generate and inspect the output. The wizard shows key run parameters and a G-code snippet before saving.</p>
        <HelpScreenshot
          src="/help_images/wizards/surfacing-wizard-step-04-gcode-ready-preview.png"
          alt="Surfacing Wizard step 4 gcode ready"
          caption="Step 4 generated output view with G-code preview and Save & Open in Visualizer action."
        />

        <h3 className="text-lg font-semibold mt-4">Generated File Result</h3>
        <p className="text-sm">After saving, the surfacing file appears in File Manager and can be loaded directly for visualization or execution.</p>
        <HelpScreenshot
          src="/help_images/wizards/surfacing-wizard-step-05-generated-file-card.png"
          alt="Generated surfacing file in file manager"
          caption="Saved surfacing output file card in File Manager (useful confirmation before running)."
        />
      </div>
    ),
  },
  {
    id: 'bit-management',
    title: 'Bit Library',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Bit Management System</h2>
        <p>Maintain a catalog of your CNC bits and track their usage over time.</p>
        
        <h3 className="text-lg font-semibold mt-4">Tool Catalog</h3>
        <p className="text-sm">Store details like bit type (Endmill, V-Bit, etc.), diameter, flute count, and tool number (T#).</p>

        <h3 className="text-lg font-semibold mt-4">Active Tool</h3>
        <p className="text-sm">Click <strong>"Set Active"</strong> on a bit to mark it as the currently loaded tool. This affects:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--text-secondary)]">
          <li><strong>3D Spindle:</strong> The visualizer will scale the spindle model to match the active bit's diameter.</li>
          <li><strong>Safety Checks:</strong> Gtaurus will warn you if you start a job that requests a different Tool Number.</li>
        </ul>

        <h3 className="text-lg font-semibold mt-4">Usage Tracking</h3>
        <p className="text-sm">Gtaurus automatically records total <strong>Usage Time</strong> and <strong>Cutting Distance</strong> for each bit, helping you plan maintenance or replacement.</p>

        <HelpScreenshot
          src="/help_images/top-menu-bit-library-panel.png"
          alt="Tool Library panel"
          caption="Bit Library panel used to manage tool definitions and set the active tool."
        />
      </div>
    ),
  },
  {
    id: 'macros',
    title: 'Quick Macros',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Macro Management</h2>
        <p>Macros are snippets of G-code that you can run with a single click.</p>
        
        <h3 className="text-lg font-semibold mt-4">Running Macros</h3>
        <p className="text-sm">Open the Macros panel to see your list. Click the Play icon to execute a macro sequence line-by-line.</p>

        <h3 className="text-lg font-semibold mt-4">Creating Macros</h3>
        <p className="text-sm">Go to <strong>Settings &gt; Macros</strong> to add or edit your snippets. Use them for common tasks like:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Tool change positions.</li>
          <li>Special probing routines.</li>
          <li>Spindle warmup cycles.</li>
        </ul>

        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-200 italic">
          <strong>Caution:</strong> Macros execute immediately. Ensure your machine state (position, tool) is safe for the specific macro being run.
        </div>

        <HelpScreenshot
          src="/help_images/dashboard-quick-macros-panel.png"
          alt="Quick Macros panel"
          caption="Quick Macros panel for one-click execution of saved G-code routines."
        />
      </div>
    ),
  },
  {
    id: 'probing',
    title: 'Probing & Workpiece',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Probing & Setup</h2>
        <p>Accurately locate your workpiece and set your zeroes.</p>
        
        <h3 className="text-lg font-semibold mt-4">Probe Configuration Check</h3>
        <p className="text-sm">When you connect to a FluidNC controller, Gtaurus automatically queries the probe configuration using the <code>$probe</code> command. This check verifies that a probe input is properly configured on your controller.</p>
        
        <h4 className="text-base font-semibold mt-3">How It Works</h4>
        <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--text-secondary)]">
          <li>On connection, Gtaurus sends the <code>$probe</code> query to retrieve the probe pin configuration.</li>
          <li>The controller responds with details about the probe input (e.g., <code>pin: gpio.22:low</code>).</li>
          <li>Gtaurus parses this response and displays the configuration status in the <strong>Probe Status</strong> indicator.</li>
        </ul>

        <h4 className="text-base font-semibold mt-3">What the Status Indicator Means</h4>
        <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--text-secondary)]">
          <li><strong>Green indicator</strong> with <em>"Probe configured"</em>: Your probe is properly set up on the controller. Probing operations are available.</li>
          <li><strong>Gray indicator</strong> with <em>"No probe configured"</em>: The controller does not have a probe input configured. Probing operations will not work.</li>
          <li><strong>No indicator</strong>: Not connected, or controller type is unknown. Connect to perform the check.</li>
        </ul>

        <h4 className="text-base font-semibold mt-3">Why This Check Matters</h4>
        <p className="text-sm text-[var(--text-secondary)]">
          A probe should only be used if it is physically installed on your machine AND configured in the controller's settings. Without both, probing will either fail silently or produce incorrect results. The configuration check prevents wasting time attempting probes on machines without probe support.
        </p>

        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-200 italic">
          <strong>💡 Tip:</strong> If you've just installed or configured a probe on your FluidNC controller, disconnect and reconnect to refresh the probe configuration check.
        </div>

        <h3 className="text-lg font-semibold mt-6">Automated Probing</h3>
        <p className="text-sm">Once your probe is confirmed as configured, the Probe panel allows for axis-aligned probing (G38.2).</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li><strong>Operation:</strong> Select between Z, X, Y, or multi-axis probing.</li>
          <li><strong>Max Travel:</strong> Set the maximum distance the probe should move before alarming if no contact is made.</li>
        </ul>

        <h3 className="text-lg font-semibold mt-4">Workpiece Management</h3>
        <p className="text-sm">The Workpiece panel summarizes your current setup, including stock dimensions and work offsets.</p>

        <HelpScreenshot
          src="/help_images/dashboard-probe-panel.png"
          alt="Probe panel"
          caption="Probe panel for axis probing, probe parameters, and zero-set workflows."
        />

        <HelpScreenshot
          src="/help_images/dashboard-workpiece-panel.png"
          alt="Workpiece panel"
          caption="Workpiece panel showing stock setup, dimensions, and related carving context."
        />

        <h3 className="text-lg font-semibold mt-6">3-Axis Touch Plate Visualization (Bed Visualizer)</h3>
        <p className="text-sm">
          Use the touch-plate visualizer to confirm corner orientation and hole placement before running the 3-axis corner probe.
        </p>

        <HelpScreenshot
          src="/help_images/dashboard-bed-visualizer-panel.png"
          alt="3-axis touch plate visualization in the Bed Visualizer"
          caption="The Bed Visualizer showing a 3-axis touch plate positioned at the selected stock corner."
        />

        <h4 className="text-base font-semibold mt-4">How to Enable</h4>
        <ol className="list-decimal pl-5 space-y-1 text-sm">
          <li>Open <strong>Settings -&gt; Probe -&gt; Touch Plate Visualization</strong>.</li>
          <li>Turn on <strong>Show in Bed Visualizer</strong>.</li>
          <li>Set <strong>Touch Plate Length</strong> and <strong>Touch Plate Width</strong>.</li>
          <li>Set <strong>Side Wrap Depth</strong> and <strong>Side Wrap Height</strong>.</li>
          <li>Set <strong>Plate Thick</strong> (Z-Offset) in the Probe panel (for example, 5mm).</li>
        </ol>

        <h4 className="text-base font-semibold mt-4">How to Position Correctly</h4>
        <ol className="list-decimal pl-5 space-y-1 text-sm">
          <li>In the Probe panel, switch to <strong>3-Axis Corner</strong>.</li>
          <li>Select the intended corner dot (<strong>front-left</strong>, <strong>front-right</strong>, <strong>back-left</strong>, or <strong>back-right</strong>).</li>
          <li>Verify the visual touch plate moves to that same stock corner.</li>
        </ol>

        <h4 className="text-base font-semibold mt-4">Hole Location Formula</h4>
        <p className="text-sm text-[var(--text-secondary)]">
          Hole center offset is computed from your probe calibration values:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--text-secondary)]">
          <li><strong>X Offset:</strong> <code>xWallThickness + (holeDiameter / 2)</code></li>
          <li><strong>Y Offset:</strong> <code>yWallThickness + (holeDiameter / 2)</code></li>
        </ul>

        <h4 className="text-base font-semibold mt-4">Pre-Probe Checklist</h4>
        <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--text-secondary)]">
          <li>Corner selection matches physical plate placement.</li>
          <li>Plate dimensions match your hardware.</li>
          <li>Hole appears clearly and is in the expected corner-relative location.</li>
          <li>Z-offset matches actual plate thickness.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'visualizer',
    title: 'Bed Visualizer',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">3D Bed Visualizer</h2>
        <p>The visualizer provides a real-time 3D representation of your CNC environment.</p>

        <h3 className="text-lg font-semibold mt-4">Navigation & View</h3>
        <ul className="list-disc pl-5 space-y-2 text-sm">
            <li><strong>Navigation Cube:</strong> Click the faces of the cube (TOP, FRONT, etc.) to snap the camera to specific views.</li>
            <li><strong>Zoom Controls:</strong> Use the + and - buttons or the scroll wheel to adjust your view distance.</li>
            <li><strong>MPos HUD:</strong> A horizontal bar at the bottom displays real-time machine coordinates and axis orientation.</li>
        </ul>

        <h3 className="text-lg font-semibold mt-4">Interactions</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>Rotate:</strong> Left-click and drag.</li>
            <li><strong>Pan:</strong> Right-click and drag.</li>
        </ul>

        <HelpScreenshot
          src="/help_images/dashboard-bed-visualizer-panel.png"
          alt="Bed visualizer panel"
          caption="Bed Visualizer panel used for 3D orientation, path review, and setup verification."
        />
      </div>
    ),
  },
  {
    id: 'carve-preview',
    title: 'Carve Preview',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Carve Preview</h2>
        <p>The Carve Preview panel provides a true-to-life 3D visualization of your G-code operations, simulating exactly what the bit will carve into the workpiece.</p>

        <h3 className="text-lg font-semibold mt-4">Simulation & Playback</h3>
        <ul className="list-disc pl-5 space-y-2 text-sm">
            <li><strong>Operation Step:</strong> Playback automatically pauses at tool changes, allowing you to review the sequence exactly as your machine will execute it.</li>
            <li><strong>Continuous:</strong> Playback runs straight through the entire file without pausing.</li>
            <li><strong>Scrubber:</strong> Drag the slider along the bottom to jump instantly to any percentage of the carve.</li>
        </ul>

        <h3 className="text-lg font-semibold mt-4">Bit Visualization</h3>
        <p className="text-sm">The 3D preview dynamically adjusts to match the tools assigned in your operation sequence. If you specify a tool type, diameter, or angle (for V-bits), the rendered bit will resize and change shape to match, ensuring your toolpaths are accurately visualized.</p>

        <h3 className="text-lg font-semibold mt-4">Stock Alignment</h3>
        <p className="text-sm">Use the <strong>Align Design</strong> buttons (F-L, Center, etc.) to position the simulated G-code footprint relative to your configured workpiece material dimensions.</p>
      </div>
    ),
  },
  {
    id: 'stats',
    title: 'Machine Stats',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Machine Statistics</h2>
        <p>Track your production efficiency and machine history over time.</p>
        
        <h3 className="text-lg font-semibold mt-4">OEE Metrics</h3>
        <p className="text-sm">Gtaurus calculates <strong>Overall Equipment Effectiveness</strong> based on Availability, Performance, and Quality targets set in your settings.</p>

        <h3 className="text-lg font-semibold mt-4">Utilization Tracking</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li><strong>Machine On Time:</strong> Total time the software has been connected.</li>
          <li><strong>Spindle Hours:</strong> Cumulative time the spindle has been active.</li>
          <li><strong>Job History:</strong> A rolling log of the last 10 jobs with start/end times and status.</li>
        </ul>

        <HelpScreenshot
          src="/help_images/top-menu-machine-statistics-panel.png"
          alt="Machine Statistics panel"
          caption="Machine Statistics panel for OEE and machine utilization trends."
        />
      </div>
    ),
  },
  {
    id: 'dashboard-panels',
    title: 'Dashboard Panels',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Dashboard Panel Reference</h2>
        <p className="text-sm">This reference maps each dashboard panel to its role in day-to-day operation.</p>

        <h3 className="text-lg font-semibold mt-4">File Manager</h3>
        <p className="text-sm">Use this panel to browse, select, and manage G-code files used for simulation and carving.</p>
        <HelpScreenshot
          src="/help_images/dashboard-file-manager-panel.png"
          alt="File Manager panel"
          caption="File Manager panel for selecting and organizing G-code files."
        />

        <h3 className="text-lg font-semibold mt-4">Auto-Leveling</h3>
        <p className="text-sm">Configure probing grid, bounds, and compensation behavior for uneven work surfaces.</p>
        <HelpScreenshot
          src="/help_images/dashboard-auto-leveling-panel.png"
          alt="Auto-Leveling panel"
          caption="Auto-Leveling panel used to configure and run surface compensation routines."
        />

        <h3 className="text-lg font-semibold mt-4">Dashboard Configuration</h3>
        <p className="text-sm">Use dashboard settings to control panel visibility, layout behavior, and default workspace organization.</p>
        <HelpScreenshot
          src="/help_images/settings-dashboard-panel-layout.png"
          alt="Dashboard settings panel"
          caption="Dashboard settings panel for configuring dashboard layout and panel behavior."
        />
      </div>
    ),
  },
  {
    id: 'top-menu-panels',
    title: 'Top Menu Panels',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Top Menu & Popout Panels</h2>
        <p className="text-sm">These panels are launched from the top menu shortcuts for quick access to advanced tools.</p>

        <HelpScreenshot
          src="/help_images/top-menu-bar.png"
          alt="Top menu"
          caption="Top menu with machine status, control shortcuts, and access to utility panels."
        />

        <h3 className="text-lg font-semibold mt-4">AI Assistant</h3>
        <p className="text-sm">The AI Assistant helps with CNC workflows, command suggestions, and troubleshooting guidance.</p>
        <HelpScreenshot
          src="/help_images/top-menu-ai-assistant-panel.png"
          alt="AI Assistant panel"
          caption="AI Assistant panel launched from the top menu."
        />

        <h3 className="text-lg font-semibold mt-4">FluidNC Manager</h3>
        <p className="text-sm">Use this manager for FluidNC-specific configuration and controller-level maintenance actions.</p>
        <HelpScreenshot
          src="/help_images/top-menu-fluidnc-manager-panel.png"
          alt="FluidNC Manager panel"
          caption="FluidNC Manager panel for controller configuration tasks."
        />

        <h3 className="text-lg font-semibold mt-4">Tool Changer</h3>
        <p className="text-sm">The Tool panel supports manual or assisted tool-change workflows tied to active jobs.</p>
        <HelpScreenshot
          src="/help_images/top-menu-tool-changer-panel.png"
          alt="Tool panel"
          caption="Tool panel opened from top-menu tooling controls."
        />
      </div>
    ),
  },
  {
    id: 'settings-dashboard',
    title: 'Settings: Dashboard',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Dashboard Settings</h2>
        <p className="text-sm">Controls which dashboard panels are visible and how your working layout is managed.</p>
        <HelpScreenshot
          src="/help_images/settings-dashboard-panel-layout.png"
          alt="Dashboard settings"
          caption="Dashboard settings for panel order, default size, minimum size, visibility toggles, and layout reset."
        />
      </div>
    ),
  },
  {
    id: 'settings-ui-controls',
    title: 'Settings: UI Controls',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">UI Controls Settings</h2>
        <p className="text-sm">These screens configure interface behavior and interaction details used during day-to-day operation.</p>
        <HelpScreenshot
          src="/help_images/settings-ui-controls-theme-ux.png"
          alt="UI Controls settings screen 1"
          caption="Theme & UX settings, including theme preset selection and UI scale adjustment."
        />
        <HelpScreenshot
          src="/help_images/settings-ui-controls-top-menu-buttons.png"
          alt="UI Controls settings screen 2"
          caption="Top Menu visibility controls for Camera, AI Assistant, Stats, Bit Library, Tool Changer, and FluidNC Manager buttons."
        />
        <HelpScreenshot
          src="/help_images/settings-ui-controls-bed-visualizer.png"
          alt="UI Controls settings screen 3"
          caption="Bed Visualizer settings, including AutoLevel mesh display and Workpiece visualization panel access."
        />
        <HelpScreenshot
          src="/help_images/settings-ui-controls-stats-camera.png"
          alt="UI Controls settings screen 4"
          caption="Stats Display and Camera settings for enabling camera UI, stream URL, and Crowsnest config path."
        />
      </div>
    ),
  },
  {
    id: 'settings-machine-system',
    title: 'Settings: Machine & System',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Machine &amp; System Settings</h2>
        <p className="text-sm">These screens contain machine-level and system behavior settings. Review each screen carefully before applying changes on production hardware.</p>
        <HelpScreenshot
          src="/help_images/settings-machine-system-general.png"
          alt="Machine and System settings screen 1"
          caption="General machine settings: Legacy GRBL mode, carving units, and firmware fallback behavior."
        />
        <HelpScreenshot
          src="/help_images/settings-machine-system-geometry-limits.png"
          alt="Machine and System settings screen 2"
          caption="Machine geometry and safety setup: safe Z height, bed limits, and axis endstop orientation."
        />
        <HelpScreenshot
          src="/help_images/settings-machine-system-connection.png"
          alt="Machine and System settings screen 3"
          caption="Connection settings for WiFi (Telnet) and Serial/USB communication parameters."
        />
        <HelpScreenshot
          src="/help_images/settings-machine-system-monitoring-file-manager.png"
          alt="Machine and System settings screen 4"
          caption="Monitoring and storage settings: status polling interval and File Manager local G-code storage path."
        />
        <HelpScreenshot
          src="/help_images/settings-machine-system-probe-configuration.png"
          alt="Machine and System settings screen 5"
          caption="Probe configuration: probe profile selection, feed/retract/travel values, and touch-plate calibration inputs."
        />
        <HelpScreenshot
          src="/help_images/settings-machine-system-calibration-calculator.png"
          alt="Machine and System settings screen 6"
          caption="Calibration calculator for steps-per-mm using motor steps, microstepping, and roller diameter."
        />
        <HelpScreenshot
          src="/help_images/settings-machine-system-fluidnc-config-motion-limits.png"
          alt="Machine and System settings screen 7"
          caption="FluidNC integration and motion controls: config file switching plus constraints and motion limit values."
        />
        <HelpScreenshot
          src="/help_images/settings-machine-system-ai-assistant.png"
          alt="Machine and System settings screen 8"
          caption="AI Assistant settings for top-menu/dashboard visibility, response style, engine tier, and local model configuration."
        />
      </div>
    ),
  },
  {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Keyboard Shortcuts</h2>
        <table className="w-full text-left text-sm border-collapse">
            <thead>
                <tr className="border-b border-[var(--border-color)]">
                    < th className="py-2">Shortcut</th>
                    <th className="py-2">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
                <tr><td className="py-2 font-mono">?</td><td className="py-2">Send Status Query</td></tr>
                <tr><td className="py-2 font-mono">!</td><td className="py-2">Feed Hold</td></tr>
                <tr><td className="py-2 font-mono">~</td><td className="py-2">Resume / Cycle Start</td></tr>
                <tr><td className="py-2 font-mono">Ctrl+X</td><td className="py-2">Soft Reset (0x18)</td></tr>
                <tr><td className="py-2 font-mono">Up / Down</td><td className="py-2">Cycle Command History</td></tr>
                <tr><td className="py-2 font-mono">Ctrl+L</td><td className="py-2">Clear Console Log</td></tr>
            </tbody>
        </table>
      </div>
    ),
  },
  {
    id: 'job-resume',
    title: 'Job Resume & Recovery',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Job Resume: Recovering from Interruptions</h2>
        <p className="text-sm">Gtaurus provides a complete job recovery system that automatically detects when a job has been interrupted and guides you through a safe, step-by-step resume process.</p>

        <h3 className="text-lg font-semibold mt-6">When Job Resume is Triggered</h3>
        <p className="text-sm">The Job Resume wizard automatically activates when:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--text-secondary)]">
          <li>A job is paused and then interrupted</li>
          <li>Power loss occurs (if checkpoint file exists)</li>
          <li>Machine alarm is triggered mid-carve</li>
          <li>Manual stop is initiated during an active job</li>
        </ul>

        <h3 className="text-lg font-semibold mt-6">The Recovery Wizard: Step-by-Step</h3>
        <p className="text-sm">The wizard guides you through 8 sequential steps to safely restore your machine state and resume carving:</p>

        <div className="space-y-3 mt-4">
          <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded">
            <div className="font-semibold text-sm mb-1">1️⃣ Checkpoint Summary</div>
            <p className="text-xs text-[var(--text-secondary)]">Review the interrupted job details: file name, interrupted line, tool number, and position coordinates.</p>
          </div>

          <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded">
            <div className="font-semibold text-sm mb-1">2️⃣ Machine Status Check</div>
            <p className="text-xs text-[var(--text-secondary)]">Confirms your machine is in a recoverable state (Idle or Hold). If alarmed, you'll need to clear the alarm first.</p>
          </div>

          <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded">
            <div className="font-semibold text-sm mb-1">3️⃣ File Validation</div>
            <p className="text-xs text-[var(--text-secondary)]">Verifies the loaded G-code file matches the original. If the file was modified, you'll need to reload the original checkpoint file.</p>
          </div>

          <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded">
            <div className="font-semibold text-sm mb-1">4️⃣ Home Decision</div>
            <p className="text-xs text-[var(--text-secondary)]">Decides whether re-homing is necessary. If the machine was moved while off or alarmed, you must re-home ($H) to establish coordinate accuracy.</p>
          </div>

          <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded">
            <div className="font-semibold text-sm mb-1">5️⃣ Modal State Restoration</div>
            <p className="text-xs text-[var(--text-secondary)]">Automatically restores critical G-code modal commands: units (G20/G21), distance mode (G90/G91), plane selection (G17/G18/G19), and feed rate mode. Click <strong>Restore Modal State</strong> to execute these commands.</p>
          </div>

          <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded">
            <div className="font-semibold text-sm mb-1">6️⃣ Safe Z Approach</div>
            <p className="text-xs text-[var(--text-secondary)]">Performs a 3-stage repositioning to safely return the tool to the resume point:<br/>
            • Stage 1: Rapid move to safe Z clearance (checkpoint Z + 10mm)<br/>
            • Stage 2: Rapid XY traverse to checkpoint position<br/>
            • Stage 3: Feed move plunge to resume Z height</p>
          </div>

          <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded">
            <div className="font-semibold text-sm mb-1">7️⃣ Toolpath Analysis</div>
            <p className="text-xs text-[var(--text-secondary)]">Analyzes the next 50 lines of G-code to detect potential collisions. The 3D view highlights the resume segment in amber so you can visually verify the continuation path is safe.</p>
          </div>

          <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded">
            <div className="font-semibold text-sm mb-1">8️⃣ Visual Confirmation</div>
            <p className="text-xs text-[var(--text-secondary)]">Final user approval. Verify the 3D highlight and tool position are correct, then check the confirmation box to begin resume.</p>
          </div>
        </div>

        <h3 className="text-lg font-semibold mt-6">Key Safety Features</h3>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li><strong>Collision Detection:</strong> Automatically alerts you if the toolpath after the resume point may collide with remaining stock.</li>
          <li><strong>Safe Z Clearance:</strong> The machine always moves to a safe height before repositioning XY to avoid crashes.</li>
          <li><strong>Visual Feedback:</strong> The 3D toolpath is highlighted at the resume segment, showing exactly where the carve will continue.</li>
          <li><strong>Modal Restoration:</strong> All G-code modes (units, distance, plane) are explicitly restored to match the original job state.</li>
          <li><strong>File Integrity:</strong> The wizard verifies the G-code file hasn't been modified to ensure accurate resume.</li>
        </ul>

        <h3 className="text-lg font-semibold mt-6">Tips for Successful Recovery</h3>
        <div className="space-y-2 text-sm">
          <p><strong>✓ Do:</strong></p>
          <ul className="list-disc pl-5 text-[var(--text-secondary)]">
            <li>Allow the wizard to complete all steps without skipping.</li>
            <li>Carefully review the 3D highlight before confirming resume.</li>
            <li>Re-home if the machine was moved while off or alarmed.</li>
            <li>Ensure the correct tool is still loaded in the spindle.</li>
          </ul>

          <p className="mt-3"><strong>✗ Don't:</strong></p>
          <ul className="list-disc pl-5 text-[var(--text-secondary)]">
            <li>Manually edit the G-code file between checkpoint and resume.</li>
            <li>Skip step verification dialogs—each one ensures your safety.</li>
            <li>Resume if the collision detection reports "High Collision Risk".</li>
            <li>Use a different tool than what was loaded when the job was interrupted.</li>
          </ul>
        </div>

        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-200 italic mt-4">
          <strong>⚠️ Important:</strong> Job Resume is a powerful recovery tool, but always exercise caution. If you're unsure about any aspect of the recovery, it's safer to restart from the beginning than risk a collision or damaged workpiece.
        </div>
      </div>
    ),
  },
  {
    id: 'about',
    title: 'About',
    category: 'general',
    content: (
      <div className="space-y-4 text-center">
        <h2 className="text-2xl font-bold mb-2">Gtaurus</h2>
        <p className="text-[var(--text-secondary)]">v0.1.0-alpha</p>
        <div className="w-16 h-1 w-full bg-[var(--border-color)] my-4 mx-auto" />
        <p className="text-sm">
            A modern CNC dashboard for FluidNC.
        </p>
        <p className="text-xs text-[var(--text-tertiary)] mt-8">
            Created for the maker community.
        </p>
      </div>
    ),
  },
  {
    id: 'gcode-ref',
    title: 'G-code Quick Reference',
    category: 'cheat-sheets',
    content: <GcodeCheatSheet />
  }
];
