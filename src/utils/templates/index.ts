import { GROK_TEMPLATES } from './grok';
import { GEMINI_TEMPLATES } from './gemini';
import { CHATGPT_TEMPLATES } from './chatgpt';
import { CLAUDE_TEMPLATES } from './claude';
import { DEEPSEEK_TEMPLATES } from './deepseek';
import { QWEN_TEMPLATES } from './qwen';
import { DOUBAO_TEMPLATES } from './doubao';
import { GENERAL_TEMPLATES } from './general';

export type {
  AIPlatform,
  TemplateSubcategory,
  PromptTemplate,
  TemplateCategory,
} from './types';

export {
  AI_PLATFORMS,
  GENERAL_SUBCATEGORIES,
  TEMPLATE_CATEGORIES,
} from './types';

/** 按 AI 平台排序的模板列表 */
export const PROMPT_TEMPLATES = [
  ...GROK_TEMPLATES,
  ...GEMINI_TEMPLATES,
  ...CHATGPT_TEMPLATES,
  ...CLAUDE_TEMPLATES,
  ...DEEPSEEK_TEMPLATES,
  ...QWEN_TEMPLATES,
  ...DOUBAO_TEMPLATES,
  ...GENERAL_TEMPLATES,
];

/** 各平台模板数量统计 */
export const PLATFORM_TEMPLATE_COUNTS: Record<string, number> = {
  grok: GROK_TEMPLATES.length,
  gemini: GEMINI_TEMPLATES.length,
  chatgpt: CHATGPT_TEMPLATES.length,
  claude: CLAUDE_TEMPLATES.length,
  deepseek: DEEPSEEK_TEMPLATES.length,
  qwen: QWEN_TEMPLATES.length,
  doubao: DOUBAO_TEMPLATES.length,
  general: GENERAL_TEMPLATES.length,
};

export function getTemplatesByPlatform(platform: string) {
  return PROMPT_TEMPLATES.filter((t) => t.category === platform);
}