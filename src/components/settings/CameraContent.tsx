import { useSettingsStore } from '../../stores/settingsStore';

export default function CameraContent() {
  const { settings, setCameraSettings } = useSettingsStore();
  const cam = settings.camera;

  const labelCls = 'block text-xs font-medium text-[var(--text-secondary)] mb-1.5';
  const inputCls =
    'w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] ' +
    'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] ' +
    'focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-[var(--text-primary)]">Enable Camera Viewer</h3>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Allow viewing camera stream and controlling settings from the UI.
          </p>
        </div>
        <button
          onClick={() => setCameraSettings({ enabled: !cam.enabled })}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            cam.enabled ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)]'
          }`}
          role="switch"
          aria-checked={cam.enabled}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              cam.enabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      <div>
        <label className={labelCls}>Stream URL</label>
        <input
          type="text"
          value={cam.streamUrl}
          onChange={(e) => setCameraSettings({ streamUrl: e.target.value })}
          placeholder="http://192.168.1.100:8080/stream"
          className={inputCls}
        />
        <p className="mt-1.5 text-[10px] text-[var(--text-tertiary)] italic leading-relaxed">
          The exact URL where the MJPEG stream is hosted.
        </p>
      </div>

      <div>
        <label className={labelCls}>Crowsnest Config Path</label>
        <input
          type="text"
          value={cam.crowsnestConfigPath}
          onChange={(e) => setCameraSettings({ crowsnestConfigPath: e.target.value })}
          placeholder="/home/user/printer_data/config/crowsnest.conf"
          className={inputCls}
        />
        <p className="mt-1.5 text-[10px] text-[var(--text-tertiary)] italic leading-relaxed">
          The absolute path to your crowsnest.conf file on the server.
        </p>
      </div>
    </div>
  );
}