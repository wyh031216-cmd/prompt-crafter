import type { Folder, Prompt, PromptFormData, PromptVersion } from '../types/prompt';

/** 提示词数据访问抽象 — 本地 / 云端实现可互换 */
export interface PromptRepository {
  // Folders
  getAllFolders(): Promise<Folder[]>;
  createFolder(name: string, color: string): Promise<Folder>;
  updateFolder(id: string, data: Partial<Pick<Folder, 'name' | 'color'>>): Promise<void>;
  deleteFolder(id: string): Promise<void>;

  // Prompts
  getAllPrompts(): Promise<Prompt[]>;
  getPrompt(id: string): Promise<Prompt | undefined>;
  createPrompt(data: PromptFormData): Promise<Prompt>;
  updatePrompt(id: string, data: Partial<PromptFormData>): Promise<void>;
  deletePrompt(id: string): Promise<void>;
  searchPrompts(query: string): Promise<Prompt[]>;
  getPromptsByFolder(folderId: string | null): Promise<Prompt[]>;

  // Versions
  getVersions(promptId: string): Promise<PromptVersion[]>;
  createVersion(
    promptId: string,
    content: string,
    variables: Prompt['variables'],
    note?: string,
  ): Promise<PromptVersion>;
  deleteVersion(id: string): Promise<void>;
  getVersion(id: string): Promise<PromptVersion | undefined>;
  autoSaveVersion(prompt: Prompt): Promise<void>;

  /** 清除全部本地数据（设置页） */
  clearAllData(): Promise<void>;
}