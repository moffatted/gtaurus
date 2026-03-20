import { HelpTopic } from './helpTopics.types';
import { HelpScreenshot } from './HelpScreenshot';

export const generalTopics: HelpTopic[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    category: 'general',
    searchText: 'connection serial usb wifi telnet websocket fluidnc grbl setup safety homing',
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
    searchText: 'gcode console command history input controller response homing status',
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
    searchText: 'dro digital readout jogging jog controls file execution simulation start pause',
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
    searchText: 'workflow homing carving zero probe bit setup ready preflight steps',
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
];
