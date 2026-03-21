import { HelpTopic } from './helpTopics.types';
import { HelpScreenshot } from './HelpScreenshot';

const gettingStartedParentId = 'getting-started';
const controlsParentId = 'controls';
const workflowParentId = 'workflow';

export const generalTopics: HelpTopic[] = [
  {
    id: gettingStartedParentId,
    title: 'Getting Started',
    category: 'general',
    searchText: 'getting started welcome connection serial usb wifi telnet websocket fluidnc grbl setup safety homing',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Welcome to Gtaurus</h2>
        <p>Gtaurus is a modern control dashboard for FluidNC and GRBL-based CNC machines.</p>
        <p className="text-sm">Use the left navigation to jump directly to connection help, Legacy GRBL guidance, or the startup safety checklist.</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Connecting to your Machine</li>
          <li>Legacy GRBL Support</li>
          <li>Safety Checklist</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'getting-started-connecting',
    parentId: gettingStartedParentId,
    title: 'Connecting to your Machine',
    category: 'general',
    searchText: 'getting started connection serial usb wifi telnet websocket bridge fluidnc gtaurus server',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Getting Started: Connecting to your Machine</h2>
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
      </div>
    ),
  },
  {
    id: 'getting-started-legacy-grbl',
    parentId: gettingStartedParentId,
    title: 'Legacy GRBL Support',
    category: 'general',
    searchText: 'getting started legacy grbl 1.1 fluidnc config editor compatibility machine and system settings',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Getting Started: Legacy GRBL Support</h2>
        <p className="text-sm mb-2">If you are using an older standard GRBL 1.1 controller instead of FluidNC:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--text-secondary)]">
          <li>Go to <strong>Settings</strong> &gt; <strong>Machine &amp; System Settings</strong>.</li>
          <li>Turn on <strong>Enable Legacy GRBL 1.1 Mode</strong>.</li>
          <li>This will hide FluidNC-specific features such as the Config Editor that are incompatible with your board.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'getting-started-safety-checklist',
    parentId: gettingStartedParentId,
    title: 'Safety Checklist',
    category: 'general',
    searchText: 'getting started safety checklist homing active tool work zero g10 l20 startup preflight',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Getting Started: Safety Checklist</h2>
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
    id: controlsParentId,
    title: 'Machine Controls',
    searchText: 'machine controls overview dro digital readout jogging jog controls file execution simulation start pause',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Machine Controls</h2>
        <p>The <strong>Controls</strong> panel is the unified hub of your machine operations, integrating the Digital Readout (DRO) and manual Jogging controls into a single workspace.</p>
        <p className="text-sm">Use the left navigation to jump directly to DRO, jogging, file control, or execution topics.</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Digital Readout &amp; Zeroing</li>
          <li>Jogging &amp; Speed</li>
          <li>File Selection &amp; Job Status</li>
          <li>Execution Controls</li>
        </ul>

        <HelpScreenshot
          src="/help_images/dashboard-machine-controls-panel.png"
          alt="Machine Controls panel"
          caption="Controls panel containing DRO, jogging controls, file controls, and execution buttons."
        />
      </div>
    ),
  },
  {
    id: 'controls-dro-zeroing',
    parentId: controlsParentId,
    title: 'Digital Readout & Zeroing',
    category: 'general',
    searchText: 'machine controls dro digital readout zeroing wpos mpos target zero all g10 l20',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Machine Controls: Digital Readout &amp; Zeroing</h2>
        <p className="text-sm">The display shows <strong>Work Position (WPos)</strong> as the primary value and <strong>Machine Position (MPos)</strong> below it.</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li><strong>Zeroing:</strong> Click the <strong>Target</strong> icon next to an axis to set its Work Zero ($G10 L20$).</li>
          <li><strong>Zero All:</strong> Use the global zero button in the header if enabled to zero X, Y, and Z simultaneously.</li>
        </ul>
        <HelpScreenshot
          src="/help_images/dashboard-machine-controls-panel.png"
          alt="Machine Controls DRO and zeroing"
          caption="Controls panel containing DRO, jogging controls, file controls, and execution buttons."
        />
      </div>
    ),
  },
  {
    id: 'controls-jogging-speed',
    parentId: controlsParentId,
    title: 'Jogging & Speed',
    category: 'general',
    searchText: 'machine controls jogging speed xy pad z column step size jog feed manual movement',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Machine Controls: Jogging &amp; Speed</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li><strong>XY Pad &amp; Z Column:</strong> Intuitive directional controls for manual tool positioning.</li>
          <li><strong>Step Size:</strong> Distance the machine moves per click (for example, 0.1mm, 1mm, or 10mm).</li>
          <li><strong>Jog Feed:</strong> The velocity of manual movement in mm/min or in/min.</li>
        </ul>
        <HelpScreenshot
          src="/help_images/dashboard-machine-controls-panel.png"
          alt="Machine Controls jogging and speed"
          caption="Controls panel containing DRO, jogging controls, file controls, and execution buttons."
        />
      </div>
    ),
  },
  {
    id: 'controls-file-selection-status',
    parentId: controlsParentId,
    title: 'File Selection & Job Status',
    category: 'general',
    searchText: 'machine controls file selection job status gcode file load active bit safety check tool numbers',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Machine Controls: File Selection &amp; Job Status</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li><strong>File Selection:</strong> Click the file name or Load icon to choose a G-code file from your local system.</li>
          <li><strong>Safety Check:</strong> Gtaurus automatically scans the file for tool numbers and warns you of any mismatches with your active bit.</li>
        </ul>
        <HelpScreenshot
          src="/help_images/dashboard-machine-controls-panel.png"
          alt="Machine Controls file selection and status"
          caption="Controls panel containing DRO, jogging controls, file controls, and execution buttons."
        />
      </div>
    ),
  },
  {
    id: 'controls-execution-controls',
    parentId: controlsParentId,
    title: 'Execution Controls',
    category: 'general',
    searchText: 'machine controls execution start resume pause stop simulation speed slider toolpath render',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Machine Controls: Execution Controls</h2>
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
          alt="Machine Controls execution controls"
          caption="Controls panel containing DRO, jogging controls, file controls, and execution buttons."
        />
      </div>
    ),
  },
  {
    id: workflowParentId,
    searchText: 'workflow homing carving zero probe bit setup ready preflight steps',
    title: 'Getting Ready to Carve',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Workflow: Getting Ready to Carve</h2>
        <p className="text-sm">Follow these steps in order to ensure a safe and accurate carve.</p>
        <p className="text-sm">Use the left navigation to jump directly to each preflight step.</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Homing</li>
          <li>Load G-code &amp; Bit</li>
          <li>Jogging to Origin</li>
          <li>Setting Zero or Probing</li>
          <li>Verify &amp; Run</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'workflow-homing',
    parentId: workflowParentId,
    title: 'Homing',
    category: 'general',
    searchText: 'workflow homing h machine coordinates soft limits getting ready to carve',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Getting Ready to Carve: Homing</h2>
        <p className="text-sm text-[var(--text-secondary)]">Start by homing your machine. This establishes the machine coordinate system and enables soft limits.</p>
      </div>
    ),
  },
  {
    id: 'workflow-load-file-bit',
    parentId: workflowParentId,
    title: 'Load G-code & Bit',
    category: 'general',
    searchText: 'workflow load gcode bit active tool bit library getting ready to carve',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Getting Ready to Carve: Load G-code &amp; Bit</h2>
        <p className="text-sm text-[var(--text-secondary)]">Select your file and ensure the correct bit is physically installed and set as Active in the Bit Library.</p>
      </div>
    ),
  },
  {
    id: 'workflow-jog-to-origin',
    parentId: workflowParentId,
    title: 'Jogging to Origin',
    category: 'general',
    searchText: 'workflow jog origin workpiece bottom left center controls getting ready to carve',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Getting Ready to Carve: Jogging to Origin</h2>
        <p className="text-sm text-[var(--text-secondary)]">Use the <strong>Jogging Controls</strong> to move the spindle to your workpiece&apos;s intended starting position, usually the bottom-left corner or center.</p>
      </div>
    ),
  },
  {
    id: 'workflow-set-zero-or-probe',
    parentId: workflowParentId,
    title: 'Setting Zero or Probing',
    category: 'general',
    searchText: 'workflow set zero probe work zero dro probe panel getting ready to carve',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Getting Ready to Carve: Setting Zero or Probing</h2>
        <p className="text-sm text-[var(--text-secondary)]">Click the <strong>Zero</strong> icons in the DRO to set Work Zero, or use the <strong>Probe</strong> panel to automatically locate the surface of your material.</p>
      </div>
    ),
  },
  {
    id: 'workflow-verify-run',
    parentId: workflowParentId,
    title: 'Verify & Run',
    category: 'general',
    searchText: 'workflow verify run simulation start carve getting ready to carve',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Getting Ready to Carve: Verify &amp; Run</h2>
        <p className="text-sm text-[var(--text-secondary)]">Run a <strong>Sim</strong> if you&apos;re unsure of the path, then click <strong>Start</strong> to begin your carve.</p>
      </div>
    ),
  },
];
