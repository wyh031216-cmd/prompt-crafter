const VISUAL_EDIT_OVERRIDE_KEY = 'promptcraft_enable_visual_edit';

/** 生产环境默认关闭；开发环境默认开启；可通过环境变量或 localStorage 覆盖 */
export function isVisualEditEnabled(): boolean {
  if (import.meta.env.VITE_ENABLE_VISUAL_EDIT === 'true') return true;
  if (import.meta.env.VITE_ENABLE_VISUAL_EDIT === 'false') return false;

  try {
    const override = localStorage.getItem(VISUAL_EDIT_OVERRIDE_KEY);
    if (override === '1') return true;
    if (override === '0') return false;
  } catch {
    /* ignore */
  }

  return import.meta.env.DEV;
}