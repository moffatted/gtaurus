import { HelpTopic } from './helpTopics.types';
import { HelpScreenshot } from './HelpScreenshot';

export const wizardTopics: HelpTopic[] = [
  {
    id: 'carve-wizard',
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

        <h3 className="text-lg font-semibold mt-4">Step 1: Power &amp; Homing</h3>
        <p className="text-sm">Confirm machine status and run homing ($H$) if needed before continuing.</p>
        <HelpScreenshot
          src="/help_images/wizards/carve-wizard-step-01-power-homing.png"
          alt="Carve Wizard step 1 power and homing"
          caption="Step 1 checks homing state and provides a direct action to run the homing cycle."
        />

        <h3 className="text-lg font-semibold mt-4">Step 2: Workpiece Placement</h3>
        <p className="text-sm">Physically secure the workpiece and acknowledge that it is clamped or fixtured safely.</p>
        <HelpScreenshot
          src="/help_images/wizards/carve-wizard-step-02-workpiece-placement.png"
          alt="Carve Wizard step 2 workpiece placement"
          caption="Step 2 requires user confirmation that the workpiece is securely placed."
        />

        <h3 className="text-lg font-semibold mt-4">Step 3: File &amp; Dimensions</h3>
        <p className="text-sm">Choose the active file and verify/edit actual workpiece dimensions used for carving setup.</p>
        <HelpScreenshot
          src="/help_images/wizards/carve-wizard-step-03-file-dimensions.png"
          alt="Carve Wizard step 3 file and dimensions"
          caption="Step 3 file selection and editable workpiece dimensions."
        />
        <HelpScreenshot
          src="/help_images/wizards/carve-wizard-step-03b-zero-position-variant.png"
          alt="Carve Wizard step 3 zero position variant"
          caption="Step 3 variant showing zero-position selection relative to the workpiece and fixed job bounds preview."
        />

        <h3 className="text-lg font-semibold mt-4">Step 4: Tooling</h3>
        <p className="text-sm">Verify the active tool and pick the correct tool from the library for this operation.</p>
        <HelpScreenshot
          src="/help_images/wizards/carve-wizard-step-04-tooling-selection.png"
          alt="Carve Wizard step 4 tooling selection"
          caption="Step 4 ensures the loaded physical tool matches the selected library tool."
        />

        <h3 className="text-lg font-semibold mt-4">Step 5: Zero Method</h3>
        <p className="text-sm">Choose how you want to set workspace zero: manual positioning or touch-probe workflow.</p>
        <HelpScreenshot
          src="/help_images/wizards/carve-wizard-step-05-zero-method.png"
          alt="Carve Wizard step 5 zero method"
          caption="Step 5 lets you choose between manual zero and probe-based zeroing."
        />

        <h3 className="text-lg font-semibold mt-4">Step 6: Position Tool</h3>
        <p className="text-sm">Jog to the intended origin using step size controls and XYZ jog buttons.</p>
        <HelpScreenshot
          src="/help_images/wizards/carve-wizard-step-06-position-tool.png"
          alt="Carve Wizard step 6 position tool"
          caption="Step 6 manual jogging interface for precise tool positioning at origin."
        />

        <h3 className="text-lg font-semibold mt-4">Step 7: Set Zero</h3>
        <p className="text-sm">Execute the zero action for the chosen method and confirm the resulting workspace coordinates.</p>
        <HelpScreenshot
          src="/help_images/wizards/carve-wizard-step-07-set-zero-manual.png"
          alt="Carve Wizard step 7 set zero manual"
          caption="Step 7 manual zero variant with explicit X0 Y0 Z0 action."
        />
        <HelpScreenshot
          src="/help_images/wizards/carve-wizard-step-07b-set-zero-probe-variant.png"
          alt="Carve Wizard step 7 set zero probe variant"
          caption="Step 7 probe variant running a touch-plate probe sequence before zero set confirmation."
        />

        <h3 className="text-lg font-semibold mt-4">Step 8: Surface Calibration</h3>
        <p className="text-sm">Select whether to run Auto Level mesh mapping before carving (recommended for uneven surfaces and PCB work).</p>
        <HelpScreenshot
          src="/help_images/wizards/carve-wizard-step-08-surface-calibration.png"
          alt="Carve Wizard step 8 surface calibration"
          caption="Step 8 Auto Level choice: map the surface or skip."
        />

        <h3 className="text-lg font-semibold mt-4">Step 9: End Job Options</h3>
        <p className="text-sm">Define post-job behavior such as optional macro execution at job completion.</p>
        <HelpScreenshot
          src="/help_images/wizards/carve-wizard-step-09-end-job-options.png"
          alt="Carve Wizard step 9 end job options"
          caption="Step 9 post-job action toggle for optional automation after carve completion."
        />

        <h3 className="text-lg font-semibold mt-4">Step 10: Safety Checks</h3>
        <p className="text-sm">Complete final safety confirmations before the machine is allowed to start carving.</p>
        <HelpScreenshot
          src="/help_images/wizards/carve-wizard-step-10-safety-checks.png"
          alt="Carve Wizard step 10 safety checks"
          caption="Step 10 checklist for personal safety, clamping, clearance, and coolant/dust readiness."
        />

        <h3 className="text-lg font-semibold mt-4">Step 11: Ready to Carve</h3>
        <p className="text-sm">Review final job details (file, RPM, feed rate) and press Start Carve when ready.</p>
        <HelpScreenshot
          src="/help_images/wizards/carve-wizard-step-11-ready-to-carve.png"
          alt="Carve Wizard step 11 ready to carve"
          caption="Step 11 final confirmation screen where carving starts."
        />
      </div>
    ),
  },
  {
    id: 'machine-setup-wizard',
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

        <HelpScreenshot
          src="/help_images/wizards/machine-setup-wizard-launch.png"
          alt="Quick Setup Wizard launch banner in Settings"
          caption="Click Start in the Quick Setup Wizard banner to open the Machine Setup Wizard."
        />

        <h3 className="text-lg font-semibold mt-4">Step 1: Welcome</h3>
        <p className="text-sm">An overview screen confirms prerequisites — machine powered on and e-stop disengaged — before proceeding.</p>
        <HelpScreenshot
          src="/help_images/wizards/machine-setup-wizard-step-01-welcome.png"
          alt="Machine Setup Wizard step 1 welcome"
          caption="Step 1 welcome screen with setup overview and prerequisites reminder."
        />

        <h3 className="text-lg font-semibold mt-4">Step 2: Connection</h3>
        <p className="text-sm">Select your connection type (Telnet, USB, or WebSocket), enter the host and port, then test the connection before moving on.</p>
        <HelpScreenshot
          src="/help_images/wizards/machine-setup-wizard-step-02-connection.png"
          alt="Machine Setup Wizard step 2 connection"
          caption="Step 2 connection type selection with host/IP, port, and Test Connection button."
        />

        <h3 className="text-lg font-semibold mt-4">Step 3: Machine Physical</h3>
        <p className="text-sm">Enter your machine's bed dimensions (X, Y, Z in mm) and safe Z height. These values define workspace boundaries and safe retract height.</p>
        <HelpScreenshot
          src="/help_images/wizards/machine-setup-wizard-step-03-machine-physical.png"
          alt="Machine Setup Wizard step 3 machine physical dimensions"
          caption="Step 3 bed size inputs for X, Y, Z and safe retract height."
        />

        <h3 className="text-lg font-semibold mt-4">Step 4: Tooling & Probe</h3>
        <p className="text-sm">Choose your probe type (Touch-Trigger, Electronic Tool Setter, or Manual) and set spindle RPM min/max limits for PWM scaling.</p>
        <HelpScreenshot
          src="/help_images/wizards/machine-setup-wizard-step-04-tooling-probe.png"
          alt="Machine Setup Wizard step 4 tooling and probe"
          caption="Step 4 probe type selection and spindle RPM limit configuration."
        />

        <h3 className="text-lg font-semibold mt-4">Step 5: X-Axis Direction</h3>
        <p className="text-sm">Home the machine first, then jog X+ and X−. If the direction is reversed, toggle <strong>Reverse X Axis Direction</strong>, then confirm with the checkbox.</p>
        <HelpScreenshot
          src="/help_images/wizards/machine-setup-wizard-step-05-x-axis-direction.png"
          alt="Machine Setup Wizard step 5 x-axis direction"
          caption="Step 5 X-axis jog controls with Home, Stop, reverse toggle, and confirmation checkbox."
        />

        <h3 className="text-lg font-semibold mt-4">Step 6: Y-Axis Direction</h3>
        <p className="text-sm">Jog Y+ and Y−. Positive Y should move the bed towards you (or the tool away from you). Toggle <strong>Reverse Y Axis Direction</strong> if needed.</p>
        <HelpScreenshot
          src="/help_images/wizards/machine-setup-wizard-step-06-y-axis-direction.png"
          alt="Machine Setup Wizard step 6 y-axis direction"
          caption="Step 6 Y-axis jog controls with reverse toggle and confirmation checkbox."
        />

        <h3 className="text-lg font-semibold mt-4">Step 7: Z-Axis Direction</h3>
        <p className="text-sm">Jog Z+ and Z−. Positive Z should lift the tool up. Toggle <strong>Reverse Z Axis Direction</strong> if it moves down instead.</p>
        <HelpScreenshot
          src="/help_images/wizards/machine-setup-wizard-step-07-z-axis-direction.png"
          alt="Machine Setup Wizard step 7 z-axis direction"
          caption="Step 7 Z-axis jog controls showing HOMED state, reverse toggle, and confirmation checkbox."
        />

        <h3 className="text-lg font-semibold mt-4">Step 8: Homing</h3>
        <p className="text-sm">The wizard runs the homing cycle and reports the result. A green <strong>HOMING SUCCESSFUL</strong> banner confirms the coordinate system is established.</p>
        <HelpScreenshot
          src="/help_images/wizards/machine-setup-wizard-step-08-homing-complete.png"
          alt="Machine Setup Wizard step 8 homing complete"
          caption="Step 8 homing complete confirmation with HOMING SUCCESSFUL banner."
        />

        <h3 className="text-lg font-semibold mt-4">Step 9: Complete</h3>
        <p className="text-sm">Setup is done. The wizard summarises next steps: load a G-code file, set Workspace Zero, and use the Carve Wizard to start a job.</p>
        <HelpScreenshot
          src="/help_images/wizards/machine-setup-wizard-step-09-complete.png"
          alt="Machine Setup Wizard step 9 setup complete"
          caption="Step 9 Setup Complete screen with suggested next steps."
        />
      </div>
    ),
  },
  {
    id: 'surfacing-wizard',
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

        <h3 className="text-lg font-semibold mt-4">Step 1: Select Surfacing Bit</h3>
        <p className="text-sm">Choose the tool to use for surfacing. The selected bit diameter drives step-over and line-count calculations.</p>
        <HelpScreenshot
          src="/help_images/wizards/surfacing-wizard-step-01-select-tool.png"
          alt="Surfacing Wizard step 1 select surfacing bit"
          caption="Step 1 tool selection with active surfacing bit highlighted."
        />

        <h3 className="text-lg font-semibold mt-4">Step 2: Configure Pass</h3>
        <p className="text-sm">Set stock dimensions, origin, removal depth, and core toolpath parameters before generation.</p>
        <HelpScreenshot
          src="/help_images/wizards/surfacing-wizard-step-02-configure-pass-stock.png"
          alt="Surfacing Wizard step 2 configure stock and removal"
          caption="Step 2 configuration for stock size, work origin, removal depth, and step-over inputs."
        />
        <HelpScreenshot
          src="/help_images/wizards/surfacing-wizard-step-02b-configure-pass-motion.png"
          alt="Surfacing Wizard step 2 configure motion settings"
          caption="Step 2 continuation with motion settings such as safe Z, feed/plunge rates, spindle RPM, cut direction, and finish pass."
        />

        <h3 className="text-lg font-semibold mt-4">Step 3: Toolpath Preview</h3>
        <p className="text-sm">Review the 2D raster preview to validate line direction, coverage, and expected pass count.</p>
        <HelpScreenshot
          src="/help_images/wizards/surfacing-wizard-step-03-toolpath-preview.png"
          alt="Surfacing Wizard step 3 toolpath preview"
          caption="Step 3 preview of raster lines across the work area with computed summary values."
        />

        <h3 className="text-lg font-semibold mt-4">Step 4: Generate G-code</h3>
        <p className="text-sm">Generate and inspect the output. The wizard shows key run parameters and a G-code snippet before saving.</p>
        <HelpScreenshot
          src="/help_images/wizards/surfacing-wizard-step-04-gcode-ready-preview.png"
          alt="Surfacing Wizard step 4 gcode ready"
          caption="Step 4 generated output view with G-code preview and Save & Open in Visualizer action."
        />

        <h3 className="text-lg font-semibold mt-4">Generated File Result</h3>
        <p className="text-sm">After saving, the surfacing file appears in File Manager and can be loaded directly for visualization or execution.</p>
        <HelpScreenshot
          src="/help_images/wizards/surfacing-wizard-step-05-generated-file-card.png"
          alt="Generated surfacing file in file manager"
          caption="Saved surfacing output file card in File Manager (useful confirmation before running)."
        />
      </div>
    ),
  },
];
