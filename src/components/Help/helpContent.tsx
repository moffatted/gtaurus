import { ReactNode } from 'react';

export interface HelpTopic {
  id: string;
  title: string;
  content: ReactNode;
}

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
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
            <strong>GTaurus Bridge (WebSocket):</strong> Used when accessing the dashboard via a web browser to control a machine remotely. Connects to a `gtaurus_server` running on a host computer physically wired to the CNC machine.
          </li>
        </ul>
        <p className="text-sm text-[var(--text-secondary)] mt-3">
          Use the <strong>Connection Panel</strong> in the sidebar to select your mode and connect.
        </p>

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
      </div>
    ),
  },
  {
    id: 'controls',
    title: 'Machine Controls',
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
      </div>
    ),
  },
  {
    id: 'workflow',
    title: 'Getting Ready to Carve',
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
    id: 'bit-management',
    title: 'Bit Library',
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
      </div>
    ),
  },
  {
    id: 'macros',
    title: 'Quick Macros',
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
      </div>
    ),
  },
  {
    id: 'probing',
    title: 'Probing & Workpiece',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Probing & Setup</h2>
        <p>Accurately locate your workpiece and set your zeroes.</p>
        
        <h3 className="text-lg font-semibold mt-4">Automated Probing</h3>
        <p className="text-sm">The Probe panel allows for axis-aligned probing (G38.2).</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li><strong>Operation:</strong> Select between Z, X, Y, or multi-axis probing.</li>
          <li><strong>Max Travel:</strong> Set the maximum distance the probe should move before alarming if no contact is made.</li>
        </ul>

        <h3 className="text-lg font-semibold mt-4">Workpiece Management</h3>
        <p className="text-sm">The Workpiece panel summarizes your current setup, including stock dimensions and work offsets.</p>
      </div>
    ),
  },
  {
    id: 'visualizer',
    title: 'Bed Visualizer',
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
      </div>
    ),
  },
  {
    id: 'stats',
    title: 'Machine Stats',
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
      </div>
    ),
  },
  {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts',
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
    id: 'about',
    title: 'About',
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
  }
];
