import { useState, useCallback, useEffect } from 'react';
import {
  Download,
  Upload,
  Database,
  Trash2,
  AlertTriangle,
  Check,
  Key,
  Globe,
  Loader2,
  Cloud,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { repo } from '../data';
import { exportAllPromptsBackup } from '../utils/backupExport';
import { validateBackupFile, parseAndValidateBackupJson } from '../utils/backupImport';
import {
  getBackupStatusLabel,
  getDaysSinceBackup,
  getLastBackupAt,
  isBackupUrgent,
} from '../utils/backupReminder';
import {
  API_PROVIDER_PRESETS,
  getApiConfig,
  setApiConfig,
  testApiConnection,
  type ApiProviderId,
} from '../ai';
import PageHeader from '../components/PageHeader';
import {
  DEFAULT_WEBDAV_PATH,
  getLastSyncAt,
  getWebDavConfig,
  setWebDavConfig,
  syncWithWebDav,
  testWebDavConnection,
  type WebDavConfig,
} from '../sync';

export default function SettingsPage() {
  const [apiProvider, setApiProvider] = useState<ApiProviderId>('deepseek');
  const [apiKey, setApiKeyState] = useState('');
  const [apiModel, setApiModelState] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [promptCount, setPromptCount] = useState(0);
  const [backupLabel, setBackupLabel] = useState(getBackupStatusLabel());
  const [webdav, setWebdav] = useState<WebDavConfig>(getWebDavConfig);
  const [showWebdavPassword, setShowWebdavPassword] = useState(false);
  const [webdavTesting, setWebdavTesting] = useState(false);
  const [webdavSyncing, setWebdavSyncing] = useState(false);
  const [lastSyncLabel, setLastSyncLabel] = useState(() => {
    const at = getLastSyncAt();
    return at ? new Date(at).toLocaleString('zh-CN') : '尚未同步';
  });

  useEffect(() => {
    const cfg = getApiConfig();
    setApiProvider(cfg.provider);
    setApiKeyState(cfg.apiKey);
    setApiModelState(cfg.model);
    setApiBaseUrl(cfg.baseUrl);
  }, []);

  const providerPreset = API_PROVIDER_PRESETS[apiProvider];

  useEffect(() => {
    repo.getAllPrompts().then((list) => {
      setPromptCount(list.length);
      setBackupLabel(getBackupStatusLabel());
    });
  }, [exporting, clearing, importing]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveApiKey = () => {
    try {
      setApiConfig({
        provider: apiProvider,
        apiKey,
        model: apiModel,
        baseUrl: apiBaseUrl,
      });
      setSaved(true);
      showMessage('success', 'API 配置已保存');
      setTimeout(() => setSaved(false), 2000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '配置无效';
      showMessage('error', msg);
    }
  };

  const handleProviderChange = (provider: ApiProviderId) => {
    setApiProvider(provider);
    const preset = API_PROVIDER_PRESETS[provider];
    setApiModelState(preset.defaultModel);
    setApiBaseUrl(preset.defaultBaseUrl);
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      showMessage('error', '请先输入 API Key');
      return;
    }
    if (apiProvider === 'custom' && !apiBaseUrl.trim()) {
      showMessage('error', '请填写 Base URL');
      return;
    }

    try {
      setApiConfig({
        provider: apiProvider,
        apiKey,
        model: apiModel,
        baseUrl: apiBaseUrl,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '配置无效';
      showMessage('error', msg);
      return;
    }

    setTesting(true);
    try {
      await testApiConnection();
      showMessage('success', `连接成功！${providerPreset.name} 可用`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '连接失败';
      showMessage('error', msg);
    } finally {
      setTesting(false);
    }
  };

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const count = await exportAllPromptsBackup();
      setBackupLabel(getBackupStatusLabel());
      showMessage('success', `成功导出 ${count} 个提示词`);
    } catch {
      showMessage('error', '导出失败');
    } finally {
      setExporting(false);
    }
  }, []);

  const handleImport = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setImporting(true);
      try {
        validateBackupFile(file);
        const text = await file.text();
        const data = parseAndValidateBackupJson(text);

        let count = 0;
        for (const p of data.prompts) {
          await repo.createPrompt({
            title: p.title || '未命名',
            content: p.content || '',
            variables: Array.isArray(p.variables) ? p.variables : [],
            tags: Array.isArray(p.tags) ? p.tags : [],
            folderId: null,
          });
          count++;
        }

        showMessage('success', `成功导入 ${count} 个提示词`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : '导入失败，请检查文件格式';
        showMessage('error', msg);
      } finally {
        setImporting(false);
      }
    };
    input.click();
  }, []);

  const handleSaveWebDav = () => {
    try {
      setWebDavConfig(webdav);
      showMessage('success', '云同步配置已保存');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '配置无效';
      showMessage('error', msg);
    }
  };

  const handleTestWebDav = async () => {
    if (!webdav.url.trim()) {
      showMessage('error', '请填写 WebDAV 地址');
      return;
    }
    setWebDavConfig(webdav);
    setWebdavTesting(true);
    try {
      await testWebDavConnection(webdav);
      showMessage('success', 'WebDAV 连接成功');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '连接失败';
      showMessage('error', msg);
    } finally {
      setWebdavTesting(false);
    }
  };

  const handleSyncNow = async () => {
    if (!webdav.url.trim() || !webdav.username.trim()) {
      showMessage('error', '请先填写 WebDAV 地址和用户名');
      return;
    }
    setWebDavConfig(webdav);
    setWebdavSyncing(true);
    try {
      const result = await syncWithWebDav(webdav);
      setLastSyncLabel(new Date(result.syncedAt).toLocaleString('zh-CN'));
      setBackupLabel(getBackupStatusLabel());
      const parts = [
        result.pulled ? '已拉取远程' : null,
        result.pushed ? '已上传合并结果' : null,
        `${result.merged.prompts} 条提示词`,
      ].filter(Boolean);
      showMessage('success', `同步完成：${parts.join('，')}`);
      const list = await repo.getAllPrompts();
      setPromptCount(list.length);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '同步失败';
      showMessage('error', msg);
    } finally {
      setWebdavSyncing(false);
    }
  };

  const handleClearAll = useCallback(async () => {
    setClearing(true);
    try {
      await repo.clearAllData();
      showMessage('success', '所有数据已清除');
      setShowClearConfirm(false);
    } catch (e) {
      showMessage('error', '清除失败');
    } finally {
      setClearing(false);
    }
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        eyebrow="设置"
        title="应用设置"
        description="API 密钥、云同步、数据备份与隐私说明"
      />

      {message && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          )}
          {message.text}
        </div>
      )}

      {/* API Configuration */}
      <div className="card p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-5 h-5 text-terracotta" />
          <h3 className="font-semibold text-espresso">AI API 配置</h3>
        </div>
        <p className="text-sm text-espresso-soft mb-4">
          选择服务商并填入 Key，用于编辑器「API 优化」与「试运行」。
          Key 仅存于本机浏览器，直连对应 API。
        </p>
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4 leading-relaxed">
          <strong>说明：</strong>试运行仅支持<strong>文本对话</strong>类 API（如 DeepSeek、Claude、GPT）。
          图像/视频提示词请在 Midjourney、Grok Imagine、Stable Diffusion 等平台使用，词坊负责撰写与优化提示词。
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-espresso-soft mb-1.5">
              服务商
            </label>
            <select
              value={apiProvider}
              onChange={(e) => handleProviderChange(e.target.value as ApiProviderId)}
              className="input-field text-sm"
            >
              {(Object.values(API_PROVIDER_PRESETS)).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {providerPreset.hint && (
              <p className="text-xs text-sage-light mt-1">{providerPreset.hint}</p>
            )}
          </div>

          {apiProvider === 'custom' && (
            <div>
              <label className="block text-xs font-medium text-espresso-soft mb-1.5">
                Base URL
              </label>
              <input
                type="url"
                value={apiBaseUrl}
                onChange={(e) => setApiBaseUrl(e.target.value)}
                className="input-field text-sm font-mono"
                placeholder="https://api.example.com/v1"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-espresso-soft mb-1.5">
              API Key
            </label>
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKeyState(e.target.value)}
                className="input-field pr-16 text-sm font-mono w-full"
                placeholder={apiProvider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-sage-light hover:text-espresso-soft cursor-pointer"
              >
                {showKey ? '隐藏' : '显示'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-espresso-soft mb-1.5">
              模型
            </label>
            {providerPreset.models.length > 0 ? (
              <select
                value={apiModel}
                onChange={(e) => setApiModelState(e.target.value)}
                className="input-field text-sm"
              >
                {providerPreset.models.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                value={apiModel}
                onChange={(e) => setApiModelState(e.target.value)}
                className="input-field text-sm font-mono"
                placeholder="模型名称，如 qwen-plus"
              />
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={handleSaveApiKey} className="btn-primary text-sm">
              {saved ? <><Check className="w-4 h-4" /> 已保存</> : '保存配置'}
            </button>
            <button
              onClick={handleTestConnection}
              disabled={testing || !apiKey.trim()}
              className="btn-secondary text-sm"
            >
              {testing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> 测试中...</>
              ) : (
                <><Globe className="w-4 h-4" /> 测试连接</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* WebDAV Sync */}
      <div className="card p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <Cloud className="w-5 h-5 text-terracotta" />
          <h3 className="font-semibold text-espresso">云同步（WebDAV）</h3>
        </div>
        <p className="text-sm text-espresso-soft mb-4 leading-relaxed">
          通过 WebDAV 将提示词、文件夹与版本历史同步到坚果云、Nextcloud 等网盘。
          凭证仅存于本机浏览器，直连你的 WebDAV 服务，不经过词坊服务器。
        </p>

        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm text-espresso cursor-pointer">
            <input
              type="checkbox"
              checked={webdav.enabled}
              onChange={(e) => setWebdav((c) => ({ ...c, enabled: e.target.checked }))}
              className="rounded border-espresso/20"
            />
            启用 WebDAV 同步
          </label>

          <div>
            <label className="block text-xs font-medium text-espresso-soft mb-1.5">
              WebDAV 地址
            </label>
            <input
              type="url"
              value={webdav.url}
              onChange={(e) => setWebdav((c) => ({ ...c, url: e.target.value }))}
              className="input-field text-sm font-mono"
              placeholder="https://dav.jianguoyun.com/dav/"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-espresso-soft mb-1.5">
                用户名
              </label>
              <input
                type="text"
                value={webdav.username}
                onChange={(e) => setWebdav((c) => ({ ...c, username: e.target.value }))}
                className="input-field text-sm"
                placeholder="邮箱或账号"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-espresso-soft mb-1.5">
                密码 / 应用专用密码
              </label>
              <div className="relative">
                <input
                  type={showWebdavPassword ? 'text' : 'password'}
                  value={webdav.password}
                  onChange={(e) => setWebdav((c) => ({ ...c, password: e.target.value }))}
                  className="input-field text-sm w-full pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowWebdavPassword(!showWebdavPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-sage-light hover:text-espresso-soft cursor-pointer"
                >
                  {showWebdavPassword ? '隐藏' : '显示'}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-espresso-soft mb-1.5">
              远程文件路径
            </label>
            <input
              type="text"
              value={webdav.remotePath}
              onChange={(e) => setWebdav((c) => ({ ...c, remotePath: e.target.value }))}
              className="input-field text-sm font-mono"
              placeholder={DEFAULT_WEBDAV_PATH}
            />
          </div>

          <p className="text-xs text-sage-light leading-relaxed">
            同步策略：按更新时间合并（较新版本优先）。删除操作暂不会跨设备同步。
            部分网盘需开启 CORS 或使用反向代理，否则浏览器可能无法直连。
          </p>

          <p className="text-[10px] text-sage-light">上次同步：{lastSyncLabel}</p>

          <div className="flex flex-wrap gap-2">
            <button onClick={handleSaveWebDav} className="btn-secondary text-sm">
              保存配置
            </button>
            <button
              onClick={handleTestWebDav}
              disabled={webdavTesting}
              className="btn-secondary text-sm"
            >
              {webdavTesting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> 测试中...</>
              ) : (
                <><Globe className="w-4 h-4" /> 测试连接</>
              )}
            </button>
            <button
              onClick={handleSyncNow}
              disabled={webdavSyncing || !webdav.enabled}
              className="btn-primary text-sm"
            >
              {webdavSyncing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> 同步中...</>
              ) : (
                <><RefreshCw className="w-4 h-4" /> 立即同步</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className="card p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-terracotta" />
          <h3 className="font-semibold text-espresso">隐私与数据</h3>
        </div>
        <ul className="text-sm text-espresso-soft space-y-2 leading-relaxed list-disc pl-5">
          <li>
            <strong className="text-espresso font-medium">本地优先</strong>：提示词、文件夹与版本历史默认保存在本机 IndexedDB，不会自动上传到任何第三方。
          </li>
          <li>
            <strong className="text-espresso font-medium">API 密钥</strong>：仅存于本机 localStorage，调用 AI 时由浏览器直连你配置的服务商，不经词坊中转。
          </li>
          <li>
            <strong className="text-espresso font-medium">云同步</strong>：仅在你在下方启用 WebDAV 并主动点击同步时，才会向你的网盘读写数据。
          </li>
          <li>
            <strong className="text-espresso font-medium">无账号体系</strong>：当前版本无需注册登录；换设备请使用 JSON 备份或 WebDAV 同步迁移数据。
          </li>
          <li>
            <strong className="text-espresso font-medium">草稿</strong>：编辑中的草稿暂存于 localStorage，用于防丢，清除站点数据会一并删除。
          </li>
        </ul>
      </div>

      {/* Data Management */}
      <div className="card p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-terracotta" />
          <h3 className="font-semibold text-espresso">数据与备份</h3>
        </div>

        <div
          className={`rounded-lg border p-4 mb-4 ${
            isBackupUrgent(getDaysSinceBackup(), promptCount)
              ? 'border-amber-200 bg-amber-50'
              : 'border-espresso/10 bg-cream/50'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-sm font-medium text-espresso">{backupLabel}</span>
            <span className="text-xs text-sage-light">{promptCount} 条提示词</span>
          </div>
          <p className="text-xs text-espresso-soft leading-relaxed mb-3">
            数据默认保存在本机浏览器（IndexedDB）。未配置 WebDAV 时不会自动云同步；
            清理缓存、换设备或重装浏览器可能导致全部丢失，请定期导出 JSON 备份或启用上方云同步。
          </p>
          {getLastBackupAt() && (
            <p className="text-[10px] text-sage-light mb-3">
              最近备份时间：{new Date(getLastBackupAt()!).toLocaleString('zh-CN')}
            </p>
          )}
          <button onClick={handleExport} disabled={exporting} className="btn-primary text-sm">
            <Download className="w-4 h-4" />
            {exporting ? '导出中...' : '立即导出备份'}
          </button>
        </div>

        <div className="space-y-3">
          <button onClick={handleExport} disabled={exporting} className="btn-secondary w-full justify-start">
            <Download className="w-4 h-4" />
            {exporting ? '导出中...' : '导出全部数据 (JSON)'}
          </button>
          <button onClick={handleImport} disabled={importing} className="btn-secondary w-full justify-start">
            <Upload className="w-4 h-4" />
            {importing ? '导入中...' : '导入数据 (JSON)'}
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card p-6 border-red-200">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="font-semibold text-red-800">危险区域</h3>
        </div>
        <p className="text-sm text-espresso-soft mb-4">以下操作不可撤销，请谨慎使用。</p>
        <button onClick={() => setShowClearConfirm(true)} className="btn-danger">
          <Trash2 className="w-4 h-4" />
          清除所有数据
        </button>
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-paper rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-espresso">确认清除所有数据</h3>
                <p className="text-sm text-espresso-soft">此操作不可撤销</p>
              </div>
            </div>
            <p className="text-sm text-espresso-soft mb-4">
              将删除所有提示词、版本历史和文件夹，且无法恢复。
              <br />建议先导出备份。
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowClearConfirm(false)} className="btn-secondary">取消</button>
              <button onClick={handleClearAll} disabled={clearing} className="btn-danger">
                {clearing ? '清除中...' : '确认清除'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 text-center text-xs text-sage-light space-y-1">
        <p>词坊 v1.0 — 多平台提示词工作台</p>
        <p>数据默认仅存于本机浏览器，请定期在上方导出备份</p>
      </div>
    </div>
  );
}
