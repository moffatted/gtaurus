import { HelpTopic } from './helpTopics.types';
import { HelpScreenshot } from './HelpScreenshot';

export const featureTopics: HelpTopic[] = [
  {
    id: 'bit-management',
    title: 'Bit Library',
    category: 'general',
    searchText: 'bit tool library catalog management active usage tracking cutting distance',
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
    searchText: 'macro quick gcode snippet automation toolchange probing spindle warmup',
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
    searchText: 'probe probing touch plate workpiece setup configuration z-axis corner calibration',
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
    id: 'job-resume',
    searchText: 'resume recovery checkpoint interruption safety collision detection modal restoration',
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
];
