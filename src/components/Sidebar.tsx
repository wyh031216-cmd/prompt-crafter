import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  Layers,
  Wand2,
  Edit3,
  Trash2,
} from 'lucide-react';
import type { Folder as FolderType } from '../types/prompt';
import { repo } from '../data';

interface SidebarProps {
  onFolderSelect: (folderId: string | null) => void;
  selectedFolder: string | null;
  onRefresh: () => void;
  collapsed: boolean;
  onToggle: () => void;
}

const FOLDER_COLORS = [
  '#C45C3E', '#6B7B5E', '#C9A962', '#9E3F28',
  '#A8B89A', '#3D342B', '#E8D5C4', '#1C1410',
  '#8B9A7D', '#D4A574',
];

export default function Sidebar({ onFolderSelect, selectedFolder, onRefresh, collapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ folder: FolderType; x: number; y: number } | null>(null);

  const isOnPrompts = location.pathname === '/';
  const allPromptsActive = isOnPrompts && selectedFolder === null;

  const loadFolders = async () => {
    setFolders(await repo.getAllFolders());
  };

  useEffect(() => {
    loadFolders();
  }, []);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const color = FOLDER_COLORS[folders.length % FOLDER_COLORS.length];
    await repo.createFolder(newFolderName.trim(), color);
    setNewFolderName('');
    setShowNewFolder(false);
    loadFolders();
    onRefresh();
  };

  const handleDeleteFolder = async (id: string) => {
    await repo.deleteFolder(id);
    loadFolders();
    onRefresh();
    if (selectedFolder === id) onFolderSelect(null);
    setContextMenu(null);
  };

  const handleRenameFolder = async (id: string) => {
    const name = prompt('重命名文件夹：');
    if (name?.trim()) {
      await repo.updateFolder(id, { name: name.trim() });
      loadFolders();
    }
    setContextMenu(null);
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const goAllPrompts = () => {
    onFolderSelect(null);
    if (location.pathname === '/') {
      onRefresh();
      return;
    }
    navigate('/');
  };

  const isOnGuide = location.pathname === '/guide';

  const toolNavItems = [
    { icon: Layers, label: '模板库', onClick: () => navigate('/templates'), active: location.pathname === '/templates' },
    { icon: Settings, label: '设置', onClick: () => navigate('/settings'), active: location.pathname === '/settings' },
  ];

  const navBtnClass = (active: boolean) =>
    active
      ? 'bg-espresso text-cream font-medium'
      : 'text-espresso-soft hover:bg-espresso/5 hover:text-espresso';

  const folderBtnClass = (active: boolean) =>
    active
      ? 'bg-terracotta/10 text-terracotta-deep font-medium'
      : 'text-espresso-soft hover:bg-espresso/5 hover:text-espresso';

  if (collapsed) {
    return (
      <div className="w-14 bg-paper/80 border-r border-espresso/8 flex flex-col items-center py-3 gap-2 backdrop-blur-sm">
        <button
          onClick={() => navigate('/guide')}
          className={`w-10 h-10 rounded-arc-md flex items-center justify-center transition-all cursor-pointer shadow-sm ${
            isOnGuide
              ? 'bg-terracotta text-cream'
              : 'bg-terracotta/10 text-terracotta-deep hover:bg-terracotta/20'
          }`}
          title="引导生成"
        >
          <Wand2 className="w-5 h-5" />
        </button>
        <button
          onClick={goAllPrompts}
          className={`w-10 h-10 rounded-arc-md flex items-center justify-center transition-all cursor-pointer ${navBtnClass(allPromptsActive)}`}
          title="全部提示词"
        >
          <FileText className="w-5 h-5" />
        </button>
        {toolNavItems.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className={`w-10 h-10 rounded-arc-md flex items-center justify-center transition-all cursor-pointer ${navBtnClass(item.active)}`}
            title={item.label}
          >
            <item.icon className="w-5 h-5" />
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={onToggle}
          className="w-10 h-10 rounded-arc-md flex items-center justify-center text-sage-light hover:text-espresso hover:bg-espresso/5 cursor-pointer"
          title="展开侧栏"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-60 bg-paper/80 border-r border-espresso/8 flex flex-col h-full backdrop-blur-sm">
      {/* 0. 引导生成 — 拉新主入口 */}
      <div className="p-4 border-b border-espresso/8">
        <button
          type="button"
          onClick={() => navigate('/guide')}
          className={`w-full rounded-xl px-3 py-3 text-left transition-all cursor-pointer ${
            isOnGuide
              ? 'bg-terracotta text-cream shadow-md'
              : 'bg-terracotta/10 border border-terracotta/20 hover:bg-terracotta/15 hover:border-terracotta/30'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isOnGuide ? 'bg-cream/20' : 'bg-terracotta/15'
              }`}
            >
              <Wand2 className={`w-4 h-4 ${isOnGuide ? 'text-cream' : 'text-terracotta-deep'}`} />
            </span>
            <div className="min-w-0">
              <span className={`block text-sm font-semibold ${isOnGuide ? 'text-cream' : 'text-espresso'}`}>
                引导生成
              </span>
              <span className={`block text-[10px] mt-0.5 truncate ${isOnGuide ? 'text-cream/80' : 'text-espresso-soft'}`}>
                描述需求，快速出稿
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* 1. 我的提示词 — 全部为区块视图，文件夹为子级分组 */}
      <div className="p-4 border-b border-espresso/8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-semibold text-sage uppercase tracking-[0.2em]">我的提示词</h2>
          <button onClick={onToggle} className="text-sage-light hover:text-espresso cursor-pointer">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={goAllPrompts}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-full text-sm transition-all cursor-pointer ${navBtnClass(allPromptsActive)}`}
        >
          <FileText className="w-4 h-4 flex-shrink-0" />
          全部提示词
        </button>

        <div className="mt-3">
          <h3 className="text-[10px] font-semibold text-sage-light uppercase tracking-[0.15em] mb-1.5 px-3">
            文件夹
          </h3>

          <div className="space-y-0.5 max-h-40 overflow-y-auto pl-1">
            {folders.length === 0 ? (
              <p className="text-xs text-sage-light italic px-3 py-1">暂无文件夹</p>
            ) : (
              folders.map((folder) => (
                <div key={folder.id} className="group relative">
                  <button
                    onClick={() => {
                      onFolderSelect(folder.id);
                      if (!isOnPrompts) navigate('/');
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ folder, x: e.clientX, y: e.clientY });
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all cursor-pointer ${folderBtnClass(isOnPrompts && selectedFolder === folder.id)}`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: folder.color }}
                    />
                    <span className="truncate">{folder.name}</span>
                  </button>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => setShowNewFolder(true)}
            className="w-full flex items-center gap-2 px-3 py-1.5 mt-1 rounded-full text-xs text-sage-light hover:text-terracotta hover:bg-espresso/5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            新建文件夹
          </button>
        </div>

        {showNewFolder && (
          <div className="mt-2 p-2 bg-cream rounded-arc-md border border-espresso/10">
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') setShowNewFolder(false);
              }}
              className="input-field text-xs mb-1.5"
              placeholder="文件夹名称"
            />
            <div className="flex gap-1">
              <button onClick={handleCreateFolder} className="btn-primary text-xs !px-2 !py-1">
                创建
              </button>
              <button onClick={() => setShowNewFolder(false)} className="btn-secondary text-xs !px-2 !py-1">
                取消
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. 工具 */}
      <div className="p-4">
        <h2 className="text-[10px] font-semibold text-sage uppercase tracking-[0.2em] mb-3">工具</h2>
        <nav className="space-y-0.5">
          {toolNavItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-full text-sm transition-all cursor-pointer ${navBtnClass(item.active)}`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {contextMenu && (
        <div
          className="fixed z-50 bg-paper border border-espresso/10 rounded-arc-md shadow-lg py-1 w-36"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleRenameFolder(contextMenu.folder.id)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-espresso hover:bg-espresso/5 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            重命名
          </button>
          <button
            onClick={() => handleDeleteFolder(contextMenu.folder.id)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            删除
          </button>
        </div>
      )}
    </div>
  );
}