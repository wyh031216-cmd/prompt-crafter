import { useState, useMemo } from 'react';
import {
  PROMPT_TEMPLATES,
  AI_PLATFORMS,
  GENERAL_SUBCATEGORIES,
  PLATFORM_TEMPLATE_COUNTS,
  type PromptTemplate,
  type AIPlatform,
  type TemplateSubcategory,
} from '../utils/templates';
import { Search, ChevronRight, Sparkles } from 'lucide-react';
import AIPlatformIcon, { PlatformChip } from './AIPlatformIcon';

interface TemplatePanelProps {
  activeTemplateId?: string | null;
  onSelectTemplate: (template: PromptTemplate) => void;
  fillHeight?: boolean;
}

const PLATFORM_ORDER: AIPlatform[] = [
  'grok',
  'gemini',
  'chatgpt',
  'claude',
  'deepseek',
  'qwen',
  'doubao',
  'general',
];

export default function TemplatePanel({ activeTemplateId, onSelectTemplate, fillHeight = false }: TemplatePanelProps) {
  const [search, setSearch] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<AIPlatform | 'all'>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<TemplateSubcategory | 'all'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);

  const filtered = useMemo(() => {
    let list = PROMPT_TEMPLATES;

    if (selectedPlatform !== 'all') {
      list = list.filter((t) => t.category === selectedPlatform);
    }
    if (selectedPlatform === 'general' && selectedSubcategory !== 'all') {
      list = list.filter((t) => t.subcategory === selectedSubcategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          AI_PLATFORMS[t.category].name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedPlatform, selectedSubcategory, search]);

  if (selectedTemplate) {
    return (
      <div>
        <button
          onClick={() => setSelectedTemplate(null)}
          className="flex items-center gap-1 text-xs text-terracotta hover:text-terracotta-deep mb-3 cursor-pointer"
        >
          ← 返回模板列表
        </button>

        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-2xl">{selectedTemplate.icon}</span>
          <PlatformChip platform={selectedTemplate.category} size="sm" />
        </div>
        <h3 className="text-sm font-bold text-espresso mb-1">{selectedTemplate.name}</h3>
        <p className="text-xs text-espresso-soft mb-3">{selectedTemplate.description}</p>

        <div className="bg-terracotta/10 rounded-lg p-2.5 mb-3">
          <h4 className="text-xs font-semibold text-terracotta-deep mb-1">💡 使用技巧</h4>
          <ul className="text-xs text-terracotta space-y-0.5">
            {selectedTemplate.tips.map((tip, i) => (
              <li key={i}>• {tip}</li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => {
            onSelectTemplate(selectedTemplate);
            setSelectedTemplate(null);
          }}
          className="btn-primary w-full justify-center text-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          套用（已含平台格式）
        </button>
      </div>
    );
  }

  const activeTemplate = activeTemplateId
    ? PROMPT_TEMPLATES.find((t) => t.id === activeTemplateId)
    : null;

  const listClass = fillHeight
    ? 'space-y-1 flex-1 min-h-0 overflow-y-auto overscroll-contain'
    : 'space-y-1 max-h-[400px] overflow-y-auto overscroll-contain';

  return (
    <div className={fillHeight ? 'flex flex-col flex-1 min-h-0 h-full' : undefined}>
      {activeTemplate && (
        <p className="mb-2 text-xs text-espresso-soft">
          当前套用：
          <span className="ml-1 font-medium text-espresso">{activeTemplate.name}</span>
        </p>
      )}

      {/* AI 平台一级分类 — 下拉更明显 */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-espresso mb-1">
          选择 AI 平台
        </label>
        <select
          value={selectedPlatform}
          onChange={(e) => {
            setSelectedPlatform(e.target.value as AIPlatform | 'all');
            setSelectedSubcategory('all');
          }}
          className="w-full text-sm px-2.5 py-2 border border-terracotta/20 rounded-lg bg-terracotta/10 text-espresso focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta/30 cursor-pointer"
        >
          <option value="all">全部平台 ({PROMPT_TEMPLATES.length})</option>
          {PLATFORM_ORDER.map((key) => {
            const cat = AI_PLATFORMS[key];
            return (
              <option key={key} value={key}>
                {cat.name} — {PLATFORM_TEMPLATE_COUNTS[key]} 个模板
              </option>
            );
          })}
        </select>
        <p className="text-xs text-sage-light mt-1">
          Grok、Gemini、ChatGPT、Claude、DeepSeek、千问、豆包
        </p>
      </div>

      {/* 通用工程二级分类 */}
      {selectedPlatform === 'general' && (
        <div className="mb-2">
          <p className="text-xs text-sage-light mb-1.5">通用 · 子分类</p>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setSelectedSubcategory('all')}
              className={`px-2 py-0.5 text-xs rounded transition-colors cursor-pointer ${
                selectedSubcategory === 'all'
                  ? 'bg-slate-200 text-slate-700 font-medium'
                  : 'text-sage-light hover:bg-cream'
              }`}
            >
              全部
            </button>
            {(Object.entries(GENERAL_SUBCATEGORIES) as [TemplateSubcategory, typeof GENERAL_SUBCATEGORIES[TemplateSubcategory]][]).map(
              ([key, sub]) => (
                <button
                  key={key}
                  onClick={() => setSelectedSubcategory(key)}
                  className={`px-2 py-0.5 text-xs rounded transition-colors cursor-pointer ${
                    selectedSubcategory === key
                      ? 'bg-slate-200 text-slate-700 font-medium'
                      : 'text-sage-light hover:bg-cream'
                  }`}
                >
                  {sub.icon} {sub.name}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-2">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-sage-light" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索模板..."
          className="w-full text-xs pl-7 pr-2 py-1.5 border border-espresso/10 rounded-lg focus:outline-none focus:border-terracotta"
        />
      </div>

      {/* Template list */}
      <div className={listClass}>
        {filtered.length === 0 ? (
          <p className="text-xs text-sage-light text-center py-4">没有匹配的模板</p>
        ) : (
          filtered.map((t) => {
            const platform = AI_PLATFORMS[t.category];
            const sub = t.subcategory ? GENERAL_SUBCATEGORIES[t.subcategory] : null;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t)}
                className={`w-full text-left p-2.5 rounded-lg transition-colors cursor-pointer group ${
                  t.id === activeTemplateId
                    ? 'bg-terracotta/10 border border-terracotta/25'
                    : 'hover:bg-cream border border-transparent hover:border-espresso/10'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg flex-shrink-0">{t.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm font-medium text-espresso truncate">{t.name}</span>
                      {t.id === activeTemplateId ? (
                        <span className="flex-shrink-0 text-[10px] font-medium text-terracotta-deep px-1.5 py-0.5 bg-terracotta/15 rounded">
                          当前
                        </span>
                      ) : (
                        <ChevronRight className="w-3 h-3 text-sage-light group-hover:text-espresso-soft flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-espresso-soft mt-0.5 line-clamp-1">{t.description}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${platform.color}`}>
                        <AIPlatformIcon platform={t.category} size={12} />
                        {platform.name}
                      </span>
                      {sub && (
                        <span className="text-xs text-sage-light">
                          {sub.icon} {sub.name}
                        </span>
                      )}
                      <span className="text-xs text-sage-light">
                        · {t.variables.length} 个变量
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}