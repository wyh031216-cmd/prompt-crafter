import { localPromptRepository } from './localPromptRepository';
import type { PromptRepository } from './types';

export type { PromptRepository } from './types';
export { LocalPromptRepository, localPromptRepository } from './localPromptRepository';
export { debouncedAutoSave } from './autoSave';

/** 当前数据实现 — 未来可切换为 RemotePromptRepository */
export const repo: PromptRepository = localPromptRepository;