import { HelpTopic } from './helpTopics.types';
import { HelpScreenshot } from './HelpScreenshot';

const uiControlsParentId = 'settings-ui-controls';
const machineSystemParentId = 'settings-machine-system';

export const settingsTopics: HelpTopic[] = [
  {
    id: 'settings-dashboard',
    title: 'Settings: Dashboard',
    category: 'general',
    searchText: 'settings dashboard panels layout visibility default size configuration',
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
    searchText: 'settings ui controls overview theme interface scale camera visualizer behavior top menu stats dashboard',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">UI Controls Settings</h2>
        <p className="text-sm">These screens configure interface behavior and interaction details used during day-to-day operation. Select a subtopic in the left navigation to jump directly to a specific area.</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Theme &amp; UX</li>
          <li>Top Menu Buttons</li>
          <li>Bed Visualizer</li>
          <li>Stats &amp; Camera</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'settings-ui-controls-theme-ux',
    parentId: uiControlsParentId,
    title: 'Theme & UX',
    category: 'general',
    searchText: 'settings ui controls theme ux interface scale theme preset user experience',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">UI Controls: Theme &amp; UX</h2>
        <p className="text-sm">Adjust the overall appearance and interaction scale of the interface for your day-to-day workflow.</p>
        <HelpScreenshot
          src="/help_images/settings-ui-controls-theme-ux.png"
          alt="Theme and UX settings"
          caption="Theme & UX settings, including theme preset selection and UI scale adjustment."
        />
      </div>
    ),
  },
  {
    id: 'settings-ui-controls-top-menu-buttons',
    parentId: uiControlsParentId,
    title: 'Top Menu Buttons',
    category: 'general',
    searchText: 'settings ui controls top menu buttons camera ai assistant stats bit library tool changer fluidnc manager visibility',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">UI Controls: Top Menu Buttons</h2>
        <p className="text-sm">Use this screen to control which quick-access buttons appear in the top menu.</p>
        <HelpScreenshot
          src="/help_images/settings-ui-controls-top-menu-buttons.png"
          alt="Top menu button settings"
          caption="Top Menu visibility controls for Camera, AI Assistant, Stats, Bit Library, Tool Changer, and FluidNC Manager buttons."
        />
      </div>
    ),
  },
  {
    id: 'settings-ui-controls-bed-visualizer',
    parentId: uiControlsParentId,
    title: 'Bed Visualizer',
    category: 'general',
    searchText: 'settings ui controls bed visualizer autolevel mesh workpiece visualization display',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">UI Controls: Bed Visualizer</h2>
        <p className="text-sm">This section controls visibility and behavior for the bed visualizer and related overlays.</p>
        <HelpScreenshot
          src="/help_images/settings-ui-controls-bed-visualizer.png"
          alt="Bed visualizer settings"
          caption="Bed Visualizer settings, including AutoLevel mesh display and Workpiece visualization panel access."
        />
      </div>
    ),
  },
  {
    id: 'settings-ui-controls-stats-camera',
    parentId: uiControlsParentId,
    title: 'Stats & Camera',
    category: 'general',
    searchText: 'settings ui controls stats camera crowsnest stream url machine stats display',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">UI Controls: Stats &amp; Camera</h2>
        <p className="text-sm">Configure the machine statistics display and camera integration settings, including stream and Crowsnest options.</p>
        <HelpScreenshot
          src="/help_images/settings-ui-controls-stats-camera.png"
          alt="Stats and camera settings"
          caption="Stats Display and Camera settings for enabling camera UI, stream URL, and Crowsnest config path."
        />
      </div>
    ),
  },
  {
    id: machineSystemParentId,
    title: 'Settings: Machine & System',
    searchText: 'settings machine system overview geometry limits connection probe calibration fluidnc grbl ai assistant panels subtopics navigation',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Machine &amp; System Settings</h2>
        <p className="text-sm">These screens contain machine-level and system behavior settings. Select a subtopic in the left navigation to jump directly to a specific panel.</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>General</li>
          <li>Geometry &amp; Limits</li>
          <li>Connection</li>
          <li>Monitoring &amp; File Manager</li>
          <li>Probe Configuration</li>
          <li>Calibration Calculator</li>
          <li>FluidNC &amp; Motion Limits</li>
          <li>AI Assistant</li>
          <li>Add AI Client</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'settings-machine-system-general',
    parentId: machineSystemParentId,
    title: 'General',
    searchText: 'settings machine system general legacy grbl carving units firmware fallback behavior',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Machine &amp; System: General</h2>
        <p className="text-sm">Configure global machine behavior such as Legacy GRBL compatibility, carving units, and firmware fallback handling.</p>
        <HelpScreenshot
          src="/help_images/settings-machine-system-general.png"
          alt="Machine and System general settings"
          caption="General machine settings: Legacy GRBL mode, carving units, and firmware fallback behavior."
        />
      </div>
    ),
  },
  {
    id: 'settings-machine-system-geometry-limits',
    parentId: machineSystemParentId,
    title: 'Geometry & Limits',
    searchText: 'settings machine system geometry limits safe z height bed limits axis endstop orientation',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Machine &amp; System: Geometry &amp; Limits</h2>
        <p className="text-sm">Use this panel to define machine travel boundaries, safe Z behavior, and endstop orientation before running jobs.</p>
        <HelpScreenshot
          src="/help_images/settings-machine-system-geometry-limits.png"
          alt="Machine and System geometry and limits settings"
          caption="Machine geometry and safety setup: safe Z height, bed limits, and axis endstop orientation."
        />
      </div>
    ),
  },
  {
    id: 'settings-machine-system-connection',
    parentId: machineSystemParentId,
    title: 'Connection',
    searchText: 'settings machine system connection wifi telnet serial usb baud communication parameters',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Machine &amp; System: Connection</h2>
        <p className="text-sm">Connection settings control how Gtaurus reaches the controller over WiFi or Serial/USB.</p>
        <HelpScreenshot
          src="/help_images/settings-machine-system-connection.png"
          alt="Machine and System connection settings"
          caption="Connection settings for WiFi (Telnet) and Serial/USB communication parameters."
        />
      </div>
    ),
  },
  {
    id: 'settings-machine-system-monitoring-file-manager',
    parentId: machineSystemParentId,
    title: 'Monitoring & File Manager',
    searchText: 'settings machine system monitoring file manager status polling interval local gcode storage path',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Machine &amp; System: Monitoring &amp; File Manager</h2>
        <p className="text-sm">This panel covers controller polling cadence and local file storage behavior for job files.</p>
        <HelpScreenshot
          src="/help_images/settings-machine-system-monitoring-file-manager.png"
          alt="Machine and System monitoring and file manager settings"
          caption="Monitoring and storage settings: status polling interval and File Manager local G-code storage path."
        />
      </div>
    ),
  },
  {
    id: 'settings-machine-system-probe-configuration',
    parentId: machineSystemParentId,
    title: 'Probe Configuration',
    searchText: 'settings machine system probe configuration profile feed retract travel touch plate calibration',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Machine &amp; System: Probe Configuration</h2>
        <p className="text-sm">Probe settings define how touch plate and probing routines move, retract, and calculate offsets.</p>
        <HelpScreenshot
          src="/help_images/settings-machine-system-probe-configuration.png"
          alt="Machine and System probe configuration settings"
          caption="Probe configuration: probe profile selection, feed/retract/travel values, and touch-plate calibration inputs."
        />
      </div>
    ),
  },
  {
    id: 'settings-machine-system-calibration-calculator',
    parentId: machineSystemParentId,
    title: 'Calibration Calculator',
    searchText: 'settings machine system calibration calculator steps per mm motor steps microstepping roller diameter',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Machine &amp; System: Calibration Calculator</h2>
        <p className="text-sm">The calibration calculator helps derive steps-per-mm values using mechanical drive inputs.</p>
        <HelpScreenshot
          src="/help_images/settings-machine-system-calibration-calculator.png"
          alt="Machine and System calibration calculator"
          caption="Calibration calculator for steps-per-mm using motor steps, microstepping, and roller diameter."
        />
      </div>
    ),
  },
  {
    id: 'settings-machine-system-fluidnc-motion-limits',
    parentId: machineSystemParentId,
    title: 'FluidNC & Motion Limits',
    searchText: 'settings machine system fluidnc motion limits config file switching constraints max rate acceleration',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Machine &amp; System: FluidNC &amp; Motion Limits</h2>
        <p className="text-sm">Use this section for FluidNC-specific configuration selection and motion limit management.</p>
        <HelpScreenshot
          src="/help_images/settings-machine-system-fluidnc-config-motion-limits.png"
          alt="Machine and System FluidNC and motion limits settings"
          caption="FluidNC integration and motion controls: config file switching plus constraints and motion limit values."
        />
      </div>
    ),
  },
  {
    id: 'settings-machine-system-ai-assistant',
    parentId: machineSystemParentId,
    title: 'AI Assistant',
    searchText: 'settings machine system ai assistant ai panel dashboard integration concise responses selection mode manual auto client profiles active client providers models',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Machine &amp; System: AI Assistant</h2>
        <p className="text-sm">AI Assistant settings control panel visibility, dashboard integration, response style, selection mode, and configured client profiles.</p>
        <HelpScreenshot
          src="/help_images/settings_aiassistant_new_1.png"
          alt="AI Assistant settings overview"
          caption="AI Assistant settings overview: visibility toggles, dashboard integration, selection mode, and configured client profiles."
        />
      </div>
    ),
  },
  {
    id: 'settings-machine-system-add-ai-client',
    parentId: machineSystemParentId,
    title: 'Add AI Client',
    searchText: 'settings machine system add ai client free pro local tier provider model string api key google gemini openai anthropic create client',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Machine &amp; System: Add AI Client</h2>
        <p className="text-sm">The Add AI Client flow lets you define a profile name, tier, provider, model string, and API credentials for a new assistant target.</p>
        <HelpScreenshot
          src="/help_images/settings_aiassistant_new_2.png"
          alt="Add AI Client modal"
          caption="Add AI Client modal with tier/provider/model configuration, provider help, and key entry fields."
        />
      </div>
    ),
  },
  {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts',
    searchText: 'keyboard shortcuts command keys feed hold status soft reset console history',
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
];
