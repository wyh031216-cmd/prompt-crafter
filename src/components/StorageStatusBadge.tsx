import { useNavigate } from 'react-router-dom';
import { Cloud, HardDrive } from 'lucide-react';
import { getLastSyncAt, getWebDavConfig } from '../sync';

export default function StorageStatusBadge() {
  const navigate = useNavigate();
  const config = getWebDavConfig();
  const lastSync = getLastSyncAt();

  if (config.enabled && lastSync) {
    return (
      <button
        type="button"
        onClick={() => navigate('/settings')}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border border-green-200 bg-green-50 text-green-800 hover:bg-green-100 transition-colors cursor-pointer"
        title="点击查看云同步设置"
      >
        <Cloud className="w-3 h-3" />
        已同步 · {new Date(lastSync).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </button>
    );
  }

  if (config.enabled) {
    return (
      <button
        type="button"
        onClick={() => navigate('/settings')}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
        title="云同步已启用，尚未同步"
      >
        <Cloud className="w-3 h-3" />
        云同步待首次同步
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => navigate('/settings')}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border border-espresso/10 bg-paper/80 text-sage hover:text-espresso-soft hover:border-espresso/20 transition-colors cursor-pointer"
      title="数据仅存于本机，可在设置中配置云同步"
    >
      <HardDrive className="w-3 h-3" />
      仅本机存储
    </button>
  );
}