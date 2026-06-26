export type ApiProviderId = 'anthropic' | 'deepseek' | 'openai' | 'custom';

export interface ApiProviderPreset {
  id: ApiProviderId;
  name: string;
  defaultBaseUrl: string;
  defaultModel: string;
  models: { value: string; label: string }[];
  hint?: string;
}

export interface ApiConfig {
  provider: ApiProviderId;
  apiKey: string;
  model: string;
  baseUrl: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  system: string;
  user: string;
  model?: string;
  maxTokens?: number;
  stream?: boolean;
}

export type OptimizeAction =
  | 'improve'
  | 'elaborate'
  | 'shorten'
  | 'restructure'
  | 'spellcheck'
  | 'translate-cn'
  | 'translate-en'
  | 'custom';

export interface OptimizeRequest {
  content: string;
  action: OptimizeAction;
  customInstruction?: string;
  model?: string;
}