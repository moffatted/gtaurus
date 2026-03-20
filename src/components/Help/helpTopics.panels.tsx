import { HelpTopic } from './helpTopics.types';
import { HelpScreenshot } from './HelpScreenshot';

export const panelTopics: HelpTopic[] = [
  {
    id: 'visualizer',
    title: 'Bed Visualizer',
    category: 'general',
    searchText: 'visualizer 3d bed view navigation zoom camera position coordinates',
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
    searchText: 'preview simulation playback bit visualization toolpath scrubber step-over',
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
    searchText: 'statistics stats oee overall equipment effectiveness utilization tracking efficiency',
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
    searchText: 'dashboard panels file manager auto-leveling configuration layout visibility',
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
    searchText: 'top menu ai assistant fluidnc manager tool changer popout panels shortcuts',
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
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>The assistant can now send supported commands directly to FluidNC from within the chat workflow.</li>
          <li>When a command is executed, the command output and controller responses are visible in the G-code Console.</li>
          <li>You can choose between your configured AI models from Machine &amp; System settings, then switch active clients in the AI Assistant panel.</li>
        </ul>
        <HelpScreenshot
          src="/help_images/AIAssistant.png"
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
];
