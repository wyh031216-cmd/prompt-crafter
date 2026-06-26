import type { ApiConfig, ApiProviderId, ApiProviderPreset } from './types';
import { normalizeApiBaseUrl } from '../utils/urlSafety';

const KEY_API_KEY = 'promptcraft_api_key';
const KEY_MODEL = 'promptcraft_api_model';
const KEY_PROVIDER = 'promptcraft_api_provider_v1';
const KEY_BASE_URL = 'promptcraft_api_base_url_v1';

export const API_PROVIDER_PRESETS: Record<ApiProviderId, ApiProviderPreset> = {
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    defaultBaseUrl: 'https://api.anthropic.com',
    defaultModel: 'claude-sonnet-4-20250514',
    models: [
      { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (推荐)' },
      { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
      { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (快速)' },
      { value: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
    ],
    hint: '需海外 API Key，从 console.anthropic.com 获取',
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    defaultBaseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    models: [
      { value: 'deepseek-chat', label: 'DeepSeek Chat (推荐)' },
      { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner' },
    ],
    hint: '国内可用，从 platform.deepseek.com 获取 Key',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    defaultBaseUrl: 'https://api.openai.com',
    defaultModel: 'gpt-4o-mini',
    models: [
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini (推荐)' },
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
    ],
    hint: '从 platform.openai.com 获取 Key',
  },
  custom: {
    id: 'custom',
    name: 'OpenAI 兼容',
    defaultBaseUrl: '',
    defaultModel: '',
    models: [],
    hint: '通义、Moonshot、本地代理等 OpenAI 格式接口',
  },
};

function readProvider(): ApiProviderId {
  const raw = localStorage.getItem(KEY_PROVIDER) as ApiProviderId | null;
  if (raw && raw in API_PROVIDER_PRESETS) return raw;
  const key = localStorage.getItem(KEY_API_KEY) || '';
  if (key.startsWith('sk-ant-')) return 'anthropic';
  return 'deepseek';
}

export function getApiConfig(): ApiConfig {
  const provider = readProvider();
  const preset = API_PROVIDER_PRESETS[provider];
  const storedBase = localStorage.getItem(KEY_BASE_URL) || '';
  const baseUrl = provider === 'custom'
    ? (storedBase || preset.defaultBaseUrl)
    : preset.defaultBaseUrl;
  return {
    provider,
    apiKey: localStorage.getItem(KEY_API_KEY) || '',
    model: localStorage.getItem(KEY_MODEL) || preset.defaultModel,
    baseUrl,
  };
}

export function setApiConfig(config: Partial<ApiConfig>) {
  if (config.apiKey !== undefined) {
    localStorage.setItem(KEY_API_KEY, config.apiKey);
  }
  if (config.model !== undefined) {
    localStorage.setItem(KEY_MODEL, config.model);
  }
  if (config.provider !== undefined) {
    localStorage.setItem(KEY_PROVIDER, config.provider);
    const preset = API_PROVIDER_PRESETS[config.provider];
    if (!localStorage.getItem(KEY_MODEL) || config.model === undefined) {
      localStorage.setItem(KEY_MODEL, preset.defaultModel);
    }
    if (config.provider !== 'custom') {
      localStorage.setItem(KEY_BASE_URL, preset.defaultBaseUrl);
    }
  }
  if (config.baseUrl !== undefined) {
    const provider = config.provider ?? readProvider();
    if (provider === 'custom') {
      localStorage.setItem(KEY_BASE_URL, normalizeApiBaseUrl(config.baseUrl));
    }
  }
}

/** @deprecated 使用 getApiConfig().apiKey */
export function getApiKey(): string {
  return getApiConfig().apiKey;
}

/** @deprecated 使用 setApiConfig */
export function setApiKey(key: string): void {
  setApiConfig({ apiKey: key });
}

/** @deprecated 使用 getApiConfig().model */
export function getApiModel(): string {
  return getApiConfig().model;
}

/** @deprecated 使用 setApiConfig */
export function setApiModel(model: string): void {
  setApiConfig({ model });
}

export function getProviderLabel(provider: ApiProviderId): string {
  return API_PROVIDER_PRESETS[provider].name;
}