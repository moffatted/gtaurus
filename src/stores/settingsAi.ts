import type {
  AiClientSettings,
  AiProvider,
  AiSettings,
  AiTier,
} from './settingsStore';

export const DEFAULT_AI_FREE_MODEL = 'gemini-1.5-flash';
export const DEFAULT_AI_PRO_MODEL = 'gemini-1.5-pro';
export const DEFAULT_AI_LOCAL_MODEL = 'qwen/qwen2.5-coder-14b';
export const DEFAULT_AI_LOCAL_BASE_URL = 'http://192.168.68.57:1473/v1';
export const DEFAULT_AI_LOCAL_API_KEY = 'lm-studio';
const LEGACY_LOCAL_MODEL_ALIAS = 'qwen-2.5-coder-14b';

function normalizeLocalModelName(model: string): string {
  return model === LEGACY_LOCAL_MODEL_ALIAS ? DEFAULT_AI_LOCAL_MODEL : model;
}

function defaultProviderBaseUrl(provider: AiProvider): string {
  switch (provider) {
    case 'copilot-sdk':
      return '';
    case 'openai':
      return 'https://api.openai.com/v1';
    case 'anthropic':
      return 'https://api.anthropic.com/v1';
    case 'openrouter':
      return 'https://openrouter.ai/api/v1';
    case 'groq':
      return 'https://api.groq.com/openai/v1';
    case 'mistral':
      return 'https://api.mistral.ai/v1';
    case 'xai':
      return 'https://api.x.ai/v1';
    case 'openai-compatible':
      return DEFAULT_AI_LOCAL_BASE_URL;
    default:
      return '';
  }
}

function defaultProviderModel(provider: AiProvider, tier: AiTier): string {
  if (provider === 'gemini') {
    return tier === 'free' ? DEFAULT_AI_FREE_MODEL : DEFAULT_AI_PRO_MODEL;
  }

  if (provider === 'copilot-sdk') {
    return tier === 'free' ? 'gpt-4o-mini' : 'gpt-4o';
  }

  if (provider === 'anthropic') {
    return 'claude-3-5-sonnet-latest';
  }

  if (provider === 'openai') {
    return tier === 'free' ? 'gpt-4o-mini' : 'gpt-4.1';
  }

  if (provider === 'openrouter') {
    return tier === 'free' ? 'google/gemini-2.0-flash-exp:free' : 'anthropic/claude-3.5-sonnet';
  }

  if (provider === 'groq') {
    return 'llama-3.3-70b-versatile';
  }

  if (provider === 'mistral') {
    return 'mistral-large-latest';
  }

  if (provider === 'xai') {
    return 'grok-2-latest';
  }

  return DEFAULT_AI_LOCAL_MODEL;
}

export function buildDefaultAiClients(ai: {
  apiKey: string;
  freeModel: string;
  proModel: string;
  localModel: string;
  localBaseUrl: string;
  localApiKey: string;
}): AiClientSettings[] {
  return [
    {
      id: 'legacy-free-gemini',
      name: 'Free Gemini',
      tier: 'free',
      provider: 'gemini',
      model: ai.freeModel,
      apiKey: ai.apiKey,
      enabled: true,
    },
    {
      id: 'free-openrouter',
      name: 'Free OpenRouter',
      tier: 'free',
      provider: 'openrouter',
      model: defaultProviderModel('openrouter', 'free'),
      baseUrl: defaultProviderBaseUrl('openrouter'),
      apiKey: '',
      enabled: false,
    },
    {
      id: 'free-copilot-sdk',
      name: 'Free GitHub Copilot SDK',
      tier: 'free',
      provider: 'copilot-sdk',
      model: defaultProviderModel('copilot-sdk', 'free'),
      copilotAuthMode: 'subscription',
      enabled: false,
    },
    {
      id: 'legacy-pro-gemini',
      name: 'Pro Gemini',
      tier: 'pro',
      provider: 'gemini',
      model: ai.proModel,
      apiKey: ai.apiKey,
      enabled: true,
    },
    {
      id: 'pro-openai',
      name: 'Pro OpenAI',
      tier: 'pro',
      provider: 'openai',
      model: defaultProviderModel('openai', 'pro'),
      baseUrl: defaultProviderBaseUrl('openai'),
      apiKey: '',
      enabled: false,
    },
    {
      id: 'pro-anthropic',
      name: 'Pro Anthropic',
      tier: 'pro',
      provider: 'anthropic',
      model: defaultProviderModel('anthropic', 'pro'),
      baseUrl: defaultProviderBaseUrl('anthropic'),
      apiKey: '',
      enabled: false,
    },
    {
      id: 'pro-groq',
      name: 'Pro Groq',
      tier: 'pro',
      provider: 'groq',
      model: defaultProviderModel('groq', 'pro'),
      baseUrl: defaultProviderBaseUrl('groq'),
      apiKey: '',
      enabled: false,
    },
    {
      id: 'pro-copilot-sdk',
      name: 'Pro GitHub Copilot SDK',
      tier: 'pro',
      provider: 'copilot-sdk',
      model: defaultProviderModel('copilot-sdk', 'pro'),
      copilotAuthMode: 'subscription',
      enabled: false,
    },
    {
      id: 'legacy-local-openai',
      name: 'Local LLM',
      tier: 'local',
      provider: 'openai-compatible',
      model: normalizeLocalModelName(ai.localModel),
      baseUrl: ai.localBaseUrl,
      apiKey: ai.localApiKey,
      enabled: true,
    },
  ];
}

export function normalizeSavedAi(savedAi: Partial<AiSettings> | undefined, defaultAi: AiSettings): AiSettings {
  const mergedLegacy: AiSettings = {
    ...defaultAi,
    ...savedAi,
    localModel: normalizeLocalModelName(savedAi?.localModel ?? defaultAi.localModel),
    selectionMode: savedAi?.selectionMode === 'auto' ? 'auto' : 'manual',
    clients: [],
    activeClientId: savedAi?.activeClientId ?? '',
  };

  const providedClients = Array.isArray(savedAi?.clients) ? savedAi.clients : [];
  const clients = (providedClients.length > 0 ? providedClients : buildDefaultAiClients(mergedLegacy)).map((client, index) => ({
    ...client,
    id: client.id || `ai-client-${index + 1}`,
    name: client.name || `AI Client ${index + 1}`,
    model: normalizeLocalModelName(client.model),
    baseUrl: client.baseUrl ?? defaultProviderBaseUrl(client.provider),
    copilotAuthMode: client.provider === 'copilot-sdk' ? (client.copilotAuthMode ?? 'subscription') : undefined,
    copilotByokProvider: client.provider === 'copilot-sdk' ? client.copilotByokProvider : undefined,
    enabled: client.enabled ?? true,
  }));

  const activeExists = clients.some((client) => client.id === mergedLegacy.activeClientId);
  const activeClient = clients.find((client) => client.id === mergedLegacy.activeClientId);
  const tierMatch = clients.find((client) => client.tier === mergedLegacy.tier && client.enabled);
  const fallbackClient = tierMatch ?? clients.find((client) => client.enabled) ?? clients[0];

  return {
    ...mergedLegacy,
    clients,
    tier: activeExists ? (activeClient?.tier ?? mergedLegacy.tier) : (fallbackClient?.tier ?? mergedLegacy.tier),
    activeClientId: activeExists ? mergedLegacy.activeClientId : fallbackClient.id,
  };
}
