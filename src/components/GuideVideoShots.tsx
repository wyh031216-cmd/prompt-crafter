import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, Film } from 'lucide-react';
import {
  getVideoShotSectionTitle,
  type ParsedVideoOutput,
} from '../utils/guideVideoShots';

interface GuideVideoShotsProps {
  parsed: ParsedVideoOutput;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
  /** 紧凑模式用于编辑器侧栏 */
  compact?: boolean;
}

export default function GuideVideoShots({
  parsed,
  copiedKey,
  onCopy,
  compact = false,
}: GuideVideoShotsProps) {
  const [scriptOpen, setScriptOpen] = useState(!compact);
  const [expandedShot, setExpandedShot] = useState<number | null>(null);

  if (!parsed.hasShots) return null;

  const title = getVideoShotSectionTitle(parsed.kind);

  return (
    <div className="card p-4 border-terracotta/25 bg-gradient-to-br from-terracotta/[0.06] to-paper">
      <div className="flex items-start gap-2 mb-3">
        <Film className="w-4 h-4 text-terracotta flex-shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-espresso">{title}</h3>
          <p className="text-xs text-espresso-soft mt-0.5 leading-relaxed">
            {parsed.kind === 'grok'
              ? '每条对应 Grok 视频一镜。第 2 镜起建议用上一镜最后一帧做图生视频。'
              : '每条生成一张关键帧静图，再用图生视频或后期合成。'}
          </p>
        </div>
      </div>

      <div className={`grid gap-2 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {parsed.shots.map((shot) => {
          const key = `shot-${shot.index}`;
          const expanded = expandedShot === shot.index;
          const preview = shot.content.length > 180 && !expanded
            ? `${shot.content.slice(0, 180)}…`
            : shot.content;

          return (
            <div
              key={shot.index}
              className="rounded-lg border border-espresso/10 bg-paper p-3 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-espresso truncate">{shot.label}</span>
                <button
                  type="button"
                  onClick={() => onCopy(shot.content, key)}
                  className="btn-primary text-xs py-1 px-2 flex-shrink-0"
                >
                  {copiedKey === key ? (
                    <Check className="w-3.5 h-3.5 text-green-200" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  复制
                </button>
              </div>
              <pre
                className={`text-[11px] font-mono leading-relaxed text-espresso-soft whitespace-pre-wrap break-words ${
                  compact ? 'max-h-28 overflow-y-auto' : ''
                }`}
              >
                {preview}
              </pre>
              {shot.content.length > 180 && (
                <button
                  type="button"
                  onClick={() => setExpandedShot(expanded ? null : shot.index)}
                  className="text-[10px] text-terracotta hover:underline self-start cursor-pointer"
                >
                  {expanded ? '收起' : '展开全文'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {parsed.script && (
        <div className="mt-3 pt-3 border-t border-espresso/10">
          <button
            type="button"
            onClick={() => setScriptOpen((o) => !o)}
            className="flex items-center gap-1 text-xs font-medium text-espresso-soft hover:text-espresso cursor-pointer"
          >
            {scriptOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            完整分镜脚本（策划参考）
          </button>
          {scriptOpen && (
            <pre className="mt-2 text-[11px] font-mono leading-relaxed text-espresso-soft whitespace-pre-wrap break-words max-h-48 overflow-y-auto rounded-lg bg-espresso/[0.03] p-2">
              {parsed.script}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}