import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Save,
  Clock,
  Trash2,
  Download,
  Copy,
  Check,
  ArrowLeft,
  Eye,
  Edit3,
  AlertTriangle,
  X,
  Tag,
  FolderInput,
  Sparkles,
  Layers,
  Hash,
  Lightbulb,
  Play,
  Variable as VarIcon,
} from 'lucide-react';
import { repo, debouncedAutoSave } from '../data';
import {
  getNewDraft,
  getEditDraft,
  saveNewDraft,
  saveEditDraft,
  clearNewDraft,
  clearEditDraft,
  type EditorDraft,
} from '../utils/draftStore';
import { syncVariables, fillVariables, getDefaultVariableValues } from '../utils/variables';
import { buildTemplatePayload } from '../utils/templateApply';
import { exportToMarkdown, exportToClipboard, downloadMarkdown, downloadJSON, exportPromptsToJSON } from '../utils/export';
import type { Prompt, Folder as FolderType } from '../types/prompt';
import { PROMPT_TEMPLATES, type PromptTemplate } from '../utils/templates';
import type { ModelKey } from '../utils/tokenCounter';
import VariablePanel from '../components/VariablePanel';

import TemplatePanel from '../components/TemplatePanel';
import AIAssistant from '../components/AIAssistant';
import TokenCounter from '../components/TokenCounter';
import PromptGuide from '../components/PromptGuide';
import RunPanel from '../components/RunPanel';
import { clearPendingTemplate, getPendingTemplate } from '../utils/templateBridge';
import { markOnboardingStep } from '../utils/onboarding';
import {
  getPromptModality,
  isTextTrialRunnable,
  splitPromptPositiveNegative,
} from '../utils/promptModality';
import ActiveTemplateBar from '../components/ActiveTemplateBar';
import Toast from '../components/Toast';
import { estimateTokens } from '../utils/tokenCounter';
import { isEditorDirty, snapshotFromEditor, type EditorSnapshot } from '../utils/editorDirty';

type SidebarTab = 'variables' | 'templates' | 'ai' | 'run' | 'tokens' | 'guide';

const SIDEBAR_TABS: { key: SidebarTab; label: string; icon: React.ReactNode }[] = [
  { key: 'variables', label: '变量', icon: <VarIcon className="w-3.5 h-3.5" /> },
  { key: 'templates', label: '模板', icon: <Layers className="w-3.5 h-3.5" /> },
  { key: 'ai', label: '优化', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { key: 'run', label: '试运行', icon: <Play className="w-3.5 h-3.5" /> },
  { key: 'tokens', label: 'Token', icon: <Hash className="w-3.5 h-3.5" /> },
  { key: 'guide', label: '指南', icon: <Lightbulb className="w-3.5 h-3.5" /> },
];

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isNew = location.pathname === '/new';
  const templateSeed = isNew ? getPendingTemplate(location.state) : null;

  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [title, setTitle] = useState(() => templateSeed?.title ?? '');
  const [content, setContent] = useState(() => templateSeed?.content ?? '');
  const [variables, setVariables] = useState<Prompt['variables']>(() => templateSeed?.variables ?? []);
  const [tags, setTags] = useState<string[]>(() => templateSeed?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<'source' | 'filled'>('source');
  const [copied, setCopied] = useState(false);
  const [copyChip, setCopyChip] = useState<'full' | 'pos' | 'neg' | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<PromptTemplate | null>(null);
  const [lastSaved, setLastSaved] = useState<EditorSnapshot | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('variables');
  const [highlightRunTab, setHighlightRunTab] = useState(false);
  const [tokenModel, setTokenModel] = useState<ModelKey>('default');
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(
    () => templateSeed?.templateId ?? null,
  );
  const [activeTemplateName, setActiveTemplateName] = useState<string | null>(
    () => templateSeed?.templateName ?? null,
  );
  const [pendingDraft, setPendingDraft] = useState<EditorDraft | null>(null);
  const [showGuideBanner, setShowGuideBanner] = useState(
    () => !!(location.state as { fromGuide?: boolean } | null)?.fromGuide,
  );
  const isEditing = !isNew && prompt !== null;

  const promptModality = useMemo(() => getPromptModality(tags), [tags]);
  const textTrialRunnable = isTextTrialRunnable(promptModality);

  const filledContent = useMemo(
    () => fillVariables(content, getDefaultVariableValues(variables)),
    [content, variables],
  );

  const { positive: promptPositive, negative: promptNegative } = useMemo(
    () => splitPromptPositiveNegative(filledContent),
    [filledContent],
  );

  const currentSnapshot = useMemo(
    () => snapshotFromEditor(title, content, variables, tags, folderId),
    [title, content, variables, tags, folderId],
  );

  const isDirty = useMemo(
    () => isEditorDirty(currentSnapshot, lastSaved, isNew),
    [currentSnapshot, lastSaved, isNew],
  );

  const tokenStats = useMemo(
    () => estimateTokens(content, tokenModel),
    [content, tokenModel],
  );

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2200);
  }, []);

  const activeTemplate = useMemo(() => {
    if (!activeTemplateId) return null;
    return PROMPT_TEMPLATES.find((t) => t.id === activeTemplateId) ?? null;
  }, [activeTemplateId]);

  useEffect(() => {
    if (loading) return;
    const state = location.state as { fromGuide?: boolean; openRun?: boolean } | null;
    if (state?.fromGuide || state?.openRun) {
      setSidebarTab('run');
      setHighlightRunTab(true);
    }
  }, [loading, location.state]);

  useEffect(() => {
    if (!showGuideBanner) return;
    const timer = setTimeout(() => setShowGuideBanner(false), 8000);
    return () => clearTimeout(timer);
  }, [showGuideBanner]);

  const dismissGuideBanner = useCallback(() => setShowGuideBanner(false), []);

  const copyPromptPart = useCallback(async (text: string, key: 'full' | 'pos' | 'neg') => {
    await navigator.clipboard.writeText(text);
    setCopyChip(key);
    dismissGuideBanner();
    setTimeout(() => setCopyChip(null), 2000);
  }, [dismissGuideBanner]);

  useEffect(() => {
    if (!isNew) {
      clearPendingTemplate();
      return;
    }
    if (templateSeed) {
      setTitle(templateSeed.title);
      setContent(templateSeed.content);
      setVariables(templateSeed.variables);
      setTags(templateSeed.tags);
      setActiveTemplateId(templateSeed.templateId ?? null);
      setActiveTemplateName(templateSeed.templateName ?? null);
      setSidebarTab('variables');
    }
  }, [isNew, templateSeed]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const allFolders = await repo.getAllFolders();
      setFolders(allFolders);

      if (!isNew && id) {
        const p = await repo.getPrompt(id);
        if (p) {
          setPrompt(p);
          setTitle(p.title);
          setContent(p.content);
          setVariables(p.variables);
          setTags(p.tags);
          setFolderId(p.folderId);
          setLastSaved(
            snapshotFromEditor(p.title, p.content, p.variables, p.tags, p.folderId),
          );
        } else {
          navigate('/', { replace: true });
          return;
        }
      }
      setLoading(false);
    };
    load();
  }, [id, isNew, navigate]);

  useEffect(() => {
    if (loading) return;
    if (isNew) {
      if (templateSeed) return;
      const draft = getNewDraft();
      if (draft && (draft.title.trim() || draft.content.trim())) {
        setTitle(draft.title);
        setContent(draft.content);
        setVariables(draft.variables);
        setTags(draft.tags);
        setFolderId(draft.folderId);
        setActiveTemplateId(draft.activeTemplateId ?? null);
        setActiveTemplateName(draft.activeTemplateName ?? null);
      }
      return;
    }
    if (id) {
      const draft = getEditDraft(id);
      if (draft && (draft.title.trim() || draft.content.trim())) {
        setPendingDraft(draft);
      }
    }
  }, [loading, isNew, id, templateSeed]);

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      const payload = {
        title,
        content,
        variables,
        tags,
        folderId,
        activeTemplateId,
        activeTemplateName,
      };
      if (isNew) saveNewDraft(payload);
      else if (id) saveEditDraft(id, payload);
    }, 500);
    return () => clearTimeout(timer);
  }, [title, content, variables, tags, folderId, activeTemplateId, activeTemplateName, loading, isNew, id]);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!id || !prompt || loading) return;
    debouncedAutoSave({
      ...prompt,
      title: title.trim() || prompt.title,
      content,
      variables,
      tags,
      folderId,
    });
  }, [id, prompt, title, content, variables, tags, folderId, loading]);

  const applyDraft = useCallback(() => {
    if (!pendingDraft) return;
    setTitle(pendingDraft.title);
    setContent(pendingDraft.content);
    setVariables(pendingDraft.variables);
    setTags(pendingDraft.tags);
    setFolderId(pendingDraft.folderId);
    setActiveTemplateId(pendingDraft.activeTemplateId ?? null);
    setActiveTemplateName(pendingDraft.activeTemplateName ?? null);
    setPendingDraft(null);
  }, [pendingDraft]);

  const dismissDraft = useCallback(() => {
    if (isNew) clearNewDraft();
    else if (id) clearEditDraft(id);
    setPendingDraft(null);
  }, [isNew, id]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setVariables((prev) => syncVariables(newContent, prev));
    dismissGuideBanner();
  }, [dismissGuideBanner]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      alert('请输入提示词标题');
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const created = await repo.createPrompt({
          title: title.trim(),
          content,
          variables,
          tags,
          folderId,
        });
        clearNewDraft();
        setPendingDraft(null);
        navigate(`/edit/${created.id}`, { replace: true });
      } else if (id) {
        const trimmedTitle = title.trim();
        await repo.updatePrompt(id, {
          title: trimmedTitle,
          content,
          variables,
          tags,
          folderId,
        });
        await repo.createVersion(id, content, variables, '手动保存');
        setPrompt((prev) => prev ? { ...prev, title: trimmedTitle, content, variables, tags, folderId, updatedAt: Date.now() } : prev);
        setLastSaved(snapshotFromEditor(trimmedTitle, content, variables, tags, folderId));
        clearEditDraft(id);
        setPendingDraft(null);
        showToast('已保存');
      }
    } finally {
      setSaving(false);
    }
  }, [title, content, variables, tags, folderId, isNew, id, navigate, showToast]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSave]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    await repo.deletePrompt(id);
    navigate('/', { replace: true });
  }, [id, navigate]);

  const handleCopy = useCallback(() => {
    const text = exportToClipboard(
      { id: id || '', title, content, variables, tags, folderId, createdAt: 0, updatedAt: Date.now() },
      Object.fromEntries(variables.map((v) => [v.name, v.defaultValue]))
    );
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      showToast('已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    });
  }, [id, title, content, variables, tags, folderId, showToast]);

  const handleExportMarkdown = useCallback(() => {
    const p = prompt || { id: '', title, content, variables, tags, folderId, createdAt: 0, updatedAt: Date.now() };
    const md = exportToMarkdown(p);
    downloadMarkdown(md, `${title}.md`);
  }, [prompt, title, content, variables, tags, folderId]);

  const handleExportJSON = useCallback(() => {
    const p = prompt || { id: '', title, content, variables, tags, folderId, createdAt: 0, updatedAt: Date.now() };
    const json = exportPromptsToJSON([p]);
    downloadJSON(json, `${title}.json`);
  }, [prompt, title, content, variables, tags, folderId]);

  const applyTemplate = useCallback((template: PromptTemplate) => {
    const payload = buildTemplatePayload(template);
    setContent(payload.content);
    setVariables(payload.variables);
    setActiveTemplateId(template.id);
    setActiveTemplateName(template.name);
    setSidebarTab('variables');
    setPendingTemplate(null);
  }, []);

  const handleSelectTemplate = useCallback((template: PromptTemplate) => {
    if (content.trim()) {
      setPendingTemplate(template);
      return;
    }
    applyTemplate(template);
  }, [content, applyTemplate]);

  const handleAIApply = useCallback((text: string) => {
    setContent(text);
    setVariables((prev) => syncVariables(text, prev));
  }, []);

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const ta = e.currentTarget;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const next = `${content.slice(0, start)}  ${content.slice(end)}`;
    handleContentChange(next);
    requestAnimationFrame(() => {
      ta.selectionStart = start + 2;
      ta.selectionEnd = start + 2;
    });
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput('');
  };

  const hasVariables = variables.length > 0;

  const previewMarkdown = useMemo(() => {
    if (!showPreview) return '';
    if (previewMode === 'filled' && hasVariables) return filledContent;
    return content || '*暂无内容*';
  }, [showPreview, previewMode, hasVariables, filledContent, content]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center text-sage-light">
        <div className="animate-spin w-6 h-6 border-2 border-terracotta border-t-transparent rounded-full mx-auto mb-2" />
        加载中...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 max-w-7xl mx-auto w-full">
      {/* 顶栏：一行完成导航、标题、归类与保存 */}
      <div className="flex-shrink-0 mb-3 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => navigate('/')} className="btn-ghost flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">返回</span>
          </button>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 min-w-[10rem] text-base lg:text-lg font-bold text-espresso bg-paper/80 border border-espresso/10 rounded-full px-4 py-2 outline-none focus:border-terracotta placeholder:text-sage-light"
            placeholder="提示词标题..."
          />

          <div className="flex items-center gap-1.5 text-sm text-espresso-soft flex-shrink-0">
            <FolderInput className="w-3.5 h-3.5" />
            <select
              value={folderId ?? ''}
              onChange={(e) => setFolderId(e.target.value || null)}
              className="text-xs border border-espresso/10 rounded-lg px-2 py-1.5 bg-paper focus:outline-none focus:border-terracotta"
            >
              <option value="">未分类</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <span
            className={`text-xs flex-shrink-0 hidden sm:inline ${
              isDirty ? 'text-amber-700' : 'text-sage-light'
            }`}
          >
            {isDirty ? '● 未保存' : '已保存'}
          </span>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex-shrink-0 text-xs ${
              isDirty ? 'btn-primary ring-2 ring-amber-300/60' : 'btn-primary opacity-90'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? '保存中...' : isNew ? '创建' : '保存'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 min-h-[1.25rem]">
          {activeTemplate && (
            <ActiveTemplateBar
              platform={activeTemplate.category}
              templateName={activeTemplateName ?? activeTemplate.name}
            />
          )}
          <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
            <Tag className="w-3 h-3 text-sage-light flex-shrink-0" />
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-terracotta/10 text-terracotta-deep rounded-full text-xs">
                {tag}
                <button onClick={() => setTags(tags.filter((t) => t !== tag))} className="hover:text-red-500 cursor-pointer">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); addTag(); }
                if (e.key === ',' || e.key === '，') { e.preventDefault(); addTag(); }
              }}
              className="text-xs border-none outline-none bg-transparent px-1 py-0.5 min-w-[8rem] max-w-[14rem]"
              placeholder="标签..."
            />
          </div>
        </div>

        {showGuideBanner && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-xs text-green-800">
            <div>
              <p className="font-medium text-green-900">已存入词库</p>
              <p className="mt-0.5 text-green-700">
                {textTrialRunnable
                  ? '右侧「试运行」已展开，配置 API 后可直接测试文本效果。'
                  : '这是图像/视频类提示词：右侧可复制到 Midjourney、Grok Imagine 等平台出图。DeepSeek 等文本 API 无法直接生成图片。'}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSidebarTab('run');
                  setHighlightRunTab(true);
                  dismissGuideBanner();
                }}
                className="btn-primary text-xs"
              >
                <Play className="w-3.5 h-3.5" />
                {textTrialRunnable ? '去试运行' : '去复制使用'}
              </button>
              <button
                type="button"
                onClick={dismissGuideBanner}
                className="text-green-700 cursor-pointer hover:underline"
              >
                知道了
              </button>
            </div>
          </div>
        )}

        {pendingDraft && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <span>发现未保存草稿（{new Date(pendingDraft.savedAt).toLocaleString('zh-CN')}）</span>
            <div className="flex gap-2">
              <button type="button" onClick={applyDraft} className="text-terracotta-deep font-medium cursor-pointer hover:underline">
                恢复
              </button>
              <button type="button" onClick={dismissDraft} className="text-espresso-soft cursor-pointer hover:underline">
                丢弃
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 工作台：左稿右具，统一边框 */}
      <div className="flex-1 min-h-0 bezel-outer">
        <div className="bezel-inner h-full flex flex-col min-h-0 overflow-hidden">
          <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
            {/* 左：模板原文 */}
            <div className="flex-[3] min-w-0 flex flex-col min-h-[14rem] lg:min-h-0 border-b lg:border-b-0 lg:border-r border-espresso/8">
              <div className="flex items-center gap-1 px-3 py-2 border-b border-espresso/8 bg-cream/40 flex-shrink-0">
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-sage-light mr-1">
                  模板原文
                </span>
                <button
                  onClick={() => setShowPreview(false)}
                  className={`px-2 py-0.5 text-xs rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                    !showPreview
                      ? 'bg-paper text-terracotta-deep shadow-sm border border-espresso/10'
                      : 'text-espresso-soft hover:text-espresso'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  编辑
                </button>
                <button
                  onClick={() => {
                    setShowPreview(true);
                    if (hasVariables) setPreviewMode('filled');
                  }}
                  className={`px-2 py-0.5 text-xs rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                    showPreview
                      ? 'bg-paper text-terracotta-deep shadow-sm border border-espresso/10'
                      : 'text-espresso-soft hover:text-espresso'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  预览
                </button>
                {showPreview && hasVariables && (
                  <>
                    <button
                      type="button"
                      onClick={() => setPreviewMode('source')}
                      className={`px-2 py-0.5 text-xs rounded-md transition-colors cursor-pointer ${
                        previewMode === 'source'
                          ? 'bg-cream text-espresso font-medium border border-espresso/10'
                          : 'text-sage-light hover:text-espresso-soft'
                      }`}
                    >
                      原文
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode('filled')}
                      className={`px-2 py-0.5 text-xs rounded-md transition-colors cursor-pointer ${
                        previewMode === 'filled'
                          ? 'bg-cream text-espresso font-medium border border-espresso/10'
                          : 'text-sage-light hover:text-espresso-soft'
                      }`}
                    >
                      成稿
                    </button>
                  </>
                )}
                {!textTrialRunnable && (
                  <div className="flex items-center gap-1 ml-1 border-l border-espresso/10 pl-2">
                    <button
                      type="button"
                      onClick={() => copyPromptPart(filledContent, 'full')}
                      className="px-2 py-0.5 text-xs rounded-md border border-espresso/10 bg-paper hover:border-terracotta/30 cursor-pointer flex items-center gap-1 text-espresso-soft hover:text-terracotta-deep"
                    >
                      {copyChip === 'full' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      完整
                    </button>
                    <button
                      type="button"
                      onClick={() => copyPromptPart(promptPositive, 'pos')}
                      className="px-2 py-0.5 text-xs rounded-md border border-espresso/10 bg-paper hover:border-terracotta/30 cursor-pointer flex items-center gap-1 text-espresso-soft hover:text-terracotta-deep"
                    >
                      {copyChip === 'pos' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      正向
                    </button>
                    {promptNegative && (
                      <button
                        type="button"
                        onClick={() => copyPromptPart(promptNegative, 'neg')}
                        className="px-2 py-0.5 text-xs rounded-md border border-espresso/10 bg-paper hover:border-terracotta/30 cursor-pointer flex items-center gap-1 text-espresso-soft hover:text-terracotta-deep"
                      >
                        {copyChip === 'neg' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        反向
                      </button>
                    )}
                  </div>
                )}
                <span className="text-xs text-sage-light ml-auto">{content.length} 字符</span>
              </div>

              {showPreview ? (
                <div className="p-4 markdown-preview flex-1 min-h-0 overflow-y-auto overscroll-contain">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{previewMarkdown}</ReactMarkdown>
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                onFocus={dismissGuideBanner}
                onKeyDown={handleTextareaKeyDown}
                className="w-full flex-1 min-h-0 p-4 text-sm font-mono leading-relaxed border-none outline-none resize-none overflow-y-auto overscroll-contain bg-paper focus:bg-cream/30 transition-colors"
                  placeholder="在此编写提示词...&#10;&#10;使用 {{变量名}} 来定义模板变量&#10;支持 Markdown 格式"
                />
              )}
            </div>

            {/* 右：工具面板 */}
            <div className="flex-[2] min-w-0 flex flex-col min-h-[16rem] lg:min-h-0">
              <div className="flex border-b border-espresso/8 bg-cream/40 flex-shrink-0">
                {SIDEBAR_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setSidebarTab(tab.key);
                      if (tab.key === 'run') setHighlightRunTab(false);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1 px-1.5 py-2 text-xs font-medium transition-colors cursor-pointer border-b-2 ${
                      sidebarTab === tab.key
                        ? 'text-terracotta border-terracotta bg-terracotta/10'
                        : 'text-espresso-soft border-transparent hover:text-espresso hover:bg-cream/60'
                    } ${tab.key === 'run' && highlightRunTab ? 'ring-2 ring-inset ring-terracotta/40 animate-pulse' : ''}`}
                    title={tab.label}
                  >
                    {tab.icon}
                    <span className="hidden md:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex-1 min-h-0 overflow-hidden flex flex-col p-3" data-vc-ignore>
                {sidebarTab === 'variables' && (
                  <div className="flex flex-col flex-1 min-h-0">
                    <VariablePanel variables={variables} onChange={setVariables} />
                    {hasVariables && (
                      <p className="text-[10px] text-sage-light mt-2 flex-shrink-0">
                        填充后的成稿请在左侧「预览 → 成稿」查看
                      </p>
                    )}
                  </div>
                )}

                {sidebarTab === 'templates' && (
                  <TemplatePanel
                    activeTemplateId={activeTemplateId}
                    onSelectTemplate={handleSelectTemplate}
                    fillHeight
                  />
                )}

            {sidebarTab === 'ai' && (
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                <AIAssistant
                  content={content}
                  templateId={activeTemplateId}
                  templateName={activeTemplateName}
                  onApplyResult={handleAIApply}
                />
              </div>
            )}

            {sidebarTab === 'run' && (
              <RunPanel
                content={content}
                variables={variables}
                tags={tags}
                onTrialRun={() => markOnboardingStep('trialRun')}
              />
            )}

            {sidebarTab === 'tokens' && (
                  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                    <TokenCounter
                      content={content}
                      model={tokenModel}
                      onModelChange={setTokenModel}
                    />
                  </div>
                )}

                {sidebarTab === 'guide' && (
                  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                    <PromptGuide />
                  </div>
                )}
              </div>

              <div className="flex gap-1.5 px-3 py-2 border-t border-espresso/8 bg-cream/30 flex-shrink-0">
                <button onClick={handleCopy} className="btn-secondary text-xs flex-1 justify-center" title="复制内容">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  复制
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setExportMenuOpen((v) => !v)}
                    className="btn-secondary text-xs"
                    title="导出"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  {exportMenuOpen && (
                    <>
                      <button
                        type="button"
                        className="fixed inset-0 z-[5] cursor-default"
                        aria-label="关闭菜单"
                        onClick={() => setExportMenuOpen(false)}
                      />
                      <div className="absolute right-0 bottom-full mb-1 w-40 bg-paper border border-espresso/10 rounded-lg shadow-lg py-1 z-10">
                        <button
                          type="button"
                          onClick={() => { handleExportMarkdown(); setExportMenuOpen(false); }}
                          className="w-full text-left px-3 py-1.5 text-xs text-espresso-soft hover:bg-cream cursor-pointer"
                        >
                          📄 Markdown (.md)
                        </button>
                        <button
                          type="button"
                          onClick={() => { handleExportJSON(); setExportMenuOpen(false); }}
                          className="w-full text-left px-3 py-1.5 text-xs text-espresso-soft hover:bg-cream cursor-pointer"
                        >
                          📦 JSON (.json)
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {isEditing && (
                  <>
                    <button onClick={() => navigate(`/history/${id}`)} className="btn-secondary text-xs" title="版本历史">
                      <Clock className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setShowDeleteConfirm(true)} className="btn-secondary text-xs text-red-500 border-red-200 hover:bg-red-50" title="删除">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="flex-shrink-0 mt-2 flex flex-wrap items-center justify-between gap-2 px-1 py-1.5 border-t border-espresso/8 text-[11px] text-sage-light">
        <div className="flex items-center gap-3">
          <span>{content.length} 字符</span>
          <span>≈ {tokenStats.tokens} tokens</span>
          <span className="hidden sm:inline">· {tokenStats.model}</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={tokenModel}
            onChange={(e) => setTokenModel(e.target.value as ModelKey)}
            className="text-[10px] border border-espresso/10 rounded px-1.5 py-0.5 bg-paper text-espresso-soft"
          >
            <option value="deepseek">DeepSeek</option>
            <option value="gpt-4o">GPT-4o</option>
            <option value="claude-3.5-sonnet">Claude 3.5</option>
            <option value="default">默认估算</option>
          </select>
          <span className={isDirty ? 'text-amber-700' : 'text-green-700'}>
            {isDirty ? '● 未保存' : '✓ 已保存'}
          </span>
        </div>
      </div>

      <Toast message={toastMessage} visible={toastVisible} />

      {/* 模板套用确认 */}
      {pendingTemplate && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-paper rounded-xl shadow-xl max-w-lg w-full p-5 max-h-[85vh] flex flex-col">
            <h3 className="font-semibold text-espresso mb-1">确认套用模板？</h3>
            <p className="text-sm text-espresso-soft mb-3">
              将用「{pendingTemplate.name}」替换当前编辑区内容，此操作不可撤销（建议先保存）。
            </p>
            <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-espresso/10 bg-cream/40 p-3 mb-4">
              <pre className="text-xs font-mono text-espresso-soft whitespace-pre-wrap leading-relaxed">
                {buildTemplatePayload(pendingTemplate).content.slice(0, 1200)}
                {buildTemplatePayload(pendingTemplate).content.length > 1200 ? '\n…' : ''}
              </pre>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setPendingTemplate(null)} className="btn-primary">
                取消
              </button>
              <button type="button" onClick={() => applyTemplate(pendingTemplate)} className="btn-danger">
                确认替换
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-paper rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-espresso">确认删除</h3>
                <p className="text-sm text-espresso-soft">此操作不可撤销</p>
              </div>
            </div>
            <p className="text-sm text-espresso-soft mb-4">
              将删除提示词 <strong>"{title}"</strong> 及其所有版本历史。
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={handleDelete} className="btn-danger">确认删除</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-primary">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
