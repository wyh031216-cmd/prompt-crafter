import type { Variable } from '../types/prompt';

export interface TemplatePayload {
  title: string;
  content: string;
  variables: Variable[];
  tags: string[];
  /** 套用的模板 ID，用于锁定生图/视频格式化平台 */
  templateId?: string;
  templateName?: string;
}

const STORAGE_KEY = 'promptcraft_pending_template_v1';

let pendingTemplate: TemplatePayload | null = null;

export function setPendingTemplate(payload: TemplatePayload) {
  pendingTemplate = payload;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function getPendingTemplate(navState: unknown): TemplatePayload | null {
  const fromNav = (navState as { fromTemplate?: TemplatePayload } | null)?.fromTemplate;
  if (fromNav) {
    pendingTemplate = fromNav;
    return fromNav;
  }
  if (pendingTemplate) return pendingTemplate;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      pendingTemplate = JSON.parse(raw) as TemplatePayload;
      return pendingTemplate;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function clearPendingTemplate() {
  pendingTemplate = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}