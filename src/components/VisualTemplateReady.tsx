import { CheckCircle2 } from 'lucide-react';
import { getFormatPlatformLabel } from '../utils/imageFormat';
import { resolveVisualContext } from '../utils/visualContext';

interface VisualTemplateReadyProps {
  content: string;
  templateId: string;
  templateName?: string | null;
  onSwitchToFreeform: () => void;
}

export default function VisualTemplateReady({
  content,
  templateId,
  templateName,
  onSwitchToFreeform,
}: VisualTemplateReadyProps) {
  const ctx = resolveVisualContext(content, templateId, templateName);
  const platform = ctx ? getFormatPlatformLabel(ctx.platform) : '';
  const modality = ctx?.modality === 'video' ? '视频' : '图像';

  return (
    <div className="mb-3 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
      <div className="flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-emerald-900">
            {templateName ?? '模板'} 已就绪 · {platform} {modality}
          </p>
          <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
            结构已按平台写好，在左侧<strong>变量</strong>里改内容 → 复制到 {platform} 即可。要加严禁项：选上方<strong>补充约束</strong> → 点执行。
          </p>
          <button
            type="button"
            onClick={onSwitchToFreeform}
            className="text-xs text-emerald-800 underline mt-1.5 cursor-pointer hover:text-emerald-950"
          >
            我已大改内容，需要重新套格式 →
          </button>
        </div>
      </div>
    </div>
  );
}