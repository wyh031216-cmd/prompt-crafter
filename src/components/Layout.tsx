import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Plus } from 'lucide-react';
import { VisualEditOverlay, VisualEditPanel, VisualEditToggle } from '../visual-edit';
import { clearPendingTemplate } from '../utils/templateBridge';
import { isVisualEditEnabled } from '../utils/featureFlags';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isEditorWorkspace = /^\/(new|edit\/)/.test(location.pathname);
  const isTemplatesPage = location.pathname === '/templates';
  const isContainedPage = isEditorWorkspace || isTemplatesPage;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const showVisualEdit = isVisualEditEnabled();

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  const handleNewPrompt = () => {
    clearPendingTemplate();
    navigate('/new');
  };

  /** 与侧栏「全部提示词」一致：回首页并清除文件夹筛选 */
  const handleGoHome = () => {
    setSelectedFolder(null);
    if (location.pathname === '/') {
      handleRefresh();
      return;
    }
    navigate('/');
  };

  return (
    <div className="relative flex h-screen bg-cream overflow-hidden">
      <div className="app-ambient" aria-hidden="true" />
      <div className="app-grain" aria-hidden="true" />

      <div className="relative z-10 flex w-full h-full">
        <Sidebar
          onFolderSelect={setSelectedFolder}
          selectedFolder={selectedFolder}
          onRefresh={handleRefresh}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <header
            className="h-16 flex items-center justify-between px-4 lg:px-6 flex-shrink-0"
            data-vc-ignore
          >
            <button
              type="button"
              onClick={handleGoHome}
              className="nav-island flex items-center gap-3 px-4 py-2 rounded-full bg-cream/80 backdrop-blur-xl shadow-[0_0_0_1px_rgba(28,20,16,0.06),0_8px_32px_rgba(28,20,16,0.06)] cursor-pointer hover:shadow-[0_12px_40px_rgba(28,20,16,0.08)] transition-shadow"
              aria-label="返回全部提示词"
              title="返回全部提示词"
            >
              <span className="font-serif text-lg text-espresso tracking-tight">
                词<em className="italic text-terracotta">坊</em>
              </span>
              <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-[0.15em] text-sage">
                多平台提示词工作台
              </span>
            </button>

            <div className="flex items-center gap-2">
              {showVisualEdit && <VisualEditToggle />}
              <button onClick={handleNewPrompt} className="btn-primary">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">新建提示词</span>
              </button>
            </div>
          </header>

          <main
            className={`flex-1 min-h-0 px-4 lg:px-6 pb-4 flex flex-col ${
              isContainedPage
                ? 'lg:overflow-hidden max-lg:overflow-y-auto'
                : 'overflow-y-auto pb-6'
            }`}
          >
            <Outlet
              context={{
                selectedFolder,
                refreshKey,
                onRefresh: handleRefresh,
                onFolderSelect: setSelectedFolder,
              }}
            />
          </main>
        </div>
      </div>

      {showVisualEdit && (
        <>
          <VisualEditOverlay />
          <VisualEditPanel />
        </>
      )}
    </div>
  );
}