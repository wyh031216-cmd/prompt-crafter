import { useState, useMemo } from 'react';
import { Copy, Check, Image, Film, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fillVariables, getDefaultVariableValues } from '../utils/variables';
import {
  getPlatformFromTags,
  getModalityLabel,
  splitPromptPositiveNegative,
  VISUAL_PLATFORM_HINTS,
  type PromptModality,
} from '../utils/promptModality';
import type { Variable } from '../types/prompt';
import { parseGuideVideoOutput } from '../utils/guideVideoShots';
import GuideVideoShots from './GuideVideoShots';

interface VisualExportPanelProps {
  content: string;
  variables: Variable[];
  modality: PromptModality;
  tags: string[];
  onCopied?: () => void;
}

export default function VisualExportPanel({
  content,
  variables,
  modality,
  tags,
  onCopied,
}: VisualExportPanelProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const promptText = fillVariables(content, getDefaultVariableValues(variables));
  const { positive, negative } = useMemo(
    () => splitPromptPositiveNegative(promptText),
    [promptText],
  );

  const videoParsed = useMemo(() => {
    if (modality !== 'video') return null;
    const parsed = parseGuideVideoOutput(positive);
    return parsed.hasShots ? parsed : null;
  }, [modality, positive]);

  const platformKey = getPlatformFromTags(tags) ?? 'general';
  const platformHint = VISUAL_PLATFORM_HINTS[platformKey] ?? VISUAL_PLATFORM_HINTS.general;
  const Icon = modality === 'video' ? Film : Image;

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onCopied?.();
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-shrink-0 mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-start gap-2">
          <Icon className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <p className="font-medium mb-1">
              这是「{getModalityLabel(modality)}」提示词，不是文本对话
            </p>
            <p>
              设置里配置的 DeepSeek / Claude 等 API 用于<strong>文本试运行</strong>，
              无法直接出图或出视频。完整内容在左侧编辑区，此处一键复制到图像/视频平台。
            </p>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 mb-3 rounded-lg border border-terracotta/20 bg-terracotta/5 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-terracotta-deep mb-1">
          推荐平台 · {platformHint.name}
        </p>
        <p className="text-xs text-espresso-soft leading-relaxed">{platformHint.tip}</p>
      </div>

      {videoParsed ? (
        <div className="flex-1 min-h-0 overflow-y-auto mb-3">
          <GuideVideoShots
            parsed={videoParsed}
            copiedKey={copiedKey}
            onCopy={copy}
            compact
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 mb-3 flex-shrink-0">
        <button
          type="button"
          onClick={() => copy(promptText, 'full')}
          className="btn-primary text-xs flex-1 justify-center"
        >
          {copiedKey === 'full' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          {videoParsed ? '复制完整脚本' : '复制完整提示词'}
        </button>
        {!videoParsed && (
          <button
            type="button"
            onClick={() => copy(positive, 'pos')}
            className="btn-secondary text-xs"
          >
            {copiedKey === 'pos' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            正向
          </button>
        )}
        {negative && (
          <button
            type="button"
            onClick={() => copy(negative, 'neg')}
            className="btn-secondary text-xs"
          >
            {copiedKey === 'neg' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            反向
          </button>
        )}
      </div>

      <p className="text-[10px] text-sage-light mt-1 flex-shrink-0">
        文本类提示词可在
        <Link to="/settings" className="text-terracotta hover:underline mx-0.5 inline-flex items-center gap-0.5">
          设置 <ExternalLink className="w-2.5 h-2.5" />
        </Link>
        配置 API 后使用「试运行」对话测试。
      </p>
    </div>
  );
}