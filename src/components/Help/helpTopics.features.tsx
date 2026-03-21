import { HelpTopic } from './helpTopics.types';
import { HelpScreenshot } from './HelpScreenshot';

const bitLibraryParentId = 'bit-management';
const macrosParentId = 'macros';
const probingParentId = 'probing';
const jobResumeParentId = 'job-resume';

export const featureTopics: HelpTopic[] = [
  {
    id: bitLibraryParentId,
    title: 'Bit Library',
    category: 'general',
    searchText: 'bit tool library overview catalog active tool usage tracking cutting distance',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Bit Management System</h2>
        <p>Maintain a catalog of your CNC bits and track their usage over time.</p>
        <p className="text-sm">Use the left navigation to jump directly to Tool Catalog, Active Tool, or Usage Tracking.</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Tool Catalog</li>
          <li>Active Tool</li>
          <li>Usage Tracking</li>
        </ul>

        <HelpScreenshot
          src="/help_images/top-menu-bit-library-panel.png"
          alt="Tool Library panel"
          caption="Bit Library panel used to manage tool definitions and set the active tool."
        />
      </div>
    ),
  },
  {
    id: 'bit-management-tool-catalog',
    parentId: bitLibraryParentId,
    title: 'Tool Catalog',
    category: 'general',
    searchText: 'bit library tool catalog bit type endmill v-bit diameter flute count tool number',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Bit Library: Tool Catalog</h2>
        <p className="text-sm">Store details like bit type, diameter, flute count, and tool number for each tool in your library.</p>
        <HelpScreenshot
          src="/help_images/top-menu-bit-library-panel.png"
          alt="Tool Library catalog"
          caption="Bit Library panel used to manage tool definitions and set the active tool."
        />
      </div>
    ),
  },
  {
    id: 'bit-management-active-tool',
    parentId: bitLibraryParentId,
    title: 'Active Tool',
    category: 'general',
    searchText: 'bit library active tool set active spindle visualizer safety checks tool number',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Bit Library: Active Tool</h2>
        <p className="text-sm">Click <strong>Set Active</strong> on a bit to mark it as the currently loaded tool.</p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--text-secondary)]">
          <li><strong>3D Spindle:</strong> The visualizer will scale the spindle model to match the active bit&apos;s diameter.</li>
          <li><strong>Safety Checks:</strong> Gtaurus will warn you if you start a job that requests a different Tool Number.</li>
        </ul>
        <HelpScreenshot
          src="/help_images/top-menu-bit-library-panel.png"
          alt="Tool Library active tool"
          caption="Bit Library panel used to manage tool definitions and set the active tool."
        />
      </div>
    ),
  },
  {
    id: 'bit-management-usage-tracking',
    parentId: bitLibraryParentId,
    title: 'Usage Tracking',
    category: 'general',
    searchText: 'bit library usage tracking cutting distance usage time maintenance replacement',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Bit Library: Usage Tracking</h2>
        <p className="text-sm">Gtaurus automatically records total <strong>Usage Time</strong> and <strong>Cutting Distance</strong> for each bit, helping you plan maintenance or replacement.</p>
        <HelpScreenshot
          src="/help_images/top-menu-bit-library-panel.png"
          alt="Tool Library usage tracking"
          caption="Bit Library panel used to manage tool definitions and set the active tool."
        />
      </div>
    ),
  },
  {
    id: macrosParentId,
    title: 'Quick Macros',
    category: 'general',
    searchText: 'macro quick gcode snippets automation toolchange probing spindle warmup safety overview',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Macro Management</h2>
        <p>Macros are snippets of G-code that you can run with a single click.</p>
        <p className="text-sm">Use the left navigation to jump directly to running, creating, or macro safety guidance.</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Running Macros</li>
          <li>Creating Macros</li>
          <li>Macro Safety</li>
        </ul>

        <HelpScreenshot
          src="/help_images/dashboard-quick-macros-panel.png"
          alt="Quick Macros panel"
          caption="Quick Macros panel for one-click execution of saved G-code routines."
        />
      </div>
    ),
  },
  {
    id: 'macros-running',
    parentId: macrosParentId,
    title: 'Running Macros',
    category: 'general',
    searchText: 'quick macros running execute play icon macro sequence line by line',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Quick Macros: Running Macros</h2>
        <p className="text-sm">Open the Macros panel to see your list. Click the Play icon to execute a macro sequence line-by-line.</p>
        <HelpScreenshot
          src="/help_images/dashboard-quick-macros-panel.png"
          alt="Quick Macros panel"
          caption="Quick Macros panel for one-click execution of saved G-code routines."
        />
      </div>
    ),
  },
  {
    id: 'macros-creating',
    parentId: macrosParentId,
    title: 'Creating Macros',
    category: 'general',
    searchText: 'quick macros creating settings macros tool change probing spindle warmup snippets',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Quick Macros: Creating Macros</h2>
        <p className="text-sm">Go to <strong>Settings &gt; Macros</strong> to add or edit your snippets. Use them for common tasks like:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Tool change positions.</li>
          <li>Special probing routines.</li>
          <li>Spindle warmup cycles.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'macros-safety',
    parentId: macrosParentId,
    title: 'Macro Safety',
    category: 'general',
    searchText: 'quick macros safety caution execute immediately machine state position tool',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Quick Macros: Macro Safety</h2>
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-200 italic">
          <strong>Caution:</strong> Macros execute immediately. Ensure your machine state, position, and tool are safe for the specific macro being run.
        </div>
      </div>
    ),
  },
  {
    id: probingParentId,
    title: 'Probing & Workpiece',
    searchText: 'probe probing touch plate workpiece setup configuration z-axis corner calibration',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Probing & Setup</h2>
        <p>Accurately locate your workpiece and set your zeroes.</p>
        <p className="text-sm">Use the left navigation to jump directly to probe configuration, automated probing, workpiece setup, or touch plate visualization details.</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Probe Configuration Check</li>
          <li>Automated Probing</li>
          <li>Workpiece Management</li>
          <li>Touch Plate Visualization</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'probing-configuration-check',
    parentId: probingParentId,
    title: 'Probe Configuration Check',
    category: 'general',
    searchText: 'probing configuration check probe status fluidnc $probe pin gpio configured no probe',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Probing &amp; Workpiece: Probe Configuration Check</h2>
        <p className="text-sm">When you connect to a FluidNC controller, Gtaurus automatically queries the probe configuration using the <code>$probe</code> command. This check verifies that a probe input is properly configured on your controller.</p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--text-secondary)]">
          <li>On connection, Gtaurus sends the <code>$probe</code> query to retrieve the probe pin configuration.</li>
          <li>The controller responds with details about the probe input, for example <code>pin: gpio.22:low</code>.</li>
          <li>Gtaurus parses this response and displays the configuration status in the <strong>Probe Status</strong> indicator.</li>
        </ul>
        <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--text-secondary)]">
          <li><strong>Green indicator</strong> with <em>Probe configured</em>: Your probe is properly set up on the controller.</li>
          <li><strong>Gray indicator</strong> with <em>No probe configured</em>: The controller does not have a probe input configured.</li>
          <li><strong>No indicator</strong>: Not connected, or controller type is unknown.</li>
        </ul>
        <p className="text-sm text-[var(--text-secondary)]">A probe should only be used if it is physically installed and configured in the controller. The configuration check prevents wasted probe attempts.</p>
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-200 italic">
          <strong>Tip:</strong> If you&apos;ve just installed or configured a probe on your FluidNC controller, disconnect and reconnect to refresh the probe configuration check.
        </div>
      </div>
    ),
  },
  {
    id: 'probing-automated-probing',
    parentId: probingParentId,
    title: 'Automated Probing',
    category: 'general',
    searchText: 'probing automated probing g38.2 z x y multi-axis max travel',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Probing &amp; Workpiece: Automated Probing</h2>
        <p className="text-sm">Once your probe is confirmed as configured, the Probe panel allows for axis-aligned probing using G38.2.</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li><strong>Operation:</strong> Select between Z, X, Y, or multi-axis probing.</li>
          <li><strong>Max Travel:</strong> Set the maximum distance the probe should move before alarming if no contact is made.</li>
        </ul>
        <HelpScreenshot
          src="/help_images/dashboard-probe-panel.png"
          alt="Probe panel"
          caption="Probe panel for axis probing, probe parameters, and zero-set workflows."
        />
      </div>
    ),
  },
  {
    id: 'probing-workpiece-management',
    parentId: probingParentId,
    title: 'Workpiece Management',
    category: 'general',
    searchText: 'probing workpiece management stock dimensions work offsets setup context',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Probing &amp; Workpiece: Workpiece Management</h2>
        <p className="text-sm">The Workpiece panel summarizes your current setup, including stock dimensions and work offsets.</p>
        <HelpScreenshot
          src="/help_images/dashboard-workpiece-panel.png"
          alt="Workpiece panel"
          caption="Workpiece panel showing stock setup, dimensions, and related carving context."
        />
      </div>
    ),
  },
  {
    id: 'probing-touch-plate-visualization',
    parentId: probingParentId,
    title: 'Touch Plate Visualization',
    category: 'general',
    searchText: 'probing touch plate visualization bed visualizer 3-axis corner show in bed visualizer hole location checklist',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Probing &amp; Workpiece: Touch Plate Visualization</h2>
        <p className="text-sm">Use the touch-plate visualizer to confirm corner orientation and hole placement before running the 3-axis corner probe.</p>
        <HelpScreenshot
          src="/help_images/dashboard-bed-visualizer-panel.png"
          alt="3-axis touch plate visualization in the Bed Visualizer"
          caption="The Bed Visualizer showing a 3-axis touch plate positioned at the selected stock corner."
        />
        <h3 className="text-lg font-semibold mt-4">How to Enable</h3>
        <ol className="list-decimal pl-5 space-y-1 text-sm">
          <li>Open <strong>Settings -&gt; Probe -&gt; Touch Plate Visualization</strong>.</li>
          <li>Turn on <strong>Show in Bed Visualizer</strong>.</li>
          <li>Set touch plate dimensions and side wrap values.</li>
          <li>Set <strong>Plate Thick</strong> (Z-Offset) in the Probe panel.</li>
        </ol>
        <h3 className="text-lg font-semibold mt-4">How to Position Correctly</h3>
        <ol className="list-decimal pl-5 space-y-1 text-sm">
          <li>In the Probe panel, switch to <strong>3-Axis Corner</strong>.</li>
          <li>Select the intended corner dot.</li>
          <li>Verify the visual touch plate moves to that same stock corner.</li>
        </ol>
        <h3 className="text-lg font-semibold mt-4">Hole Location Formula</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--text-secondary)]">
          <li><strong>X Offset:</strong> <code>xWallThickness + (holeDiameter / 2)</code></li>
          <li><strong>Y Offset:</strong> <code>yWallThickness + (holeDiameter / 2)</code></li>
        </ul>
        <h3 className="text-lg font-semibold mt-4">Pre-Probe Checklist</h3>
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
    id: jobResumeParentId,
    searchText: 'resume recovery checkpoint interruption safety collision detection modal restoration',
    title: 'Job Resume & Recovery',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Job Resume: Recovering from Interruptions</h2>
        <p className="text-sm">Gtaurus provides a complete job recovery system that automatically detects when a job has been interrupted and guides you through a safe, step-by-step resume process.</p>
        <p className="text-sm">Use the left navigation to jump to the trigger conditions, wizard steps, safety features, or recovery tips.</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>When Job Resume is Triggered</li>
          <li>Recovery Wizard Steps</li>
          <li>Key Safety Features</li>
          <li>Tips for Successful Recovery</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'job-resume-triggered',
    parentId: jobResumeParentId,
    title: 'When Job Resume is Triggered',
    category: 'general',
    searchText: 'job resume triggered paused interrupted power loss machine alarm manual stop checkpoint',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Job Resume: When Resume is Triggered</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--text-secondary)]">
          <li>A job is paused and then interrupted.</li>
          <li>Power loss occurs if a checkpoint file exists.</li>
          <li>Machine alarm is triggered mid-carve.</li>
          <li>Manual stop is initiated during an active job.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'job-resume-recovery-wizard',
    parentId: jobResumeParentId,
    title: 'Recovery Wizard Steps',
    category: 'general',
    searchText: 'job resume recovery wizard steps checkpoint summary machine status file validation home decision modal state safe z toolpath analysis visual confirmation',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Job Resume: Recovery Wizard Steps</h2>
        <div className="space-y-3 mt-4">
          <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded"><div className="font-semibold text-sm mb-1">1. Checkpoint Summary</div><p className="text-xs text-[var(--text-secondary)]">Review the interrupted job details: file name, interrupted line, tool number, and position coordinates.</p></div>
          <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded"><div className="font-semibold text-sm mb-1">2. Machine Status Check</div><p className="text-xs text-[var(--text-secondary)]">Confirms your machine is in a recoverable state. If alarmed, clear the alarm first.</p></div>
          <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded"><div className="font-semibold text-sm mb-1">3. File Validation</div><p className="text-xs text-[var(--text-secondary)]">Verifies the loaded G-code file matches the original checkpoint file.</p></div>
          <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded"><div className="font-semibold text-sm mb-1">4. Home Decision</div><p className="text-xs text-[var(--text-secondary)]">Decides whether re-homing is necessary to re-establish coordinate accuracy.</p></div>
          <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded"><div className="font-semibold text-sm mb-1">5. Modal State Restoration</div><p className="text-xs text-[var(--text-secondary)]">Restores critical G-code modal commands and feed state.</p></div>
          <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded"><div className="font-semibold text-sm mb-1">6. Safe Z Approach</div><p className="text-xs text-[var(--text-secondary)]">Uses a safe three-stage repositioning path back to the resume point.</p></div>
          <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded"><div className="font-semibold text-sm mb-1">7. Toolpath Analysis</div><p className="text-xs text-[var(--text-secondary)]">Analyzes upcoming lines for potential collisions and highlights the resume segment.</p></div>
          <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded"><div className="font-semibold text-sm mb-1">8. Visual Confirmation</div><p className="text-xs text-[var(--text-secondary)]">Final approval before resume begins.</p></div>
        </div>
      </div>
    ),
  },
  {
    id: 'job-resume-safety-features',
    parentId: jobResumeParentId,
    title: 'Key Safety Features',
    category: 'general',
    searchText: 'job resume safety features collision detection safe z visual feedback modal restoration file integrity',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Job Resume: Key Safety Features</h2>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li><strong>Collision Detection:</strong> Alerts you if the toolpath after the resume point may collide with remaining stock.</li>
          <li><strong>Safe Z Clearance:</strong> The machine always moves to a safe height before repositioning XY.</li>
          <li><strong>Visual Feedback:</strong> The 3D toolpath is highlighted at the resume segment.</li>
          <li><strong>Modal Restoration:</strong> G-code modes are explicitly restored to match the original job state.</li>
          <li><strong>File Integrity:</strong> The wizard verifies the G-code file has not been modified.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'job-resume-recovery-tips',
    parentId: jobResumeParentId,
    title: 'Tips for Successful Recovery',
    category: 'general',
    searchText: 'job resume tips successful recovery do dont re-home collision risk different tool',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Job Resume: Tips for Successful Recovery</h2>
        <div className="space-y-2 text-sm">
          <p><strong>Do:</strong></p>
          <ul className="list-disc pl-5 text-[var(--text-secondary)]">
            <li>Allow the wizard to complete all steps without skipping.</li>
            <li>Review the 3D highlight before confirming resume.</li>
            <li>Re-home if the machine was moved while off or alarmed.</li>
            <li>Ensure the correct tool is still loaded in the spindle.</li>
          </ul>

          <p className="mt-3"><strong>Don&apos;t:</strong></p>
          <ul className="list-disc pl-5 text-[var(--text-secondary)]">
            <li>Manually edit the G-code file between checkpoint and resume.</li>
            <li>Skip step verification dialogs.</li>
            <li>Resume if collision detection reports high collision risk.</li>
            <li>Use a different tool than what was loaded when the job was interrupted.</li>
          </ul>
        </div>

        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-200 italic mt-4">
          <strong>Important:</strong> If you are unsure about any aspect of the recovery, it is safer to restart from the beginning than risk a collision or damaged workpiece.
        </div>
      </div>
    ),
  },
];
