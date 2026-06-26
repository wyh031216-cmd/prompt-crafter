import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { captureElement, isIgnoredElement } from './inspector';
import type { SelectedElementInfo, StyleOverrides, VisualEditEntry } from './types';

const STORAGE_KEY = 'promptcraft_visual_edits_v1';

interface VisualEditContextValue {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  selectedEl: HTMLElement | null;
  selectedInfo: SelectedElementInfo | null;
  selectElement: (el: HTMLElement) => void;
  selectParent: () => void;
  clearSelection: () => void;
  textOverride: string;
  setTextOverride: (v: string) => void;
  styleOverrides: StyleOverrides;
  setStyleOverride: (key: keyof StyleOverrides, value: string) => void;
  clearStyleOverrides: () => void;
  note: string;
  setNote: (v: string) => void;
  entries: VisualEditEntry[];
  saveEntry: () => void;
  removeEntry: (id: string) => void;
  clearEntries: () => void;
}

const VisualEditContext = createContext<VisualEditContextValue | null>(null);

function camelToKebab(key: string) {
  return key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

export function VisualEditProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [enabled, setEnabled] = useState(false);
  const [selectedEl, setSelectedEl] = useState<HTMLElement | null>(null);
  const [selectedInfo, setSelectedInfo] = useState<SelectedElementInfo | null>(null);
  const [textOverride, setTextOverrideState] = useState('');
  const [styleOverrides, setStyleOverrides] = useState<StyleOverrides>({});
  const [note, setNote] = useState('');
  const [entries, setEntries] = useState<VisualEditEntry[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const resetElementStyles = useCallback((el: HTMLElement) => {
    el.removeAttribute('data-vc-selected');
    el.style.cssText = '';
  }, []);

  const clearSelection = useCallback(() => {
    if (selectedEl) resetElementStyles(selectedEl);
    setSelectedEl(null);
    setSelectedInfo(null);
    setTextOverrideState('');
    setStyleOverrides({});
    setNote('');
  }, [selectedEl, resetElementStyles]);

  const selectElement = useCallback(
    (el: HTMLElement) => {
      if (selectedEl && selectedEl !== el) resetElementStyles(selectedEl);
      setSelectedEl(el);
      const info = captureElement(el, location.pathname);
      setSelectedInfo(info);
      setTextOverrideState(info.text);
      setStyleOverrides({});
      setNote('');
      el.setAttribute('data-vc-selected', 'true');
    },
    [selectedEl, location.pathname, resetElementStyles]
  );

  const selectParent = useCallback(() => {
    let parent = selectedEl?.parentElement ?? null;
    while (parent && isIgnoredElement(parent)) {
      parent = parent.parentElement;
    }
    if (parent && parent !== document.body) {
      selectElement(parent as HTMLElement);
    }
  }, [selectedEl, selectElement]);

  const setTextOverride = useCallback(
    (value: string) => {
      setTextOverrideState(value);
      if (selectedEl) selectedEl.textContent = value;
    },
    [selectedEl]
  );

  const setStyleOverride = useCallback(
    (key: keyof StyleOverrides, value: string) => {
      setStyleOverrides((prev) => {
        const next = { ...prev, [key]: value || undefined };
        if (selectedEl) {
          if (value) {
            (selectedEl.style as unknown as Record<string, string>)[key] = value;
          } else {
            selectedEl.style.removeProperty(camelToKebab(key));
          }
        }
        return next;
      });
    },
    [selectedEl]
  );

  const clearStyleOverrides = useCallback(() => {
    if (selectedEl) {
      Object.keys(styleOverrides).forEach((key) => {
        selectedEl.style.removeProperty(camelToKebab(key));
      });
    }
    setStyleOverrides({});
  }, [selectedEl, styleOverrides]);

  const saveEntry = useCallback(() => {
    if (!selectedInfo) return;
    const entry: VisualEditEntry = {
      id: selectedInfo.id,
      timestamp: Date.now(),
      element: selectedInfo,
      textOverride: textOverride !== selectedInfo.text ? textOverride : undefined,
      styleOverrides,
      note,
    };
    setEntries((prev) => [entry, ...prev.filter((e) => e.id !== entry.id)].slice(0, 50));
  }, [selectedInfo, textOverride, styleOverrides, note]);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearEntries = useCallback(() => setEntries([]), []);

  useEffect(() => {
    if (!enabled) clearSelection();
  }, [enabled, clearSelection]);

  const value = useMemo(
    () => ({
      enabled,
      setEnabled,
      selectedEl,
      selectedInfo,
      selectElement,
      selectParent,
      clearSelection,
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
    }),
    [
      enabled,
      selectedEl,
      selectedInfo,
      selectElement,
      selectParent,
      clearSelection,
      textOverride,
      setTextOverride,
      styleOverrides,
      setStyleOverride,
      clearStyleOverrides,
      note,
      entries,
      saveEntry,
      removeEntry,
      clearEntries,
    ]
  );

  return <VisualEditContext.Provider value={value}>{children}</VisualEditContext.Provider>;
}

export function useVisualEdit() {
  const ctx = useContext(VisualEditContext);
  if (!ctx) throw new Error('useVisualEdit must be used within VisualEditProvider');
  return ctx;
}