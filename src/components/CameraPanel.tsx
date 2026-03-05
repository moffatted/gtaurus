/**
 * @file CameraPanel.tsx
 * @purpose Displays the live camera stream and provides hardware controls via backend.
 */
import { useEffect, useState } from 'react';
import { Settings2, RefreshCw } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import { transport } from '../services/transportService';

export function CameraPanel({ hideHeader = false }: { hideHeader?: boolean }) {
  const { camera } = useSettingsStore(s => s.settings);
  const [showSettings, setShowSettings] = useState(false);
  const [controls, setControls] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  
  // Cache buster for the mjpeg stream if needed, though most browsers handle it
  const [cb, setCb] = useState(Date.now());

  useEffect(() => {
    if (showSettings) {
      loadSettings();
    }
  }, [showSettings]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await transport.invoke<Record<string, any>>('get_camera_settings', {
        configPath: camera.crowsnestConfigPath
      });
      setControls(res || {});
    } catch (err) {
      console.error("Failed to load camera settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (key: string, value: any) => {
    setControls(prev => ({ ...prev, [key]: value }));
    try {
      await transport.invoke('set_camera_settings', {
        configPath: camera.crowsnestConfigPath,
        updates: { [key]: value }
      });
    } catch (err) {
      console.error("Failed to set camera setting:", err);
    }
  };

  if (!camera.enabled) {
    return (
      <div className="flex items-center justify-center p-8 h-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl">
        <p className="text-[var(--text-tertiary)] italic">Camera is disabled in Settings.</p>
      </div>
    );
  }

  const renderSlider = (label: string, key: string, min = -64, max = 64) => (
    <div key={key} className="space-y-1">
      <div className="flex justify-between text-xs text-[var(--text-secondary)]">
        <span className="capitalize">{label}</span>
        <span>{controls[key] ?? 0}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={controls[key] ?? 0}
        onChange={(e) => setControls(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
        onMouseUp={(e) => handleUpdate(key, parseInt(e.currentTarget.value))}
        className="w-full accent-[var(--accent-primary)]"
      />
    </div>
  );

  return (
    <div className="relative flex flex-col h-full bg-[var(--bg-secondary)] rounded-xl overflow-hidden border border-[var(--border-color)]">
      {!hideHeader && (
        <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-header)] border-b border-[var(--border-color)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Camera Viewer</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setCb(Date.now())}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition-colors"
              title="Refresh Stream"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition-colors"
              title="Camera Settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main viewer area */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {camera.streamUrl ? (
          <img
            src={`${camera.streamUrl}?cb=${cb}`}
            alt="Live Stream"
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : (
          <p className="text-[var(--text-tertiary)] text-xs">No stream URL configured.</p>
        )}
        <div className="hidden absolute inset-0 flex flex-col items-center justify-center text-[var(--text-tertiary)]">
          <p className="text-sm font-semibold">Stream Offline</p>
          <p className="text-xs">Check URL in Settings</p>
        </div>

        {/* Floating Settings Popover */}
        {showSettings && (
          <div className="absolute right-4 top-4 w-64 bg-[var(--bg-secondary)]/95 backdrop-blur-sm border border-[var(--border-color)] rounded-xl shadow-2xl p-4 flex flex-col gap-4 z-10 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
              <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase">Hardware Controls</h4>
              {loading && <RefreshCw className="w-3 h-3 animate-spin text-[var(--accent-primary)]" />}
            </div>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
              {renderSlider('Brightness', 'brightness')}
              {renderSlider('Contrast', 'contrast', 0, 100)}
              {renderSlider('Saturation', 'saturation', 0, 100)}
              {renderSlider('Hue', 'hue', -180, 180)}
              {renderSlider('Exposure', 'exposure')}
              {renderSlider('Zoom', 'zoom', 0, 100)}
            </div>

            {/* Quick config tweaks could go here, e.g. resolution select */}
            <div className="pt-2 border-t border-[var(--border-color)]">
               <button onClick={() => setShowSettings(false)} className="w-full py-1.5 text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] rounded-lg transition-colors">
                 Close Settings
               </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Optional overlay buttons even when header is hidden */}
      {hideHeader && (
        <div className="absolute top-2 right-2 flex gap-1 bg-black/50 backdrop-blur rounded-lg p-1 border border-white/10 opacity-50 hover:opacity-100 transition-opacity">
          <button
            onClick={() => setCb(Date.now())}
            className="p-1.5 rounded-md hover:bg-white/10 text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${showSettings ? 'bg-white/20 text-white' : 'text-white/80'}`}
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
