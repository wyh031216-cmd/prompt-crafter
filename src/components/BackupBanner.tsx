import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Download, X } from 'lucide-react';
import {
  dismissReminder,
  getBackupStatusLabel,
  getDaysSinceBackup,
} from '../utils/backupReminder';

interface BackupBannerProps {
  promptCount: number;
  exporting?: boolean;
  onExport: () => void;
}

export default function BackupBanner({ promptCount, exporting, onExport }: BackupBannerProps) {
  const navigate = useNavigate();
  const days = getDaysSinceBackup();
  const status = getBackupStatusLabel();

  const detail =
    days === null
      ? `你已有 ${promptCount} 条提示词，但还没有导出过备份。`
      : days >= 7
        ? `已有 ${promptCount} 条提示词，${status}。清缓存或换设备会导致数据丢失。`
        : `已有 ${promptCount} 条提示词，建议定期导出。${status}。`;

  return (
    <div className="mb-4 flex flex-wrap items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-[12rem]">
        <p className="text-sm font-medium text-amber-900">建议备份你的提示词</p>
        <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">{detail}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={onExport}
          disabled={exporting}
          className="btn-primary text-xs"
        >
          <Download className="w-3.5 h-3.5" />
          {exporting ? '导出中...' : '一键导出'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="btn-secondary text-xs"
        >
          设置
        </button>
        <button
          type="button"
          onClick={() => dismissReminder()}
          className="text-amber-700 hover:text-amber-900 cursor-pointer p-1"
          title="3 天内不再提醒"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}