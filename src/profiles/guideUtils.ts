import { getDefaultAnswer, getVisibleQuestions } from './engine.js';
import type { GeneratedResult, Profile, Question, RefinePatch } from './index';

/** 正向 + 反向合并为编辑器/复制用的完整文本 */
export function buildFullText(positive: string, negative: string): string {
  if (!negative?.trim()) return positive;
  const items = negative.split(',').map((s) => s.trim()).filter(Boolean);
  return `${positive}\n\n---\n【严禁 / Negative】\n${items.map((n) => `- ${n}`).join('\n')}`;
}

export function applyRefinePatches(
  base: GeneratedResult,
  patchIds: string[],
  patches: RefinePatch[],
): GeneratedResult {
  const patchText = patchIds.map((id) => patches.find((p) => p.id === id)?.text ?? '').join('');
  const positive = base.positive + patchText;
  return {
    ...base,
    positive,
    negative: base.negative,
    full: buildFullText(positive, base.negative),
  };
}

export function stripRefinePatches(text: string, patchIds: string[], patches: RefinePatch[]): string {
  let out = text;
  for (const id of patchIds) {
    const p = patches.find((x) => x.id === id);
    if (p) out = out.split(p.text).join('');
  }
  return out;
}

export function buildInitialAnswers(profile: Profile, desc: string): Record<string, unknown> {
  const init: Record<string, unknown> = {};
  const allQ = [...(profile.sharedQuestions || []), ...profile.questions];
  allQ.forEach((q) => {
    if (!/^length_/.test(q.id)) {
      init[q.id] = getDefaultAnswer(q, desc);
    }
  });
  (getVisibleQuestions(profile, init) as Question[]).forEach((q) => {
    if (/^length_/.test(q.id)) {
      init[q.id] = getDefaultAnswer(q, desc);
    }
  });
  return init;
}