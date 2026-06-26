type Step = 1 | 2 | 3;

const STEPS: { n: Step; title: string; hint: string }[] = [
  { n: 1, title: '描述需求', hint: '用一句话说清楚要什么' },
  { n: 2, title: '确认细节', hint: '核对场景与关键选项' },
  { n: 3, title: '保存编辑', hint: '存词库后继续打磨' },
];

interface GuideStepProgressProps {
  step: Step;
}

export default function GuideStepProgress({ step }: GuideStepProgressProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-1 mb-3">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1 min-w-0">
            <div
              className={`h-1 flex-1 rounded-full transition-colors ${
                step > s.n ? 'bg-green-400' : step === s.n ? 'bg-terracotta' : 'bg-espresso/10'
              }`}
            />
            {i < STEPS.length - 1 && <div className="w-1 flex-shrink-0" />}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className={`rounded-lg border px-2 py-2.5 text-center transition-colors ${
              step === s.n
                ? 'bg-terracotta/10 border-terracotta/25'
                : step > s.n
                  ? 'bg-green-50 border-green-200'
                  : 'bg-paper border-espresso/10'
            }`}
          >
            <div
              className={`text-xs font-semibold ${
                step === s.n
                  ? 'text-terracotta-deep'
                  : step > s.n
                    ? 'text-green-700'
                    : 'text-sage-light'
              }`}
            >
              {s.title}
            </div>
            <div className="text-[10px] text-espresso-soft mt-0.5 leading-snug hidden sm:block">
              {s.hint}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}