import { useSettingsStore } from '../../stores/settingsStore';
import { transport } from '../../services/transportService';
import { Tooltip } from '../ui/Tooltip';

export default function RotaryContent() {
  const { settings, setRotarySettings } = useSettingsStore();
  const rotary = settings.rotary;

  const labelCls = 'block text-xs font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5';
  const inputCls =
    'w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] ' +
    'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] ' +
    'focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]';
  
  const subHeaderCls = "text-xs font-semibold text-[var(--accent-primary)] uppercase tracking-wider mb-3 mt-1";

  // Calculations
  const calcStepsPerMm = rotary.rotaryType === 'Roller'
    ? (rotary.stepsPerRevolution * rotary.microstepping) / (Math.PI * rotary.rollerDiameter)
    : (rotary.stepsPerRevolution * rotary.microstepping) / (Math.PI * rotary.objectDiameter);

  const calcStepsPerDegree = (rotary.stepsPerRevolution * rotary.microstepping) / 360;

  return (
    <div className="space-y-8">
      
      {/* 1. Hardware Setup */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className={subHeaderCls}>1. Hardware Setup</h4>
          <Tooltip content="Enable or disable Rotary Mode globally" position="left">
            <button
              onClick={() => setRotarySettings({ enabled: !rotary.enabled })}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                rotary.enabled ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  rotary.enabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </Tooltip>
        </div>

        <div className="grid grid-cols-2 gap-4 opacity-100 transition-opacity">
          <Tooltip content="Choose how your rotary is wired: Swapping a Y/X motor, or using a dedicated 4th axis" position="top">
            <div>
              <label className={labelCls}>Strategy</label>
              <div className="flex gap-1.5 p-1 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
                  <button
                    onClick={() => setRotarySettings({ strategy: 'A_Swap' })}
                    className={`flex-1 py-1.5 text-[10px] font-medium rounded-md transition-all ${
                      rotary.strategy === 'A_Swap'
                        ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    Axis Swap
                  </button>
                  <button
                    onClick={() => setRotarySettings({ strategy: 'B_Dedicated' })}
                    className={`flex-1 py-1.5 text-[10px] font-medium rounded-md transition-all ${
                      rotary.strategy === 'B_Dedicated'
                        ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    Dedicated A-Axis
                  </button>
              </div>
            </div>
          </Tooltip>
          
          <Tooltip content="Roller uses a fixed roller diameter. Chuck uses the actual object's diameter." position="top">
            <div>
              <label className={labelCls}>Rotary Type</label>
              <div className="flex gap-1.5 p-1 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
                  <button
                    onClick={() => setRotarySettings({ rotaryType: 'Roller' })}
                    className={`flex-1 py-1.5 text-[10px] font-medium rounded-md transition-all ${
                      rotary.rotaryType === 'Roller'
                        ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    Roller
                  </button>
                  <button
                    onClick={() => setRotarySettings({ rotaryType: 'Chuck' })}
                    className={`flex-1 py-1.5 text-[10px] font-medium rounded-md transition-all ${
                      rotary.rotaryType === 'Chuck'
                        ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    Chuck
                  </button>
              </div>
            </div>
          </Tooltip>

          {rotary.strategy === 'A_Swap' && (
            <Tooltip content="Which standard axis is unplugged / substituted by the rotary stepper" position="top">
              <div>
                <label className={labelCls}>Swapped Axis</label>
                <select
                  value={rotary.swapAxis}
                  onChange={(e) => setRotarySettings({ swapAxis: e.target.value as any })}
                  className={inputCls}
                >
                  <option value="X">X-Axis</option>
                  <option value="Y">Y-Axis</option>
                  <option value="Z">Z-Axis</option>
                </select>
              </div>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      {/* 2. Calibration Calculations */}
      <div className="space-y-4">
        <h4 className={subHeaderCls}>2. Calibration Calculations</h4>
        <div className="grid grid-cols-2 gap-4">
          <Tooltip content="Number of full steps the stepper motor requires for 1 revolution (e.g. 200 for 1.8 degree motors)" position="top">
            <div>
              <label className={labelCls}>Motor Steps/Rev</label>
              <input
                type="number"
                value={rotary.stepsPerRevolution}
                onChange={(e) => setRotarySettings({ stepsPerRevolution: parseInt(e.target.value) || 200 })}
                className={inputCls}
                step={100}
              />
            </div>
          </Tooltip>
          
          <Tooltip content="Microsteps set on the stepper driver hardware (e.g., 16, 32, etc.)" position="top">
            <div>
              <label className={labelCls}>Microstepping (Driver setting)</label>
              <input
                type="number"
                value={rotary.microstepping}
                onChange={(e) => setRotarySettings({ microstepping: parseInt(e.target.value) || 16 })}
                className={inputCls}
              />
            </div>
          </Tooltip>
          
          {rotary.rotaryType === 'Roller' ? (
            <Tooltip content="The exact diameter (in mm) of the rubber rollers driving the object" position="top">
              <div>
                <label className={labelCls}>Roller Diameter (mm)</label>
                <input
                  type="number"
                  value={rotary.rollerDiameter}
                  onChange={(e) => setRotarySettings({ rollerDiameter: parseFloat(e.target.value) || 40 })}
                  className={inputCls}
                  step={0.1}
                />
              </div>
            </Tooltip>
          ) : (
            <Tooltip content="The diameter (in mm) of the material securely held in the chuck" position="top">
              <div>
                <label className={labelCls}>Object Diameter (mm)</label>
                <input
                  type="number"
                  value={rotary.objectDiameter}
                  onChange={(e) => setRotarySettings({ objectDiameter: parseFloat(e.target.value) || 50 })}
                  className={inputCls}
                  step={0.1}
                />
                <p className="mt-1 text-[9px] text-[var(--text-tertiary)] italic">
                  A Chuck on $101 requires changing this value per object.
                </p>
              </div>
            </Tooltip>
          )}
        </div>

        {/* Dynamic Display of Value */}
        <Tooltip content="Update your controller firmware config with these calculated steps" position="top">
          <div className="mt-4 p-4 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)]">
              <h5 className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] mb-2">Calculated Value</h5>
              {rotary.strategy === 'B_Dedicated' ? (
                 <div className="flex justify-between items-center">
                     <div className="text-xl font-bold text-[var(--accent-primary)]">{calcStepsPerDegree.toFixed(3)}</div>
                     <div className="text-xs text-[var(--text-secondary)]">Steps per Degree</div>
                 </div>
              ) : (
                 <div className="flex justify-between items-center">
                     <div className="text-xl font-bold text-[var(--accent-primary)]">{calcStepsPerMm.toFixed(3)}</div>
                     <div className="text-xs text-[var(--text-secondary)]">Steps per mm</div>
                 </div>
              )}
              <p className="mt-2 text-[10px] text-[var(--text-tertiary)]">
                  {rotary.strategy === 'B_Dedicated' 
                   ? `Set $103=${calcStepsPerDegree.toFixed(3)} or 'steps_per_mm' in your fluidnc A-axis block.`
                   : `Set $101=${calcStepsPerMm.toFixed(3)} or 'steps_per_mm' in your fluidnc Y-axis block.`}
              </p>
          </div>
        </Tooltip>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      {/* 3. FluidNC Environments */}
      <div className="space-y-4">
        <h4 className={subHeaderCls}>3. FluidNC Config Files</h4>
        <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed -mt-2 mb-3">
          Switching configurations quickly is a feature of FluidNC. Ensure these files exist on your controller.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Tooltip content="Path to your default non-rotary FluidNC config.yaml" position="top">
            <div>
              <label className={labelCls}>Standard Config</label>
              <input
                type="text"
                value={rotary.standardConfigPath}
                onChange={(e) => setRotarySettings({ standardConfigPath: e.target.value })}
                className={inputCls}
                placeholder="config.yaml"
              />
              <button 
                onClick={() => transport.invoke('send_gcode', { cmd: `?$Config/Filename=${rotary.standardConfigPath}` })}
                className="mt-2 w-full text-[10px] py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] rounded transition-colors"
              >
                Load Standard
              </button>
            </div>
          </Tooltip>
          
          <Tooltip content="Path to your secondary FluidNC rotary config (e.g. rotary.yaml)" position="top">
            <div>
              <label className={labelCls}>Rotary Config</label>
              <input
                type="text"
                value={rotary.rotaryConfigPath}
                onChange={(e) => setRotarySettings({ rotaryConfigPath: e.target.value })}
                className={inputCls}
                placeholder="rotary.yaml"
              />
              <button 
                onClick={() => transport.invoke('send_gcode', { cmd: `?$Config/Filename=${rotary.rotaryConfigPath}` })}
                className="mt-2 w-full text-[10px] py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] rounded transition-colors"
              >
                Load Rotary
              </button>
            </div>
          </Tooltip>
        </div>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      {/* 4. Motion Parameters */}
      <div className="space-y-4">
        <h4 className={subHeaderCls}>4. Constraints & Motion Limits</h4>
        <div className="grid grid-cols-2 gap-4">
          <Tooltip content="Max velocity limit for the axis in GRBL ($110/$111/$113) or fluidnc 'max_travel_mm_per_min'" position="top">
            <div>
              <label className={labelCls}>Max Rate ({rotary.strategy === 'B_Dedicated' ? 'degrees/min' : 'mm/min'})</label>
              <input
                type="number"
                value={rotary.maxRate}
                onChange={(e) => setRotarySettings({ maxRate: parseFloat(e.target.value) || 0 })}
                className={inputCls}
              />
            </div>
          </Tooltip>
          
          <Tooltip content="Max acceleration limit for the axis in GRBL ($120/$121/$123) or fluidnc 'acceleration_mm_per_sec2'" position="top">
            <div>
              <label className={labelCls}>Acceleration ({rotary.strategy === 'B_Dedicated' ? 'deg/sec²' : 'mm/sec²'})</label>
              <input
                type="number"
                value={rotary.acceleration}
                onChange={(e) => setRotarySettings({ acceleration: parseFloat(e.target.value) || 0 })}
                className={inputCls}
              />
               <p className="mt-1 text-[9px] text-[var(--accent-primary)] italic">
                Keep low (e.g. 50-100) on Roller to prevent slip!
              </p>
            </div>
          </Tooltip>
        </div>
      </div>

    </div>
  );
}