import type { WebDavConfig } from './types';
import { DEFAULT_WEBDAV_PATH } from './types';
import { normalizeHttpUrl } from '../utils/urlSafety';

const CONFIG_KEY = 'promptcraft_webdav_config_v1';
const LAST_SYNC_KEY = 'promptcraft_last_sync_at';

const DEFAULT_CONFIG: WebDavConfig = {
  enabled: false,
  url: '',
  username: '',
  password: '',
  remotePath: DEFAULT_WEBDAV_PATH,
};

export function getWebDavConfig(): WebDavConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function setWebDavConfig(config: WebDavConfig): void {
  const next = { ...config };
  if (next.url?.trim()) {
    next.url = normalizeHttpUrl(next.url.trim(), { requireHttps: true });
  }
  localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
}

export function getLastSyncAt(): number | null {
  const raw = localStorage.getItem(LAST_SYNC_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function recordSyncAt(ts: number = Date.now()): void {
  localStorage.setItem(LAST_SYNC_KEY, String(ts));
}