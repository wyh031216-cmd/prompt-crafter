import type { ApiConfig, ChatRequest } from '../types';

function parseApiError(body: string): string {
  try {
    const j = JSON.parse(body);
    return j.error?.message || j.error?.type || 'API 请求失败';
  } catch {
    return 'API 请求失败';
  }
}

export async function chatAnthropic(
  config: ApiConfig,
  request: ChatRequest,
  onChunk?: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const model = request.model || config.model;
  const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: request.maxTokens ?? 4096,
      system: request.system,
      messages: [{ role: 'user', content: request.user }],
      stream: !!onChunk,
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
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            result += parsed.delta.text;
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
  return data.content?.[0]?.text || '';
}