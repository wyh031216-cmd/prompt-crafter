import type { ApiConfig, ChatRequest } from '../types';

function parseApiError(body: string): string {
  try {
    const j = JSON.parse(body);
    return j.error?.message || j.message || 'API 请求失败';
  } catch {
    return 'API 请求失败';
  }
}

function resolveBaseUrl(config: ApiConfig): string {
  const base = (config.baseUrl || 'https://api.openai.com').replace(/\/$/, '');
  return base.endsWith('/v1') ? base : `${base}/v1`;
}

export async function chatOpenAICompatible(
  config: ApiConfig,
  request: ChatRequest,
  onChunk?: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const model = request.model || config.model;
  const url = `${resolveBaseUrl(config)}/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: request.maxTokens ?? 4096,
      stream: !!onChunk,
      messages: [
        { role: 'system', content: request.system },
        { role: 'user', content: request.user },
      ],
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(parseApiError(await response.text()));
  }

  if (onChunk) {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('响应无法读取');

    let result = '';
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (!data || data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            result += delta;
            onChunk(result);
          }
        } catch {
          /* skip */
        }
      }
    }

    return result;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}