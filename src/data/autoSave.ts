import type { Prompt } from '../types/prompt';
import { localPromptRepository } from './localPromptRepository';

const autoSaveTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function debouncedAutoSave(prompt: Prompt, delay: number = 30000) {
  const existing = autoSaveTimers.get(prompt.id);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    localPromptRepository.autoSaveVersion(prompt);
    autoSaveTimers.delete(prompt.id);
  }, delay);

  autoSaveTimers.set(prompt.id, timer);
}