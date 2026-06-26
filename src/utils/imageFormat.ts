import { buildStyleLock, formatForPlatform } from '../profiles';
import type { ResolvedVisualContext } from './visualContext';

export type VisualStyle =
  | 'realistic' | 'anime' | 'semi_realistic' | 'concept' | 'illustration'
  | '3d' | 'watercolor' | 'oil' | 'pixel' | 'flat' | 'retro';

export type Strictness = 'strict' | 'normal' | 'loose';

export type StructuredPlatform = 'grok' | 'midjourney' | 'sd' | 'dalle' | 'general';
export type Platform = StructuredPlatform;
export type TemplatePlatform = 'gemini-imagen' | 'chatgpt-dalle';
export type ImageFormatPlatform = StructuredPlatform | TemplatePlatform;

export const GROK_NEGATIVE_VIDEO = [
  'blurry', 'flickering', 'jittery', 'inconsistent face', 'wrong product', 'wrong packaging',
  'style drift', 'anime', 'cartoon', 'watermark', 'deformed', 'low quality', 'text overlay',
  'different person', 'face morphing', 'shaky camera',
].join(', ');

export const STRUCTURED_PLATFORMS: { value: StructuredPlatform; label: string; video?: boolean }[] = [
  { value: 'grok', label: 'Grok Imagine', video: true },
  { value: 'midjourney', label: 'Midjourney' },
  { value: 'sd', label: 'Stable Diffusion' },
  { value: 'dalle', label: 'DALL·E' },
  { value: 'general', label: '通用 / 其他' },
];

export const TEMPLATE_PLATFORMS: { value: TemplatePlatform; label: string }[] = [
  { value: 'gemini-imagen', label: 'Gemini Imagen' },
  { value: 'chatgpt-dalle', label: 'ChatGPT DALL·E' },
];

/** 编辑区是否为图像/视频类生成提示词（非普通文本对话） */
const VISUAL_PROMPT_RE =
  /视频|短视频|宣传片|短片|广告片|分镜|一镜|clip|mv|运镜|镜头|秒镜|图生视频|文生视频|三视图|立绘|人设|角色图|turnaround|character sheet|图片|图像|海报|封面|插画|壁纸|banner|生图|文生图|imagine|midjourney|stable diffusion|\bsd\b|dalle|dall·e|photorealistic|写实|摄影|动漫风|negative prompt|风格锁定|生成内容|严禁出现|grok|seedream|万相|imagen|text-to-image|image generation|图生图|产品图|场景图/i;

export function isVisualPrompt(content: string): boolean {
  const text = content.trim();
  if (!text) return false;
  return VISUAL_PROMPT_RE.test(text);
}

const PLATFORM_DETECT_RULES: { re: RegExp; platform: ImageFormatPlatform }[] = [
  { re: /midjourney|--ar\b|--no\b|--v\s*\d/i, platform: 'midjourney' },
  { re: /stable diffusion|stable_diffusion|comfyui|automatic1111|webui/i, platform: 'sd' },
  { re: /\bsd\b|负面提示词|正向提示词/i, platform: 'sd' },
  { re: /chatgpt|dall[·.\-]?e|dalle/i, platform: 'chatgpt-dalle' },
  { re: /gemini|imagen|google ai/i, platform: 'gemini-imagen' },
  { re: /seedream|万相|通义/i, platform: 'gemini-imagen' },
  { re: /grok/i, platform: 'grok' },
];

/** 从编辑区内容推断生图/生视频目标平台 */
export function detectFormatPlatform(content: string): ImageFormatPlatform {
  for (const { re, platform } of PLATFORM_DETECT_RULES) {
    if (re.test(content)) return platform;
  }
  if (/视频|镜头|运镜|clip|video|图生视频|文生视频|imagine/i.test(content)) return 'grok';
  return 'general';
}

export function detectVisualStyle(content: string): VisualStyle {
  if (/动漫|anime|cel shading|二次元/i.test(content)) return 'anime';
  if (/插画|illustration/i.test(content)) return 'illustration';
  if (/概念|concept/i.test(content)) return 'concept';
  if (/3d|渲染|cgi|octane/i.test(content)) return '3d';
  return 'realistic';
}

function detectVisualMode(content: string): 'image' | 'video' {
  if (/视频|镜头|运镜|clip|video|图生视频|秒镜|分镜/i.test(content)) return 'video';
  return 'image';
}

export function getFormatPlatformLabel(platform: ImageFormatPlatform): string {
  const structured = STRUCTURED_PLATFORMS.find((p) => p.value === platform);
  if (structured) return structured.label;
  const template = TEMPLATE_PLATFORMS.find((p) => p.value === platform);
  return template?.label ?? '通用';
}

/** 一键格式化：优先遵循模板锁定上下文，否则自动识别平台 */
export function formatVisualPromptQuick(
  content: string,
  body = content,
  ctx?: ResolvedVisualContext | null,
): string {
  const raw = body.trim();
  if (!raw) return '';

  const platform = ctx?.platform ?? detectFormatPlatform(content);
  const mode =
    ctx?.modality === 'video' && platform === 'grok'
      ? 'video'
      : platform === 'grok' && !ctx
        ? detectVisualMode(content)
        : 'image';

  const output = formatImagePrompt(raw, {
    platform,
    style: ctx?.style ?? detectVisualStyle(content),
    strictness: ctx?.strictness ?? 'strict',
    mode,
  });
  return output ? formatOutputToText(output) : raw;
}

const STYLE_EN: Partial<Record<VisualStyle, string>> = {
  realistic: 'photorealistic',
  anime: 'anime style',
  illustration: 'digital illustration',
  concept: 'concept art',
  '3d': '3D rendered',
  semi_realistic: 'semi-realistic digital painting',
  watercolor: 'watercolor illustration',
  oil: 'oil painting',
  pixel: 'pixel art',
  flat: 'flat design illustration',
  retro: 'vintage film photography',
};

export type FormatOutput =
  | { kind: 'text'; text: string }
  | { kind: 'sd'; positive: string; negative: string };

function styleToEnglish(style: VisualStyle): string {
  return STYLE_EN[style] || 'photorealistic';
}

export function wrapForGeminiImagen(content: string, style: VisualStyle = 'realistic'): string {
  const body = content.trim();
  const styleEn = styleToEnglish(style);
  return `A ${styleEn} image.

Scene: ${body}

Mood: clear, intentional atmosphere
Lighting: natural balanced lighting, soft shadows
Composition: clear subject, balanced framing

Technical: high resolution, sharp focus, professional quality

Do not include: text, watermark, blurry, distorted, oversaturated`;
}

export function wrapForChatGptDalle(content: string): string {
  const body = content.trim();
  return `${body}

Lighting: natural soft lighting
Composition: balanced framing, clear focal point
Color mood: harmonious, cohesive palette

Style notes: high detail, no text, no watermark`;
}

export function formatImagePrompt(
  content: string,
  opts: {
    platform: ImageFormatPlatform;
    style?: VisualStyle;
    strictness?: Strictness;
    mode?: 'image' | 'video';
  },
): FormatOutput | null {
  const body = content.trim();
  if (!body) return null;

  const style = opts.style || 'realistic';
  const strictness = opts.strictness || 'strict';
  const mode = opts.mode || 'image';

  if (opts.platform === 'gemini-imagen') {
    return { kind: 'text', text: wrapForGeminiImagen(body, style) };
  }
  if (opts.platform === 'chatgpt-dalle') {
    return { kind: 'text', text: wrapForChatGptDalle(body) };
  }

  const styleLock = buildStyleLock(style, strictness);
  const quality =
    mode === 'video' && opts.platform === 'grok'
      ? '9:16 vertical, stable smooth motion, 4K commercial'
      : '4K, sharp focus, stable composition';

  const sections = {
    lock: styleLock.lock,
    repeat: styleLock.repeat,
    avoid: styleLock.avoid,
    quality,
  };

  if (opts.platform === 'grok') {
    return {
      kind: 'text',
      text: formatForPlatform('grok', { ...sections, desc: body }) as string,
    };
  }

  if (opts.platform === 'sd') {
    const raw = formatForPlatform('sd', { ...sections, details: body }) as unknown as {
      positive: string;
      negative: string;
    };
    return { kind: 'sd', positive: raw.positive, negative: raw.negative };
  }

  const text = formatForPlatform(opts.platform, { ...sections, details: body }) as string;
  return { kind: 'text', text };
}

export function formatOutputToText(output: FormatOutput): string {
  if (output.kind === 'sd') {
    return `【Positive Prompt】\n${output.positive}\n\n【Negative Prompt】\n${output.negative}`;
  }
  return output.text;
}