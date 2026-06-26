import type { OptimizeAction } from './types';

export function getActionPrompt(action: OptimizeAction, customInstruction?: string): string {
  switch (action) {
    case 'improve':
      return '请优化以下提示词。使其更清晰、具体、有效。保持原意，但改进结构和表达方式。\n\n优化原则：\n1. 明确角色和任务\n2. 具体而非模糊\n3. 包含输出格式要求\n4. 加入约束条件和验收标准\n5. 使用积极肯定的语言\n\n请直接输出优化后的提示词，不要添加额外说明。';
    case 'elaborate':
      return '请将以下提示词扩展得更详细、更具体。增加上下文、示例、约束条件和详细的输出要求，使其更完善。\n\n请直接输出扩展后的提示词，不要添加额外说明。';
    case 'shorten':
      return '请将以下提示词精简到最核心的内容，去除冗余表达，保持信息完整但更加简洁。\n\n请直接输出精简后的提示词，不要添加额外说明。';
    case 'restructure':
      return '请重新组织以下提示词的结构，使用标题、列表、分段等方式使其更有层次感、更易读。用 Markdown 格式输出。\n\n请直接输出重构后的提示词，不要添加额外说明。';
    case 'spellcheck':
      return '请检查以下提示词中的拼写、语法和标点错误，修正错误后直接输出修正后的完整版本。\n\n请只输出修正后的文本，不要添加说明。';
    case 'translate-cn':
      return '请将以下提示词翻译成中文，保持技术术语准确，语气和专业风格与原文一致。\n\n请直接输出翻译后的内容，不要添加额外说明。';
    case 'translate-en':
      return 'Please translate the following prompt into professional English. Maintain accurate technical terminology and keep the tone consistent with the original.\n\nOutput only the translated prompt, no additional text.';
    case 'custom':
      return customInstruction || '请优化以下提示词。';
  }
}

export function buildSystemPrompt(action: OptimizeAction): string {
  if (action === 'translate-en') {
    return 'You are a professional prompt engineer and translator. Your task is to translate and optimize prompts. Output only the result.';
  }
  return '你是一位专业的提示词工程师（Prompt Engineer）。你的任务是帮助用户优化他们的提示词。请直接输出优化后的结果，不要添加任何额外说明、评论或解释。';
}

export function getActionLabel(action: OptimizeAction): string {
  const labels: Record<OptimizeAction, string> = {
    improve: '✨ 智能优化',
    elaborate: '📖 扩写完善',
    shorten: '📏 精简浓缩',
    restructure: '🏗️ 重构结构',
    spellcheck: '✅ 语法修正',
    'translate-cn': '🌐 译成中文',
    'translate-en': '🌐 译成英文',
    custom: '⚡ 自定义',
  };
  return labels[action];
}