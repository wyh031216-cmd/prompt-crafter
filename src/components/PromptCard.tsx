import { Clock, Tag, ChevronRight } from 'lucide-react';
import type { Prompt, Folder } from '../types/prompt';
import { useNavigate } from 'react-router-dom';

interface PromptCardProps {
  prompt: Prompt;
  folder?: Folder | null;
  showFolder?: boolean;
}

export default function PromptCard({ prompt, folder, showFolder = true }: PromptCardProps) {
  const navigate = useNavigate();
  const preview = prompt.content.slice(0, 120).replace(/\{\{\w+\}\}/g, (m) => m);
  const isGuided = prompt.tags.includes('guided');

  return (
    <div
      className="card-hover p-4 cursor-pointer group"
      onClick={() => navigate(`/edit/${prompt.id}`)}
    >
      <div className="flex items-start justify-between mb-2 gap-2">
        <h3 className="font-serif text-lg text-espresso truncate flex-1">{prompt.title}</h3>
        {isGuided && (
          <span className="flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-sage/15 text-sage">
            引导
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-sage-light group-hover:text-terracotta transition-colors flex-shrink-0" />
      </div>

      <p className="text-sm text-espresso-soft line-clamp-2 mb-3 leading-relaxed">{preview}</p>

      <div className="flex items-center gap-2 flex-wrap text-xs text-sage-light">
        {showFolder && folder && (
          <span className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: folder.color }}
            />
            {folder.name}
          </span>
        )}

        {prompt.tags.length > 0 && (
          <span className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {prompt.tags.slice(0, 2).join(', ')}
            {prompt.tags.length > 2 && '...'}
          </span>
        )}

        <span className="flex items-center gap-1 ml-auto">
          <Clock className="w-3 h-3" />
          {new Date(prompt.updatedAt).toLocaleDateString('zh-CN')}
        </span>
      </div>
    </div>
  );
}
