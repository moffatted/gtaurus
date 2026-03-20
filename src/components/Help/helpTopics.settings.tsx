import { HelpTopic } from './helpTopics.types';
import { HelpScreenshot } from './HelpScreenshot';

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
    searchText: 'settings ui controls theme interface scale camera visualizer behavior',
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
    searchText: 'settings machine system geometry limits connection probe calibration fluidnc grbl',
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
