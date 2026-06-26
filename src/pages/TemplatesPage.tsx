import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PROMPT_TEMPLATES,
  AI_PLATFORMS,
  GENERAL_SUBCATEGORIES,
  PLATFORM_TEMPLATE_COUNTS,
  type AIPlatform,
  type PromptTemplate,
  type TemplateSubcategory,
} from '../utils/templates';
import { Sparkles, ChevronRight } from 'lucide-react';
import { setPendingTemplate } from '../utils/templateBridge';
import { buildTemplatePayload } from '../utils/templateApply';
import AIPlatformIcon, { PlatformChip } from '../components/AIPlatformIcon';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';

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

const PLATFORM_DESC: Record<AIPlatform, string> = {
  grok: '视频单镜、角色图、产品图、Imagine',
  gemini: 'System Instruction、多模态、Imagen、长文档',
  chatgpt: 'System/User、Custom GPT、JSON Mode、DALL·E',
  claude: 'XML 标签、Artifacts、Projects、思维链',
  deepseek: 'R1 推理、代码、JSON、数学证明',
  qwen: '通义系统提示、小红书、万相、多轮对话',
  doubao: '短视频脚本、电商带货、Seedream、直播',
  general: '角色扮演、CoT、Few-shot、格式约束等',
};

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<AIPlatform>('grok');
  const [subcategory, setSubcategory] = useState<TemplateSubcategory | 'all'>('all');
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchScope, setSearchScope] = useState<'all' | AIPlatform>('all');
  const [selected, setSelected] = useState<PromptTemplate | null>(null);

  const isGlobalSearch = globalSearch.trim().length > 0;

  const handleGlobalSearch = (query: string) => {
    setGlobalSearch(query);
    if (query.trim()) {
      setSearchScope('all');
    }
  };

  const matchesQuery = (t: PromptTemplate, q: string) =>
    t.name.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    AI_PLATFORMS[t.category].name.toLowerCase().includes(q);

  const filtered = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();

    if (q) {
      let list = PROMPT_TEMPLATES.filter((t) => matchesQuery(t, q));
      if (searchScope !== 'all') {
        list = list.filter((t) => t.category === searchScope);
      }
      return list;
    }

    let list = PROMPT_TEMPLATES.filter((t) => t.category === platform);
    if (platform === 'general' && subcategory !== 'all') {
      list = list.filter((t) => t.subcategory === subcategory);
    }
    return list;
  }, [platform, subcategory, globalSearch, searchScope]);

  const globalMatchCount = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return 0;
    return PROMPT_TEMPLATES.filter((t) => matchesQuery(t, q)).length;
  }, [globalSearch]);

  const handleUse = (template: PromptTemplate) => {
    const payload = buildTemplatePayload(template);
    setPendingTemplate(payload);
    navigate('/new', { state: { fromTemplate: payload } });
  };

  if (selected) {
    return (
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => setSelected(null)}
          className="text-sm text-terracotta hover:text-terracotta-deep mb-4 cursor-pointer"
        >
          ← 返回模板列表
        </button>
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{selected.icon}</span>
            <div>
              <PlatformChip platform={selected.category} size="sm" />
              <h2 className="text-xl font-bold text-espresso mt-1">{selected.name}</h2>
              <p className="text-sm text-espresso-soft">{selected.description}</p>
            </div>
          </div>
          <div className="bg-terracotta/10 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-terracotta-deep mb-2">💡 使用技巧</h3>
            <ul className="text-sm text-terracotta space-y-1">
              {selected.tips.map((tip, i) => (
                <li key={i}>• {tip}</li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-sage-light mb-4">{selected.variables.length} 个变量</p>
          <button onClick={() => handleUse(selected)} className="btn-primary">
            <Sparkles className="w-4 h-4" />
            套用到编辑器（已含格式）
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col min-h-0 lg:h-[calc(100vh-7.5rem)]">
      <div className="mb-4 flex-shrink-0 space-y-4">
        <PageHeader
          eyebrow="模板库"
          title="AI 提示词模板库"
          description={`共 ${PROMPT_TEMPLATES.length} 个模板 · 按 AI 平台分类（Grok 独立分支）`}
        />
        <SearchBar
          onSearch={handleGlobalSearch}
          placeholder="搜索全部模板（名称、简介、平台）..."
        />
        {isGlobalSearch && (
          <p className="text-xs text-sage-light px-1">
            全库 {globalMatchCount} 个匹配
            {searchScope !== 'all' && (
              <span> · 已缩小至 {AI_PLATFORMS[searchScope].name}（{filtered.length} 个）</span>
            )}
            {searchScope === 'all' && (
              <span className="text-sage-light/80"> · 点左侧平台可缩小范围</span>
            )}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
        {/* 左侧：AI 平台 — 独立滚动 */}
        <div className="lg:col-span-1 flex flex-col min-h-0 max-h-48 lg:max-h-none">
          <p className="text-xs font-semibold text-espresso-soft uppercase tracking-wide px-1 mb-2 flex-shrink-0">
            选择 AI 平台
          </p>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 overscroll-contain pr-0.5">
          {PLATFORM_ORDER.map((key) => {
            const cat = AI_PLATFORMS[key];
            const active = isGlobalSearch ? searchScope === key : platform === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setPlatform(key);
                  setSubcategory('all');
                  if (isGlobalSearch) setSearchScope(key);
                }}
                className={`w-full text-left p-3 rounded-xl border-2 transition-all cursor-pointer ${
                  active
                    ? 'border-terracotta bg-terracotta/10 shadow-sm'
                    : 'border-espresso/10 bg-paper hover:border-terracotta/20 hover:bg-cream'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2.5 text-base font-semibold text-espresso min-w-0">
                    <AIPlatformIcon platform={key} size={28} />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <span className="text-xs text-sage-light flex-shrink-0">{PLATFORM_TEMPLATE_COUNTS[key]}</span>
                </div>
                <p className="text-xs text-espresso-soft mt-1 line-clamp-2">{PLATFORM_DESC[key]}</p>
              </button>
            );
          })}
          </div>
        </div>

        {/* 右侧：模板列表 — 独立滚动 */}
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <div className="card p-4 flex flex-col flex-1 min-h-0">
            <div className="flex items-center gap-2 mb-4 flex-shrink-0">
              {isGlobalSearch ? (
                <span className="text-sm font-medium text-espresso">全库搜索结果</span>
              ) : (
                <PlatformChip platform={platform} />
              )}
              <span className="text-sm text-sage-light">{filtered.length} 个模板</span>
            </div>

            {!isGlobalSearch && platform === 'general' && (
              <div className="flex flex-wrap gap-1.5 mb-3 flex-shrink-0">
                <button
                  onClick={() => setSubcategory('all')}
                  className={`px-2.5 py-1 text-xs rounded-lg cursor-pointer ${
                    subcategory === 'all' ? 'bg-slate-200 text-slate-800' : 'bg-paper text-espresso-soft'
                  }`}
                >
                  全部
                </button>
                {(Object.entries(GENERAL_SUBCATEGORIES) as [TemplateSubcategory, typeof GENERAL_SUBCATEGORIES[TemplateSubcategory]][]).map(
                  ([key, sub]) => (
                    <button
                      key={key}
                      onClick={() => setSubcategory(key)}
                      className={`px-2.5 py-1 text-xs rounded-lg cursor-pointer ${
                        subcategory === key ? 'bg-slate-200 text-slate-800' : 'bg-paper text-espresso-soft'
                      }`}
                    >
                      {sub.icon} {sub.name}
                    </button>
                  )
                )}
              </div>
            )}

            <div className="space-y-2 flex-1 min-h-0 overflow-y-auto overscroll-contain">
              {filtered.length === 0 ? (
                <p className="text-sm text-sage-light text-center py-8">没有匹配的模板</p>
              ) : (
                filtered.map((t) => {
                  const sub = t.subcategory ? GENERAL_SUBCATEGORIES[t.subcategory] : null;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelected(t)}
                      className="w-full text-left p-4 rounded-xl border border-espresso/10 hover:border-terracotta/25 hover:bg-terracotta/10 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{t.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-espresso">{t.name}</span>
                            <ChevronRight className="w-4 h-4 text-sage-light group-hover:text-terracotta" />
                          </div>
                          <p className="text-sm text-espresso-soft mt-0.5">{t.description}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-sage-light flex-wrap">
                            {isGlobalSearch && <PlatformChip platform={t.category} size="sm" />}
                            {sub && <span>{sub.icon} {sub.name}</span>}
                            <span>{t.variables.length} 个变量</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}