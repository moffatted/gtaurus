import { HelpTopic } from './helpTopics.types';
import { HelpScreenshot } from './HelpScreenshot';

const visualizerParentId = 'visualizer';
const carvePreviewParentId = 'carve-preview';
const machineStatsParentId = 'stats';
const dashboardPanelsParentId = 'dashboard-panels';
const topMenuPanelsParentId = 'top-menu-panels';

export const panelTopics: HelpTopic[] = [
  {
    id: visualizerParentId,
    title: 'Bed Visualizer',
    category: 'general',
    searchText: 'visualizer 3d bed view navigation zoom camera position coordinates overview',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">3D Bed Visualizer</h2>
        <p>The visualizer provides a real-time 3D representation of your CNC environment.</p>
        <p className="text-sm">Use the left navigation to jump directly to navigation controls or interactions.</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Navigation &amp; View</li>
          <li>Interactions</li>
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
    id: 'visualizer-navigation-view',
    parentId: visualizerParentId,
    title: 'Navigation & View',
    category: 'general',
    searchText: 'visualizer navigation view cube zoom camera mpos hud coordinates',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Bed Visualizer: Navigation &amp; View</h2>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li><strong>Navigation Cube:</strong> Click the faces of the cube to snap the camera to specific views.</li>
          <li><strong>Zoom Controls:</strong> Use the plus and minus buttons or the scroll wheel to adjust view distance.</li>
          <li><strong>MPos HUD:</strong> A horizontal bar at the bottom displays real-time machine coordinates and axis orientation.</li>
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
    id: 'visualizer-interactions',
    parentId: visualizerParentId,
    title: 'Interactions',
    category: 'general',
    searchText: 'visualizer interactions rotate pan left click right click drag',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Bed Visualizer: Interactions</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li><strong>Rotate:</strong> Left-click and drag.</li>
          <li><strong>Pan:</strong> Right-click and drag.</li>
        </ul>
        <HelpScreenshot
          src="/help_images/dashboard-bed-visualizer-panel.png"
          alt="Bed visualizer interactions"
          caption="Bed Visualizer panel used for 3D orientation, path review, and setup verification."
        />
      </div>
    ),
  },
  {
    id: carvePreviewParentId,
    title: 'Carve Preview',
    category: 'general',
    searchText: 'preview simulation playback bit visualization toolpath scrubber step-over stock alignment overview',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Carve Preview</h2>
        <p>The Carve Preview panel provides a true-to-life 3D visualization of your G-code operations, simulating exactly what the bit will carve into the workpiece.</p>
        <p className="text-sm">Use the left navigation to jump directly to playback controls, bit visualization, or stock alignment.</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Simulation &amp; Playback</li>
          <li>Bit Visualization</li>
          <li>Stock Alignment</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'carve-preview-simulation-playback',
    parentId: carvePreviewParentId,
    title: 'Simulation & Playback',
    category: 'general',
    searchText: 'carve preview simulation playback operation step continuous scrubber percent',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Carve Preview: Simulation &amp; Playback</h2>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li><strong>Operation Step:</strong> Playback automatically pauses at tool changes.</li>
          <li><strong>Continuous:</strong> Playback runs straight through the entire file without pausing.</li>
          <li><strong>Scrubber:</strong> Drag the slider to jump instantly to any percentage of the carve.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'carve-preview-bit-visualization',
    parentId: carvePreviewParentId,
    title: 'Bit Visualization',
    category: 'general',
    searchText: 'carve preview bit visualization diameter angle v-bit tool shape resize',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Carve Preview: Bit Visualization</h2>
        <p className="text-sm">The 3D preview dynamically adjusts to match the tools assigned in your operation sequence. If you specify a tool type, diameter, or angle for V-bits, the rendered bit will resize and change shape to match.</p>
      </div>
    ),
  },
  {
    id: 'carve-preview-stock-alignment',
    parentId: carvePreviewParentId,
    title: 'Stock Alignment',
    category: 'general',
    searchText: 'carve preview stock alignment align design front left center footprint material dimensions',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Carve Preview: Stock Alignment</h2>
        <p className="text-sm">Use the <strong>Align Design</strong> buttons, such as Front-Left or Center, to position the simulated G-code footprint relative to your configured workpiece dimensions.</p>
      </div>
    ),
  },
  {
    id: machineStatsParentId,
    title: 'Machine Stats',
    searchText: 'statistics stats oee overall equipment effectiveness utilization tracking efficiency',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Machine Statistics</h2>
        <p>Track your production efficiency and machine history over time.</p>
        <p className="text-sm">Use the left navigation to jump directly to OEE metrics or utilization tracking.</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>OEE Metrics</li>
          <li>Utilization Tracking</li>
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
    id: 'stats-oee-metrics',
    parentId: machineStatsParentId,
    title: 'OEE Metrics',
    category: 'general',
    searchText: 'machine stats oee metrics availability performance quality overall equipment effectiveness',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Machine Stats: OEE Metrics</h2>
        <p className="text-sm">Gtaurus calculates <strong>Overall Equipment Effectiveness</strong> based on Availability, Performance, and Quality targets set in your settings.</p>
        <HelpScreenshot
          src="/help_images/top-menu-machine-statistics-panel.png"
          alt="Machine Statistics panel"
          caption="Machine Statistics panel for OEE and machine utilization trends."
        />
      </div>
    ),
  },
  {
    id: 'stats-utilization-tracking',
    parentId: machineStatsParentId,
    title: 'Utilization Tracking',
    category: 'general',
    searchText: 'machine stats utilization tracking machine on time spindle hours job history',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Machine Stats: Utilization Tracking</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li><strong>Machine On Time:</strong> Total time the software has been connected.</li>
          <li><strong>Spindle Hours:</strong> Cumulative time the spindle has been active.</li>
          <li><strong>Job History:</strong> A rolling log of the last 10 jobs with start/end times and status.</li>
        </ul>
        <HelpScreenshot
          src="/help_images/top-menu-machine-statistics-panel.png"
          alt="Machine Statistics utilization tracking"
          caption="Machine Statistics panel for OEE and machine utilization trends."
        />
      </div>
    ),
  },
  {
    id: dashboardPanelsParentId,
    title: 'Dashboard Panels',
    searchText: 'dashboard panels overview file manager auto-leveling configuration layout visibility',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Dashboard Panel Reference</h2>
        <p className="text-sm">This reference maps each dashboard panel to its role in day-to-day operation. Select a subtopic in the left navigation to jump directly to a specific panel.</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>File Manager</li>
          <li>Auto-Leveling</li>
          <li>Dashboard Configuration</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'dashboard-panels-file-manager',
    parentId: dashboardPanelsParentId,
    title: 'File Manager',
    searchText: 'dashboard panels file manager gcode files organize browse select',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Dashboard Panels: File Manager</h2>
        <p className="text-sm">Use this panel to browse, select, and manage G-code files used for simulation and carving.</p>
        <HelpScreenshot
          src="/help_images/dashboard-file-manager-panel.png"
          alt="File Manager panel"
          caption="File Manager panel for selecting and organizing G-code files."
        />
      </div>
    ),
  },
  {
    id: 'dashboard-panels-auto-leveling',
    parentId: dashboardPanelsParentId,
    title: 'Auto-Leveling',
    searchText: 'dashboard panels auto leveling probing grid bounds compensation work surface',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Dashboard Panels: Auto-Leveling</h2>
        <p className="text-sm">Configure probing grid, bounds, and compensation behavior for uneven work surfaces.</p>
        <HelpScreenshot
          src="/help_images/dashboard-auto-leveling-panel.png"
          alt="Auto-Leveling panel"
          caption="Auto-Leveling panel used to configure and run surface compensation routines."
        />
      </div>
    ),
  },
  {
    id: 'dashboard-panels-configuration',
    parentId: dashboardPanelsParentId,
    title: 'Dashboard Configuration',
    searchText: 'dashboard panels configuration layout visibility default workspace organization settings',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Dashboard Panels: Configuration</h2>
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
    id: topMenuPanelsParentId,
    searchText: 'top menu ai assistant fluidnc manager tool changer popout panels shortcuts',
    title: 'Top Menu Panels',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Top Menu & Popout Panels</h2>
        <p className="text-sm">These panels are launched from the top menu shortcuts for quick access to advanced tools. Select a subtopic in the left navigation to jump directly to a specific panel.</p>

        <HelpScreenshot
          src="/help_images/top-menu-bar.png"
          alt="Top menu"
          caption="Top menu with machine status, control shortcuts, and access to utility panels."
        />
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>AI Assistant</li>
          <li>FluidNC Manager</li>
          <li>Tool Changer</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'top-menu-panels-ai-assistant',
    parentId: topMenuPanelsParentId,
    title: 'AI Assistant',
    searchText: 'top menu panels ai assistant cnc workflows command suggestions troubleshooting active clients machine system settings',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Top Menu Panels: AI Assistant</h2>
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
      </div>
    ),
  },
  {
    id: 'top-menu-panels-fluidnc-manager',
    parentId: topMenuPanelsParentId,
    title: 'FluidNC Manager',
    searchText: 'top menu panels fluidnc manager controller configuration maintenance actions',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Top Menu Panels: FluidNC Manager</h2>
        <p className="text-sm">Use this manager for FluidNC-specific configuration and controller-level maintenance actions.</p>
        <HelpScreenshot
          src="/help_images/top-menu-fluidnc-manager-panel.png"
          alt="FluidNC Manager panel"
          caption="FluidNC Manager panel for controller configuration tasks."
        />
      </div>
    ),
  },
  {
    id: 'top-menu-panels-tool-changer',
    parentId: topMenuPanelsParentId,
    title: 'Tool Changer',
    searchText: 'top menu panels tool changer assisted manual tool change workflow active jobs tooling controls',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Top Menu Panels: Tool Changer</h2>
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
