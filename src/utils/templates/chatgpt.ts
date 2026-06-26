import type { PromptTemplate } from './types';

export const CHATGPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'chatgpt-system-user',
    name: 'System + User 结构',
    description: 'OpenAI API / ChatGPT 标准双消息结构',
    category: 'chatgpt',
    icon: '💬',
    template: `=== SYSTEM ===
{{system_prompt}}

=== USER ===
{{user_prompt}}

=== 参数建议 ===
- model: {{model}}
- temperature: {{temperature}}
- response_format: {{response_format}}`,
    variables: [
      { name: 'system_prompt', description: 'System 消息', defaultValue: 'You are a senior copywriter. Write concise, persuasive marketing copy. Always respond in 简体中文.' },
      { name: 'user_prompt', description: 'User 消息', defaultValue: '为一款敏感肌保湿面霜写 3 条小红书标题，每条不超过 20 字，带 emoji。' },
      { name: 'model', description: '模型', defaultValue: 'gpt-4o' },
      { name: 'temperature', description: '温度', defaultValue: '0.7' },
      { name: 'response_format', description: '响应格式', defaultValue: 'text（或 json_object）' },
    ],
    tips: ['System 放角色和规则，User 放具体任务', 'gpt-4o 多模态可附图', 'JSON mode 需在 system 中说明 JSON 结构'],
  },
  {
    id: 'chatgpt-custom-gpt',
    name: 'Custom GPT 指令',
    description: '创建自定义 GPT 的 Instructions',
    category: 'chatgpt',
    icon: '🤖',
    template: `# Role
{{role}}

# What you do
{{capabilities}}

# How you respond
- Default language: {{language}}
- Style: {{style}}
- Always start by: {{opening_behavior}}

# Knowledge & Tools
{{tools_knowledge}}

# Boundaries
{{boundaries}}

# Example interaction
User: {{example_user}}
Assistant: {{example_assistant}}`,
    variables: [
      { name: 'role', description: '角色', defaultValue: '「提示词教练」— 帮用户写出更好的 AI 提示词' },
      { name: 'capabilities', description: '能力', defaultValue: '1. 分析用户草稿提示词的缺陷\n2. 给出改进版\n3. 解释每条修改的原因' },
      { name: 'language', description: '语言', defaultValue: '简体中文' },
      { name: 'style', description: '风格', defaultValue: '友好、具体、可执行' },
      { name: 'opening_behavior', description: '开场行为', defaultValue: '确认用户的 AI 平台和目标任务' },
      { name: 'tools_knowledge', description: '工具/知识', defaultValue: '可浏览网页查最新模型能力；不上传文件' },
      { name: 'boundaries', description: '边界', defaultValue: '不生成违法内容；不假装能访问用户本地文件' },
      { name: 'example_user', description: '示例用户输入', defaultValue: '帮我写个写周报用的提示词' },
      { name: 'example_assistant', description: '示例回复', defaultValue: '好的！你周报主要面向谁？技术团队还是管理层？需要包含哪些模块？' },
    ],
    tips: ['Instructions 限 8000 字符', '示例对话能显著提升一致性', 'Boundaries 防止 GPT 越界'],
  },
  {
    id: 'chatgpt-json-mode',
    name: 'JSON Mode',
    description: 'response_format: json_object 专用',
    category: 'chatgpt',
    icon: '📐',
    template: `You must respond with a valid JSON object only. No other text.

## Task
{{task}}

## Required JSON structure
{
  {{json_fields}}
}

## Input data
{{input_data}}

## Rules
1. All fields must be present
2. {{extra_rules}}
3. Output must parse with JSON.parse()`,
    variables: [
      { name: 'task', description: '任务', defaultValue: '从用户评论中提取情感和产品问题' },
      { name: 'json_fields', description: 'JSON 字段', defaultValue: '"sentiment": "positive|neutral|negative",\n  "issues": ["string"],\n  "summary": "string"' },
      { name: 'input_data', description: '输入数据', defaultValue: '（粘贴评论文本）' },
      { name: 'extra_rules', description: '额外规则', defaultValue: 'issues 数组最多 5 项，无问题时为空数组' },
    ],
    tips: ['System 和 User 都要提 JSON', 'API 设 response_format: { type: "json_object" }', '给完整 schema 示例'],
  },
  {
    id: 'chatgpt-dalle',
    name: 'DALL·E 图像',
    description: 'ChatGPT / DALL·E 文生图提示词',
    category: 'chatgpt',
    icon: '🖼️',
    template: `{{subject}}, {{art_style}}.

{{scene_detail}}
Lighting: {{lighting}}
Composition: {{composition}}
Color mood: {{color_mood}}

Style notes: {{style_notes}}`,
    variables: [
      { name: 'subject', description: '主体', defaultValue: 'A serene Japanese garden with a red bridge over a koi pond' },
      { name: 'art_style', description: '艺术风格', defaultValue: 'digital illustration in Studio Ghibli style' },
      { name: 'scene_detail', description: '场景细节', defaultValue: 'Cherry blossoms falling, misty mountains in background, golden hour' },
      { name: 'lighting', description: '光线', defaultValue: 'warm soft backlight, gentle shadows' },
      { name: 'composition', description: '构图', defaultValue: 'wide landscape, rule of thirds' },
      { name: 'color_mood', description: '色调', defaultValue: 'pastel pinks and greens, dreamy atmosphere' },
      { name: 'style_notes', description: '风格备注', defaultValue: 'high detail, no text, no watermark' },
    ],
    tips: ['DALL·E 对自然语言友好', '避免真实名人姓名', '风格参考用艺术家/流派而非抄袭'],
  },
  {
    id: 'chatgpt-canvas-code',
    name: 'Canvas 代码协作',
    description: 'ChatGPT Canvas 编程/文档协作',
    category: 'chatgpt',
    icon: '💻',
    template: `## Project Context
{{project_context}}

## Current Code / Document
\`\`\`{{language}}
{{current_code}}
\`\`\`

## Task
{{task}}

## Requirements
1. {{req1}}
2. {{req2}}
3. {{req3}}

## Output
- Modify the code directly in Canvas
- Add brief comments for non-obvious changes
- After changes, list what you changed in 3 bullets`,
    variables: [
      { name: 'project_context', description: '项目背景', defaultValue: 'React + TypeScript 提示词编辑器，使用 Dexie 本地存储' },
      { name: 'language', description: '语言', defaultValue: 'typescript' },
      { name: 'current_code', description: '当前代码', defaultValue: '（粘贴代码片段）' },
      { name: 'task', description: '任务', defaultValue: '添加按 AI 平台筛选模板的功能' },
      { name: 'req1', description: '要求1', defaultValue: '不破坏现有 API' },
      { name: 'req2', description: '要求2', defaultValue: 'TypeScript 类型完整' },
      { name: 'req3', description: '要求3', defaultValue: '保持现有代码风格' },
    ],
    tips: ['Canvas 适合迭代改代码', '给出项目上下文减少幻觉', '要求列出改动便于 review'],
  },
  {
    id: 'chatgpt-reasoning',
    name: '复杂推理任务',
    description: '适合 o 系列 / 多步逻辑与方案对比',
    category: 'chatgpt',
    icon: '🧩',
    template: `Solve the following problem with rigorous step-by-step reasoning.

## Problem
{{problem}}

## Constraints
{{constraints}}

## Process
1. Restate the problem and success criteria
2. List assumptions and unknowns
3. Compare {{option_count}} viable approaches in a table (pros/cons/effort/risk)
4. Pick one approach and justify
5. Execute with numbered steps
6. Sanity-check the result against constraints

## Output
- Show reasoning clearly
- Final answer in a boxed **结论** section
- Language: {{language}}`,
    variables: [
      { name: 'problem', description: '问题', defaultValue: '设计提示词模板库的搜索与平台筛选架构，需支持 70+ 模板、离线可用' },
      { name: 'constraints', description: '约束', defaultValue: '纯前端、IndexedDB 存储、不改现有编辑器 API' },
      { name: 'option_count', description: '方案数', defaultValue: '3' },
      { name: 'language', description: '语言', defaultValue: '简体中文' },
    ],
    tips: ['o 系列不必写 think step by step', '表格对比方案更清晰', '明确 success criteria 防跑题'],
  },
  {
    id: 'chatgpt-prompt-improve',
    name: '提示词优化器',
    description: '诊断并改写提示词草稿',
    category: 'chatgpt',
    icon: '✨',
    template: `You are a prompt engineering coach.

## Target AI
{{target_ai}}

## User's Task
{{user_task}}

## Draft Prompt
\`\`\`
{{draft_prompt}}
\`\`\`

## Your Job
1. **Diagnosis** — list issues (vague role, missing format, no constraints, etc.)
2. **Improved Prompt** — rewrite completely, ready to copy
3. **Changelog** — bullet list: what you changed and why
4. **Optional variants** — {{variant_note}}

Keep the user's intent; do not over-engineer.`,
    variables: [
      { name: 'target_ai', description: '目标 AI', defaultValue: 'ChatGPT gpt-4o' },
      { name: 'user_task', description: '用户任务', defaultValue: '把会议录音整理成待办清单' },
      { name: 'draft_prompt', description: '草稿', defaultValue: '帮我整理会议纪要，要清楚一点' },
      { name: 'variant_note', description: '变体说明', defaultValue: '给一个「更短」和一个「更严谨」版本' },
    ],
    tips: ['说明目标 AI 模型很重要', 'Changelog 帮助用户学会写法', '适合 Custom GPT 内核指令'],
  },
  {
    id: 'chatgpt-ad-copy-ab',
    name: '广告文案 A/B',
    description: '生成多版投放文案并说明测试假设',
    category: 'chatgpt',
    icon: '📢',
    template: `Create A/B ad copy variants for {{channel}}.

## Product
{{product}}

## Audience
{{audience}}

## Campaign Goal
{{goal}}

## Deliverables
For each variant (A/B/C):
- Headline ({{headline_limit}} chars)
- Primary text ({{body_limit}} chars)
- CTA
- **Hypothesis** — what psychological angle this tests

## Constraints
{{constraints}}

Language: {{language}}`,
    variables: [
      { name: 'channel', description: '渠道', defaultValue: 'Meta Feed 广告' },
      { name: 'product', description: '产品', defaultValue: '敏感肌保湿面霜，199 元，无香精' },
      { name: 'audience', description: '受众', defaultValue: '25-35 岁女性，一二线城市，护肤意识强' },
      { name: 'goal', description: '目标', defaultValue: '点击落地页，提高加购' },
      { name: 'headline_limit', description: '标题字数', defaultValue: '40' },
      { name: 'body_limit', description: '正文字数', defaultValue: '125' },
      { name: 'constraints', description: '约束', defaultValue: '不用绝对化用语；不含医疗功效承诺' },
      { name: 'language', description: '语言', defaultValue: '简体中文' },
    ],
    tips: ['Hypothesis 字段便于投放复盘', '字数限制按平台改', 'gpt-4o 营销语感好'],
  },
];