const STORAGE_KEY = 'promptcraft_onboarding_v1';

export type OnboardingStep = 'guideVisited' | 'promptSaved' | 'trialRun';

interface OnboardingState {
  dismissed: boolean;
  steps: Record<OnboardingStep, boolean>;
}

const DEFAULT_STATE: OnboardingState = {
  dismissed: false,
  steps: {
    guideVisited: false,
    promptSaved: false,
    trialRun: false,
  },
};

function readState(): OnboardingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE, steps: { ...DEFAULT_STATE.steps } };
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    return {
      dismissed: !!parsed.dismissed,
      steps: { ...DEFAULT_STATE.steps, ...parsed.steps },
    };
  } catch {
    return { ...DEFAULT_STATE, steps: { ...DEFAULT_STATE.steps } };
  }
}

function writeState(state: OnboardingState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function markOnboardingStep(step: OnboardingStep): void {
  const state = readState();
  if (state.steps[step]) return;
  state.steps[step] = true;
  writeState(state);
}

export function dismissOnboarding(): void {
  const state = readState();
  state.dismissed = true;
  writeState(state);
}

export function getOnboardingState(): OnboardingState {
  return readState();
}

export function shouldShowOnboarding(promptCount: number): boolean {
  const state = readState();
  if (state.dismissed) return false;
  if (promptCount > 0 && state.steps.trialRun) return false;
  return true;
}

export function getOnboardingProgress(promptCount: number): {
  steps: { id: OnboardingStep; label: string; done: boolean }[];
  completedCount: number;
} {
  const state = readState();
  const steps = [
    { id: 'guideVisited' as const, label: '用引导生成一条提示词', done: state.steps.guideVisited },
    {
      id: 'promptSaved' as const,
      label: '保存到词库并进入编辑器',
      done: state.steps.promptSaved || promptCount > 0,
    },
    {
      id: 'trialRun' as const,
      label: '试运行文本提示词，或复制图像提示词到平台',
      done: state.steps.trialRun,
    },
  ];
  return {
    steps,
    completedCount: steps.filter((s) => s.done).length,
  };
}