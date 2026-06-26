import type { SelectedElementInfo, StyleOverrides } from './types';

let idCounter = 0;

export function isIgnoredElement(el: Element | null): boolean {
  if (!el || el === document.body || el === document.documentElement) return true;
  return !!el.closest('[data-vc-ignore]');
}

/** 按钮、输入框等交互元素不拦截，保证正常操作 */
export function isInteractiveElement(el: Element | null): boolean {
  if (!el) return false;
  if (isIgnoredElement(el)) return true;
  const tag = el.tagName.toLowerCase();
  if (['button', 'a', 'input', 'textarea', 'select', 'label', 'option', 'summary'].includes(tag)) {
    return true;
  }
  return !!el.closest(
    'button, a, input, textarea, select, label, [role="button"], [contenteditable="true"]'
  );
}

export function buildSelector(el: Element): string {
  const parts: string[] = [];
  let current: Element | null = el;

  while (current && current !== document.body && parts.length < 6) {
    let part = current.tagName.toLowerCase();
    if (current.id) {
      part += `#${current.id}`;
      parts.unshift(part);
      break;
    }
    const cls = Array.from(current.classList).filter((c) => !c.startsWith('vc-')).slice(0, 2);
    if (cls.length) part += `.${cls.join('.')}`;
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter((c) => c.tagName === current!.tagName);
      if (siblings.length > 1) {
        const idx = siblings.indexOf(current) + 1;
        part += `:nth-of-type(${idx})`;
      }
    }
    parts.unshift(part);
    current = current.parentElement;
  }

  return parts.join(' > ');
}

export function getElementText(el: Element): string {
  const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
  return text.slice(0, 120);
}

export function captureElement(el: Element, route: string): SelectedElementInfo {
  const rect = el.getBoundingClientRect();
  return {
    id: `vc-${++idCounter}`,
    tagName: el.tagName.toLowerCase(),
    text: getElementText(el),
    className: el.className?.toString?.() || '',
    selector: buildSelector(el),
    route,
    rect: {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    },
  };
}

export function buildAiPrompt(entry: {
  element: SelectedElementInfo;
  textOverride?: string;
  styleOverrides: StyleOverrides;
  note: string;
}): string {
  const styles = Object.entries(entry.styleOverrides)
    .filter(([, v]) => v)
    .map(([k, v]) => `  ${k}: ${v}`)
    .join('\n');

  return `【可视化编辑 · 请修改词坊界面】

页面路由: ${entry.element.route}
选中元素: <${entry.element.tagName}>
CSS 选择器: ${entry.element.selector}
当前 class: ${entry.element.className || '(无)'}
当前文字: ${entry.element.text || '(空)'}
${entry.textOverride ? `期望文字: ${entry.textOverride}` : ''}
${styles ? `期望样式:\n${styles}` : ''}

修改说明:
${entry.note || '(请根据上方样式/文字调整对应组件)'}

项目路径: D:\\GROK\\projects\\prompt-crafter
请直接修改源码，保持现有代码风格。`;
}