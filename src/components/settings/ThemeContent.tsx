import { Sun, Moon, Sparkles, Wind, Ghost, Leaf } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import { useSettingsStore } from '../../stores/settingsStore';

export function ThemeContent() {
  const { theme, setTheme } = useThemeStore();

  const themes = [
    { id: 'light',    label: 'Standard Light', icon: <Sun className="w-4 h-4" />,      colors: ['#fafbfc', '#2d3748', '#4a90e2'] },
    { id: 'dark',     label: 'Standard Dark',  icon: <Moon className="w-4 h-4" />,     colors: ['#121417', '#e4e7eb', '#5a9fd4'] },
    { id: 'midnight', label: 'Midnight Blue',  icon: <Sparkles className="w-4 h-4" />, colors: ['#020617', '#f1f5f9', '#6366f1'] },
    { id: 'nord',     label: 'Arctic Nord',    icon: <Wind className="w-4 h-4" />,     colors: ['#2e3440', '#eceff4', '#88c0d0'] },
    { id: 'dracula',  label: 'Gothic Dracula', icon: <Ghost className="w-4 h-4" />,    colors: ['#21222c', '#f8f8f2', '#bd93f9'] },
    { id: 'bamboo',   label: 'Zen Bamboo',     icon: <Leaf className="w-4 h-4" />,     colors: ['#0f110f', '#e6e8e6', '#84cc16'] },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-4">
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className={`relative group flex flex-col p-3.5 rounded-xl border-2 transition-all duration-300 cursor-pointer text-left overflow-hidden ${
            theme === t.id
              ? 'border-[var(--accent-primary)] bg-[var(--bg-tertiary)] shadow-lg shadow-[var(--accent-primary)]/10'
              : 'border-[var(--border-color)] hover:border-[var(--accent-primary)]/40 hover:bg-[var(--bg-tertiary)]/50'
          }`}
          aria-label={`${t.label} theme`}
          aria-pressed={theme === t.id}
        >
          {theme === t.id && (
            <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center">
              <div className="absolute top-[-10px] right-[-10px] w-20 h-20 bg-[var(--accent-primary)] rotate-45 transform pointer-events-none opacity-10" />
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] relative z-10" />
            </div>
          )}

          <div className="flex items-center gap-2.5 mb-3 relative z-10">
            <span className={`p-1.5 rounded-lg transition-colors ${
              theme === t.id ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]'
            }`}>
              {t.icon}
            </span>
            <span className={`text-xs font-bold tracking-tight transition-colors ${
              theme === t.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
            }`}>
              {t.label}
            </span>
          </div>

          <div className="flex gap-1.5 items-center relative z-10">
            {t.colors.map((c, i) => (
              <div
                key={i}
                className="w-full h-1.5 rounded-full border border-black/5"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {theme === t.id && (
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/5 to-transparent pointer-events-none" />
          )}
        </button>
      ))}

      <div className="col-span-2 pt-4 border-t border-[var(--border-color)]">
        <div className="space-y-3">
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
            UI Scale ({(useSettingsStore(s => s.settings.general.uiScale) || 1.0).toFixed(1)}x)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={useSettingsStore(s => s.settings.general.uiScale) || 1.0}
              onChange={(e) => useSettingsStore.getState().setGeneralSettings({ uiScale: parseFloat(e.target.value) || 1.0 })}
              className="flex-1 accent-[var(--accent-primary)] cursor-pointer"
            />
            <button
              onClick={() => useSettingsStore.getState().setGeneralSettings({ uiScale: 1.0 })}
              className="p-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition-colors cursor-pointer text-xs flex items-center gap-1"
              title="Reset to 1.0x"
            >
              Reset
            </button>
          </div>
          <p className="text-[10px] text-[var(--text-tertiary)] italic leading-relaxed">
            Adjust the overall size of the user interface. You can also use Ctrl/Cmd + and - to zoom, and 0 to reset.
          </p>
        </div>
      </div>
    </div>
  );
}
