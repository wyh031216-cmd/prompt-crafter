import type { SyntheticEvent } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { Variable } from '../types/prompt';

interface VariablePanelProps {
  variables: Variable[];
  onChange: (variables: Variable[]) => void;
}

export default function VariablePanel({ variables, onChange }: VariablePanelProps) {
  const addVariable = () => {
    const baseName = 'var';
    let i = 1;
    while (variables.some((v) => v.name === `${baseName}${i}`)) i++;
    onChange([...variables, { name: `${baseName}${i}`, defaultValue: '', description: '' }]);
  };

  const updateVariable = (index: number, field: keyof Variable, value: string) => {
    const updated = variables.map((v, i) => (i === index ? { ...v, [field]: value } : v));
    onChange(updated);
  };

  const removeVariable = (index: number) => {
    onChange(variables.filter((_, i) => i !== index));
  };

  const stopEditCapture = (e: SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="flex flex-col flex-1 min-h-0" data-vc-ignore>
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <h3 className="text-sm font-semibold text-espresso">
          模板变量
          {variables.length > 0 && (
            <span className="ml-1.5 text-xs font-normal text-sage-light">{variables.length}</span>
          )}
        </h3>
        <button onClick={addVariable} className="btn-ghost text-xs">
          <Plus className="w-3.5 h-3.5" />
          添加
        </button>
      </div>

      {variables.length === 0 ? (
        <p className="text-xs text-sage-light italic">
          在内容中使用 <code className="text-terracotta bg-terracotta/10 px-1 rounded">{'{{变量名}}'}</code> 添加变量
        </p>
      ) : (
        <div className="space-y-2 overflow-y-auto overscroll-contain flex-1 min-h-0 pr-0.5 -mr-0.5">
          {variables.map((v, i) => (
            <div
              key={`${v.name}-${i}`}
              className="p-2 bg-cream rounded-arc-md border border-espresso/8 select-text"
              data-vc-ignore
              onMouseDown={stopEditCapture}
              onClick={stopEditCapture}
            >
              <div className="flex items-start gap-1.5 mb-1.5">
                <GripVertical className="w-3.5 h-3.5 text-sage-light mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <code className="text-[11px] font-mono text-terracotta-deep bg-terracotta/10 px-1 py-0.5 rounded flex-shrink-0 select-all">
                      {'{{'}{v.name}{'}}'}
                    </code>
                    <input
                      value={v.name}
                      onChange={(e) => updateVariable(i, 'name', e.target.value)}
                      className="input-field text-[11px] font-mono flex-1 min-w-0 !py-0.5 !px-1.5"
                      placeholder="变量名"
                      spellCheck={false}
                      title="修改变量名"
                    />
                  </div>
                  {v.description && (
                    <p className="text-[10px] text-sage-light mt-0.5 line-clamp-1">{v.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeVariable(i)}
                  className="text-sage-light hover:text-red-500 transition-colors cursor-pointer flex-shrink-0"
                  title="删除变量"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                id={`var-default-${v.name}`}
                value={v.defaultValue}
                onChange={(e) => updateVariable(i, 'defaultValue', e.target.value)}
                rows={2}
                className="input-field text-xs select-text w-full resize-y min-h-[2.75rem] leading-relaxed"
                placeholder={v.description || '填写默认值，预览时自动代入'}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}