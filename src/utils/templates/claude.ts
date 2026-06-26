import type { PromptTemplate } from './types';

export const CLAUDE_TEMPLATES: PromptTemplate[] = [
  {
    id: 'claude-xml-structure',
    name: 'XML 标准结构',
    description: 'Anthropic 官方结构；标签名英文，正文中文',
    category: 'claude',
    icon: '🏷️',
    template: `<role>
{{role}}
</role>

<context>
{{context}}
</context>

<input>
{{input}}
</input>

<instructions>
1. {{step_1}}
2. {{step_2}}
3. {{step_3}}
</instructions>

<constraints>
{{constraints}}
</constraints>

<output_format>
{{output_format}}
直接输出结果，不要「以下是…」「根据您的要求…」等开场白。
将最终交付内容放在 <answer> 标签内。全文使用简体中文。
</output_format>`,
    variables: [
      { name: 'role', description: '角色', defaultValue: '你是一位资深技术文档工程师，擅长把复杂系统写成清晰、可执行的说明。' },
      { name: 'context', description: '背景', defaultValue: '项目：词坊（prompt-crafter），本地优先的提示词工作台，含引导生成与模板库。' },
      { name: 'input', description: '输入材料', defaultValue: '（粘贴原文、数据或待处理内容）' },
      { name: 'step_1', description: '步骤 1', defaultValue: '理解任务目标与读者是谁' },
      { name: 'step_2', description: '步骤 2', defaultValue: '按约束完成核心任务' },
      { name: 'step_3', description: '步骤 3', defaultValue: '自检是否遗漏关键要求' },
      { name: 'constraints', description: '硬性约束', defaultValue: '- 面向非技术用户\n- 不超过 300 字\n- 不编造未提供的事实' },
      { name: 'output_format', description: '输出格式', defaultValue: 'Markdown：3 个小标题 + 编号步骤列表' },
    ],
    tips: [
      '标签名（role/context 等）保留英文即可，标签内写中文',
      '长文档放 <input>，步骤指令放后面',
      '说明「为何」比单纯禁止更有效',
    ],
  },
  {
    id: 'claude-few-shot',
    name: 'Few-shot 示例驱动',
    description: '用 3 个中文示例固定输出格式',
    category: 'claude',
    icon: '📋',
    template: `<task>
{{task}}
</task>

<instructions>
- 严格参照下方示例的写法与结构
- 示例已覆盖不同情况，请举一反三
- 默认只输出结果本身，不要解释过程（除非我特别要求）
- 使用简体中文
</instructions>

<examples>
<example>
<input>{{example_1_input}}</input>
<output>{{example_1_output}}</output>
</example>
<example>
<input>{{example_2_input}}</input>
<output>{{example_2_output}}</output>
</example>
<example>
<input>{{example_3_input}}</input>
<output>{{example_3_output}}</output>
</example>
</examples>

<input>
{{user_input}}
</input>

<output_format>
{{output_format}}
</output_format>`,
    variables: [
      { name: 'task', description: '任务', defaultValue: '将用户模糊需求改写为给 AI 的清晰任务说明' },
      { name: 'example_1_input', description: '示例1输入', defaultValue: '帮我弄一下那个登录' },
      { name: 'example_1_output', description: '示例1输出', defaultValue: '【目标】修复登录页 401 错误\n【步骤】1. 检查 token 刷新逻辑…' },
      { name: 'example_2_input', description: '示例2输入', defaultValue: '写个好看点的按钮' },
      { name: 'example_2_output', description: '示例2输出', defaultValue: '【目标】设计主 CTA 按钮\n【约束】品牌色 #C67B5C，圆角 8px…' },
      { name: 'example_3_input', description: '示例3输入', defaultValue: '总结一下这个会议' },
      { name: 'example_3_output', description: '示例3输出', defaultValue: '## 概要\n## 决策\n## 待办\n- [ ] …' },
      { name: 'user_input', description: '本次输入', defaultValue: '（粘贴待处理内容）' },
      { name: 'output_format', description: '输出格式', defaultValue: '与示例同结构的 Markdown，放入 <answer> 标签' },
    ],
    tips: [
      '示例用中文写即可，不必为了「官方」改成英文',
      '3 个示例要略有差异，避免 AI 死记硬背单一格式',
      '示例与本次任务越像，效果越好',
    ],
  },
  {
    id: 'claude-multi-document',
    name: '多文档分析',
    description: '长文档置顶，先引用原文再回答',
    category: 'claude',
    icon: '📚',
    template: `<documents>
  <document index="1">
    <source>{{doc_1_source}}</source>
    <document_content>
{{doc_1_content}}
    </document_content>
  </document>
  <document index="2">
    <source>{{doc_2_source}}</source>
    <document_content>
{{doc_2_content}}
    </document_content>
  </document>
</documents>

<instructions>
1. 先从文档中找出与问题相关的原文，摘录到 <quotes> 标签中，并注明来自哪份文档
2. 仅依据文档内容逐条回答问题，不要编造
3. 文档里没有的信息，写「文档未提及」，不要猜测
4. 最后用 <summary> 标签写 3 条执行摘要
5. 全文使用简体中文
</instructions>

<questions>
{{questions}}
</questions>`,
    variables: [
      { name: 'doc_1_source', description: '文档1来源', defaultValue: '2025年度报告.pdf' },
      { name: 'doc_1_content', description: '文档1内容', defaultValue: '（粘贴或摘要）' },
      { name: 'doc_2_source', description: '文档2来源', defaultValue: '竞品分析_Q2.xlsx' },
      { name: 'doc_2_content', description: '文档2内容', defaultValue: '（粘贴或摘要）' },
      { name: 'questions', description: '问题列表', defaultValue: '1. 核心增长点是什么？\n2. 主要风险？\n3. Q3 应优先做什么？' },
    ],
    tips: [
      '文档内容放最上面，问题放最后',
      '先引用再回答，能明显减少瞎编',
      '文件名用中文或中文+英文都可以',
    ],
  },
  {
    id: 'claude-artifacts',
    name: 'Artifacts 生成',
    description: '让 Claude 在侧边栏直接生成可预览页面/组件',
    category: 'claude',
    icon: '📦',
    template: `<instructions>
在 artifact 中创建一个可交互的 {{artifact_type}}。
请直接实现，不要只写方案或步骤说明。
输出完整、可立即预览的成品，依赖尽量内联，不要缺文件。
使用简体中文撰写界面文案（代码标识符可保持英文）。
</instructions>

<purpose>
{{purpose}}
</purpose>

<requirements>
{{requirements}}
</requirements>

<design>
- 视觉风格：{{style}}
- 响应式：{{responsive}}
- 无障碍：{{a11y}}
</design>

<content>
{{content}}
</content>`,
    variables: [
      { name: 'artifact_type', description: '产物类型', defaultValue: 'React 组件' },
      { name: 'purpose', description: '用途', defaultValue: '提示词模板卡片：展示平台徽章、标题、描述和变量数量' },
      { name: 'requirements', description: '功能要求', defaultValue: '- 点击可展开 tips\n- 平台色徽章\n- 悬停高亮' },
      { name: 'style', description: '风格', defaultValue: 'Tailwind CSS，陶土色主色，简洁干净' },
      { name: 'responsive', description: '响应式', defaultValue: '移动优先，小屏全宽' },
      { name: 'a11y', description: '无障碍', defaultValue: '支持键盘操作，对比度达标' },
      { name: 'content', description: '示例数据', defaultValue: '示例：Grok 视频单镜模板，4 个变量' },
    ],
    tips: [
      '保留 artifact 这个英文关键词，Claude 才能打开侧边预览',
      '写「直接实现」比「请建议方案」更容易出成品',
      '界面给用户看的文字用中文',
    ],
  },
  {
    id: 'claude-projects-system',
    name: 'Projects 系统提示',
    description: 'Claude Projects 自定义指令（跨对话持久）',
    category: 'claude',
    icon: '📁',
    template: `# 项目说明
{{project_description}}

# 我的偏好
- 沟通风格：{{style}}
- 默认语言：{{language}}
- 让我写代码时：{{code_preference}}
- 让我做分析时：{{analysis_preference}}

# 项目知识库用法
{{knowledge_usage}}

# 总是要做
{{always_do}}

# 禁止事项
{{never_do}}

# 输出习惯
直接给结果，不要客套开场白；除非我要求，否则不要逐步讲解过程。`,
    variables: [
      { name: 'project_description', description: '项目描述', defaultValue: '我在开发词坊（prompt-crafter），本地优先的 AI 提示词工具，含引导生成和模板库。' },
      { name: 'style', description: '沟通风格', defaultValue: '直接、简洁、给可执行建议' },
      { name: 'language', description: '语言', defaultValue: '简体中文' },
      { name: 'code_preference', description: '代码偏好', defaultValue: 'TypeScript + React，最小改动，不过度重构' },
      { name: 'analysis_preference', description: '分析偏好', defaultValue: '先结论后论据，用表格对比' },
      { name: 'knowledge_usage', description: '知识库用法', defaultValue: '优先引用已上传的项目文档；有冲突时问我' },
      { name: 'always_do', description: '总是做', defaultValue: '指出潜在边界情况；说明改动影响范围' },
      { name: 'never_do', description: '禁止做', defaultValue: '不要擅自大改架构；不要删除我未要求删除的功能' },
    ],
    tips: ['Projects 里全中文完全没问题', '「禁止事项」写清楚能少踩坑', '配合上传文档效果更好'],
  },
  {
    id: 'claude-chain-of-thought',
    name: '扩展思维链',
    description: '复杂问题分步推理，过程与结论分开',
    category: 'claude',
    icon: '🧠',
    template: `<problem>
{{problem}}
</problem>

<instructions>
请仔细思考后再回答，按以下步骤进行：
1. 用自己的话重述问题
2. 列出已知事实与假设
3. 想出 {{approach_count}} 种不同方案
4. 比较各方案利弊
5. 选出最优方案并说明理由
6. 按步骤执行求解
7. 回头检验答案是否真正解决了原问题
</instructions>

<output_format>
推理过程写在 <thinking> 标签内，最终结论写在 <answer> 标签内。
使用 {{language}}，不要跳过第 7 步检验。
</output_format>`,
    variables: [
      { name: 'problem', description: '问题', defaultValue: '设计一个按 AI 平台分类的提示词模板系统，需支持搜索、变量替换和本地存储。' },
      { name: 'approach_count', description: '方案数量', defaultValue: '3' },
      { name: 'language', description: '语言', defaultValue: '简体中文' },
    ],
    tips: [
      'thinking 里可以中文推演，answer 里给干净结论',
      '适合架构设计、方案选型类任务',
      '要求「检验」一步能减少漏项',
    ],
  },
  {
    id: 'claude-code-review',
    name: 'PR 代码审查',
    description: '审查 diff，优先级：正确性 > 安全 > 性能',
    category: 'claude',
    icon: '🔎',
    template: `<context>
{{pr_context}}
</context>

<diff>
{{diff}}
</diff>

<instructions>
- 审查优先级：正确性 > 安全 > 性能 > 代码风格
- 只提你有把握的问题，不要臆测
- 每个问题注明：严重程度、大致位置、修改建议
- 简要肯定写得好的地方
- 最后用一句话给出总体结论：通过 / 需修改 / 仅评论
- 评审意见使用简体中文
</instructions>`,
    variables: [
      { name: 'pr_context', description: 'PR 背景', defaultValue: '为模板库各平台新增实用模板，并修复滚动布局' },
      { name: 'diff', description: 'Diff', defaultValue: '（粘贴 git diff）' },
    ],
    tips: ['diff 和背景分开标签，结构更清晰', '结论用「通过/需修改」比 Approve 更好懂', '只报有把握的问题'],
  },
  {
    id: 'claude-writing-editor',
    name: '文稿编辑润色',
    description: '保留作者语气，不编造新事实',
    category: 'claude',
    icon: '✍️',
    template: `<draft>
{{draft}}
</draft>

<audience>
{{audience}}
</audience>

<goals>
{{goals}}
</goals>

<instructions>
请润色上方原稿，除非影响清晰度，否则保留作者语气。
不要添加原稿中没有的事实；缺信息处标注 [待补充]。
使用简体中文。
</instructions>

<output_format>
1. 润色后全文放在 <edited> 标签内
2. 主要修改说明（最多 8 条）放在 <notes> 标签内
3. 3 个备选标题放在 <titles> 标签内
</output_format>`,
    variables: [
      { name: 'draft', description: '原稿', defaultValue: '（粘贴文章/邮件/公告草稿）' },
      { name: 'audience', description: '读者', defaultValue: '公司内部全员，非技术背景' },
      { name: 'goals', description: '目标', defaultValue: '更简洁、逻辑更顺、去掉口语赘词，保持友好语气' },
    ],
    tips: ['强调保留语气，可避免 AI 腔', '分标签输出方便只复制正文', '缺数据用 [待补充] 而不是瞎编'],
  },
  {
    id: 'claude-structured-json',
    name: '结构化 JSON 输出',
    description: '用 schema 约束 JSON，替代旧版 prefill',
    category: 'claude',
    icon: '{ }',
    template: `<task>
{{task}}
</task>

<input>
{{input}}
</input>

<output_schema>
请输出符合以下结构的合法 JSON（字段名保持英文）：
{{json_schema}}
</output_schema>

<instructions>
- 只输出 JSON，不要 markdown 代码块，不要开场白
- 不知道的字段填 null，不要猜测
- 字符串类型的值使用 {{language}}
</instructions>`,
    variables: [
      { name: 'task', description: '任务', defaultValue: '从用户描述中提取图像生成参数' },
      { name: 'input', description: '输入', defaultValue: '生成一张写实东亚女性半身肖像，家居晨光，9:16 竖版' },
      {
        name: 'json_schema',
        description: 'JSON 结构',
        defaultValue: '{\n  "subject": "主体描述（中文）",\n  "style": "realistic|anime|illustration",\n  "aspect_ratio": "9:16|16:9|1:1",\n  "lighting": "光线描述（中文）",\n  "negative": ["排除项，可中英混合"]\n}',
      },
      { name: 'language', description: '字符串语言', defaultValue: '简体中文' },
    ],
    tips: [
      '字段名用英文是 JSON 惯例，值可以全中文',
      '说清「只输出 JSON」能减少废话',
      '不确定就 null，比瞎填好',
    ],
  },
  {
    id: 'claude-meeting-notes',
    name: '会议纪要',
    description: '从散乱笔记整理决策、待办、风险',
    category: 'claude',
    icon: '📋',
    template: `<notes>
{{raw_notes}}
</notes>

<metadata>
- 会议主题：{{meeting_title}}
- 日期：{{date}}
- 参会人：{{attendees}}
</metadata>

<instructions>
将上方笔记整理为结构化会议纪要。
待办和决策可以用列表或表格，其余部分用简洁中文段落。
使用简体中文。
</instructions>

<output_format>
## 会议概要（3 句以内）
## 关键决策
| 决策 | 负责人 | 截止时间 |
## 待办事项
- [ ] ...
## 未决问题 / 风险
## 下次会议议题（如有）
</output_format>`,
    variables: [
      { name: 'raw_notes', description: '原始笔记', defaultValue: '（粘贴语音转写或随手记）' },
      { name: 'meeting_title', description: '会议主题', defaultValue: 'Q2 产品路线图评审' },
      { name: 'date', description: '日期', defaultValue: '2026-06-25' },
      { name: 'attendees', description: '参会人', defaultValue: '产品、研发、设计负责人' },
    ],
    tips: ['决策和待办分开，方便跟进', '「未决问题」单独列出防遗漏', '适合放进 Projects 当固定格式'],
  },
];