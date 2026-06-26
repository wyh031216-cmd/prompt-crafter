import { chatCompletion } from './chat';
import { buildSystemPrompt, getActionPrompt } from './prompts';
import type { OptimizeRequest } from './types';

export async function optimizePrompt(
  request: OptimizeRequest,
  onChunk?: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const systemPrompt = buildSystemPrompt(request.action);
  const userPrompt = `${getActionPrompt(request.action, request.customInstruction)}\n\n---\n\n${request.content}`;

  return chatCompletion(
    {
      system: systemPrompt,
      user: userPrompt,
      model: request.model,
      maxTokens: 4096,
    },
    onChunk,
    signal,
  );
}