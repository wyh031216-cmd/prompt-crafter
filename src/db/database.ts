import Dexie, { type Table } from 'dexie';
import type { Prompt, PromptVersion, Folder } from '../types/prompt';

class PromptCraftDB extends Dexie {
  prompts!: Table<Prompt, string>;
  versions!: Table<PromptVersion, string>;
  folders!: Table<Folder, string>;

  constructor() {
    super('PromptCraftDB');
    this.version(1).stores({
      prompts: 'id, title, folderId, updatedAt, *tags',
      versions: 'id, promptId, createdAt',
      folders: 'id, name, createdAt',
    });
  }
}

export const db = new PromptCraftDB();
