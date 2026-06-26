import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Sparkles, Loader2, AlertCircle, X, Cpu, Cloud, ChevronDown, ChevronUp } from 'lucide-react';
import {
  optimizePrompt,
  getActionLabel,
  getApiKey,
  getApiConfig,
  getProviderLabel,
  type OptimizeAction,
} from '../ai';
import { optimizePromptLocalStream, optimizePromptLocalExtra } from '../utils/localOptimize';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ImageFormatPanel from './ImageFormatPanel';
import VisualTemplateReady from './VisualTemplateReady';
import {
  hasVisualTemplate,
  needsFreeformVisualFormat,
  getVisualFormatLabel,
} from '../utils/visualContext';

interface AIAssistantProps {
  content: string;
  templateId?: string | null;
  templateName?: string | null;
  onApplyResult: (text: string) => void;
}

type OptimizeMode = 'local' | 'api';

type LocalExtraAction = 'add-constraints' | 'visual-format';

type SelectedAction = OptimizeAction | LocalExtraAction;

const BASE_ACTIONS: OptimizeAction[] = [
  'improve', 'elaborate', 'shorten', 'restructure',
  'spellcheck', 'translate-cn', 'translate-en',
];

const EXTRA_LABELS: Record<LocalExtraAction, string> = {
  'add-constraints': '补充约束',
  'visual-format': '格式化',
};

function isExtraAction(action: SelectedAction): action is LocalExtraAction {
  return action === 'add-constraints' || action === 'visual-format';
}

function getSelectedLabel(action: SelectedAction, platformHint?: string): string {
  if (isExtraAction(action)) {
    if (action === 'visual-format' && platformHint) return `${EXTRA_LABELS[action]} · ${platformHint}`;
    return EXTRA_LABELS[action];
  }
  return getActionLabel(action).replace(/^[^\s]+\s/, '');
}

export default function AIAssistant({
  content,
  templateId,
  templateName,
  onApplyResult,
}: AIAssistantProps) {
  const [mode, setMode] = useState<OptimizeMode>('local');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamText, setStreamText] = useState('');
  const [selectedAction, setSelectedAction] = useState<SelectedAction>('improve');
  const [showAdvancedFormat, setShowAdvancedFormat] = useState(false);
  const [freeformMode, setFreeformMode] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const hasApiKey = !!getApiKey();
  const apiProviderLabel = getProviderLabel(getApiConfig().provider);
  const visualTemplate = hasVisualTemplate(templateId);
  const templateReady = visualTemplate && !freeformMode;
  const freeformVisual = needsFreeformVisualFormat(content, freeformMode ? null : templateId);
  const showFormatTools = freeformVisual || freeformMode;

  useEffect(() => {
    setFreeformMode(false);
    setShowAdvancedFormat(false);
  }, [templateId]);

  useEffect(() => {
    if (mode === 'api' && isExtraAction(selectedAction)) {
      setSelectedAction('improve');
    }
  }, [mode, selectedAction]);

  const detectedPlatform = useMemo(
    () => (showFormatTools ? getVisualFormatLabel(content, freeformMode ? null : templateId, templateName) : ''),
    [content, templateId, templateName, showFormatTools, freeformMode],
  );

  const actionButtons = useMemo(() => {
    const items: { key: SelectedAction; label: string }[] = BASE_ACTIONS.map((a) => ({
      key: a,
      label: getActionLabel(a).split(' ').slice(1).join(' ') || a,
    }));

    if (mode === 'local') {
      if (templateReady || showFormatTools) {
        items.push({ key: 'add-constraints', label: EXTRA_LABELS['add-constraints'] });
      }
      if (showFormatTools) {
        items.push({
          key: 'visual-format',
          label: detectedPlatform ? `${EXTRA_LABELS['visual-format']} · ${detectedPlatform}` : EXTRA_LABELS['visual-format'],
        });
      }
    }

    return items;
  }, [mode, templateReady, showFormatTools, detectedPlatform]);

  const runLocalExtra = useCallback(
    async (id: LocalExtraAction) => {
      if (!content.trim()) return;
      setLoading(true);
      setError(null);
      const full = optimizePromptLocalExtra(content, id, {
        templateId: freeformMode ? null : templateId,
      });
      setStreamText('');
      setResult(full);
      setLoading(false);
    },
    [content, templateId, freeformMode],
  );

  const handleOptimize = useCallback(async () => {
    if (!content.trim()) return;

    if (mode === 'local' && isExtraAction(selectedAction)) {
      await runLocalExtra(selectedAction);
      return;
    }

    setLoading(true);
    setError(null);
    setResult('');
    setStreamText('');
    abortRef.current = new AbortController();

    try {
      if (mode === 'local') {
        const text = await optimizePromptLocalStream(
          content,
          selectedAction as OptimizeAction,
          (chunk) => setStreamText(chunk),
          undefined,
          abortRef.current.signal,
        );
        setResult(text);
      } else {
        const text = await optimizePrompt(
          { content, action: selectedAction as OptimizeAction },
          (chunk) => setStreamText(chunk),
          abortRef.current.signal,
        );
        setResult(text);
      }
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        setError('已取消');
      } else if (e instanceof Error) {
        setError(e.message || '优化失败');
      } else {
        setError('优化失败');
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [content, selectedAction, mode, runLocalExtra]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleApply = useCallback(() => {
    const text = result || streamText;
    if (text) onApplyResult(text);
  }, [result, streamText, onApplyResult]);

  const displayText = result || streamText;

  return (
    <div>
      <div className="flex gap-1 mb-3 p-1 bg-paper rounded-lg">
        <button
          type="button"
          onClick={() => setMode('local')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded-md cursor-pointer transition-colors ${
            mode === 'local' ? 'bg-paper text-terracotta-deep font-medium shadow-sm' : 'text-espresso-soft'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          规则优化
        </button>
        <button
          type="button"
          onClick={() => setMode('api')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded-md cursor-pointer transition-colors ${
            mode === 'api' ? 'bg-paper text-terracotta-deep font-medium shadow-sm' : 'text-espresso-soft'
          }`}
        >
          <Cloud className="w-3.5 h-3.5" />
          API 优化
        </button>
      </div>

      {mode === 'local' ? (
        <p className="text-xs text-espresso-soft mb-3 leading-relaxed">
          {templateReady
            ? '模板模式：结构已就绪，改变量即可。润色或补约束请点下方按钮后执行。'
            : showFormatTools
              ? '自由撰写生图词：选「格式化」一键套结构；译成中文需信达雅请切 API 模式。'
              : '离线规则引擎，无需 Key。润色扩写可用；信达雅翻译请切 API 模式。'}
        </p>
      ) : !hasApiKey ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-3">
          <p className="text-xs text-amber-700 mb-1">API 模式需在设置中配置 Key</p>
          <button
            type="button"
            onClick={() => { window.location.href = '/settings'; }}
            className="text-xs text-terracotta hover:text-terracotta-deep underline cursor-pointer"
          >
            前往设置 →
          </button>
        </div>
      ) : (
        <p className="text-xs text-espresso-soft mb-3">
          当前服务商：<span className="font-medium text-espresso">{apiProviderLabel}</span>
        </p>
      )}

      <div className="flex flex-wrap gap-1 mb-3">
        {actionButtons.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSelectedAction(key)}
            title={key === 'visual-format' && detectedPlatform ? `识别为 ${detectedPlatform}` : undefined}
            className={`px-2 py-1 text-xs rounded-md transition-colors cursor-pointer ${
              selectedAction === key
                ? 'bg-terracotta/15 text-terracotta-deep font-medium'
                : 'text-espresso-soft hover:bg-paper'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'local' && templateReady && templateId && (
        <VisualTemplateReady
          content={content}
          templateId={templateId}
          templateName={templateName}
          onSwitchToFreeform={() => setFreeformMode(true)}
        />
      )}

      {mode === 'local' && showFormatTools && (
        <div className="border-t border-espresso/8 pt-2 mb-3">
          <button
            type="button"
            onClick={() => setShowAdvancedFormat((v) => !v)}
            className="flex items-center gap-1 text-xs text-espresso-soft hover:text-terracotta cursor-pointer mb-2"
          >
            {showAdvancedFormat ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            高级：选手动平台 / 风格 / 预览
          </button>
          {showAdvancedFormat && (
            <ImageFormatPanel
              content={content}
              templateId={freeformMode ? null : templateId}
              templateName={templateName}
              onApplyResult={onApplyResult}
            />
          )}
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          onClick={handleOptimize}
          disabled={loading || !content.trim() || (mode === 'api' && !hasApiKey)}
          className="flex-1 justify-center btn-primary text-xs"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              处理中…
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              {mode === 'local' ? '规则' : 'API'}
              {getSelectedLabel(selectedAction, detectedPlatform)}
            </>
          )}
        </button>
        {loading && !isExtraAction(selectedAction) && (
          <button type="button" onClick={handleStop} className="btn-secondary text-xs">
            停止
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 p-2 bg-red-50 text-red-600 rounded-lg text-xs mb-3">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-auto cursor-pointer">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {displayText && (
        <div className="border border-espresso/10 rounded-lg overflow-hidden">
          <div className="bg-cream px-3 py-1.5 text-xs text-espresso-soft border-b border-espresso/10 flex items-center justify-between">
            <span>{mode === 'local' ? '规则优化结果' : 'API 优化结果'}</span>
            <button
              type="button"
              onClick={handleApply}
              className="text-terracotta hover:text-terracotta-deep font-medium cursor-pointer"
            >
              应用到编辑区
            </button>
          </div>
          <div className="p-3 markdown-preview text-xs max-h-[300px] overflow-y-auto">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayText}</ReactMarkdown>
          </div>
        </div>
      )}

      {loading && !displayText && (
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin w-5 h-5 border-2 border-terracotta border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}