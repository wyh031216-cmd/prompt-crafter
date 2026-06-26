import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Clock, FileText, RotateCcw } from 'lucide-react';
import { repo } from '../data';
import type { Prompt, PromptVersion } from '../types/prompt';
import DiffViewer from '../components/DiffViewer';
import EmptyState from '../components/EmptyState';

export default function HistoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersions, setSelectedVersions] = useState<[string, string] | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      const [p, v] = await Promise.all([repo.getPrompt(id), repo.getVersions(id)]);
      if (p) setPrompt(p);
      setVersions(v);
      setLoading(false);
    };
    load();
  }, [id]);

  const handleDeleteVersion = async (versionId: string) => {
    if (!confirm('确定删除此版本？')) return;
    await repo.deleteVersion(versionId);
    setVersions((prev) => prev.filter((v) => v.id !== versionId));
  };

  const handleRestore = async (version: PromptVersion) => {
    if (!id) return;
    if (!confirm(`将「${version.note || '此版本'}」恢复为当前内容？现有未保存修改会被覆盖。`)) return;
    await repo.updatePrompt(id, {
      content: version.content,
      variables: version.variables,
    });
    await repo.createVersion(id, version.content, version.variables, `从版本恢复：${version.note || '历史版本'}`);
    navigate(`/edit/${id}`);
  };

  const handleCompare = (v1Id: string, v2Id: string) => {
    // Ensure v1 is older (smaller timestamp)
    const v1 = versions.find((v) => v.id === v1Id);
    const v2 = versions.find((v) => v.id === v2Id);
    if (!v1 || !v2) return;

    if (v1.createdAt <= v2.createdAt) {
      setSelectedVersions([v1Id, v2Id]);
    } else {
      setSelectedVersions([v2Id, v1Id]);
    }
  };

  const selectedDiff = selectedVersions
    ? {
        oldVersion: versions.find((v) => v.id === selectedVersions[0])!,
        newVersion: versions.find((v) => v.id === selectedVersions[1])!,
      }
    : null;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-sage-light">
        <div className="animate-spin w-6 h-6 border-2 border-terracotta border-t-transparent rounded-full mx-auto mb-2" />
        加载中...
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="max-w-4xl mx-auto">
        <EmptyState title="提示词不存在" description="该提示词可能已被删除" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate(`/edit/${id}`)} className="btn-ghost mb-4">
        <ArrowLeft className="w-4 h-4" />
        返回编辑器
      </button>

      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-5 h-5 text-terracotta" />
        <div>
          <h2 className="text-xl font-bold text-espresso">{prompt.title}</h2>
          <p className="text-sm text-espresso-soft">
            <Clock className="w-3.5 h-3.5 inline mr-1" />
            {versions.length} 个版本
          </p>
        </div>
      </div>

      {/* Diff view */}
      {selectedDiff && (
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-espresso">版本对比</h3>
            <button
              onClick={() => setSelectedVersions(null)}
              className="btn-ghost text-xs"
            >
              关闭对比
            </button>
          </div>
          <DiffViewer oldVersion={selectedDiff.oldVersion} newVersion={selectedDiff.newVersion} />
        </div>
      )}

      {/* Version list */}
      {versions.length === 0 ? (
        <EmptyState title="暂无版本历史" description="保存提示词后会自动创建版本快照" />
      ) : (
        <div className="space-y-2">
          {versions.map((version, i) => (
            <div key={version.id} className="card p-4 hover:border-terracotta/20 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-terracotta/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-terracotta">{versions.length - i}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-espresso">
                        {version.note || `版本 #${versions.length - i}`}
                      </span>
                      {i === 0 && (
                        <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">最新</span>
                      )}
                    </div>
                    <p className="text-xs text-sage-light">
                      {new Date(version.createdAt).toLocaleString('zh-CN')}
                      {' · '}
                      {version.content.length} 字符
                      {version.variables.length > 0 && ` · ${version.variables.length} 个变量`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleRestore(version)}
                    className="btn-primary text-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    恢复
                  </button>
                  {i < versions.length - 1 && (
                    <button
                      onClick={() => handleCompare(versions[i + 1].id, version.id)}
                      className="btn-ghost text-xs"
                    >
                      对比
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteVersion(version.id)}
                    className="btn-ghost text-xs text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Preview of this version */}
              <div className="mt-2 ml-11">
                <p className="text-xs text-espresso-soft line-clamp-2 font-mono bg-cream p-2 rounded">
                  {version.content.slice(0, 200)}
                  {version.content.length > 200 ? '...' : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
