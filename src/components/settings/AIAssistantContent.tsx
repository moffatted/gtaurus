import { useState } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { transport } from '../../services/transportService';

export function AIAssistantContent() {
  const { settings, setDashboardPanelEnabled, setAiSettings } = useSettingsStore();
  const [apiKey, setApiKey] = useState(settings.ai.apiKey);
  const [freeModel, setFreeModel] = useState(settings.ai.freeModel || "gemini-1.5-flash");
  const [proModel, setProModel] = useState(settings.ai.proModel || "gemini-1.5-pro");
  const [localModel, setLocalModel] = useState(settings.ai.localModel || "qwen-2.5-coder-14b");
  const [localBaseUrl, setLocalBaseUrl] = useState(settings.ai.localBaseUrl || "http://192.168.68.57:1473/v1");
  const [localApiKey, setLocalApiKey] = useState(settings.ai.localApiKey || "lm-studio");
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [modelList, setModelList] = useState<string | null>(null);
  const [conciseMode, setConciseMode] = useState(settings.ai.conciseMode);

  const isPanelEnabled = settings.dashboardPanels.find(p => p.id === 'ai')?.enabled ?? false;
  const isFreeTier = settings.ai.tier === 'free';

  const handleSave = async () => {
    setLoading(true);
    setSaveMessage('');
    try {
      setAiSettings({ 
        apiKey: apiKey.trim(),
        freeModel: freeModel.trim(),
        proModel: proModel.trim(),
        localModel: localModel.trim(),
        localBaseUrl: localBaseUrl.trim(),
        localApiKey: localApiKey.trim(),
        conciseMode: conciseMode,
      });
      setSaveMessage('Settings saved successfully.');
    } catch (e: any) {
      setSaveMessage(`Error: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleListModels = async () => {
    if (!apiKey.trim() && !settings.ai.apiKey) {
      setSaveMessage('Error: Please enter or save an API key first.');
      return;
    }
    setLoading(true);
    setSaveMessage('Fetching model list...');
    try {
      const raw = await transport.invoke<string>('list_gemini_models', { apiKey: apiKey || settings.ai.apiKey });
      const data = JSON.parse(raw);
      if (data.models) {
        const names = data.models.map((m: any) => m.name.replace('models/', '')).join(', ');
        setModelList(names);
        setSaveMessage('Available models fetched.');
      } else {
        setModelList(raw);
        setSaveMessage('Fetched raw model data.');
      }
    } catch (e: any) {
      setSaveMessage(`Error: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  const labelCls = 'block text-xs font-medium text-[var(--text-secondary)] mb-1.5';
  const inputCls =
    'w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] ' +
    'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] ' +
    'focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]';
  const subHeaderCls = "text-xs font-semibold text-[var(--accent-primary)] uppercase tracking-wider mb-3 mt-1";

  return (
    <div className="space-y-6">
      {/* Visibility Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-[var(--text-primary)]">Show AI Assistant Button</h3>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Display the AI Assistant button in the top menu.
          </p>
        </div>
        <button
          onClick={() => setAiSettings({ enabled: !settings.ai.enabled })}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            settings.ai.enabled ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)]'
          }`}
          role="switch"
          aria-checked={settings.ai.enabled}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              settings.ai.enabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      <div className="space-y-4">
        <h4 className={subHeaderCls}>Dashboard Integration</h4>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-[var(--text-primary)] mb-1 block">Show AI Panel</span>
            <span className="text-[10px] text-[var(--text-tertiary)]">Enable the interactive AI chat panel on the dashboard.</span>
          </div>
          <button
            onClick={() => setDashboardPanelEnabled('ai', !isPanelEnabled)}
            className={`relative h-5 w-9 rounded-full transition-colors ${isPanelEnabled ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]'}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-4 w-4 bg-white rounded-full transition-transform ${isPanelEnabled ? 'translate-x-4' : ''}`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-[var(--text-primary)] mb-1 block">Concise Responses</span>
            <span className="text-[10px] text-[var(--text-tertiary)]">AI will provide brief, direct answers with minimal explanation.</span>
          </div>
          <button
            onClick={() => setConciseMode(!conciseMode)}
            className={`relative h-5 w-9 rounded-full transition-colors ${conciseMode ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]'}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-4 w-4 bg-white rounded-full transition-transform ${conciseMode ? 'translate-x-4' : ''}`} />
          </button>
        </div>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      <div className="space-y-4">
        <h4 className={subHeaderCls} style={{ marginBottom: 0 }}>AI Engine Tier</h4>
        <div className="flex gap-1.5 p-1 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
          <button
            onClick={() => setAiSettings({ tier: 'free' })}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
              settings.ai.tier === 'free'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            Free
          </button>
          <button
            onClick={() => setAiSettings({ tier: 'pro' })}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
              settings.ai.tier === 'pro'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            Pro Tier
          </button>
          <button
            onClick={() => setAiSettings({ tier: 'local' })}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
              settings.ai.tier === 'local'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            Local
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-[var(--text-tertiary)] italic leading-relaxed">
          {settings.ai.tier === 'free' 
            ? `Using the built-in free tier with ${settings.ai.freeModel}. Speed-optimized for fast responses.`
            : settings.ai.tier === 'pro'
            ? `Using ${settings.ai.proModel} for the most advanced reasoning. Requires your own Google API key.`
            : `Connecting to a local LLM server (like LM Studio) at ${localBaseUrl}. Faster and private.`}
        </p>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      <div className="space-y-4">
        <h4 className={subHeaderCls} style={{ marginBottom: 0 }}>Model Configuration</h4>
        <div className="grid grid-cols-1 gap-4">
          {settings.ai.tier === 'free' && (
            <div>
              <label className={labelCls}>Free Tier Model</label>
              <input
                type="text"
                value={freeModel}
                onChange={(e) => setFreeModel(e.target.value)}
                className={inputCls}
                placeholder="e.g. gemini-1.5-flash"
              />
            </div>
          )}
          {settings.ai.tier === 'pro' && (
            <div>
              <label className={labelCls}>Pro Tier Model</label>
              <input
                type="text"
                value={proModel}
                onChange={(e) => setProModel(e.target.value)}
                className={inputCls}
                placeholder="e.g. gemini-1.5-pro"
              />
            </div>
          )}
          {settings.ai.tier === 'local' && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Local Model String</label>
                <input
                  type="text"
                  value={localModel}
                  onChange={(e) => setLocalModel(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. qwen/qwen2.5-coder-14b"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>API Base URL</label>
                  <input
                    type="text"
                    value={localBaseUrl}
                    onChange={(e) => setLocalBaseUrl(e.target.value)}
                    className={inputCls}
                    placeholder="http://192.168.68.57:1473/v1"
                  />
                </div>
                <div>
                  <label className={labelCls}>Local API Key</label>
                  <input
                    type="password"
                    value={localApiKey}
                    onChange={(e) => setLocalApiKey(e.target.value)}
                    className={inputCls}
                    placeholder="lm-studio"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      {settings.ai.tier !== 'local' && (
        <>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className={subHeaderCls} style={{ marginBottom: 0 }}>API Credentials</h4>
              <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)]">
                {settings.ai.apiKey ? 'Key is Set ✓' : 'No Key Configured'}
              </span>
            </div>
            
            <div>
              <label className={labelCls}>Gemini API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={settings.ai.apiKey ? "••••••••••••••••" : "Paste your Gemini API Key here..."}
                className={inputCls}
              />
              <p className="mt-1.5 text-[10px] text-[var(--text-tertiary)] italic leading-relaxed">
                {isFreeTier 
                  ? "You can provide your own key here to use the Free model, or leave it blank if the app was built with a bundled key."
                  : "Your key is secure. Ensure you use a valid Pro capable API key for the selected model."}
              </p>
            </div>
          </div>
          <div className="border-t border-[var(--border-color)]" />
        </>
      )}

      <div className="border-t border-[var(--border-color)]" />

      <div className="space-y-4">
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-[var(--accent-primary)] text-white text-xs font-medium rounded-lg hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? 'Saving...' : 'Save AI Configuration'}
          </button>
          <button
            onClick={handleListModels}
            disabled={loading}
            className="px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)] text-xs font-medium rounded-lg hover:bg-[var(--bg-secondary)] disabled:opacity-50 transition-colors"
          >
            {loading ? '...' : 'List Models'}
          </button>
        </div>
        {saveMessage && (
          <p className={`text-center text-[10px] mt-2 ${saveMessage.includes('Error') ? 'text-[var(--danger-color)]' : 'text-[var(--success-color)]'}`}>
            {saveMessage}
          </p>
        )}
        {modelList && (
          <div className="mt-4 p-2 bg-[var(--bg-secondary)] rounded border border-[var(--border-color)] overflow-hidden">
            <h5 className="text-[10px] font-bold text-[var(--accent-primary)] mb-1 uppercase">Models Your Key Can Access:</h5>
            <div className="text-[10px] text-[var(--text-secondary)] font-mono max-h-24 overflow-y-auto break-all whitespace-pre-wrap">
              {modelList}
            </div>
            <p className="mt-2 text-[8px] text-[var(--text-tertiary)] italic">Copy/paste one of these into the model boxes above if you get 404 errors.</p>
          </div>
        )}
      </div>
    </div>
  );
}