import { useState } from 'react';
import { ChevronDown, ChevronRight, Lightbulb } from 'lucide-react';

interface GuideSection {
  title: string;
  content: string;
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    title: '🎯 提示词核心原则',
    content: `**做好提示词的 5 条黄金法则：**

1. **明确角色（Role）**
   告诉 AI 它应该以什么身份来回答。"你是一位资深律师"就比"请回答"好得多。

2. **清晰任务（Task）**
   用动词开头明确指令：分析、总结、对比、生成、翻译...

3. **提供上下文（Context）**
   背景信息越充分，AI 的回答越精准。包括目标受众、使用场景、已知条件。

4. **指定格式（Format）**
   明确输出的结构：JSON、表格、Markdown、列表、多少字...

5. **设定约束（Constraints）**
   告诉 AI 什么不能做：不要编造数据、只基于提供的资料、分 3 点回答...`,
  },
  {
    title: '🧪 提示词策略对比',
    content: `**不同策略的最佳使用场景：**

| 策略 | 适合场景 | 效果 |
|------|---------|------|
| 零样本 (Zero-Shot) | 简单任务 | ⭐⭐ |
| Few-Shot 示例 | 复杂/特定格式 | ⭐⭐⭐⭐⭐ |
| 思维链 (CoT) | 逻辑推理/数学 | ⭐⭐⭐⭐ |
| 角色扮演 | 特定领域任务 | ⭐⭐⭐⭐ |
| 逐步指导 | 多步骤任务 | ⭐⭐⭐⭐ |
| 格式约束 | 程序化输出 | ⭐⭐⭐⭐⭐ |

**经验法则：** 任务的复杂度越高，需要的提示词结构就越完整。`,
  },
  {
    title: '🔄 迭代优化方法',
    content: `**提示词不是一次写好的：**

1. **第一版**：基础版本，验证核心思路
   → AI 回答可能一般

2. **分析差距**：回答和期望的差距在哪里？
   → 格式不对？太简略？理解偏差？

3. **针对性增补**：
   - 理解偏差 → 加示例
   - 太简略 → 加输出要求
   - 格式不对 → 加格式模板

4. **重复 2-3 步**，直到满意

> 好的提示词通常是 3-5 次迭代的结果。`,
  },
  {
    title: '⚠️ 常见陷阱',
    content: `**避免这些常见错误：**

1. ❌ **过于模糊**
   "写点好东西" → "写一篇 500 字的科技博客，介绍 AI 在医疗领域的 3 个应用"

2. ❌ **任务过载**
   一次只给一个核心任务，不要试图在一个提示词里做完所有事

3. ❌ **忽略负面约束**
   不仅要说明"要什么"，也要说明"不要什么"

4. ❌ **假设 AI 知道背景**
   不要假设 AI 了解你的项目、代码库或行业，显式提供上下文

5. ❌ **一次定型**
   很少有提示词能一遍成功，迭代优化是常态`,
  },
  {
    title: '📐 提示词结构模板',
    content: `**推荐的提示词结构：**

\`\`\`
你是一位[角色]。

## 任务
[具体任务描述]

## 背景
[相关上下文]

## 要求
1. [要求1]
2. [要求2]
3. [要求3]

## 输出格式
[格式说明]

## 示例（可选）
输入：...
输出：...
\`\`\`

这种结构化方式能显著提高 AI 回答的质量和一致性。`,
  },
];

export default function PromptGuide() {
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0]));

  const toggle = (i: number) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-xs font-semibold text-espresso">提示词工程指南</span>
      </div>

      <div className="space-y-1">
        {GUIDE_SECTIONS.map((section, i) => (
          <div key={i} className="border border-espresso/8 rounded-lg overflow-hidden">
            <button
              onClick={() => toggle(i)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-espresso hover:bg-cream transition-colors cursor-pointer"
            >
              {section.title}
              {openSections.has(i) ? (
                <ChevronDown className="w-3 h-3 text-sage-light" />
              ) : (
                <ChevronRight className="w-3 h-3 text-sage-light" />
              )}
            </button>
            {openSections.has(i) && (
              <div className="px-3 py-2 border-t border-espresso/8">
                <div className="markdown-preview text-xs leading-relaxed">{parseSimpleMarkdown(section.content)}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function parseSimpleMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  lines.forEach((line, i) => {
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={i} className="bg-espresso text-cream p-2.5 rounded text-xs mb-2 overflow-x-auto font-mono">
            {codeBuffer.join('\n')}
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    if (line.startsWith('| ')) {
      elements.push(<div key={i} className="text-xs mb-1 font-mono">{line}</div>);
      return;
    }

    if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(
        <p key={i} className="font-bold text-espresso text-xs mb-1">
          {line.replace(/\*\*/g, '')}
        </p>
      );
      return;
    }

    if (line.startsWith('#') || (line.match(/^\d+\./) && !line.startsWith('|'))) {
      elements.push(
        <p key={i} className="text-xs mb-1 text-espresso">
          {formatInline(line)}
        </p>
      );
      return;
    }

    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="border-l-2 border-terracotta pl-2 text-xs text-espresso-soft italic mb-1">
          {formatInline(line.slice(2))}
        </blockquote>
      );
      return;
    }

    if (line.trim() === '') return;

    elements.push(
      <p key={i} className="text-xs mb-1 leading-relaxed">
        {formatInline(line)}
      </p>
    );
  });

  return elements;
}

function formatInline(text: string): React.ReactNode {
  // Handle **bold**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}
