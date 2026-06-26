/** AI 平台一级分类 */
export type AIPlatform =
  | 'grok'
  | 'gemini'
  | 'chatgpt'
  | 'claude'
  | 'deepseek'
  | 'qwen'
  | 'doubao'
  | 'general';

/** 通用提示词工程的二级分类（仅 general 使用） */
export type TemplateSubcategory =
  | 'role'
  | 'reasoning'
  | 'fewshot'
  | 'format'
  | 'expert'
  | 'creative'
  | 'analysis';

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: AIPlatform;
  subcategory?: TemplateSubcategory;
  icon: string;
  template: string;
  variables: Array<{ name: string; description: string; defaultValue: string }>;
  tips: string[];
}

/** icon 字段已弃用，UI 请用 AIPlatformIcon 组件 */
export const AI_PLATFORMS: Record<AIPlatform, { name: string; icon: string; color: string }> = {
  grok: { name: 'Grok', icon: 'grok', color: 'bg-espresso text-cream' },
  gemini: { name: 'Gemini', icon: 'gemini', color: 'bg-blue-50 text-blue-700' },
  chatgpt: { name: 'ChatGPT', icon: 'chatgpt', color: 'bg-emerald-50 text-emerald-700' },
  claude: { name: 'Claude', icon: 'claude', color: 'bg-orange-50 text-orange-800' },
  deepseek: { name: 'DeepSeek', icon: 'deepseek', color: 'bg-terracotta/10 text-terracotta-deep' },
  qwen: { name: '通义千问', icon: 'qwen', color: 'bg-purple-50 text-purple-700' },
  doubao: { name: '豆包', icon: 'doubao', color: 'bg-rose-50 text-rose-700' },
  general: { name: '通用工程', icon: 'general', color: 'bg-slate-50 text-slate-700' },
};

export const GENERAL_SUBCATEGORIES: Record<TemplateSubcategory, { name: string; icon: string }> = {
  role: { name: '角色扮演', icon: '🎭' },
  reasoning: { name: '推理思维', icon: '🧠' },
  fewshot: { name: '示例驱动', icon: '📋' },
  format: { name: '格式约束', icon: '📐' },
  expert: { name: '专家模式', icon: '👨‍🔬' },
  creative: { name: '创意写作', icon: '✍️' },
  analysis: { name: '分析对比', icon: '📊' },
};

/** @deprecated 使用 AIPlatform */
export type TemplateCategory = AIPlatform;

/** @deprecated 使用 AI_PLATFORMS */
export const TEMPLATE_CATEGORIES = AI_PLATFORMS;