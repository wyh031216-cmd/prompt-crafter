const HISTORY_KEY = 'promptcraft_history_v2';
const MAX = 20;

export interface GuideHistoryEntry {
  id: string;
  title: string;
  description: string;
  profileId: string;
  profileLabel: string;
  answers: Record<string, unknown>;
  results: { positive: string; negative: string; full: string };
  appliedRefines: string[];
  precision: number;
  savedAt: string;
}

export function loadGuideHistory(): GuideHistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveGuideHistory(entry: GuideHistoryEntry): void {
  const list = loadGuideHistory().filter((h) => h.id !== entry.id);
  list.unshift(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, MAX)));
}