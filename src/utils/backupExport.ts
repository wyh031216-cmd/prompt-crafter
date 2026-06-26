import { repo } from '../data';
import { exportPromptsToJSON, downloadJSON } from './export';
import { recordBackup } from './backupReminder';

export async function exportAllPromptsBackup(): Promise<number> {
  const prompts = await repo.getAllPrompts();
  const json = exportPromptsToJSON(prompts);
  const date = new Date().toISOString().split('T')[0];
  downloadJSON(json, `promptcraft-backup-${date}.json`);
  recordBackup();
  return prompts.length;
}