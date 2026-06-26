const LAST_BACKUP_KEY = 'promptcraft_last_backup_v1';
const REMINDER_DISMISS_KEY = 'promptcraft_backup_dismiss_v1';

export const BACKUP_REMINDER_DAYS = 7;
export const BACKUP_REMINDER_COUNT = 20;

export function getLastBackupAt(): number | null {
  try {
    const raw = localStorage.getItem(LAST_BACKUP_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function recordBackup() {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, String(Date.now()));
    localStorage.removeItem(REMINDER_DISMISS_KEY);
  } catch {
    /* ignore */
  }
}

export function getDaysSinceBackup(): number | null {
  const at = getLastBackupAt();
  if (!at) return null;
  return Math.floor((Date.now() - at) / (24 * 60 * 60 * 1000));
}

export function getBackupStatusLabel(): string {
  const days = getDaysSinceBackup();
  if (days === null) return '从未备份';
  if (days === 0) return '今天已备份';
  if (days === 1) return '上次备份：昨天';
  return `上次备份：${days} 天前`;
}

export function isBackupUrgent(days: number | null, promptCount: number): boolean {
  if (promptCount === 0) return false;
  if (days === null) return promptCount >= 3;
  if (days >= BACKUP_REMINDER_DAYS) return true;
  if (promptCount >= BACKUP_REMINDER_COUNT && days >= 3) return true;
  return false;
}

export function isReminderDismissed(): boolean {
  try {
    const raw = localStorage.getItem(REMINDER_DISMISS_KEY);
    if (!raw) return false;
    return Date.now() < Number(raw);
  } catch {
    return false;
  }
}

/** 暂时关闭提醒，默认 3 天 */
export function dismissReminder(hideDays: number = 3) {
  try {
    localStorage.setItem(
      REMINDER_DISMISS_KEY,
      String(Date.now() + hideDays * 24 * 60 * 60 * 1000),
    );
  } catch {
    /* ignore */
  }
}

export function shouldShowBackupReminder(promptCount: number): boolean {
  if (isReminderDismissed()) return false;
  return isBackupUrgent(getDaysSinceBackup(), promptCount);
}