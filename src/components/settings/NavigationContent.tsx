import { Camera, Bot, BarChart2, Wrench, Drill, SlidersHorizontal } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';

export function NavigationContent() {
  const { settings, setAiSettings, setStatsSettings, setCameraSettings, setAtcSettings, setToolLibrarySettings, setFluidncManagerSettings } = useSettingsStore();

  const buttons = [
    { 
      id: 'camera', 
      label: 'Camera Viewer', 
      enabled: settings.camera.enabled, 
      toggle: () => setCameraSettings({ enabled: !settings.camera.enabled }),
      icon: <Camera className="w-4 h-4" />
    },
    { 
      id: 'ai', 
      label: 'AI Assistant', 
      enabled: settings.ai.enabled, 
      toggle: () => setAiSettings({ enabled: !settings.ai.enabled }),
      icon: <Bot className="w-4 h-4" />
    },
    { 
      id: 'stats', 
      label: 'Machine Statistics', 
      enabled: settings.stats.enabled, 
      toggle: () => setStatsSettings({ enabled: !settings.stats.enabled }),
      icon: <BarChart2 className="w-4 h-4" />
    },
    { 
      id: 'library', 
      label: 'Bit Library', 
      enabled: settings.toolLibrary.enabled, 
      toggle: () => setToolLibrarySettings({ enabled: !settings.toolLibrary.enabled }),
      icon: <Wrench className="w-4 h-4" />
    },
    { 
      id: 'tools', 
      label: 'Tool Changer', 
      enabled: settings.atc.enabled, 
      toggle: () => setAtcSettings({ enabled: !settings.atc.enabled }),
      icon: <Drill className="w-4 h-4" />
    },
    ...(!settings.general.legacyGrblMode ? [{ 
      id: 'manager', 
      label: 'FluidNC Manager', 
      enabled: settings.fluidncManager.enabled, 
      toggle: () => setFluidncManagerSettings({ enabled: !settings.fluidncManager.enabled }),
      icon: <SlidersHorizontal className="w-4 h-4" />
    }] : []),
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--text-tertiary)] mb-4 italic">
        Toggle which buttons are visible in the top navigation menu.
      </p>
      <div className="grid grid-cols-1 gap-3">
        {buttons.map((btn) => (
          <div key={btn.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <span className="text-[var(--accent-primary)]">{btn.icon}</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">{btn.label}</span>
            </div>
            <button
              onClick={btn.toggle}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                btn.enabled ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-secondary)] hover:bg-[var(--border-color)]'
              }`}
              role="switch"
              aria-checked={btn.enabled}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  btn.enabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}