import { PlatformChip } from './AIPlatformIcon';
import type { AIPlatform } from '../utils/templates/types';

interface ActiveTemplateBarProps {
  platform: AIPlatform;
  templateName: string;
}

/** 只读来源标识：回答「当前基于哪个平台的哪个模板」，不提供换模板入口 */
export default function ActiveTemplateBar({ platform, templateName }: ActiveTemplateBarProps) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-xs text-espresso-soft">
      <span className="flex-shrink-0">基于</span>
      <PlatformChip platform={platform} size="sm" />
      <span className="min-w-0 truncate font-medium text-espresso">{templateName}</span>
    </div>
  );
}