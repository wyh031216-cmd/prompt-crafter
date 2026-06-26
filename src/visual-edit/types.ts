export interface StyleOverrides {
  fontSize?: string;
  color?: string;
  backgroundColor?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  fontWeight?: string;
  width?: string;
  height?: string;
  opacity?: string;
}

export interface SelectedElementInfo {
  id: string;
  tagName: string;
  text: string;
  className: string;
  selector: string;
  route: string;
  rect: { top: number; left: number; width: number; height: number };
}

export interface VisualEditEntry {
  id: string;
  timestamp: number;
  element: SelectedElementInfo;
  textOverride?: string;
  styleOverrides: StyleOverrides;
  note: string;
}

export const STYLE_FIELDS: Array<{ key: keyof StyleOverrides; label: string; placeholder: string }> = [
  { key: 'fontSize', label: '字号', placeholder: '16px' },
  { key: 'color', label: '文字颜色', placeholder: '#111827' },
  { key: 'backgroundColor', label: '背景色', placeholder: '#ffffff' },
  { key: 'padding', label: '内边距', placeholder: '12px 16px' },
  { key: 'margin', label: '外边距', placeholder: '8px 0' },
  { key: 'borderRadius', label: '圆角', placeholder: '8px' },
  { key: 'fontWeight', label: '字重', placeholder: '600' },
  { key: 'width', label: '宽度', placeholder: '100%' },
  { key: 'height', label: '高度', placeholder: 'auto' },
  { key: 'opacity', label: '透明度', placeholder: '1' },
];