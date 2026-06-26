import { useState, useCallback, useRef } from 'react';
import { Play, Square, Loader2, AlertCircle, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatCompletion, getApiConfig, getProviderLabel } from '../ai';
import { fillVariables, getDefaultVariableValues } from '../utils/variables';
import { getPromptModality, isTextTrialRunnable } from '../utils/promptModality';
import VisualExportPanel from './VisualExportPanel';
import type { Variable } from '../types/prompt';

interface RunPanelProps {
  content: string;
  variables: Variable[];
  tags?: string[];
  onTrialRun?: () => void;
}

export default function RunPanel({ content, variables, tags = [], onTrialRun }: RunPanelProps) {
  const modality = getPromptModality(tags);

  if (!isTextTrialRunnable(modality)) {
    return (
      <VisualExportPanel
        content={content}
        variables={variables}
        modality={modality}
        tags={tags}
        onCopied={onTrialRun}
      />
    );
  }

  return (
    <TextRunPanel content={content} variables={variables} onTrialRun={onTrialRun} />
  );
}

function TextRunPanel({
  content,
  variables,
  onTrialRun,
}: {
  content: string;
  variables: Variable[];
  onTrialRun?: () => void;
}) {
  const [reply, setReply] = useState('');
  const [streaming, setStreaming] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const providerLabel = getProviderLabel(getApiConfig().provider);
  const hasKey = !!getApiConfig().apiKey.trim();

  const promptText = fillVariables(content, getDefaultVariableValues(variables));

  const handleRun = useCallback(async () => {
    if (!promptText.trim()) return;
    if (!hasKey) {
      setError('请先在设置中配置 API Key');
      return;
    }

    setLoading(true);
    setError(null);
    setReply('');
    setStreaming('');
    onTrialRun?.();
    abortRef.current = new AbortController();

    try {
      const text = await chatCompletion(
        {
          system: 'You are a helpful AI assistant. Follow the user prompt carefully and respond directly.',
          user: promptText,
          maxTokens: 4096,
        },
        (chunk) => setStreaming(chunk),
        abortRef.current.signal,
      );
      setReply(text);
      setStreaming('');
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        setError('已取消');
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('请求失败');
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [promptText, hasKey]);

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const display = reply || streaming;

  return (
    <div className="flex flex-col h-full min-h-0">
      <p className="text-xs text-espresso-soft mb-3 flex-shrink-0 leading-relaxed">
        将左侧编辑区成稿发送给 <span className="font-medium text-espresso">{providerLabel}</span> 进行
        <span className="font-medium text-espresso">文本对话</span>测试。
      </p>

      <div className="flex gap-2 mb-3 flex-shrink-0">
        <button
          type="button"
          onClick={handleRun}
          disabled={loading || !promptText.trim() || !hasKey}
          className="btn-primary flex-1 justify-center text-xs"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              运行中…
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              运行测试
            </>
          )}
        </button>
        {loading && (
          <button type="button" onClick={handleStop} className="btn-secondary text-xs">
            <Square className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {!hasKey && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-2 flex-shrink-0">
          请先在
          <a href="/settings" className="text-terracotta underline mx-1">设置</a>
          配置 API Key
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 p-2 bg-red-50 text-red-600 rounded-lg text-xs mb-2 flex-shrink-0">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-auto cursor-pointer">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col border border-espresso/10 rounded-lg overflow-hidden">
        <div className="px-3 py-1.5 text-xs text-espresso-soft border-b border-espresso/8 bg-cream/40 flex-shrink-0">
          模型回复
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 markdown-preview text-xs">
          {display ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{display}</ReactMarkdown>
          ) : (
            <p className="text-sage-light italic">运行后此处显示回复</p>
          )}
        </div>
      </div>
    </div>
  );
}