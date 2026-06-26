import { useNavigate } from 'react-router-dom';
import { Wand2, X, Check, Play, Circle } from 'lucide-react';
import { dismissOnboarding, getOnboardingProgress } from '../utils/onboarding';

interface OnboardingCardProps {
  promptCount: number;
  latestPromptId?: string | null;
}

export default function OnboardingCard({ promptCount, latestPromptId }: OnboardingCardProps) {
  const navigate = useNavigate();
  const { steps, completedCount } = getOnboardingProgress(promptCount);
  const trialDone = steps.find((s) => s.id === 'trialRun')?.done;

  return (
    <div className="mb-6 rounded-xl border border-terracotta/20 bg-gradient-to-br from-terracotta/5 to-paper p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-terracotta-deep mb-1">
            新手入门 · {completedCount}/{steps.length}
          </p>
          <h3 className="font-serif text-lg text-espresso">3 分钟完成第一条提示词</h3>
          <p className="text-sm text-espresso-soft mt-1">
            跟着下面三步走，即可体验完整闭环。
          </p>
        </div>
        <button
          type="button"
          onClick={dismissOnboarding}
          className="text-sage-light hover:text-espresso-soft cursor-pointer p-1 flex-shrink-0"
          title="不再显示"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <ol className="space-y-2.5 mb-4">
        {steps.map((step, i) => (
          <li key={step.id} className="flex items-start gap-3 text-sm">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                step.done
                  ? 'bg-green-100 text-green-700'
                  : 'bg-paper border border-espresso/15 text-sage-light'
              }`}
            >
              {step.done ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <span className="text-xs font-medium">{i + 1}</span>
              )}
            </span>
            <span className={step.done ? 'text-espresso-soft line-through' : 'text-espresso'}>
              {step.label}
            </span>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-2">
        {!steps[0].done || promptCount === 0 ? (
          <button type="button" onClick={() => navigate('/guide')} className="btn-primary text-sm">
            <Wand2 className="w-4 h-4" />
            {completedCount === 0 ? '开始引导生成' : '继续引导生成'}
          </button>
        ) : null}
        {latestPromptId && !trialDone && (
          <button
            type="button"
            onClick={() => navigate(`/edit/${latestPromptId}`, { state: { openRun: true } })}
            className="btn-secondary text-sm"
          >
            <Play className="w-4 h-4" />
            去试运行
          </button>
        )}
      </div>

      <p className="text-[10px] text-sage-light mt-3 flex items-center gap-1">
        <Circle className="w-2 h-2 fill-current" />
        文本试运行需配置 API；图像提示词请复制到对应平台
      </p>
    </div>
  );
}