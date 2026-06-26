import { MousePointer2 } from 'lucide-react';
import { useVisualEdit } from './VisualEditContext';

export default function VisualEditToggle() {
  const { enabled, setEnabled } = useVisualEdit();

  return (
    <button
      onClick={() => setEnabled(!enabled)}
      data-vc-ignore
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer border ${
        enabled
          ? 'bg-orange-500 text-white border-orange-500 shadow-md'
          : 'bg-paper text-espresso-soft border-espresso/10 hover:border-orange-300 hover:text-orange-600'
      }`}
      title="可视化编辑：点击界面元素现场修改"
    >
      <MousePointer2 className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{enabled ? '编辑中' : '可视化编辑'}</span>
    </button>
  );
}