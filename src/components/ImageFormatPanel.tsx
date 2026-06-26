import { useState, useEffect, useMemo } from 'react';
import { Sparkles, Copy, Check, Lock } from 'lucide-react';
import {
  formatImagePrompt,
  formatOutputToText,
  GROK_NEGATIVE_VIDEO,
  STRUCTURED_PLATFORMS,
  TEMPLATE_PLATFORMS,
  getFormatPlatformLabel,
  type VisualStyle,
  type Strictness,
  type ImageFormatPlatform,
  type FormatOutput,
} from '../utils/imageFormat';
import {
  resolveVisualContext,
  allowsVideoMode,
  type ResolvedVisualContext,
} from '../utils/visualContext';

interface ImageFormatPanelProps {
  content: string;
  templateId?: string | null;
  templateName?: string | null;
  onApplyResult: (text: string) => void;
}

const STYLES: { value: VisualStyle; label: string }[] = [
  { value: 'realistic', label: '写实摄影' },
  { value: 'anime', label: '动漫' },
  { value: 'illustration', label: '插画' },
  { value: 'concept', label: '概念设计' },
  { value: '3d', label: '3D 渲染' },
];

function isTemplatePlatform(p: ImageFormatPlatform): boolean {
  return p === 'gemini-imagen' || p === 'chatgpt-dalle';
}

export default function ImageFormatPanel({
  content,
  templateId,
  templateName,
  onApplyResult,
}: ImageFormatPanelProps) {
  const resolved = useMemo(
    () => resolveVisualContext(content, templateId, templateName),
    [content, templateId, templateName],
  );

  const [unlocked, setUnlocked] = useState(false);
  const [platform, setPlatform] = useState<ImageFormatPlatform>('grok');
  const [style, setStyle] = useState<VisualStyle>('realistic');
  const [strictness, setStrictness] = useState<Strictness>('strict');
  const [mode, setMode] = useState<'image' | 'video'>('image');
  const [copied, setCopied] = useState<'negative' | 'sd-negative' | null>(null);

  const locked = !!resolved?.locked && !unlocked;

  useEffect(() => {
    if (!resolved) return;
    if (locked) {
      setPlatform(resolved.platform);
      setStyle(resolved.style);
      setStrictness(resolved.strictness);
      setMode(resolved.modality === 'video' ? 'video' : 'image');
      return;
    }
    setPlatform(resolved.platform);
    setStyle(resolved.style);
    setMode(resolved.modality === 'video' ? 'video' : 'image');
  }, [resolved, locked]);

  useEffect(() => {
    setUnlocked(false);
  }, [templateId]);

  const activeCtx: ResolvedVisualContext | null = resolved
    ? {
        ...resolved,
        platform: locked ? resolved.platform : platform,
        modality: allowsVideoMode({ ...resolved, platform, modality: mode }) ? 'video' : 'image',
        style,
        strictness,
        locked,
      }
    : null;

  const templateMode = isTemplatePlatform(platform);
  const showVideoToggle = allowsVideoMode(
    activeCtx ?? { platform, modality: mode, style, strictness, locked: false },
  );

  const output: FormatOutput | null = content.trim()
    ? formatImagePrompt(content, {
        platform,
        style,
        strictness,
        mode: showVideoToggle ? mode : 'image',
      })
    : null;

  const preview = output ? formatOutputToText(output) : '';

  const handlePlatformChange = (next: ImageFormatPlatform) => {
    setPlatform(next);
    if (next !== 'grok') setMode('image');
  };

  const handleApply = () => {
    if (preview) onApplyResult(preview);
  };

  const copyText = (text: string, key: 'negative' | 'sd-negative') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const applyLabel = templateMode
    ? '套用模板结构到编辑区'
    : platform === 'grok'
      ? mode === 'video'
        ? '套用 Grok 视频格式到编辑区'
        : '套用 Grok 图像格式到编辑区'
      : `套用 ${getFormatPlatformLabel(platform)} 格式到编辑区`;

  return (
    <div className="space-y-3">
      {locked && resolved ? (
        <div className="flex items-start gap-2 bg-terracotta/10 border border-terracotta/15 rounded-lg p-2.5">
          <Lock className="w-3.5 h-3.5 text-terracotta mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-terracotta-deep font-medium">
              已锁定：{resolved.templateName ?? '模板'} → {getFormatPlatformLabel(resolved.platform)}
              {resolved.modality === 'video' ? ' · 视频' : ' · 图像'}
            </p>
            <p className="text-xs text-terracotta mt-0.5 leading-relaxed">
              与当前模板一致，避免套错平台。自由创作时可
              <button
                type="button"
                onClick={() => setUnlocked(true)}
                className="underline ml-0.5 cursor-pointer hover:text-terracotta-deep"
              >
                解除锁定
              </button>
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-espresso-soft leading-relaxed">
          生图/生视频格式化：上方 ⚡ 格式化 与模板/内容识别保持一致。复杂分镜请用顶部 <strong>引导生成</strong>。
        </p>
      )}

      {locked ? (
        <div className="text-xs px-2.5 py-2 bg-cream border border-espresso/10 rounded-lg text-espresso">
          目标平台：<span className="font-medium">{getFormatPlatformLabel(platform)}</span>
          <span className="text-sage-light mx-1.5">·</span>
          {resolved?.modality === 'video' ? '🎥 视频' : '🖼️ 图像'}
        </div>
      ) : (
        <div>
          <label className="text-xs text-espresso-soft font-medium">目标平台</label>
          <select
            value={platform}
            onChange={(e) => handlePlatformChange(e.target.value as ImageFormatPlatform)}
            className="mt-1 w-full text-xs border border-espresso/10 rounded-lg px-2 py-1.5 bg-paper"
          >
            <optgroup label="结构化（风格锁定）">
              {STRUCTURED_PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </optgroup>
            <optgroup label="自然语言模板">
              {TEMPLATE_PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </optgroup>
          </select>
        </div>
      )}

      {showVideoToggle && (
        <div className="flex gap-1">
          {(['image', 'video'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => !locked && setMode(m)}
              disabled={locked}
              className={`flex-1 px-2 py-1 text-xs rounded-md cursor-pointer disabled:cursor-default ${
                mode === m ? 'bg-terracotta/15 text-terracotta-deep font-medium' : 'text-espresso-soft hover:bg-paper'
              } ${locked ? 'opacity-80' : ''}`}
            >
              {m === 'image' ? '🖼️ 图像' : '🎥 视频'}
            </button>
          ))}
        </div>
      )}

      {!templateMode && (
        <>
          <div>
            <label className="text-xs text-espresso-soft font-medium">视觉风格</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as VisualStyle)}
              className="mt-1 w-full text-xs border border-espresso/10 rounded-lg px-2 py-1.5 bg-paper"
            >
              {STYLES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-espresso-soft font-medium">锁定强度</label>
            <select
              value={strictness}
              onChange={(e) => setStrictness(e.target.value as Strictness)}
              className="mt-1 w-full text-xs border border-espresso/10 rounded-lg px-2 py-1.5 bg-paper"
            >
              <option value="strict">🔒 严格 — 防风格跑偏</option>
              <option value="normal">适中</option>
              <option value="loose">宽松</option>
            </select>
          </div>
        </>
      )}

      {platform === 'gemini-imagen' && (
        <div>
          <label className="text-xs text-espresso-soft font-medium">风格倾向</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value as VisualStyle)}
            className="mt-1 w-full text-xs border border-espresso/10 rounded-lg px-2 py-1.5 bg-paper"
          >
            {STYLES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      )}

      <button
        type="button"
        onClick={handleApply}
        disabled={!content.trim()}
        className="btn-primary w-full justify-center text-xs"
      >
        <Sparkles className="w-3.5 h-3.5" />
        {applyLabel}
      </button>

      {preview && (
        <div className="border border-espresso/10 rounded-lg overflow-hidden">
          <div className="bg-cream px-3 py-1.5 text-xs text-espresso-soft border-b">预览</div>
          <pre className="p-2 text-xs whitespace-pre-wrap max-h-[200px] overflow-y-auto font-mono leading-relaxed">{preview}</pre>
        </div>
      )}

      {platform === 'grok' && mode === 'video' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
          <p className="text-xs text-amber-800 mb-1.5">视频常用反向约束（复制到 Grok Negative）</p>
          <button
            type="button"
            onClick={() => copyText(GROK_NEGATIVE_VIDEO, 'negative')}
            className="btn-secondary text-xs w-full justify-center"
          >
            {copied === 'negative' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied === 'negative' ? '已复制' : '复制 Negative'}
          </button>
        </div>
      )}

      {output?.kind === 'sd' && output.negative && (
        <div className="bg-violet-50 border border-violet-200 rounded-lg p-2.5">
          <p className="text-xs text-violet-800 mb-1.5">SD Negative（可单独复制到反向提示词框）</p>
          <button
            type="button"
            onClick={() => copyText(output.negative, 'sd-negative')}
            className="btn-secondary text-xs w-full justify-center"
          >
            {copied === 'sd-negative' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied === 'sd-negative' ? '已复制' : '复制 Negative'}
          </button>
        </div>
      )}
    </div>
  );
}