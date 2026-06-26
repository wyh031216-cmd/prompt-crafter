import { useMemo } from 'react';
import { estimateTokens, estimateCost, type ModelKey, MODEL_OPTIONS } from '../utils/tokenCounter';
import { Hash, DollarSign } from 'lucide-react';

interface TokenCounterProps {
  content: string;
  model?: ModelKey;
  onModelChange?: (model: ModelKey) => void;
}

export default function TokenCounter({ content, model = 'default', onModelChange }: TokenCounterProps) {
  const result = useMemo(() => estimateTokens(content, model), [content, model]);
  const costIn = useMemo(() => estimateCost(result.tokens, model, 'input'), [result.tokens, model]);
  const costOut = useMemo(() => estimateCost(result.tokens, model, 'output'), [result.tokens, model]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Hash className="w-3.5 h-3.5 text-sage-light" />
        <span className="text-xs font-medium text-espresso-soft">Token 估算</span>
      </div>

      {onModelChange && (
        <select
          value={model}
          onChange={(e) => onModelChange(e.target.value as ModelKey)}
          className="w-full text-xs px-2 py-1.5 border border-espresso/10 rounded-lg mb-2 focus:outline-none focus:border-terracotta bg-paper"
        >
          {MODEL_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-cream rounded-lg p-2.5 text-center">
          <div className="text-lg font-bold text-terracotta">{result.tokens.toLocaleString()}</div>
          <div className="text-xs text-espresso-soft">Tokens</div>
        </div>
        <div className="bg-cream rounded-lg p-2.5 text-center">
          <div className="text-lg font-bold text-espresso">{result.chars.toLocaleString()}</div>
          <div className="text-xs text-espresso-soft">字符</div>
        </div>
      </div>

      <div className="mt-2 text-xs text-sage-light space-y-0.5">
        <div className="flex items-center gap-1">
          <DollarSign className="w-3 h-3" />
          输入 ≈ ${costIn.toFixed(5)} / 输出 ≈ ${costOut.toFixed(5)}
        </div>
        <p className="italic">* 估算值，实际以模型为准</p>
      </div>
    </div>
  );
}
