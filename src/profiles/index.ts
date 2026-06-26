/* eslint-disable @typescript-eslint/no-explicit-any */
export {
  PROFILES,
  DEFAULT_PROFILE,
  REFINE_PATCHES,
  detectProfile,
  getDefaultAnswer,
  getVisibleQuestions,
  calcPrecision,
  generatePromptResult,
  buildStyleLock,
  formatForPlatform,
} from './engine.js';

export {
  buildFullText,
  applyRefinePatches,
  stripRefinePatches,
  buildInitialAnswers,
} from './guideUtils';

export type Profile = {
  id: string;
  label: string;
  icon: string;
  keywords: string[];
  sharedQuestions?: Question[];
  questions: Question[];
  build: (desc: string, ans: Record<string, any>) => {
    positive: string;
    negative?: string;
    hasNegative?: boolean;
    precision?: number;
    grokTip?: string | null;
  };
  buildNegative?: (desc: string, ans: Record<string, any>) => string[] | string;
};

export type Question = {
  id: string;
  label: string;
  type: 'single' | 'multi' | 'text';
  required?: boolean;
  hint?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  showWhen?: (a: Record<string, any>) => boolean;
  detect?: (desc: string) => string | string[] | null;
};

export type RefinePatch = { id: string; label: string; text: string };

export type GeneratedResult = {
  positive: string;
  negative: string;
  full: string;
  precision: number;
  grokTip?: string | null;
};