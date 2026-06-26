import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { repo } from '../data';
import type { Prompt, Folder } from '../types/prompt';
import PromptCard from '../components/PromptCard';
import SearchBar from '../components/SearchBar';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import BackupBanner from '../components/BackupBanner';
import HomeHero from '../components/HomeHero';
import StorageStatusBadge from '../components/StorageStatusBadge';
import OnboardingCard from '../components/OnboardingCard';
import { exportAllPromptsBackup } from '../utils/backupExport';
import { shouldShowBackupReminder } from '../utils/backupReminder';
import { shouldShowOnboarding } from '../utils/onboarding';

interface OutletContext {
  selectedFolder: string | null;
  refreshKey: number;
  onRefresh: () => void;
  onFolderSelect: (folderId: string | null) => void;
}

function PromptGrid({
  prompts,
  folders,
  showFolder = false,
}: {
  prompts: Prompt[];
  folders: Map<string, Folder>;
  showFolder?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {prompts.map((prompt) => (
        <PromptCard
          key={prompt.id}
          prompt={prompt}
          folder={prompt.folderId ? folders.get(prompt.folderId) : null}
          showFolder={showFolder}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { selectedFolder, refreshKey, onFolderSelect } = useOutletContext<OutletContext>();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [folderList, setFolderList] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [exportingBackup, setExportingBackup] = useState(false);
  const [showBackupBanner, setShowBackupBanner] = useState(false);

  const folders = useMemo(
    () => new Map(folderList.map((f) => [f.id, f])),
    [folderList],
  );

  const loadPrompts = useCallback(async () => {
    setLoading(true);
    try {
      let result: Prompt[];
      if (searchQuery) {
        result = await repo.searchPrompts(searchQuery);
      } else if (selectedFolder !== null) {
        result = await repo.getPromptsByFolder(selectedFolder);
      } else {
        result = await repo.getAllPrompts();
      }
      setPrompts(result);
      setFolderList(await repo.getAllFolders());
    } finally {
      setLoading(false);
    }
  }, [selectedFolder, searchQuery]);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts, refreshKey]);

  useEffect(() => {
    if (loading) return;
    setShowBackupBanner(shouldShowBackupReminder(prompts.length));
  }, [loading, prompts.length, refreshKey]);

  const handleQuickBackup = useCallback(async () => {
    setExportingBackup(true);
    try {
      await exportAllPromptsBackup();
      setShowBackupBanner(false);
    } finally {
      setExportingBackup(false);
    }
  }, []);

  const currentFolder = selectedFolder ? folders.get(selectedFolder) : null;
  const isAllView = !searchQuery && selectedFolder === null;

  const grouped = useMemo(() => {
    if (!isAllView) return null;

    const uncategorized = prompts.filter((p) => !p.folderId);
    const byFolderId = new Map<string, Prompt[]>();

    for (const prompt of prompts) {
      if (!prompt.folderId) continue;
      const list = byFolderId.get(prompt.folderId) ?? [];
      list.push(prompt);
      byFolderId.set(prompt.folderId, list);
    }

    const folderSections = folderList
      .filter((folder) => (byFolderId.get(folder.id)?.length ?? 0) > 0)
      .map((folder) => ({
        folder,
        prompts: byFolderId.get(folder.id) ?? [],
      }));

    return { uncategorized, folderSections };
  }, [isAllView, prompts, folderList]);

  const pageEyebrow = searchQuery
    ? '我的提示词'
    : currentFolder
      ? '我的提示词 · 文件夹'
      : '我的提示词';

  const pageTitle = currentFolder
    ? currentFolder.name
    : searchQuery
      ? `搜索: "${searchQuery}"`
      : '全部提示词';

  const pageDesc = currentFolder
    ? `${prompts.length} 个提示词`
    : searchQuery
      ? `找到 ${prompts.length} 个结果`
      : `共 ${prompts.length} 个已保存的提示词`;

  const showHero = isAllView && !loading;
  const isFolderView = !searchQuery && currentFolder !== null;
  const isSearchView = !!searchQuery;
  const showOnboarding = isAllView && !loading && shouldShowOnboarding(prompts.length);
  const latestPromptId = prompts[0]?.id ?? null;

  return (
    <div className="max-w-5xl mx-auto">
      {showHero ? (
        <>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0" />
            <StorageStatusBadge />
          </div>
          <HomeHero compact={prompts.length > 0} />
          {prompts.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage mb-1">
                {pageEyebrow}
              </p>
              <h2 className="font-serif text-2xl text-espresso">{pageTitle}</h2>
              <p className="text-sm text-espresso-soft mt-1">{pageDesc}</p>
            </div>
          )}
        </>
      ) : isFolderView && currentFolder ? (
        <div className="mb-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <button
              type="button"
              onClick={() => onFolderSelect(null)}
              className="inline-flex items-center gap-1.5 text-xs text-sage-light hover:text-espresso-soft transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              全部提示词
            </button>
            <StorageStatusBadge />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border border-espresso/8"
                style={{ backgroundColor: `${currentFolder.color}18` }}
              >
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: currentFolder.color }}
                />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage mb-0.5">
                  文件夹
                </p>
                <h2 className="font-serif text-2xl text-espresso truncate">{currentFolder.name}</h2>
                <p className="text-sm text-espresso-soft mt-0.5">{pageDesc}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/new')}
              className="btn-primary text-sm flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              新建提示词
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <PageHeader
              className="!mb-0 flex-1 min-w-0"
              eyebrow={pageEyebrow}
              title={pageTitle}
              description={pageDesc}
            />
            <StorageStatusBadge />
          </div>
        </div>
      )}

      {showOnboarding && (
        <OnboardingCard promptCount={prompts.length} latestPromptId={latestPromptId} />
      )}

      {showBackupBanner && (
        <BackupBanner
          promptCount={prompts.length}
          exporting={exportingBackup}
          onExport={handleQuickBackup}
        />
      )}

      {!isFolderView || prompts.length > 0 ? (
        <div className="mb-6">
          <SearchBar onSearch={setSearchQuery} placeholder="搜索标题、内容或标签..." />
        </div>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-5 bg-blush rounded w-3/4 mb-3" />
              <div className="h-4 bg-paper rounded w-full mb-2" />
              <div className="h-4 bg-paper rounded w-2/3 mb-3" />
              <div className="h-3 bg-paper rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : prompts.length === 0 && !showOnboarding ? (
        <EmptyState
          variant={currentFolder ? 'panel' : 'default'}
          icon={currentFolder ? 'folder' : 'file'}
          accentColor={currentFolder?.color}
          title={
            searchQuery
              ? '没有找到匹配的提示词'
              : currentFolder
                ? '这个文件夹是空的'
                : '还没有提示词'
          }
          description={
            searchQuery
              ? '换个关键词试试，或检查拼写与标签'
              : currentFolder
                ? `保存提示词时选择「${currentFolder.name}」，内容会归入此文件夹`
                : '推荐从「引导生成」开始——描述需求即可出稿，自动存入词库'
          }
          action={
            !searchQuery && !currentFolder
              ? { label: '引导生成', onClick: () => navigate('/guide') }
              : !searchQuery && currentFolder
                ? { label: '新建提示词', onClick: () => navigate('/new') }
                : isSearchView
                  ? { label: '查看全部', onClick: () => setSearchQuery(''), variant: 'secondary' }
                  : undefined
          }
          secondaryAction={
            !searchQuery && !currentFolder
              ? { label: '新建空白', onClick: () => navigate('/new'), variant: 'secondary' }
              : undefined
          }
        />
      ) : isAllView && grouped ? (
        <div className="space-y-8">
          {grouped.uncategorized.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-espresso mb-3">未分类</h3>
              <PromptGrid prompts={grouped.uncategorized} folders={folders} />
            </section>
          )}

          {grouped.folderSections.length > 0 && (
            <section>
              <h3 className="text-[10px] font-semibold text-sage-light uppercase tracking-[0.15em] mb-4">
                文件夹
              </h3>
              <div className="space-y-6">
                {grouped.folderSections.map(({ folder, prompts: folderPrompts }) => (
                  <div key={folder.id}>
                    <button
                      type="button"
                      onClick={() => onFolderSelect(folder.id)}
                      className="flex items-center gap-2 mb-3 text-left cursor-pointer group"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: folder.color }}
                      />
                      <span className="text-sm font-semibold text-espresso group-hover:text-terracotta-deep transition-colors">
                        {folder.name}
                      </span>
                      <span className="text-xs text-sage-light">{folderPrompts.length}</span>
                    </button>
                    <PromptGrid prompts={folderPrompts} folders={folders} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <PromptGrid prompts={prompts} folders={folders} showFolder={!!searchQuery} />
      )}
    </div>
  );
}