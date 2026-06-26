import { useMemo } from 'react';
import { diffWords } from 'diff';
import { Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { PromptVersion } from '../types/prompt';

interface DiffViewerProps {
  oldVersion: PromptVersion;
  newVersion: PromptVersion;
}

export default function DiffViewer({ oldVersion, newVersion }: DiffViewerProps) {
  const diffs = useMemo(() => diffWords(oldVersion.content, newVersion.content), [oldVersion.content, newVersion.content]);

  const renderDiffText = () => {
    return diffs.map((part, i) => {
      if (part.added) {
        return (
          <span key={i} className="bg-green-100 text-green-800 rounded px-0.5">
            {part.value}
          </span>
        );
      }
      if (part.removed) {
        return (
          <span key={i} className="bg-red-100 text-red-800 rounded px-0.5 line-through">
            {part.value}
          </span>
        );
      }
      return <span key={i}>{part.value}</span>;
    });
  };

  const renderDiffMarkdown = () => {
    // Simple approach: render side by side
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-espresso/10 rounded-lg overflow-hidden">
          <div className="bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 border-b border-red-100">
            旧版本
            <span className="ml-2 text-espresso-soft font-normal">
              {new Date(oldVersion.createdAt).toLocaleString('zh-CN')}
            </span>
          </div>
          <div className="p-3 markdown-preview text-sm max-h-[400px] overflow-y-auto">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{oldVersion.content}</ReactMarkdown>
          </div>
        </div>
        <div className="border border-espresso/10 rounded-lg overflow-hidden">
          <div className="bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 border-b border-green-100">
            新版本
            <span className="ml-2 text-espresso-soft font-normal">
              {new Date(newVersion.createdAt).toLocaleString('zh-CN')}
            </span>
          </div>
          <div className="p-3 markdown-preview text-sm max-h-[400px] overflow-y-auto">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{newVersion.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Version info */}
      <div className="flex items-center gap-4 text-xs text-espresso-soft">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          旧: {new Date(oldVersion.createdAt).toLocaleString('zh-CN')}
          {oldVersion.note && <span className="text-sage-light">（{oldVersion.note}）</span>}
        </span>
        <span className="text-sage-light">→</span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          新: {new Date(newVersion.createdAt).toLocaleString('zh-CN')}
          {newVersion.note && <span className="text-sage-light">（{newVersion.note}）</span>}
        </span>
      </div>

      {/* Diff modes */}
      <details className="group" open>
        <summary className="text-sm font-medium text-espresso cursor-pointer hover:text-espresso mb-2 select-none">
          📝 文本对比
        </summary>
        <div className="p-4 bg-paper border border-espresso/10 rounded-lg text-sm leading-relaxed whitespace-pre-wrap font-mono">
          {renderDiffText()}
        </div>
      </details>

      <details className="group">
        <summary className="text-sm font-medium text-espresso cursor-pointer hover:text-espresso mb-2 select-none">
          👁️ 渲染对比
        </summary>
        {renderDiffMarkdown()}
      </details>
    </div>
  );
}
