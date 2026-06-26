import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import type { Folder, Prompt, PromptFormData, PromptVersion } from '../types/prompt';
import type { PromptRepository } from './types';

export class LocalPromptRepository implements PromptRepository {
  async getAllFolders(): Promise<Folder[]> {
    return db.folders.orderBy('createdAt').toArray();
  }

  async createFolder(name: string, color: string): Promise<Folder> {
    const folder: Folder = {
      id: uuidv4(),
      name,
      color,
      createdAt: Date.now(),
    };
    await db.folders.add(folder);
    return folder;
  }

  async updateFolder(id: string, data: Partial<Pick<Folder, 'name' | 'color'>>): Promise<void> {
    await db.folders.update(id, data);
  }

  async deleteFolder(id: string): Promise<void> {
    await db.folders.delete(id);
    await db.prompts.where('folderId').equals(id).modify({ folderId: null });
  }

  async getAllPrompts(): Promise<Prompt[]> {
    return db.prompts.orderBy('updatedAt').reverse().toArray();
  }

  async getPrompt(id: string): Promise<Prompt | undefined> {
    return db.prompts.get(id);
  }

  async createPrompt(data: PromptFormData): Promise<Prompt> {
    const now = Date.now();
    const prompt: Prompt = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await db.prompts.add(prompt);
    return prompt;
  }

  async updatePrompt(id: string, data: Partial<PromptFormData>): Promise<void> {
    await db.prompts.update(id, { ...data, updatedAt: Date.now() });
  }

  async deletePrompt(id: string): Promise<void> {
    await db.prompts.delete(id);
    await db.versions.where('promptId').equals(id).delete();
  }

  async searchPrompts(query: string): Promise<Prompt[]> {
    const all = await this.getAllPrompts();
    const q = query.toLowerCase();
    return all.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  async getPromptsByFolder(folderId: string | null): Promise<Prompt[]> {
    if (folderId === null) {
      return db.prompts.filter((p) => !p.folderId || p.folderId === '').reverse().sortBy('updatedAt');
    }
    return db.prompts.where('folderId').equals(folderId).reverse().sortBy('updatedAt');
  }

  async getVersions(promptId: string): Promise<PromptVersion[]> {
    return db.versions.where('promptId').equals(promptId).reverse().sortBy('createdAt');
  }

  async createVersion(
    promptId: string,
    content: string,
    variables: Prompt['variables'],
    note: string = '',
  ): Promise<PromptVersion> {
    const version: PromptVersion = {
      id: uuidv4(),
      promptId,
      content,
      variables,
      note,
      createdAt: Date.now(),
    };
    await db.versions.add(version);
    return version;
  }

  async deleteVersion(id: string): Promise<void> {
    await db.versions.delete(id);
  }

  async getVersion(id: string): Promise<PromptVersion | undefined> {
    return db.versions.get(id);
  }

  async autoSaveVersion(prompt: Prompt): Promise<void> {
    const lastVersion = await db.versions
      .where('promptId')
      .equals(prompt.id)
      .reverse()
      .sortBy('createdAt');

    if (lastVersion.length > 0 && lastVersion[0].content === prompt.content) {
      return;
    }

    await this.createVersion(prompt.id, prompt.content, prompt.variables, '自动保存');
  }

  async clearAllData(): Promise<void> {
    await db.prompts.clear();
    await db.versions.clear();
    await db.folders.clear();
  }
}

export const localPromptRepository = new LocalPromptRepository();