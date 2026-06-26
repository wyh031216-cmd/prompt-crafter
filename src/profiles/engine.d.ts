export const PROFILES: unknown[];
export const DEFAULT_PROFILE: unknown;
export const REFINE_PATCHES: Record<string, { id: string; label: string; text: string }[]>;
export function detectProfile(desc: string): unknown;
export function getDefaultAnswer(q: unknown, desc: string): unknown;
export function getVisibleQuestions(profile: unknown, answers: Record<string, unknown>): unknown[];
export function calcPrecision(profile: unknown, answers: Record<string, unknown>): number;
export function generatePromptResult(
  description: string,
  profile: unknown,
  answers: Record<string, unknown>
): { positive: string; negative: string; full: string; precision: number; grokTip?: string | null };
export function buildStyleLock(style: string, strictness: string): { lock: string; avoid: string[]; repeat?: string };
export function formatVideoForPlatform(
  platform: string,
  ctx: Record<string, unknown>
): string | { positive: string; negative: string };
export function formatForPlatform(
  platform: string,
  sections: Record<string, unknown>
): string | { positive: string; negative: string };