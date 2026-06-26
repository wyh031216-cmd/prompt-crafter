import type { Folder, Prompt, PromptVersion } from '../types/prompt';

export interface DataSnapshot {
  version: '1.1';
  exportedAt: number;
  folders: Folder[];
  prompts: Prompt[];
  versions: PromptVersion[];
}

export interface WebDavConfig {
  enabled: boolean;
  url: string;
  username: string;
  password: string;
  /** 远程文件路径，相对于 WebDAV 根目录 */
  remotePath: string;
}

export interface SyncResult {
  pulled: boolean;
  pushed: boolean;
  merged: {
    folders: number;
    prompts: number;
    versions: number;
  };
  syncedAt: number;
}

export const DEFAULT_WEBDAV_PATH = '/promptcraft/sync.json';