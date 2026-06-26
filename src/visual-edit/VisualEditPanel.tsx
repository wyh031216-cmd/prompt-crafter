import { useCallback, useEffect, useRef, useState } from 'react';
import { Copy, Check, X, Save, Trash2, MessageSquare, GripVertical, Minimize2, Maximize2, ArrowUp } from 'lucide-react';
import { buildAiPrompt } from './inspector';
import { STYLE_FIELDS } from './types';
import { useVisualEdit } from './VisualEditContext';

const LAYOUT_KEY = 'vc_panel_layout_v1';
const PANEL_W = 320;
const PANEL_MAX_H = 520;

interface PanelLayout {
  x: number;
  y: number;
  collapsed: boolean;
}

function loadLayout(): PanelLayout {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    if (raw) {
      const p = JSON.parse(raw) as PanelLayout;
      return {
        x: Math.min(Math.max(8, p.x), window.innerWidth - 100),
        y: Math.min(Math.max(8, p.y), window.innerHeight - 80),
        collapsed: !!p.collapsed,
      };
    }
  } catch {
    /* ignore */
  }
  return {
    x: Math.max(16, window.innerWidth - PANEL_W - 24),
    y: 72,
    collapsed: false,
  };
}

function saveLayout(layout: PanelLayout) {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
  } catch {
    /* ignore */
  }
}

export default function VisualEditPanel() {
  const {
    enabled,
    selectedInfo,
    clearSelection,
    selectParent,
    textOverride,
    setTextOverride,
    styleOverrides,
    setStyleOverride,
    clearStyleOverrides,
    note,
    setNote,
    entries,
    saveEntry,
    removeEntry,
    clearEntries,
  } = useVisualEdit();

  const [copied, setCopied] = useState(false);
  const [layout, setLayout] = useState<PanelLayout>(loadLayout);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    setLayout(loadLayout());
  }, [enabled]);

  const persistLayout = useCallback((next: PanelLayout) => {
    setLayout(next);
    saveLayout(next);
  }, []);

  const onDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: layout.x,
      origY: layout.y,
    };

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      const x = Math.min(Math.max(8, dragRef.current.origX + dx), window.innerWidth - 80);
      const y = Math.min(Math.max(8, dragRef.current.origY + dy), window.innerHeight - 48);
      setLayout((prev) => ({ ...prev, x, y }));
    };

    const onUp = () => {
      dragRef.current = null;
      setLayout((prev) => {
        saveLayout(prev);
        return prev;
      });
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  if (!enabled) return null;

  const handleCopyPrompt = async () => {
    if (!selectedInfo) return;
    const prompt = buildAiPrompt({ element: selectedInfo, textOverride, styleOverrides, note });
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAll = async () => {
    if (!entries.length) return;
    const text = entries
      .map((e) => buildAiPrompt({ element: e.element, textOverride: e.textOverride, styleOverrides: e.styleOverrides, note: e.note }))
      .join('\n\n---\n\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (layout.collapsed) {
    return (
      <button
        type="button"
        data-vc-ignore
        onClick={() => persistLayout({ ...layout, collapsed: false })}
        style={{ left: layout.x, top: layout.y }}
        className="fixed z-[9999] flex items-center gap-2 px-3 py-2 bg-orange-500 text-white text-xs font-medium rounded-full shadow-lg cursor-pointer hover:bg-orange-600"
      >
        <Maximize2 className="w-3.5 h-3.5" />
        展开编辑面板
        {selectedInfo && <span className="bg-paper/20 px-1.5 py-0.5 rounded">已选中</span>}
      </button>
    );
  }

  return (
    <div
      data-vc-ignore
      style={{ left: layout.x, top: layout.y, width: PANEL_W, maxHeight: PANEL_MAX_H }}
      className="fixed z-[9999] bg-paper border border-orange-200 rounded-xl shadow-2xl flex flex-col overflow-hidden"
    >
      {/* 可拖动标题栏 */}
      <div
        onMouseDown={onDragStart}
        className="px-3 py-2.5 bg-orange-50 border-b border-orange-100 flex items-center gap-2 cursor-grab active:cursor-grabbing select-none"
      >
        <GripVertical className="w-4 h-4 text-orange-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-orange-800 leading-tight">可视化编辑</h3>
          <p className="text-[10px] text-orange-600 truncate">拖动此栏移动 · 可收起</p>
        </div>
        <button
          type="button"
          onClick={() => persistLayout({ ...layout, collapsed: true })}
          className="p-1 text-orange-500 hover:text-orange-700 cursor-pointer"
          title="收起面板"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
        {selectedInfo && (
          <button type="button" onClick={clearSelection} className="p-1 text-orange-400 hover:text-orange-600 cursor-pointer" title="取消选中">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {!selectedInfo ? (
          <div className="text-center py-6 text-sage-light text-sm">
            <p className="mb-1">👆 点击页面元素选中</p>
            <p className="text-xs leading-relaxed">
              面板可拖动让开位置<br />
              选不准可点「选父级」
            </p>
          </div>
        ) : (
          <>
            <div className="bg-cream rounded-lg p-2.5 text-xs space-y-1">
              <p><span className="text-sage-light">标签:</span> &lt;{selectedInfo.tagName}&gt;</p>
              <p className="break-all line-clamp-2"><span className="text-sage-light">选择器:</span> {selectedInfo.selector}</p>
              <button
                type="button"
                onClick={selectParent}
                className="mt-1 flex items-center gap-1 text-orange-600 hover:text-orange-800 cursor-pointer"
              >
                <ArrowUp className="w-3 h-3" /> 选父级（扩大选中范围）
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-espresso mb-1 block">文字内容</label>
              <textarea
                value={textOverride}
                onChange={(e) => setTextOverride(e.target.value)}
                rows={2}
                className="w-full text-xs border border-espresso/10 rounded-lg px-2 py-1.5 focus:outline-none focus:border-orange-400 resize-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-espresso">样式预览</label>
                <button type="button" onClick={clearStyleOverrides} className="text-xs text-sage-light hover:text-espresso-soft cursor-pointer">
                  重置
                </button>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {STYLE_FIELDS.map((f) => (
                  <div key={f.key} className="flex items-center gap-2">
                    <span className="text-xs text-espresso-soft w-14 flex-shrink-0">{f.label}</span>
                    <input
                      type="text"
                      value={styleOverrides[f.key] || ''}
                      onChange={(e) => setStyleOverride(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="flex-1 text-xs border border-espresso/10 rounded px-2 py-0.5 focus:outline-none focus:border-orange-400"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-espresso mb-1 block">修改说明</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="例：把这个按钮改成绿色…"
                className="w-full text-xs border border-espresso/10 rounded-lg px-2 py-1.5 focus:outline-none focus:border-orange-400 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={saveEntry} className="flex-1 btn-secondary text-xs justify-center py-1.5">
                <Save className="w-3.5 h-3.5" /> 暂存
              </button>
              <button type="button" onClick={handleCopyPrompt} className="flex-1 btn-primary text-xs justify-center py-1.5">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} 复制
              </button>
            </div>
          </>
        )}

        {entries.length > 0 && (
          <div className="border-t border-espresso/8 pt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-espresso-soft">暂存 {entries.length}</span>
              <button type="button" onClick={handleCopyAll} className="text-xs text-terracotta hover:text-terracotta-deep cursor-pointer flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> 全部复制
              </button>
            </div>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {entries.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-xs bg-cream rounded px-2 py-1">
                  <span className="truncate flex-1">&lt;{e.element.tagName}&gt; {e.note || e.element.text.slice(0, 16)}</span>
                  <button type="button" onClick={() => removeEntry(e.id)} className="text-sage-light hover:text-red-500 cursor-pointer ml-1">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={clearEntries} className="text-xs text-sage-light hover:text-espresso-soft cursor-pointer">
              清空暂存
            </button>
          </div>
        )}
      </div>

      <div className="px-3 py-1.5 bg-cream border-t border-espresso/8 text-[10px] text-sage-light">
        复制指令后粘贴给 AI 改代码
      </div>
    </div>
  );
}