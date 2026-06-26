import { useNavigate } from 'react-router-dom';
import { Wand2, Plus, FileText } from 'lucide-react';

interface HomeHeroProps {
  compact?: boolean;
}

export default function HomeHero({ compact }: HomeHeroProps) {
  const navigate = useNavigate();

  if (compact) {
    return (
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-espresso/8 bg-paper/60 px-4 py-3">
        <p className="text-sm text-espresso-soft">
          <span className="font-medium text-espresso">不会写？</span>
          用引导生成，描述需求即可出稿
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button type="button" onClick={() => navigate('/guide')} className="btn-primary text-xs">
            <Wand2 className="w-3.5 h-3.5" />
            引导生成
          </button>
          <button type="button" onClick={() => navigate('/new')} className="btn-secondary text-xs">
            <Plus className="w-3.5 h-3.5" />
            新建空白
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-2xl border border-espresso/8 bg-gradient-to-br from-paper via-cream/80 to-terracotta/5 p-6 lg:p-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage mb-2">
        多平台提示词工作台
      </p>
      <h2 className="font-serif text-2xl lg:text-3xl text-espresso leading-snug mb-2">
        引导出稿，多平台适配，版本可回溯
      </h2>
      <p className="text-sm text-espresso-soft max-w-xl leading-relaxed mb-6">
        不会写提示词？用引导生成描述你的需求，30 秒出稿并自动存入词库，进编辑器继续打磨。
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => navigate('/guide')} className="btn-primary">
          <Wand2 className="w-4 h-4" />
          引导生成
        </button>
        <button type="button" onClick={() => navigate('/new')} className="btn-secondary">
          <Plus className="w-4 h-4" />
          新建空白
        </button>
        <button
          type="button"
          onClick={() => navigate('/templates')}
          className="btn-ghost text-sm text-espresso-soft"
        >
          <FileText className="w-4 h-4" />
          浏览模板
        </button>
      </div>
    </div>
  );
}