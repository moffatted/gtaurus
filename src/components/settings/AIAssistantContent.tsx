import { useEffect, useMemo, useState } from 'react';
import { useSettingsStore, type AiClientSettings, type AiProvider, type AiTier } from '../../stores/settingsStore';
import { transport } from '../../services/transportService';

type ClientModalState = {
  open: boolean;
  mode: 'add' | 'edit';
  client: AiClientSettings | null;
};

type ConnectivityStatus = Record<string, { ok: boolean; message: string }>;

const providerDefaults: Record<AiProvider, { model: string; baseUrl?: string }> = {
  gemini: { model: 'gemini-1.5-flash' },
  'copilot-sdk': { model: 'gpt-4o-mini' },
  openai: { model: 'gpt-4.1', baseUrl: 'https://api.openai.com/v1' },
  anthropic: { model: 'claude-3-5-sonnet-latest', baseUrl: 'https://api.anthropic.com/v1' },
  openrouter: { model: 'google/gemini-2.0-flash-exp:free', baseUrl: 'https://openrouter.ai/api/v1' },
  groq: { model: 'llama-3.3-70b-versatile', baseUrl: 'https://api.groq.com/openai/v1' },
  mistral: { model: 'mistral-large-latest', baseUrl: 'https://api.mistral.ai/v1' },
  xai: { model: 'grok-2-latest', baseUrl: 'https://api.x.ai/v1' },
  'openai-compatible': { model: 'qwen/qwen2.5-coder-14b', baseUrl: 'http://192.168.68.57:1473/v1' },
};

const providerHelp: Record<AiProvider, { title: string; keyHint: string; endpointHint: string; modelHint: string }> = {
  gemini: {
    title: 'Google Gemini',
    keyHint: 'Google AI Studio key (AIza...) or bundled free key.',
    endpointHint: 'Google Generative Language API managed internally.',
    modelHint: 'Examples: gemini-1.5-flash, gemini-1.5-pro',
  },
  'copilot-sdk': {
    title: 'GitHub Copilot SDK',
    keyHint: 'Subscription mode uses authenticated runtime. BYOK uses a provider key.',
    endpointHint: 'Runtime dispatch or BYOK endpoint based on auth mode.',
    modelHint: 'Examples: gpt-4o, claude-3-5-sonnet-latest',
  },
  openai: {
    title: 'OpenAI',
    keyHint: 'OpenAI API key (sk-...).',
    endpointHint: 'Default: https://api.openai.com/v1',
    modelHint: 'Examples: gpt-4.1, gpt-4o-mini',
  },
  anthropic: {
    title: 'Anthropic',
    keyHint: 'Anthropic key (sk-ant-...).',
    endpointHint: 'Default: https://api.anthropic.com/v1',
    modelHint: 'Examples: claude-3-5-sonnet-latest',
  },
  openrouter: {
    title: 'OpenRouter',
    keyHint: 'OpenRouter key for multi-provider routing.',
    endpointHint: 'Default: https://openrouter.ai/api/v1',
    modelHint: 'Examples: google/gemini-2.0-flash-exp:free',
  },
  groq: {
    title: 'Groq',
    keyHint: 'Groq API key.',
    endpointHint: 'Default: https://api.groq.com/openai/v1',
    modelHint: 'Examples: llama-3.3-70b-versatile',
  },
  mistral: {
    title: 'Mistral',
    keyHint: 'Mistral API key.',
    endpointHint: 'Default: https://api.mistral.ai/v1',
    modelHint: 'Examples: mistral-large-latest',
  },
  xai: {
    title: 'xAI',
    keyHint: 'xAI API key.',
    endpointHint: 'Default: https://api.x.ai/v1',
    modelHint: 'Examples: grok-2-latest',
  },
  'openai-compatible': {
    title: 'OpenAI-Compatible (Local)',
    keyHint: 'Optional local token, often lm-studio.',
    endpointHint: 'Local server endpoint, e.g. LM Studio.',
    modelHint: 'Examples: qwen/qwen2.5-coder-14b',
  },
};

const providersByTier: Record<AiTier, AiProvider[]> = {
  free: ['gemini', 'copilot-sdk', 'openrouter', 'openai', 'groq'],
  pro: ['gemini', 'copilot-sdk', 'openai', 'anthropic', 'groq', 'mistral', 'xai', 'openrouter'],
  local: ['openai-compatible'],
};

export function AIAssistantContent() {
  const { settings, setDashboardPanelEnabled, setAiSettings } = useSettingsStore();
  const [selectedClientId, setSelectedClientId] = useState(settings.ai.activeClientId || settings.ai.clients?.[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [modelList, setModelList] = useState<string | null>(null);
  const [testingClientId, setTestingClientId] = useState<string | null>(null);
  const [testStatusByClientId, setTestStatusByClientId] = useState<ConnectivityStatus>({});
  const [pendingDeleteClient, setPendingDeleteClient] = useState<{ id: string; name: string } | null>(null);
  const [clientModal, setClientModal] = useState<ClientModalState>({ open: false, mode: 'add', client: null });

  const isPanelEnabled = settings.dashboardPanels.find(p => p.id === 'ai')?.enabled ?? false;
  const clients = settings.ai.clients ?? [];
  const activeClient = useMemo(
    () => clients.find((c) => c.id === settings.ai.activeClientId) ?? clients[0] ?? null,
    [clients, settings.ai.activeClientId]
  );

  useEffect(() => {
    const fallbackId = settings.ai.activeClientId || clients[0]?.id || '';
    const nextSelected = clients.some((c) => c.id === selectedClientId) ? selectedClientId : fallbackId;
    if (nextSelected !== selectedClientId) {
      setSelectedClientId(nextSelected);
    }
  }, [clients, selectedClientId, settings.ai.activeClientId]);

  const syncLegacyFields = (nextClients: AiClientSettings[], nextActiveClientId: string) => {
    const freeClient = nextClients.find((c) => c.tier === 'free');
    const proClient = nextClients.find((c) => c.tier === 'pro');
    const localClient = nextClients.find((c) => c.tier === 'local');
    const active = nextClients.find((c) => c.id === nextActiveClientId) ?? nextClients[0] ?? activeClient;
    const geminiClient = nextClients.find((c) => c.provider === 'gemini');

    return {
      clients: nextClients,
      activeClientId: active?.id ?? nextActiveClientId,
      tier: active?.tier ?? settings.ai.tier,
      apiKey: geminiClient?.apiKey ?? settings.ai.apiKey,
      freeModel: freeClient?.model ?? settings.ai.freeModel,
      proModel: proClient?.model ?? settings.ai.proModel,
      localModel: localClient?.model ?? settings.ai.localModel,
      localBaseUrl: localClient?.baseUrl ?? settings.ai.localBaseUrl,
      localApiKey: localClient?.apiKey ?? settings.ai.localApiKey,
    };
  };

  const createClient = (tier: AiTier, provider?: AiProvider): AiClientSettings => {
    const resolvedProvider: AiProvider = provider ?? (tier === 'local' ? 'openai-compatible' : 'gemini');
    const defaults = providerDefaults[resolvedProvider];
    return {
      id: crypto.randomUUID(),
      name: `${tier.toUpperCase()} ${resolvedProvider.replace('-', ' ')}`,
      tier,
      provider: resolvedProvider,
      model: defaults.model,
      baseUrl: defaults.baseUrl || '',
      apiKey: tier === 'local' ? 'lm-studio' : '',
      enabled: true,
      copilotAuthMode: resolvedProvider === 'copilot-sdk' ? 'subscription' : undefined,
      copilotByokProvider: resolvedProvider === 'copilot-sdk' ? 'openai' : undefined,
    };
  };

  const updateModalClient = (patch: Partial<AiClientSettings>) => {
    setClientModal((prev) => {
      if (!prev.client) return prev;
      return { ...prev, client: { ...prev.client, ...patch } };
    });
  };

  const activateClient = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    setAiSettings(syncLegacyFields(clients, clientId));
    setSelectedClientId(clientId);
    setSaveMessage(`Active client set to ${client.name}.`);
  };

  const toggleClientEnabled = (clientId: string) => {
    const target = clients.find((c) => c.id === clientId);
    if (!target) return;
    const nextClients = clients.map((c) => (c.id === clientId ? { ...c, enabled: !c.enabled } : c));
    setAiSettings(syncLegacyFields(nextClients, settings.ai.activeClientId));
    setSaveMessage(`${target.name} ${target.enabled ? 'disabled' : 'enabled'}.`);
  };

  const openAddClientModal = (tier: AiTier) => {
    setModelList(null);
    setClientModal({ open: true, mode: 'add', client: createClient(tier) });
  };

  const openEditClientModal = (client: AiClientSettings) => {
    setModelList(null);
    setClientModal({ open: true, mode: 'edit', client: { ...client } });
  };

  const saveModalClient = () => {
    if (!clientModal.client) return;
    const normalized = {
      ...clientModal.client,
      name: clientModal.client.name.trim() || 'AI Client',
      model: clientModal.client.model.trim(),
      baseUrl: (clientModal.client.baseUrl || '').trim(),
      apiKey: (clientModal.client.apiKey || '').trim(),
    };

    if (!normalized.model) {
      setSaveMessage('Error: Model string is required.');
      return;
    }

    if (clientModal.mode === 'add') {
      const nextClients = [...clients, normalized];
      setAiSettings(syncLegacyFields(nextClients, normalized.id));
      setSelectedClientId(normalized.id);
      setSaveMessage(`${normalized.tier.toUpperCase()} client created.`);
    } else {
      const nextClients = clients.map((c) => (c.id === normalized.id ? normalized : c));
      setAiSettings(syncLegacyFields(nextClients, settings.ai.activeClientId));
      setSelectedClientId(normalized.id);
      setSaveMessage('Client profile saved.');
    }

    setClientModal({ open: false, mode: 'add', client: null });
    setModelList(null);
  };

  const deleteClient = (clientId?: string) => {
    const targetId = clientId ?? selectedClientId;
    const target = clients.find((c) => c.id === targetId);
    if (!target) return;

    if (clients.length <= 1) {
      setSaveMessage('Error: At least one client profile is required.');
      return;
    }

    const nextClients = clients.filter((c) => c.id !== targetId);
    const nextActive = settings.ai.activeClientId === targetId ? nextClients[0].id : settings.ai.activeClientId;
    setAiSettings(syncLegacyFields(nextClients, nextActive));
    setSelectedClientId(nextActive);
    setSaveMessage('Client profile deleted.');
  };

  const handleSave = async () => {
    setLoading(true);
    setSaveMessage('');
    try {
      setAiSettings({ conciseMode: settings.ai.conciseMode });
      setSaveMessage('Settings saved successfully.');
    } catch (e: unknown) {
      setSaveMessage(`Error: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  const testClientConnectivity = async (client: AiClientSettings) => {
    setTestingClientId(client.id);
    setTestStatusByClientId((prev) => {
      const next = { ...prev };
      delete next[client.id];
      return next;
    });
    try {
      const result = await transport.invoke<{ ok: boolean; message: string }>('test_ai_client_connectivity', {
        selectedClient: client,
        fallbackApiKey: settings.ai.apiKey,
        fallbackLocalApiKey: settings.ai.localApiKey,
      });
      setTestStatusByClientId((prev) => ({ ...prev, [client.id]: result }));
      setSaveMessage(result.message);
    } catch (e: unknown) {
      const message = String(e);
      setTestStatusByClientId((prev) => ({ ...prev, [client.id]: { ok: false, message } }));
      setSaveMessage(`Error: ${message}`);
    } finally {
      setTestingClientId(null);
    }
  };

  const handleListModels = async (client?: AiClientSettings | null) => {
    const key = client?.apiKey?.trim() || settings.ai.apiKey;
    if (!key) {
      setSaveMessage('Error: Please enter or save an API key first.');
      return;
    }
    setLoading(true);
    setSaveMessage('Fetching model list...');
    try {
      const raw = await transport.invoke<string>('list_gemini_models', { apiKey: key });
      const data = JSON.parse(raw);
      if (data.models) {
        const names = data.models.map((m: any) => m.name.replace('models/', '')).join(', ');
        setModelList(names);
        setSaveMessage('Available models fetched.');
      } else {
        setModelList(raw);
        setSaveMessage('Fetched raw model data.');
      }
    } catch (e: unknown) {
      setSaveMessage(`Error: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  const labelCls = 'block text-xs font-medium text-[var(--text-secondary)] mb-1';
  const inputCls =
    'w-full px-3 py-1.5 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] ' +
    'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] ' +
    'focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]';
  const subHeaderCls = "text-xs font-semibold text-[var(--accent-primary)] uppercase tracking-wider mb-2 mt-0.5";

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

      <div className="space-y-3">
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
            onClick={() => setAiSettings({ conciseMode: !settings.ai.conciseMode })}
            className={`relative h-5 w-9 rounded-full transition-colors ${settings.ai.conciseMode ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]'}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-4 w-4 bg-white rounded-full transition-transform ${settings.ai.conciseMode ? 'translate-x-4' : ''}`} />
          </button>
        </div>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      <div className="space-y-3">
        <h4 className={subHeaderCls} style={{ marginBottom: 0 }}>Selection Mode</h4>
        <div className="flex gap-1.5 p-1 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
          <button
            onClick={() => setAiSettings({ selectionMode: 'manual' })}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
              settings.ai.selectionMode === 'manual'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            Manual
          </button>
          <button
            onClick={() => setAiSettings({ selectionMode: 'auto' })}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
              settings.ai.selectionMode === 'auto'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            Auto
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-[var(--text-tertiary)] italic leading-relaxed">
          {settings.ai.selectionMode === 'manual'
            ? 'Manual mode uses the selected active client profile for all requests.'
            : 'Auto mode can pick the best configured client profile for the task context.'}
        </p>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className={subHeaderCls} style={{ marginBottom: 0 }}>Client Profiles</h4>
          <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)]">{clients.length} configured</span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {clients.map((client) => (
            <div
              key={client.id}
              className={`p-2 rounded-lg border transition-colors ${
                selectedClientId === client.id
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                  : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedClientId(client.id)}
                  className="flex-1 text-left"
                >
                  <div className="text-xs font-semibold text-[var(--text-primary)]">{client.name}</div>
                  <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">{client.tier} · {client.provider}</div>
                  {testStatusByClientId[client.id] && (
                    <div className={`mt-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] ${testStatusByClientId[client.id].ok ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {testStatusByClientId[client.id].ok ? 'Reachable' : 'Unreachable'}
                    </div>
                  )}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleClientEnabled(client.id)}
                    className="px-2 py-1 text-[10px] rounded border border-[var(--border-color)] hover:bg-[var(--bg-secondary)]"
                  >
                    {client.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => activateClient(client.id)}
                    disabled={settings.ai.activeClientId === client.id}
                    className="px-2 py-1 text-[10px] rounded border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {settings.ai.activeClientId === client.id ? 'Active' : 'Use'}
                  </button>
                  <button
                    onClick={() => openEditClientModal(client)}
                    className="px-2 py-1 text-[10px] rounded border border-[var(--border-color)] hover:bg-[var(--bg-secondary)]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => testClientConnectivity(client)}
                    disabled={testingClientId === client.id}
                    className="px-2 py-1 text-[10px] rounded border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] disabled:opacity-50"
                  >
                    {testingClientId === client.id ? 'Testing' : 'Test'}
                  </button>
                  <button
                    onClick={() => setPendingDeleteClient({ id: client.id, name: client.name })}
                    disabled={clients.length <= 1}
                    className="px-2 py-1 text-[10px] rounded border border-red-500/40 text-red-400 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={clients.length <= 1 ? 'At least one client is required' : `Delete ${client.name}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => openAddClientModal('free')}
            className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)]"
          >
            Add Free Client
          </button>
          <button
            onClick={() => openAddClientModal('pro')}
            className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)]"
          >
            Add Pro Client
          </button>
          <button
            onClick={() => openAddClientModal('local')}
            className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)]"
          >
            Add Local Client
          </button>
        </div>

        {activeClient && (
          <p className="text-[10px] text-[var(--text-tertiary)] italic leading-relaxed">
            Active profile: {activeClient.name} ({activeClient.provider} · {activeClient.model})
          </p>
        )}
      </div>

      <div className="border-t border-[var(--border-color)]" />

      <div className="space-y-3">
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-[var(--accent-primary)] text-white text-xs font-medium rounded-lg hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? 'Saving...' : 'Save AI Configuration'}
          </button>
          <button
            onClick={() => handleListModels(activeClient)}
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

      {clientModal.open && clientModal.client && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-header)] flex items-center justify-between">
              <h5 className="text-sm font-semibold text-[var(--text-primary)]">{clientModal.mode === 'add' ? 'Add AI Client' : 'Edit AI Client'}</h5>
              <button
                onClick={() => {
                  setClientModal({ open: false, mode: 'add', client: null });
                  setModelList(null);
                }}
                className="px-2 py-1 text-xs rounded border border-[var(--border-color)] hover:bg-[var(--bg-secondary)]"
              >
                Close
              </button>
            </div>

            <div className="px-4 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Profile Name</label>
                  <input type="text" value={clientModal.client.name} onChange={(e) => updateModalClient({ name: e.target.value })} className={inputCls} placeholder="My AI Client" />
                </div>
                <div>
                  <label className={labelCls}>Tier</label>
                  <select
                    value={clientModal.client.tier}
                    onChange={(e) => {
                      const nextTier = e.target.value as AiTier;
                      const allowedProviders = providersByTier[nextTier];
                      const nextProvider = allowedProviders.includes(clientModal.client!.provider) ? clientModal.client!.provider : allowedProviders[0];
                      updateModalClient({
                        tier: nextTier,
                        provider: nextProvider,
                        model: providerDefaults[nextProvider].model,
                        baseUrl: providerDefaults[nextProvider].baseUrl || '',
                      });
                    }}
                    className={inputCls}
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="local">Local</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Provider</label>
                  <select
                    value={clientModal.client.provider}
                    onChange={(e) => {
                      const nextProvider = e.target.value as AiProvider;
                      const defaults = providerDefaults[nextProvider];
                      updateModalClient({ provider: nextProvider, model: defaults.model, baseUrl: defaults.baseUrl || '' });
                    }}
                    className={inputCls}
                  >
                    {providersByTier[clientModal.client.tier].map((provider) => (
                      <option key={provider} value={provider}>{provider}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Model String</label>
                  <input type="text" value={clientModal.client.model} onChange={(e) => updateModalClient({ model: e.target.value })} className={inputCls} placeholder="e.g. gemini-1.5-flash" />
                </div>
              </div>

              <div className="p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)]">
                <div className="text-[10px] uppercase tracking-wider text-[var(--accent-primary)] mb-1">Provider Help: {providerHelp[clientModal.client.provider].title}</div>
                <div className="text-[10px] text-[var(--text-secondary)] leading-relaxed space-y-0.5">
                  <div>Key: {providerHelp[clientModal.client.provider].keyHint}</div>
                  <div>Endpoint: {providerHelp[clientModal.client.provider].endpointHint}</div>
                  <div>Model: {providerHelp[clientModal.client.provider].modelHint}</div>
                </div>
              </div>

              {clientModal.client.provider !== 'gemini' && clientModal.client.provider !== 'anthropic' && clientModal.client.provider !== 'copilot-sdk' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>API Base URL</label>
                    <input type="text" value={clientModal.client.baseUrl || ''} onChange={(e) => updateModalClient({ baseUrl: e.target.value })} className={inputCls} placeholder="http://192.168.68.57:1473/v1" />
                  </div>
                  <div>
                    <label className={labelCls}>API Key</label>
                    <input type="password" value={clientModal.client.apiKey || ''} onChange={(e) => updateModalClient({ apiKey: e.target.value })} className={inputCls} placeholder="Optional token" />
                  </div>
                </div>
              )}

              {clientModal.client.provider === 'anthropic' && (
                <div>
                  <label className={labelCls}>Anthropic API Key</label>
                  <input type="password" value={clientModal.client.apiKey || ''} onChange={(e) => updateModalClient({ apiKey: e.target.value })} className={inputCls} placeholder="sk-ant-..." />
                </div>
              )}

              {clientModal.client.provider === 'gemini' && (
                <div>
                  <label className={labelCls}>Gemini API Key</label>
                  <input type="password" value={clientModal.client.apiKey || ''} onChange={(e) => updateModalClient({ apiKey: e.target.value })} className={inputCls} placeholder="AIza..." />
                </div>
              )}

              {clientModal.client.provider === 'copilot-sdk' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Auth Mode</label>
                      <select
                        value={clientModal.client.copilotAuthMode || 'subscription'}
                        onChange={(e) => updateModalClient({ copilotAuthMode: e.target.value as 'subscription' | 'byok' })}
                        className={inputCls}
                      >
                        <option value="subscription">Subscription</option>
                        <option value="byok">BYOK</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>BYOK Provider</label>
                      <select
                        value={clientModal.client.copilotByokProvider || 'openai'}
                        onChange={(e) => {
                          const provider = e.target.value as 'openai' | 'anthropic';
                          updateModalClient({
                            copilotByokProvider: provider,
                            baseUrl: provider === 'openai' ? 'https://api.openai.com/v1' : 'https://api.anthropic.com/v1',
                          });
                        }}
                        className={inputCls}
                        disabled={(clientModal.client.copilotAuthMode || 'subscription') !== 'byok'}
                      >
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                      </select>
                    </div>
                  </div>

                  {(clientModal.client.copilotAuthMode || 'subscription') === 'byok' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>BYOK API Key</label>
                        <input
                          type="password"
                          value={clientModal.client.apiKey || ''}
                          onChange={(e) => updateModalClient({ apiKey: e.target.value })}
                          className={inputCls}
                          placeholder={(clientModal.client.copilotByokProvider || 'openai') === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>BYOK Base URL</label>
                        <input
                          type="text"
                          value={clientModal.client.baseUrl || ''}
                          onChange={(e) => updateModalClient({ baseUrl: e.target.value })}
                          className={inputCls}
                          placeholder={(clientModal.client.copilotByokProvider || 'openai') === 'anthropic' ? 'https://api.anthropic.com/v1' : 'https://api.openai.com/v1'}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {modelList && (
                <div className="p-2 bg-[var(--bg-primary)] rounded border border-[var(--border-color)] overflow-hidden">
                  <h5 className="text-[10px] font-bold text-[var(--accent-primary)] mb-1 uppercase">Models Your Key Can Access:</h5>
                  <div className="text-[10px] text-[var(--text-secondary)] font-mono max-h-24 overflow-y-auto break-all whitespace-pre-wrap">{modelList}</div>
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-[var(--border-color)] flex justify-end gap-2 bg-[var(--bg-header)]">
              <button
                onClick={() => {
                  setClientModal({ open: false, mode: 'add', client: null });
                  setModelList(null);
                }}
                className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)]"
              >
                Cancel
              </button>
              {clientModal.client.provider === 'gemini' && (
                <button
                  onClick={() => handleListModels(clientModal.client)}
                  disabled={loading}
                  className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50"
                >
                  {loading ? '...' : 'List Models'}
                </button>
              )}
              <button
                onClick={saveModalClient}
                className="px-3 py-1.5 text-xs rounded-lg bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/90"
              >
                {clientModal.mode === 'add' ? 'Create Client' : 'Save Client'}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingDeleteClient && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-header)]">
              <h5 className="text-sm font-semibold text-[var(--text-primary)]">Delete Client Profile</h5>
            </div>
            <div className="px-4 py-4 space-y-2">
              <p className="text-xs text-[var(--text-secondary)]">
                Are you sure you want to delete <span className="font-semibold text-[var(--text-primary)]">{pendingDeleteClient.name}</span>?
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)]">This removes the client profile from AI Assistant settings.</p>
            </div>
            <div className="px-4 py-3 border-t border-[var(--border-color)] flex justify-end gap-2 bg-[var(--bg-header)]">
              <button
                onClick={() => setPendingDeleteClient(null)}
                className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteClient(pendingDeleteClient.id);
                  setPendingDeleteClient(null);
                }}
                className="px-3 py-1.5 text-xs rounded-lg bg-red-500 text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}