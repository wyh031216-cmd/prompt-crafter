/**
 * Simple token estimation for common models.
 * This is a heuristic — for exact counts, use the model's tokenizer.
 */

const MODEL_ENCODINGS: Record<string, { charsPerToken: number; name: string }> = {
  'claude-3-opus': { charsPerToken: 3.2, name: 'Claude 3 Opus' },
  'claude-3-sonnet': { charsPerToken: 3.5, name: 'Claude 3 Sonnet' },
  'claude-3-haiku': { charsPerToken: 3.5, name: 'Claude 3 Haiku' },
  'claude-3.5-sonnet': { charsPerToken: 3.5, name: 'Claude 3.5 Sonnet' },
  'claude-3.5-haiku': { charsPerToken: 3.5, name: 'Claude 3.5 Haiku' },
  'claude-4-opus': { charsPerToken: 3.4, name: 'Claude 4 Opus' },
  'claude-4-sonnet': { charsPerToken: 3.5, name: 'Claude 4 Sonnet' },
  'gpt-4': { charsPerToken: 3.3, name: 'GPT-4' },
  'gpt-4o': { charsPerToken: 3.5, name: 'GPT-4o' },
  'gpt-3.5-turbo': { charsPerToken: 3.7, name: 'GPT-3.5 Turbo' },
  'deepseek': { charsPerToken: 3.0, name: 'DeepSeek' },
  'default': { charsPerToken: 3.5, name: '默认' },
};

export type ModelKey = keyof typeof MODEL_ENCODINGS;

export interface TokenCountResult {
  tokens: number;
  chars: number;
  model: string;
  estimated: boolean;
}

export function estimateTokens(text: string, model: ModelKey = 'default'): TokenCountResult {
  const config = MODEL_ENCODINGS[model] || MODEL_ENCODINGS.default;
  // Chinese characters and non-ASCII take more tokens
  let adjustedChars = 0;
  for (const char of text) {
    if (char.charCodeAt(0) > 127) {
      adjustedChars += 1.5; // CJK characters ~1.5x
    } else {
      adjustedChars += 1;
    }
  }

  const tokens = Math.ceil(adjustedChars / config.charsPerToken);
  return {
    tokens,
    chars: text.length,
    model: config.name,
    estimated: true,
  };
}

export function estimateCost(tokens: number, model: ModelKey, type: 'input' | 'output' = 'input'): number {
  // Approximate cost per 1K tokens (USD)
  const costs: Record<string, { input: number; output: number }> = {
    'claude-3.5-sonnet': { input: 0.003, output: 0.015 },
    'claude-3.5-haiku': { input: 0.0008, output: 0.004 },
    'claude-4-sonnet': { input: 0.003, output: 0.015 },
    'claude-4-opus': { input: 0.015, output: 0.075 },
    'gpt-4o': { input: 0.0025, output: 0.01 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'deepseek': { input: 0.0005, output: 0.002 },
    'default': { input: 0.003, output: 0.015 },
  };
  const c = costs[model] || costs.default;
  const rate = type === 'input' ? c.input : c.output;
  return (tokens / 1000) * rate;
}

export const MODEL_OPTIONS = Object.entries(MODEL_ENCODINGS).map(([key, val]) => ({
  key,
  label: val.name,
}));
