export const MAX_BACKUP_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_BACKUP_PROMPTS = 5000;
const MAX_FIELD_LEN = 200_000;

export type BackupPayload = {
  version: string;
  prompts: Array<{
    title?: string;
    content?: string;
    variables?: unknown;
    tags?: unknown;
    folderId?: unknown;
  }>;
};

export function validateBackupFile(file: File): void {
  if (file.size > MAX_BACKUP_FILE_BYTES) {
    throw new Error(`备份文件过大（上限 ${MAX_BACKUP_FILE_BYTES / 1024 / 1024}MB）`);
  }
}

export function parseAndValidateBackupJson(text: string): BackupPayload {
  if (text.length > MAX_BACKUP_FILE_BYTES) {
    throw new Error('备份内容过大');
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('不是有效的 JSON 文件');
  }

  if (!data || typeof data !== 'object') {
    throw new Error('无效的备份文件格式');
  }

  const record = data as Record<string, unknown>;
  if (!record.version || !Array.isArray(record.prompts)) {
    throw new Error('无效的备份文件格式');
  }

  const prompts = record.prompts as BackupPayload['prompts'];
  if (prompts.length > MAX_BACKUP_PROMPTS) {
    throw new Error(`提示词数量过多（上限 ${MAX_BACKUP_PROMPTS} 条）`);
  }

  for (const p of prompts) {
    if (!p || typeof p !== 'object') {
      throw new Error('备份中存在无效的提示词条目');
    }
    const title = typeof p.title === 'string' ? p.title : '';
    const content = typeof p.content === 'string' ? p.content : '';
    if (title.length > MAX_FIELD_LEN || content.length > MAX_FIELD_LEN) {
      throw new Error('单条提示词过长');
    }
    if (p.variables !== undefined && !Array.isArray(p.variables)) {
      throw new Error('variables 字段格式无效');
    }
    if (p.tags !== undefined && !Array.isArray(p.tags)) {
      throw new Error('tags 字段格式无效');
    }
  }

  return {
    version: String(record.version),
    prompts,
  };
}