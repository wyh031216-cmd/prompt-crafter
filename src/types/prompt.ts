export interface Variable {
  name: string;
  defaultValue: string;
  description: string;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  variables: Variable[];
  tags: string[];
  folderId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface PromptVersion {
  id: string;
  promptId: string;
  content: string;
  variables: Variable[];
  note: string;
  createdAt: number;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface PromptFormData {
  title: string;
  content: string;
  variables: Variable[];
  tags: string[];
  folderId: string | null;
}

export const FOLDER_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
] as const;
