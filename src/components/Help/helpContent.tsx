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
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>WiFi (Telnet):</strong> Enter the IP address of your FluidNC controller (e.g., 192.168.1.100) and port (default 23).</li>
          <li><strong>Serial / USB:</strong> Select the COM port and Baud Rate (usually 115200).</li>
        </ul>
        <p className="text-sm text-[var(--text-secondary)] mt-2">
          Use the <strong>Connection Panel</strong> in the sidebar to manage connections.
        </p>
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
            $H  - Homing Cycle<br/>
            $X  - Unlock Alarm<br/>
            ?   - Status Report
        </div>
      </div>
    ),
  },
  {
    id: 'dro',
    title: 'Digital Readout (DRO)',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Digital Readout</h2>
        <p>Monitor your machine's position and status in real-time.</p>
        
        <h3 className="text-lg font-semibold mt-4">Coordinates</h3>
        <p>The display shows both <strong>Work Position (WPos)</strong> and <strong>Machine Position (MPos)</strong>.</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>MPos:</strong> Absolute coordinates from the machine's home switches.</li>
            <li><strong>WPos:</strong> Relative coordinates based on your work offset (G54, etc.).</li>
        </ul>

        <h3 className="text-lg font-semibold mt-4">Status Modifiers</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 border rounded"><strong>Idle:</strong> Machine is ready.</div>
            <div className="p-2 border rounded"><strong>Run:</strong> Moving or executing G-code.</div>
            <div className="p-2 border rounded"><strong>Hold:</strong> Paused locally.</div>
            <div className="p-2 border rounded border-red-500/30 text-red-400"><strong>Alarm:</strong> Locked due to error/limit.</div>
        </div>
      </div>
    ),
  },
  {
    id: 'fluidnc',
    title: 'FluidNC Manager',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">FluidNC Manager</h2>
        <p>Advanced tools for configuring FluidNC controllers.</p>

        <h3 className="text-lg font-semibold mt-4">Quick Commands</h3>
        <p>One-click access to common system commands like sending <code>$Config/List</code> or checking firmware info.</p>

        <h3 className="text-lg font-semibold mt-4">Config Editor</h3>
        <p>View and edit the <code>config.yaml</code> file directly on the controller.</p>
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-sm">
            <strong>Warning:</strong> Editing the configuration incorrectly can make your machine unresponsive. 
            Always backup your config before making changes.
        </div>
        <p className="mt-2 text-sm">
            After saving changes, you must restart the controller for them to take effect.
        </p>
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
                    <th className="py-2">Shortcut</th>
                    <th className="py-2">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
                <tr><td className="py-2 font-mono">?</td><td className="py-2">Send Status Query</td></tr>
                <tr><td className="py-2 font-mono">!</td><td className="py-2">Feed Hold</td></tr>
                <tr><td className="py-2 font-mono">~</td><td className="py-2">Resume / Cycle Start</td></tr>
                <tr><td className="py-2 font-mono">Ctrl+X</td><td className="py-2">Soft Reset (0x18)</td></tr>
                <tr><td className="py-2 font-mono">Up / Down</td><td className="py-2">Cycle Command History</td></tr>
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
        <div className="w-16 h-1 w-full bg-[var(--border-color)] my-4" />
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
