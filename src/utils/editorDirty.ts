import type { Prompt } from '../types/prompt';

export interface EditorSnapshot {
  title: string;
  content: string;
  variables: Prompt['variables'];
  tags: string[];
  folderId: string | null;
}

export function snapshotFromEditor(
  title: string,
  content: string,
  variables: Prompt['variables'],
  tags: string[],
  folderId: string | null,
): EditorSnapshot {
  return { title, content, variables, tags, folderId };
}

export function isEditorDirty(
  current: EditorSnapshot,
  saved: EditorSnapshot | null,
  isNew: boolean,
): boolean {
  if (isNew) {
    return !!(current.title.trim() || current.content.trim() || current.tags.length > 0);
  }
  if (!saved) return false;
  return (
    current.title !== saved.title ||
    current.content !== saved.content ||
    current.folderId !== saved.folderId ||
    JSON.stringify(current.tags) !== JSON.stringify(saved.tags) ||
    JSON.stringify(current.variables) !== JSON.stringify(saved.variables)
  );
}