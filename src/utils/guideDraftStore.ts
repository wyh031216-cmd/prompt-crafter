const KEY = 'promptcraft_guide_draft_v1';

export interface GuideDraft {
  step: 1 | 2 | 3;
  description: string;
  profileId: string | null;
  answers: Record<string, unknown>;
  savedAt: number;
}

export function getGuideDraft(): GuideDraft | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GuideDraft;
  } catch {
    return null;
  }
}

export function saveGuideDraft(draft: Omit<GuideDraft, 'savedAt'>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch {
    /* ignore */
  }
}

export function clearGuideDraft(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}