import type { PromptFormData } from '../types/prompt';

export interface EditorDraft extends PromptFormData {
  savedAt: number;
  activeTemplateId?: string | null;
  activeTemplateName?: string | null;
}

const DRAFT_NEW_KEY = 'promptcraft_draft_new';
const draftKey = (id: string) => `promptcraft_draft_${id}`;

function read(key: string): EditorDraft | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as EditorDraft;
  } catch {
    return null;
  }
}

function write(key: string, draft: EditorDraft) {
  try {
    localStorage.setItem(key, JSON.stringify(draft));
  } catch {
    /* quota exceeded — ignore */
  }
}

export function getNewDraft(): EditorDraft | null {
  return read(DRAFT_NEW_KEY);
}

export function getEditDraft(id: string): EditorDraft | null {
  return read(draftKey(id));
}

export function saveNewDraft(draft: Omit<EditorDraft, 'savedAt'>) {
  write(DRAFT_NEW_KEY, { ...draft, savedAt: Date.now() });
}

export function saveEditDraft(id: string, draft: Omit<EditorDraft, 'savedAt'>) {
  write(draftKey(id), { ...draft, savedAt: Date.now() });
}

export function clearNewDraft() {
  try {
    localStorage.removeItem(DRAFT_NEW_KEY);
  } catch {
    /* ignore */
  }
}

export function clearEditDraft(id: string) {
  try {
    localStorage.removeItem(draftKey(id));
  } catch {
    /* ignore */
  }
}