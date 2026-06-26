import type { PromptTemplate } from './templates/types';
import {
  detectFormatPlatform,
  detectVisualStyle,
  getFormatPlatformLabel,
  isVisualPrompt,
  type ImageFormatPlatform,
  type VisualStyle,
  type Strictness,
} from './imageFormat';

export type VisualModality = 'image' | 'video';

export interface ResolvedVisualContext {
  platform: ImageFormatPlatform;
  modality: VisualModality;
  style: VisualStyle;
  strictness: Strictness;
  /** 来自模板时锁定，不可随意换平台/视频 */
  locked: boolean;
  templateId?: string;
  templateName?: string;
}

/** 生图/生视频类模板 → 格式化平台与模态 */
const TEMPLATE_VISUAL_MAP: Record<string, { platform: ImageFormatPlatform; modality: VisualModality }> = {
  'grok-video-shot': { platform: 'grok', modality: 'video' },
  'grok-video-ad-plan': { platform: 'grok', modality: 'video' },
  'grok-image-character': { platform: 'grok', modality: 'image' },
  'grok-image-product': { platform: 'grok', modality: 'image' },
  'grok-imagine-style': { platform: 'grok', modality: 'image' },
  'grok-image-scene': { platform: 'grok', modality: 'image' },
  'grok-img2video': { platform: 'grok', modality: 'video' },
  'gemini-imagen': { platform: 'gemini-imagen', modality: 'image' },
  'chatgpt-dalle': { platform: 'chatgpt-dalle', modality: 'image' },
  'qwen-wanx-image': { platform: 'general', modality: 'image' },
  'doubao-seedream-image': { platform: 'general', modality: 'image' },
  'doubao-video-prompt': { platform: 'general', modality: 'video' },
};

export function getTemplateVisualMeta(templateId: string) {
  return TEMPLATE_VISUAL_MAP[templateId] ?? null;
}

export function isVisualTemplate(template: PromptTemplate): boolean {
  return !!TEMPLATE_VISUAL_MAP[template.id];
}

function isVideoContent(content: string): boolean {
  return /视频|镜头|运镜|clip|video|图生视频|文生视频|秒镜|分镜|一镜/i.test(content);
}

/** 解析当前编辑区应使用的格式化上下文 */
export function resolveVisualContext(
  content: string,
  templateId?: string | null,
  templateName?: string | null,
  forceUnlock = false,
): ResolvedVisualContext | null {
  const text = content.trim();
  if (!text && !templateId) return null;

  const fromTemplate = templateId ? TEMPLATE_VISUAL_MAP[templateId] : null;

  if (fromTemplate && !forceUnlock) {
    return {
      platform: fromTemplate.platform,
      modality: fromTemplate.modality,
      style: detectVisualStyle(text),
      strictness: 'strict',
      locked: true,
      templateId: templateId ?? undefined,
      templateName: templateName ?? undefined,
    };
  }

  const platform = detectFormatPlatform(text);
  const modality: VisualModality =
    platform === 'grok' && isVideoContent(text) ? 'video' : 'image';

  return {
    platform,
    modality,
    style: detectVisualStyle(text),
    strictness: 'strict',
    locked: false,
    templateId: templateId || undefined,
    templateName: templateName || undefined,
  };
}

export function allowsVideoMode(ctx: ResolvedVisualContext): boolean {
  return ctx.platform === 'grok' && ctx.modality === 'video';
}

/** 当前是否套用了生图/生视频类模板 */
export function hasVisualTemplate(templateId?: string | null): boolean {
  return !!(templateId && TEMPLATE_VISUAL_MAP[templateId]);
}

/** 自由撰写的生图/视频内容（无模板）才需要格式化工具 */
export function needsFreeformVisualFormat(content: string, templateId?: string | null): boolean {
  if (hasVisualTemplate(templateId)) return false;
  return isVisualPrompt(content);
}

export function getVisualFormatLabel(
  content: string,
  templateId?: string | null,
  templateName?: string | null,
): string {
  const ctx = resolveVisualContext(content, templateId, templateName);
  return ctx ? getFormatPlatformLabel(ctx.platform) : '';
}