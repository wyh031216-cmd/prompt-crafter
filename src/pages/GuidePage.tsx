import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  detectProfile,
  getDefaultAnswer,
  getVisibleQuestions,
  calcPrecision,
  generatePromptResult,
  REFINE_PATCHES,
  PROFILES,
  DEFAULT_PROFILE,
  type Profile,
  type GeneratedResult,
  type RefinePatch,
  type Question,
  buildFullText,
  applyRefinePatches,
  stripRefinePatches,
  buildInitialAnswers,
} from '../profiles';
import { loadGuideHistory, saveGuideHistory, type GuideHistoryEntry } from '../utils/guideHistory';
import { repo } from '../data';
import type { Folder } from '../types/prompt';
import {
  ArrowRight,
  Copy,
  Check,
  RotateCcw,
  Save,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  FolderInput,
  X,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import GuideStepProgress from '../components/GuideStepProgress';
import { markOnboardingStep } from '../utils/onboarding';
import { getModalityFromProfileId } from '../utils/promptModality';
import { clearGuideDraft, getGuideDraft, saveGuideDraft } from '../utils/guideDraftStore';
import { parseGuideVideoOutput } from '../utils/guideVideoShots';
import GuideVideoShots from '../components/GuideVideoShots';

const EXAMPLE_GROUPS = [
  {
    label: '图像 / 视频',
    items: [
      '生成一张男性角色三视图，用于游戏角色设计',
      '生成一张赛博朋克风格城市夜景插画，16:9 横版',
      '生成一段 15 秒的产品宣传短视频，突出产品质感与使用场景',
    ],
  },
  {
    label: '文案 / 营销',
    items: [
      '写一条小红书种草文案，推广一款敏感肌可用的保湿面霜',
      '为 B2B SaaS 产品写一封冷启动推广邮件，语气专业但不生硬',
    ],
  },
  {
    label: '代码 / 效率',
    items: [
      '帮我写一个 Python 脚本，批量把文件夹里的 PNG 转成 WebP',
      '把这段模糊需求整理成给 AI 的清晰任务说明，分步骤输出',
    ],
  },
];

type Step = 1 | 2 | 3;

const ALL_PROFILES = PROFILES as Profile[];

function getProfileById(id: string): Profile {
  return ALL_PROFILES.find((p) => p.id === id) ?? (DEFAULT_PROFILE as Profile);
}

export default function GuidePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [description, setDescription] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [baseResult, setBaseResult] = useState<GeneratedResult | null>(null);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [appliedRefines, setAppliedRefines] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [history, setHistory] = useState<GuideHistoryEntry[]>(() => loadGuideHistory());
  const [recentOpen, setRecentOpen] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveFolderId, setSaveFolderId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);


  const visibleQuestions = useMemo((): Question[] => {
    if (!profile) return [];
    return getVisibleQuestions(profile, answers) as Question[];
  }, [profile, answers]);

  const precision = useMemo(() => {
    if (!profile) return 0;
    return result?.precision ?? calcPrecision(profile, answers);
  }, [profile, answers, result]);

  const refinePatches: RefinePatch[] = useMemo(() => {
    const pid = profile?.id || 'general';
    return (REFINE_PATCHES as Record<string, RefinePatch[]>)[pid] || REFINE_PATCHES.general;
  }, [profile]);

  const videoParsed = useMemo(() => {
    if (profile?.id !== 'video' || !result?.positive) return null;
    const parsed = parseGuideVideoOutput(result.positive);
    return parsed.hasShots ? parsed : null;
  }, [profile?.id, result?.positive]);

  const getBaseResult = useCallback((): GeneratedResult | null => {
    if (baseResult) return baseResult;
    if (!result) return null;
    return {
      ...result,
      positive: stripRefinePatches(result.positive, appliedRefines, refinePatches),
      full: stripRefinePatches(result.full, appliedRefines, refinePatches),
    };
  }, [baseResult, result, appliedRefines, refinePatches]);

  useEffect(() => {
    if (step === 3 && result && !baseResult) {
      setBaseResult({
        ...result,
        positive: stripRefinePatches(result.positive, appliedRefines, refinePatches),
        full: stripRefinePatches(result.full, appliedRefines, refinePatches),
      });
    }
  }, [step, result, baseResult, appliedRefines, refinePatches]);

  useEffect(() => {
    markOnboardingStep('guideVisited');
    const draft = getGuideDraft();
    if (draft?.description) {
      setDescription(draft.description);
      if (draft.step >= 2 && draft.profileId) {
        const p = getProfileById(draft.profileId);
        setProfile(p);
        setAnswers(draft.answers);
        setStep(draft.step === 3 ? 2 : draft.step);
      }
    }
  }, []);

  useEffect(() => {
    if (step === 1 && !description.trim()) return;
    saveGuideDraft({
      step: step === 3 ? 2 : step,
      description,
      profileId: profile?.id ?? null,
      answers,
    });
  }, [step, description, profile, answers]);

  useEffect(() => {
    if (!showSaveModal) return;
    repo.getAllFolders().then(setFolders);
  }, [showSaveModal]);

  const handleAnalyze = useCallback(() => {
    const desc = description.trim();
    if (!desc) return;
    const p = detectProfile(desc) as Profile;
    setProfile(p);
    setAnswers(buildInitialAnswers(p, desc));
    setBaseResult(null);
    setResult(null);
    setAppliedRefines([]);
    setStep(2);
  }, [description]);

  const handleProfileChange = useCallback((profileId: string) => {
    const desc = description.trim();
    const p = getProfileById(profileId);
    setProfile(p);
    setAnswers(buildInitialAnswers(p, desc));
    setBaseResult(null);
    setResult(null);
    setAppliedRefines([]);
  }, [description]);

  const handleGenerate = useCallback(() => {
    if (!profile) return;
    const missing = visibleQuestions.filter(
      (q: Question) => q.required && q.type === 'text' && !(answers[q.id] as string)?.trim?.()
    );
    if (missing.length) {
      setValidationErrors(missing.map((q: Question) => q.id));
      return;
    }
    setValidationErrors([]);
    const gen = generatePromptResult(description, profile, answers) as GeneratedResult;
    setBaseResult(gen);
    setResult(gen);
    setAppliedRefines([]);
    setStep(3);

    const entry: GuideHistoryEntry = {
      id: Date.now().toString(),
      title: description.slice(0, 40) + (description.length > 40 ? '…' : ''),
      description,
      profileId: profile.id,
      profileLabel: profile.label,
      answers: { ...answers },
      results: { positive: gen.positive, negative: gen.negative, full: gen.full },
      appliedRefines: [],
      precision: gen.precision,
      savedAt: new Date().toISOString(),
    };
    saveGuideHistory(entry);
    setHistory(loadGuideHistory());
  }, [profile, description, answers, visibleQuestions]);

  const syncBaseFromEdits = (positive: string, negative: string) => {
    const full = buildFullText(positive, negative);
    const nextBase: GeneratedResult = {
      positive,
      negative,
      full,
      precision: result?.precision ?? 0,
      grokTip: result?.grokTip,
    };
    setBaseResult(nextBase);
    setAppliedRefines([]);
    setResult(nextBase);
  };

  const toggleRefine = (patchId: string) => {
    const base = getBaseResult();
    if (!base) return;
    const next = appliedRefines.includes(patchId)
      ? appliedRefines.filter((id) => id !== patchId)
      : [...appliedRefines, patchId];
    setAppliedRefines(next);
    setResult(applyRefinePatches(base, next, refinePatches));
  };

  const clearAllRefines = () => {
    const base = getBaseResult();
    if (!base) return;
    setAppliedRefines([]);
    setResult({ ...base });
  };

  const updatePositive = (positive: string) => {
    if (!result) return;
    syncBaseFromEdits(positive, result.negative);
  };

  const updateNegative = (negative: string) => {
    if (!result) return;
    syncBaseFromEdits(result.positive, negative);
  };

  const copyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const openSaveModal = () => {
    if (!result) return;
    setSaveTitle(description.slice(0, 50) || profile?.label || '引导生成');
    setSaveFolderId(null);
    setShowSaveModal(true);
  };

  const confirmSave = async () => {
    if (!result || !saveTitle.trim()) {
      alert('请输入标题');
      return;
    }
    setSaving(true);
    try {
      const profileId = profile?.id || 'general';
      const modality = getModalityFromProfileId(profileId);
      const promptTags = [
        'guided',
        `profile:${profileId}`,
        `modality:${modality}`,
        ...(profile?.label ? [profile.label] : []),
      ];
      const platform = answers.platform;
      if (typeof platform === 'string' && platform) {
        promptTags.push(`platform:${platform}`);
      }

      const created = await repo.createPrompt({
        title: saveTitle.trim(),
        content: result.full,
        variables: [],
        tags: promptTags,
        folderId: saveFolderId,
      });
      markOnboardingStep('promptSaved');
      clearGuideDraft();
      setShowSaveModal(false);
      navigate(`/edit/${created.id}`, {
        replace: true,
        state: { fromGuide: true, openRun: true },
      });
    } finally {
      setSaving(false);
    }
  };

  const loadHistoryEntry = (entry: GuideHistoryEntry) => {
    setDescription(entry.description);
    const p = getProfileById(entry.profileId);
    setProfile(p);
    setAnswers(entry.answers);
    const patches =
      (REFINE_PATCHES as Record<string, RefinePatch[]>)[entry.profileId] || REFINE_PATCHES.general;
    const refineIds = entry.appliedRefines || [];
    const base: GeneratedResult = {
      positive: stripRefinePatches(entry.results.positive, refineIds, patches),
      negative: entry.results.negative,
      full: stripRefinePatches(entry.results.full, refineIds, patches),
      precision: entry.precision,
    };
    setBaseResult(base);
    setResult({
      positive: entry.results.positive,
      negative: entry.results.negative,
      full: entry.results.full,
      precision: entry.precision,
    });
    setAppliedRefines(refineIds);
    setStep(entry.results ? 3 : 2);
  };

  const reset = () => {
    setStep(1);
    setDescription('');
    setProfile(null);
    setAnswers({});
    setBaseResult(null);
    setResult(null);
    setAppliedRefines([]);
    setShowSaveModal(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        eyebrow="引导生成"
        title="引导式生成"
        description="描述需求 → 确认场景与选项 → 生成提示词 → 保存后进编辑器试运行"
      />

      <GuideStepProgress step={step} />

      {/* Step 1 */}
      {step === 1 && (
        <div className="card p-4 space-y-4">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full text-sm border border-espresso/10 rounded-lg p-3 focus:outline-none focus:border-terracotta"
            placeholder="描述你想生成的内容…"
          />
          <div className="space-y-3">
            <span className="text-xs text-sage-light">不知道从哪开始？点一个示例：</span>
            {EXAMPLE_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-semibold text-sage-light uppercase tracking-wider mb-1.5">
                  {group.label}
                </p>
                <div className="flex flex-col gap-1.5">
                  {group.items.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setDescription(ex)}
                      className={`text-left px-3 py-2 text-xs rounded-lg border transition-colors cursor-pointer ${
                        description === ex
                          ? 'bg-terracotta/10 border-terracotta/30 text-terracotta-deep'
                          : 'bg-paper border-espresso/10 text-espresso-soft hover:border-terracotta/25 hover:bg-cream'
                      }`}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {history.length > 0 && (
            <div className="border border-espresso/8 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setRecentOpen((v) => !v)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-espresso-soft hover:bg-cream cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="flex-1 text-left">最近生成 ({history.length})</span>
                {recentOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {recentOpen && (
                <div className="border-t border-espresso/8 max-h-36 overflow-y-auto overscroll-contain">
                  {history.slice(0, 8).map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => loadHistoryEntry(h)}
                      className="w-full min-w-0 text-left px-3 py-2 hover:bg-cream text-sm cursor-pointer border-b border-espresso/5 last:border-0"
                    >
                      <div className="truncate text-espresso">{h.title}</div>
                      <div className="text-xs text-sage-light truncate mt-0.5">
                        {h.profileLabel} · 填写完整度 {h.precision}%
                      </div>
                      {h.results?.full && (
                        <div className="text-[10px] text-espresso-soft font-mono line-clamp-2 mt-1 leading-relaxed">
                          {h.results.full.slice(0, 120)}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!description.trim()}
            className="btn-primary btn-lg w-full justify-center"
          >
            分析并生成问题 <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && profile && (
        <div className="card p-4 space-y-4">
          <div className="p-3 bg-terracotta/10 rounded-lg space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl">{profile.icon}</span>
              <span className="text-sm">
                识别为：<strong>{profile.label}</strong>
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                precision >= 80 ? 'bg-green-100 text-green-700' : precision >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
              }`}>
                填写完整度 {precision}%
              </span>
            </div>
            <div className="rounded-lg border border-terracotta/25 bg-paper/80 p-2.5">
              <label htmlFor="guide-profile-pick" className="block text-xs font-medium text-espresso mb-1.5">
                场景不对？手动切换
              </label>
              <select
                id="guide-profile-pick"
                value={profile.id}
                onChange={(e) => handleProfileChange(e.target.value)}
                className="w-full text-sm border border-espresso/10 rounded-lg px-2 py-2 bg-paper focus:outline-none focus:border-terracotta cursor-pointer"
              >
                {ALL_PROFILES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icon} {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {validationErrors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              请填写必填项后再生成
            </div>
          )}

          <div className="space-y-4">
            {visibleQuestions.map((q: Question, idx: number) => (
              <div key={`${q.id}-${idx}`}>
                <label className="text-sm font-medium text-espresso">
                  {idx + 1}. {q.label}
                  {q.required && <span className="text-red-400 ml-1">*</span>}
                </label>
                {q.hint && <p className="text-xs text-amber-600 mt-0.5">{q.hint}</p>}
                {q.type === 'text' ? (
                  <input
                    type="text"
                    value={(answers[q.id] as string) || ''}
                    onChange={(e) => {
                      setAnswers({ ...answers, [q.id]: e.target.value });
                      if (validationErrors.includes(q.id)) {
                        setValidationErrors((prev) => prev.filter((id) => id !== q.id));
                      }
                    }}
                    placeholder={q.placeholder}
                    className={`mt-1 w-full text-sm border rounded-lg px-3 py-2 ${
                      validationErrors.includes(q.id)
                        ? 'border-red-300 bg-red-50/50 focus:border-red-400'
                        : 'border-espresso/10'
                    }`}
                  />
                ) : (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {q.options?.map((opt: { value: string; label: string }) => {
                      const isMulti = q.type === 'multi';
                      const selected = isMulti
                        ? ((answers[q.id] as string[]) || []).includes(opt.value)
                        : answers[q.id] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            if (isMulti) {
                              const cur = (answers[q.id] as string[]) || [];
                              setAnswers({
                                ...answers,
                                [q.id]: cur.includes(opt.value)
                                  ? cur.filter((v) => v !== opt.value)
                                  : [...cur, opt.value],
                              });
                            } else {
                              const next = { ...answers, [q.id]: opt.value };
                              if (q.id === 'type' && profile) {
                                ['length_academic', 'length_business', 'length_marketing', 'length_general'].forEach((k) => {
                                  delete next[k];
                                });
                                (getVisibleQuestions(profile, next) as Question[]).forEach((vq) => {
                                  if (/^length_/.test(vq.id)) {
                                    next[vq.id] = getDefaultAnswer(vq, description);
                                  }
                                });
                              }
                              setAnswers(next);
                            }
                          }}
                          className={`px-3 py-1.5 text-xs rounded-lg border cursor-pointer transition-colors ${
                            selected
                              ? 'bg-espresso text-cream border-espresso'
                              : 'bg-paper text-espresso-soft border-espresso/10 hover:border-terracotta/25'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setStep(1)} className="btn-secondary">← 修改描述</button>
            <button type="button" onClick={handleGenerate} className="btn-primary flex-1 justify-center">
              生成提示词 <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && result && (
        <div className="space-y-4">
          {result.grokTip && (
            <div className="card p-3 bg-amber-50 border-amber-200 text-xs text-amber-800">
              <span className="font-semibold">平台提示 · </span>
              {result.grokTip}
            </div>
          )}

          {videoParsed && (
            <GuideVideoShots
              parsed={videoParsed}
              copiedKey={copied}
              onCopy={copyText}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">正向提示词</h3>
                <button type="button" onClick={() => copyText(result.positive, 'pos')} className="btn-ghost text-xs">
                  {copied === 'pos' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <textarea
                value={result.positive}
                onChange={(e) => updatePositive(e.target.value)}
                rows={12}
                className="w-full text-xs font-mono leading-relaxed border border-espresso/10 rounded-lg p-2 focus:outline-none focus:border-terracotta resize-y min-h-[120px] max-h-[40vh] text-espresso"
              />
            </div>
            {result.negative && (
              <div className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">反向约束</h3>
                  <button type="button" onClick={() => copyText(result.negative, 'neg')} className="btn-ghost text-xs">
                    {copied === 'neg' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <textarea
                  value={result.negative}
                  onChange={(e) => updateNegative(e.target.value)}
                  rows={12}
                  className="w-full text-xs font-mono leading-relaxed border border-espresso/10 rounded-lg p-2 focus:outline-none focus:border-terracotta resize-y min-h-[120px] max-h-[40vh] text-espresso-soft"
                />
              </div>
            )}
          </div>

          {refinePatches.length > 0 && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">生成不理想？一键追加约束</h3>
                {appliedRefines.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllRefines}
                    className="text-xs text-orange-600 hover:text-orange-800 cursor-pointer"
                  >
                    撤销全部约束
                  </button>
                )}
              </div>
              <p className="text-xs text-sage-light mb-2">已追加的约束可再次点击撤回</p>
              <div className="flex flex-wrap gap-2">
                {refinePatches.map((p) => {
                  const applied = appliedRefines.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleRefine(p.id)}
                      className={`px-3 py-1.5 text-xs rounded-full border cursor-pointer transition-colors ${
                        applied
                          ? 'bg-green-50 border-green-400 text-green-800 hover:bg-green-100'
                          : 'bg-paper border-espresso/10 hover:border-terracotta/25'
                      }`}
                    >
                      {applied ? '✓ ' : ''}{p.label}
                      {applied ? ' · 点击撤回' : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="card p-4 border-terracotta/20 bg-terracotta/5">
            <h3 className="text-sm font-semibold text-espresso mb-2">满意了？完成这三步</h3>
            <ol className="text-xs text-espresso-soft space-y-1 mb-3 list-decimal pl-4 leading-relaxed">
              <li>点击「保存到词库」—— 自动进入编辑器</li>
              <li>在编辑器继续修改、添加变量</li>
              <li>
                {profile && getModalityFromProfileId(profile.id) === 'text'
                  ? '打开右侧「试运行」，用 API 测试文本效果'
                  : profile && getModalityFromProfileId(profile.id) === 'video'
                    ? videoParsed
                      ? '在上方单镜卡片逐条复制到 Grok；保存后编辑器侧栏同样可逐镜复制'
                      : '打开右侧面板，复制提示词到视频生成平台'
                    : '打开右侧面板，复制提示词到图像平台出图（文本 API 无法直接出图）'}
              </li>
            </ol>
            <button type="button" onClick={openSaveModal} className="btn-primary w-full sm:w-auto justify-center">
              <Save className="w-4 h-4" /> 保存到词库并继续编辑
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => copyText(result.full, 'full')} className="btn-secondary">
              {copied === 'full' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              复制完整
            </button>
            <button type="button" onClick={openSaveModal} className="btn-secondary">
              <Save className="w-4 h-4" /> 保存到词库
            </button>
            <button type="button" onClick={() => setStep(2)} className="btn-secondary">← 调整选项</button>
            <button type="button" onClick={reset} className="btn-ghost">
              <RotateCcw className="w-4 h-4" /> 重新开始
            </button>
          </div>
        </div>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-paper rounded-xl shadow-xl max-w-md w-full p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-espresso">保存到词库</h3>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="text-sage-light hover:text-espresso cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-espresso-soft mb-1">标题</label>
                <input
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  className="input-field text-sm w-full"
                  placeholder="提示词标题"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-espresso-soft mb-1">文件夹</label>
                <div className="flex items-center gap-2">
                  <FolderInput className="w-3.5 h-3.5 text-sage-light flex-shrink-0" />
                  <select
                    value={saveFolderId ?? ''}
                    onChange={(e) => setSaveFolderId(e.target.value || null)}
                    className="flex-1 text-sm border border-espresso/10 rounded-lg px-2 py-1.5 bg-paper focus:outline-none focus:border-terracotta"
                  >
                    <option value="">未分类</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {profile && (
                <p className="text-xs text-sage-light">
                  来源：引导生成 · {profile.icon} {profile.label}
                </p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowSaveModal(false)} className="btn-secondary text-xs">
                取消
              </button>
              <button type="button" onClick={confirmSave} disabled={saving} className="btn-primary text-xs">
                {saving ? '保存中...' : '确认保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}