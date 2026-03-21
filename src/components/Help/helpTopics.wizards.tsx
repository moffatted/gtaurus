import { HelpTopic } from './helpTopics.types';
import { HelpScreenshot } from './HelpScreenshot';

const carveWizardParentId = 'carve-wizard';
const machineSetupWizardParentId = 'machine-setup-wizard';
const surfacingWizardParentId = 'surfacing-wizard';

export const wizardTopics: HelpTopic[] = [
  {
    id: carveWizardParentId,
    title: 'Carve Wizard',
    category: 'general',
    searchText: 'wizard carve steps preflight workpiece file tool zero safety checks',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Carve Wizard: Step-by-Step</h2>
        <p className="text-sm">
          The Carve Wizard guides you through an 11-step preflight before streaming a job.
          Some steps can render different screens depending on your choices (manual zero vs probe, zero location selection, etc.).
        </p>
        <p className="text-sm">Use the left navigation to jump directly to each wizard step.</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Step 1: Power &amp; Homing</li>
          <li>Step 2: Workpiece Placement</li>
          <li>Step 3: File &amp; Dimensions</li>
          <li>Step 4: Tooling</li>
          <li>Step 5: Zero Method</li>
          <li>Step 6: Position Tool</li>
          <li>Step 7: Set Zero</li>
          <li>Step 8: Surface Calibration</li>
          <li>Step 9: End Job Options</li>
          <li>Step 10: Safety Checks</li>
          <li>Step 11: Ready to Carve</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'carve-wizard-step-01', parentId: carveWizardParentId, title: 'Step 1: Power & Homing', category: 'general', searchText: 'carve wizard power homing step 1', content: (<div className="space-y-4"><h2 className="text-xl font-bold mb-4">Carve Wizard: Step 1 - Power &amp; Homing</h2><p className="text-sm">Confirm machine status and run homing if needed before continuing.</p><HelpScreenshot src="/help_images/wizards/carve-wizard-step-01-power-homing.png" alt="Carve Wizard step 1 power and homing" caption="Step 1 checks homing state and provides a direct action to run the homing cycle." /></div>),
  },
  {
    id: 'carve-wizard-step-02', parentId: carveWizardParentId, title: 'Step 2: Workpiece Placement', category: 'general', searchText: 'carve wizard workpiece placement step 2', content: (<div className="space-y-4"><h2 className="text-xl font-bold mb-4">Carve Wizard: Step 2 - Workpiece Placement</h2><p className="text-sm">Physically secure the workpiece and acknowledge that it is clamped or fixtured safely.</p><HelpScreenshot src="/help_images/wizards/carve-wizard-step-02-workpiece-placement.png" alt="Carve Wizard step 2 workpiece placement" caption="Step 2 requires user confirmation that the workpiece is securely placed." /></div>),
  },
  {
    id: 'carve-wizard-step-03', parentId: carveWizardParentId, title: 'Step 3: File & Dimensions', category: 'general', searchText: 'carve wizard file dimensions zero position step 3', content: (<div className="space-y-4"><h2 className="text-xl font-bold mb-4">Carve Wizard: Step 3 - File &amp; Dimensions</h2><p className="text-sm">Choose the active file and verify or edit actual workpiece dimensions used for carving setup.</p><HelpScreenshot src="/help_images/wizards/carve-wizard-step-03-file-dimensions.png" alt="Carve Wizard step 3 file and dimensions" caption="Step 3 file selection and editable workpiece dimensions." /><HelpScreenshot src="/help_images/wizards/carve-wizard-step-03b-zero-position-variant.png" alt="Carve Wizard step 3 zero position variant" caption="Step 3 variant showing zero-position selection relative to the workpiece and fixed job bounds preview." /></div>),
  },
  {
    id: 'carve-wizard-step-04', parentId: carveWizardParentId, title: 'Step 4: Tooling', category: 'general', searchText: 'carve wizard tooling step 4 active tool library', content: (<div className="space-y-4"><h2 className="text-xl font-bold mb-4">Carve Wizard: Step 4 - Tooling</h2><p className="text-sm">Verify the active tool and pick the correct tool from the library for this operation.</p><HelpScreenshot src="/help_images/wizards/carve-wizard-step-04-tooling-selection.png" alt="Carve Wizard step 4 tooling selection" caption="Step 4 ensures the loaded physical tool matches the selected library tool." /></div>),
  },
  {
    id: 'carve-wizard-step-05', parentId: carveWizardParentId, title: 'Step 5: Zero Method', category: 'general', searchText: 'carve wizard zero method step 5 manual probe', content: (<div className="space-y-4"><h2 className="text-xl font-bold mb-4">Carve Wizard: Step 5 - Zero Method</h2><p className="text-sm">Choose how you want to set workspace zero: manual positioning or touch-probe workflow.</p><HelpScreenshot src="/help_images/wizards/carve-wizard-step-05-zero-method.png" alt="Carve Wizard step 5 zero method" caption="Step 5 lets you choose between manual zero and probe-based zeroing." /></div>),
  },
  {
    id: 'carve-wizard-step-06', parentId: carveWizardParentId, title: 'Step 6: Position Tool', category: 'general', searchText: 'carve wizard position tool step 6 jog origin', content: (<div className="space-y-4"><h2 className="text-xl font-bold mb-4">Carve Wizard: Step 6 - Position Tool</h2><p className="text-sm">Jog to the intended origin using step size controls and XYZ jog buttons.</p><HelpScreenshot src="/help_images/wizards/carve-wizard-step-06-position-tool.png" alt="Carve Wizard step 6 position tool" caption="Step 6 manual jogging interface for precise tool positioning at origin." /></div>),
  },
  {
    id: 'carve-wizard-step-07', parentId: carveWizardParentId, title: 'Step 7: Set Zero', category: 'general', searchText: 'carve wizard set zero step 7 manual probe variant', content: (<div className="space-y-4"><h2 className="text-xl font-bold mb-4">Carve Wizard: Step 7 - Set Zero</h2><p className="text-sm">Execute the zero action for the chosen method and confirm the resulting workspace coordinates.</p><HelpScreenshot src="/help_images/wizards/carve-wizard-step-07-set-zero-manual.png" alt="Carve Wizard step 7 set zero manual" caption="Step 7 manual zero variant with explicit X0 Y0 Z0 action." /><HelpScreenshot src="/help_images/wizards/carve-wizard-step-07b-set-zero-probe-variant.png" alt="Carve Wizard step 7 set zero probe variant" caption="Step 7 probe variant running a touch-plate probe sequence before zero set confirmation." /></div>),
  },
  {
    id: 'carve-wizard-step-08', parentId: carveWizardParentId, title: 'Step 8: Surface Calibration', category: 'general', searchText: 'carve wizard surface calibration step 8 auto level', content: (<div className="space-y-4"><h2 className="text-xl font-bold mb-4">Carve Wizard: Step 8 - Surface Calibration</h2><p className="text-sm">Select whether to run Auto Level mesh mapping before carving.</p><HelpScreenshot src="/help_images/wizards/carve-wizard-step-08-surface-calibration.png" alt="Carve Wizard step 8 surface calibration" caption="Step 8 Auto Level choice: map the surface or skip." /></div>),
  },
  {
    id: 'carve-wizard-step-09', parentId: carveWizardParentId, title: 'Step 9: End Job Options', category: 'general', searchText: 'carve wizard end job options step 9 macro execution', content: (<div className="space-y-4"><h2 className="text-xl font-bold mb-4">Carve Wizard: Step 9 - End Job Options</h2><p className="text-sm">Define post-job behavior such as optional macro execution at job completion.</p><HelpScreenshot src="/help_images/wizards/carve-wizard-step-09-end-job-options.png" alt="Carve Wizard step 9 end job options" caption="Step 9 post-job action toggle for optional automation after carve completion." /></div>),
  },
  {
    id: 'carve-wizard-step-10', parentId: carveWizardParentId, title: 'Step 10: Safety Checks', category: 'general', searchText: 'carve wizard safety checks step 10', content: (<div className="space-y-4"><h2 className="text-xl font-bold mb-4">Carve Wizard: Step 10 - Safety Checks</h2><p className="text-sm">Complete final safety confirmations before the machine is allowed to start carving.</p><HelpScreenshot src="/help_images/wizards/carve-wizard-step-10-safety-checks.png" alt="Carve Wizard step 10 safety checks" caption="Step 10 checklist for personal safety, clamping, clearance, and coolant or dust readiness." /></div>),
  },
  {
    id: 'carve-wizard-step-11', parentId: carveWizardParentId, title: 'Step 11: Ready to Carve', category: 'general', searchText: 'carve wizard ready to carve step 11 start', content: (<div className="space-y-4"><h2 className="text-xl font-bold mb-4">Carve Wizard: Step 11 - Ready to Carve</h2><p className="text-sm">Review final job details and press Start Carve when ready.</p><HelpScreenshot src="/help_images/wizards/carve-wizard-step-11-ready-to-carve.png" alt="Carve Wizard step 11 ready to carve" caption="Step 11 final confirmation screen where carving starts." /></div>),
  },
  {
    id: machineSetupWizardParentId,
    title: 'Machine Setup Wizard',
    category: 'general',
    searchText: 'wizard setup connection dimensions bed tooling probe axis direction homing',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Machine Setup Wizard: Step-by-Step</h2>
        <p className="text-sm">
          The Machine Setup Wizard walks you through connecting to your machine, configuring physical dimensions
          and tooling, verifying all three axis directions, running homing, and confirming the machine is ready to carve.
          Launch it from the Quick Setup Wizard banner in Settings.
        </p>

        <HelpScreenshot src="/help_images/wizards/machine-setup-wizard-launch.png" alt="Quick Setup Wizard launch banner in Settings" caption="Click Start in the Quick Setup Wizard banner to open the Machine Setup Wizard." />
        <p className="text-sm">Use the left navigation to jump directly to each wizard step.</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Step 1: Welcome</li>
          <li>Step 2: Connection</li>
          <li>Step 3: Machine Physical</li>
          <li>Step 4: Tooling &amp; Probe</li>
          <li>Step 5: X-Axis Direction</li>
          <li>Step 6: Y-Axis Direction</li>
          <li>Step 7: Z-Axis Direction</li>
          <li>Step 8: Homing</li>
          <li>Step 9: Complete</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'machine-setup-wizard-step-01', parentId: machineSetupWizardParentId, title: 'Step 1: Welcome', category: 'general', searchText: 'machine setup wizard step 1 welcome', content: (<div className="space-y-4"><h2 className="text-xl font-bold mb-4">Machine Setup Wizard: Step 1 - Welcome</h2><p className="text-sm">An overview screen confirms prerequisites before proceeding.</p><HelpScreenshot src="/help_images/wizards/machine-setup-wizard-step-01-welcome.png" alt="Machine Setup Wizard step 1 welcome" caption="Step 1 welcome screen with setup overview and prerequisites reminder." /></div>),
  },
  {
    id: 'machine-setup-wizard-step-02', parentId: machineSetupWizardParentId, title: 'Step 2: Connection', category: 'general', searchText: 'machine setup wizard step 2 connection telnet usb websocket', content: (<div className="space-y-4"><h2 className="text-xl font-bold mb-4">Machine Setup Wizard: Step 2 - Connection</h2><p className="text-sm">Select your connection type, enter host and port, then test the connection.</p><HelpScreenshot src="/help_images/wizards/machine-setup-wizard-step-02-connection.png" alt="Machine Setup Wizard step 2 connection" caption="Step 2 connection type selection with host/IP, port, and Test Connection button." /></div>),
  },
  {
    id: 'machine-setup-wizard-step-03', parentId: machineSetupWizardParentId, title: 'Step 3: Machine Physical', category: 'general', searchText: 'machine setup wizard step 3 machine physical dimensions safe z', content: (<div className="space-y-4"><h2 className="text-xl font-bold mb-4">Machine Setup Wizard: Step 3 - Machine Physical</h2><p className="text-sm">Enter bed dimensions and safe Z height to define workspace boundaries.</p><HelpScreenshot src="/help_images/wizards/machine-setup-wizard-step-03-machine-physical.png" alt="Machine Setup Wizard step 3 machine physical dimensions" caption="Step 3 bed size inputs for X, Y, Z and safe retract height." /></div>),
  },
  {
    id: 'machine-setup-wizard-step-04', parentId: machineSetupWizardParentId, title: 'Step 4: Tooling & Probe', category: 'general', searchText: 'machine setup wizard step 4 tooling probe spindle rpm', content: (<div className="space-y-4"><h2 className="text-xl font-bold mb-4">Machine Setup Wizard: Step 4 - Tooling &amp; Probe</h2><p className="text-sm">Choose your probe type and set spindle RPM min and max limits.</p><HelpScreenshot src="/help_images/wizards/machine-setup-wizard-step-04-tooling-probe.png" alt="Machine Setup Wizard step 4 tooling and probe" caption="Step 4 probe type selection and spindle RPM limit configuration." /></div>),
  },
  {
    id: 'machine-setup-wizard-step-05', parentId: machineSetupWizardParentId, title: 'Step 5: X-Axis Direction', category: 'general', searchText: 'machine setup wizard step 5 x axis direction reverse x', content: (<div className="space-y-4"><h2 className="text-xl font-bold mb-4">Machine Setup Wizard: Step 5 - X-Axis Direction</h2><p className="text-sm">Home first, then jog X positive and negative. Reverse the axis if needed.</p><HelpScreenshot src="/help_images/wizards/machine-setup-wizard-step-05-x-axis-direction.png" alt="Machine Setup Wizard step 5 x-axis direction" caption="Step 5 X-axis jog controls with Home, Stop, reverse toggle, and confirmation checkbox." /></div>),
  },
  {
    id: 'machine-setup-wizard-step-06', parentId: machineSetupWizardParentId, title: 'Step 6: Y-Axis Direction', category: 'general', searchText: 'machine setup wizard step 6 y axis direction reverse y', content: (<div className="space-y-4"><h2 className="text-xl font-bold mb-4">Machine Setup Wizard: Step 6 - Y-Axis Direction</h2><p className="text-sm">Jog Y positive and negative, then reverse the axis if needed.</p><HelpScreenshot src="/help_images/wizards/machine-setup-wizard-step-06-y-axis-direction.png" alt="Machine Setup Wizard step 6 y-axis direction" caption="Step 6 Y-axis jog controls with reverse toggle and confirmation checkbox." /></div>),
  },
  {
    id: 'machine-setup-wizard-step-07', parentId: machineSetupWizardParentId, title: 'Step 7: Z-Axis Direction', category: 'general', searchText: 'machine setup wizard step 7 z axis direction reverse z', content: (<div className="space-y-4"><h2 className="text-xl font-bold mb-4">Machine Setup Wizard: Step 7 - Z-Axis Direction</h2><p className="text-sm">Jog Z positive and negative. Positive Z should lift the tool up.</p><HelpScreenshot src="/help_images/wizards/machine-setup-wizard-step-07-z-axis-direction.png" alt="Machine Setup Wizard step 7 z-axis direction" caption="Step 7 Z-axis jog controls showing HOMED state, reverse toggle, and confirmation checkbox." /></div>),
  },
  {
    id: 'machine-setup-wizard-step-08', parentId: machineSetupWizardParentId, title: 'Step 8: Homing', category: 'general', searchText: 'machine setup wizard step 8 homing successful', content: (<div className="space-y-4"><h2 className="text-xl font-bold mb-4">Machine Setup Wizard: Step 8 - Homing</h2><p className="text-sm">The wizard runs the homing cycle and reports the result.</p><HelpScreenshot src="/help_images/wizards/machine-setup-wizard-step-08-homing-complete.png" alt="Machine Setup Wizard step 8 homing complete" caption="Step 8 homing complete confirmation with HOMING SUCCESSFUL banner." /></div>),
  },
  {
    id: 'machine-setup-wizard-step-09', parentId: machineSetupWizardParentId, title: 'Step 9: Complete', category: 'general', searchText: 'machine setup wizard step 9 complete next steps', content: (<div className="space-y-4"><h2 className="text-xl font-bold mb-4">Machine Setup Wizard: Step 9 - Complete</h2><p className="text-sm">Setup is done. Load a file, set workspace zero, and use the Carve Wizard to start a job.</p><HelpScreenshot src="/help_images/wizards/machine-setup-wizard-step-09-complete.png" alt="Machine Setup Wizard step 9 setup complete" caption="Step 9 Setup Complete screen with suggested next steps." /></div>),
  },
  {
    id: surfacingWizardParentId,
    title: 'Surfacing Wizard',
    searchText: 'wizard surfacing bit stock pass depth preview toolpath raster gcode generate',
    category: 'general',
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Surfacing Wizard: Step-by-Step</h2>
        <p className="text-sm">
          The Surfacing Wizard guides you through selecting a surfacing bit, defining pass parameters,
          previewing the raster toolpath, and generating a ready-to-run G-code file.
        </p>

        <p className="text-sm">Use the left navigation to jump directly to each wizard step.</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Step 1: Select Surfacing Bit</li>
          <li>Step 2: Configure Pass</li>
          <li>Step 3: Toolpath Preview</li>
          <li>Step 4: Generate G-code</li>
          <li>Generated File Result</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'surfacing-wizard-step-01', parentId: surfacingWizardParentId, title: 'Step 1: Select Surfacing Bit', category: 'general', searchText: 'surfacing wizard step 1 select surfacing bit', content: (<div className="space-y-4"><h2 className="text-xl font-bold mb-4">Surfacing Wizard: Step 1 - Select Surfacing Bit</h2><p className="text-sm">Choose the tool to use for surfacing. The selected bit diameter drives step-over and line-count calculations.</p><HelpScreenshot src="/help_images/wizards/surfacing-wizard-step-01-select-tool.png" alt="Surfacing Wizard step 1 select surfacing bit" caption="Step 1 tool selection with active surfacing bit highlighted." /></div>),
  },
  {
    id: 'surfacing-wizard-step-02', parentId: surfacingWizardParentId, title: 'Step 2: Configure Pass', category: 'general', searchText: 'surfacing wizard step 2 configure pass stock motion', content: (<div className="space-y-4"><h2 className="text-xl font-bold mb-4">Surfacing Wizard: Step 2 - Configure Pass</h2><p className="text-sm">Set stock dimensions, origin, removal depth, and core toolpath parameters before generation.</p><HelpScreenshot src="/help_images/wizards/surfacing-wizard-step-02-configure-pass-stock.png" alt="Surfacing Wizard step 2 configure stock and removal" caption="Step 2 configuration for stock size, work origin, removal depth, and step-over inputs." /><HelpScreenshot src="/help_images/wizards/surfacing-wizard-step-02b-configure-pass-motion.png" alt="Surfacing Wizard step 2 configure motion settings" caption="Step 2 continuation with motion settings such as safe Z, feed and plunge rates, spindle RPM, cut direction, and finish pass." /></div>),
  },
  {
    id: 'surfacing-wizard-step-03', parentId: surfacingWizardParentId, title: 'Step 3: Toolpath Preview', category: 'general', searchText: 'surfacing wizard step 3 toolpath preview raster lines', content: (<div className="space-y-4"><h2 className="text-xl font-bold mb-4">Surfacing Wizard: Step 3 - Toolpath Preview</h2><p className="text-sm">Review the 2D raster preview to validate line direction, coverage, and expected pass count.</p><HelpScreenshot src="/help_images/wizards/surfacing-wizard-step-03-toolpath-preview.png" alt="Surfacing Wizard step 3 toolpath preview" caption="Step 3 preview of raster lines across the work area with computed summary values." /></div>),
  },
  {
    id: 'surfacing-wizard-step-04', parentId: surfacingWizardParentId, title: 'Step 4: Generate G-code', category: 'general', searchText: 'surfacing wizard step 4 generate gcode', content: (<div className="space-y-4"><h2 className="text-xl font-bold mb-4">Surfacing Wizard: Step 4 - Generate G-code</h2><p className="text-sm">Generate and inspect the output before saving.</p><HelpScreenshot src="/help_images/wizards/surfacing-wizard-step-04-gcode-ready-preview.png" alt="Surfacing Wizard step 4 gcode ready" caption="Step 4 generated output view with G-code preview and Save & Open in Visualizer action." /></div>),
  },
  {
    id: 'surfacing-wizard-generated-file', parentId: surfacingWizardParentId, title: 'Generated File Result', category: 'general', searchText: 'surfacing wizard generated file result file manager', content: (<div className="space-y-4"><h2 className="text-xl font-bold mb-4">Surfacing Wizard: Generated File Result</h2><p className="text-sm">After saving, the surfacing file appears in File Manager and can be loaded directly for visualization or execution.</p><HelpScreenshot src="/help_images/wizards/surfacing-wizard-step-05-generated-file-card.png" alt="Generated surfacing file in file manager" caption="Saved surfacing output file card in File Manager before running." /></div>),
  },
];
