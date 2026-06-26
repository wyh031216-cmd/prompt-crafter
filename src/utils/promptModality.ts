export type PromptModality = 'text' | 'image' | 'video';

const IMAGE_PROFILES = new Set(['image_character', 'image_scene']);
const VIDEO_PROFILES = new Set(['video']);

export function getProfileIdFromTags(tags: string[]): string | null {
  const tag = tags.find((t) => t.startsWith('profile:'));
  return tag ? tag.slice('profile:'.length) : null;
}

export function getPlatformFromTags(tags: string[]): string | null {
  const tag = tags.find((t) => t.startsWith('platform:'));
  return tag ? tag.slice('platform:'.length) : null;
}

export function getModalityFromProfileId(profileId: string): PromptModality {
  if (IMAGE_PROFILES.has(profileId)) return 'image';
  if (VIDEO_PROFILES.has(profileId)) return 'video';
  return 'text';
}

export function getPromptModality(tags: string[]): PromptModality {
  const explicit = tags.find((t) => t.startsWith('modality:'));
  if (explicit) {
    const m = explicit.slice('modality:'.length);
    if (m === 'image' || m === 'video' || m === 'text') return m;
  }
  const profileId = getProfileIdFromTags(tags);
  if (profileId) return getModalityFromProfileId(profileId);
  return 'text';
}

export function isTextTrialRunnable(modality: PromptModality): boolean {
  return modality === 'text';
}

export function getModalityLabel(modality: PromptModality): string {
  switch (modality) {
    case 'image':
      return '图像生成';
    case 'video':
      return '视频生成';
    default:
      return '文本任务';
  }
}

const NEGATIVE_MARKER = '\n\n---\n【严禁 / Negative】\n';

export function splitPromptPositiveNegative(full: string): {
  positive: string;
  negative: string;
} {
  const idx = full.indexOf(NEGATIVE_MARKER);
  if (idx === -1) return { positive: full, negative: '' };
  return {
    positive: full.slice(0, idx).trim(),
    negative: full.slice(idx + NEGATIVE_MARKER.length).trim(),
  };
}

export const VISUAL_PLATFORM_HINTS: Record<
  string,
  { name: string; tip: string }
> = {
  grok: {
    name: 'Grok Imagine',
    tip: '在 Grok 中切换到 Imagine / 图像模式，粘贴正向提示词。',
  },
  midjourney: {
    name: 'Midjourney',
    tip: '在 Discord 使用 /imagine，粘贴正向提示词；反向约束可用 --no 参数。',
  },
  sd: {
    name: 'Stable Diffusion',
    tip: '分别填入 Positive / Negative Prompt 输入框后生成。',
  },
  dalle: {
    name: 'DALL·E',
    tip: '在 ChatGPT 图像功能或 OpenAI 图像 API 中使用完整描述。',
  },
  general: {
    name: '通用图像平台',
    tip: '将正向与反向提示词粘贴到平台对应栏目（如 Prompt / Negative）。',
  },
};