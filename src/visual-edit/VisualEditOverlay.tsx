import { useEffect, useRef, useState } from 'react';
import { isIgnoredElement, isInteractiveElement } from './inspector';
import { useVisualEdit } from './VisualEditContext';

export default function VisualEditOverlay() {
  const { enabled, selectElement, selectedEl } = useVisualEdit();
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const [selectedRect, setSelectedRect] = useState<DOMRect | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setHoverRect(null);
      setSelectedRect(null);
      return;
    }

    const updateSelectedRect = () => {
      if (selectedEl) setSelectedRect(selectedEl.getBoundingClientRect());
    };

    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const target = document.elementFromPoint(e.clientX, e.clientY);
        if (!target || isIgnoredElement(target)) {
          setHoverRect(null);
          return;
        }
        setHoverRect(target.getBoundingClientRect());
      });
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target || isIgnoredElement(target)) return;
      if (isInteractiveElement(target) && !e.altKey) return;

      let el = target as HTMLElement;
      if (e.altKey) {
        while (el.parentElement && isIgnoredElement(el.parentElement)) {
          el = el.parentElement;
        }
      }

      e.preventDefault();
      e.stopPropagation();
      selectElement(el);
      setSelectedRect(el.getBoundingClientRect());
    };

    const onScroll = () => {
      updateSelectedRect();
    };

    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('click', onClick, true);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', updateSelectedRect);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener('mousemove', onMove, true);
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', updateSelectedRect);
    };
  }, [enabled, selectElement, selectedEl]);

  if (!enabled) return null;

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none" data-vc-ignore>
      {hoverRect && (
        <div
          className="absolute border-2 border-sky-400 bg-sky-400/10 rounded-sm transition-all duration-75"
          style={{
            top: hoverRect.top,
            left: hoverRect.left,
            width: hoverRect.width,
            height: hoverRect.height,
          }}
        />
      )}
      {selectedRect && (
        <div
          className="absolute border-2 border-orange-500 bg-orange-500/10 rounded-sm"
          style={{
            top: selectedRect.top,
            left: selectedRect.left,
            width: selectedRect.width,
            height: selectedRect.height,
          }}
        >
          <span className="absolute -top-6 left-0 text-xs bg-orange-500 text-white px-2 py-0.5 rounded whitespace-nowrap">
            已选中 · 右侧编辑
          </span>
        </div>
      )}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs px-4 py-2 rounded-full shadow-lg text-center max-w-[90vw]">
        <span className="animate-pulse">●</span>
        {' '}点选元素编辑 · 拖动面板标题栏可移动 · 可收起面板
      </div>
    </div>
  );
}