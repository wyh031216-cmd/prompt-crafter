import { getApiConfig } from './config';
import { chatAnthropic } from './providers/anthropic';
import { chatOpenAICompatible } from './providers/openai';
import type { ChatRequest } from './types';

export async function chatCompletion(
  request: ChatRequest,
  onChunk?: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const config = getApiConfig();
  if (!config.apiKey.trim()) {
    throw new Error('请先在设置中配置 API Key');
  }
  if (!config.model.trim()) {
    throw new Error('请先在设置中选择或填写模型');
  }
  if (config.provider === 'custom' && !config.baseUrl.trim()) {
    throw new Error('请填写 OpenAI 兼容接口的 Base URL');
  }

  if (config.provider === 'anthropic') {
    return chatAnthropic(config, request, onChunk, signal);
  }

  return chatOpenAICompatible(config, request, onChunk, signal);
}

export async function testApiConnection(): Promise<void> {
  await chatCompletion({
    system: 'Reply with exactly: OK',
    user: 'Hi',
    maxTokens: 16,
  });
}