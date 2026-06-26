import type { DataSnapshot } from './types';

export const MAX_SYNC_JSON_BYTES = 10 * 1024 * 1024;
const MAX_ITEMS = 10_000;

export function parseAndValidateSnapshot(raw: string): DataSnapshot {
  if (raw.length > MAX_SYNC_JSON_BYTES) {
    throw new Error('远程同步文件过大，已拒绝加载');
  }

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('远程文件不是有效 JSON');
  }

  if (!data || typeof data !== 'object') {
    throw new Error('远程文件格式无效');
  }

  const record = data as Record<string, unknown>;
  if (record.version !== '1.1' || !Array.isArray(record.prompts)) {
    throw new Error('远程文件格式无效');
  }

  const folders = Array.isArray(record.folders) ? record.folders : [];
  const prompts = record.prompts;
  const versions = Array.isArray(record.versions) ? record.versions : [];

  if (folders.length > MAX_ITEMS || prompts.length > MAX_ITEMS || versions.length > MAX_ITEMS) {
    throw new Error('远程同步数据条目过多');
  }

  return {
    version: '1.1',
    exportedAt: typeof record.exportedAt === 'number' ? record.exportedAt : Date.now(),
    folders: folders as DataSnapshot['folders'],
    prompts: prompts as DataSnapshot['prompts'],
    versions: versions as DataSnapshot['versions'],
  };
}