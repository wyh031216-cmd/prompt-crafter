import type { PromptTemplate } from './types';

export const GENERAL_TEMPLATES: PromptTemplate[] = [
  {
    id: 'role-general',
    name: '通用角色扮演',
    description: '让 AI 扮演特定角色来完成任务',
    category: 'general',
    subcategory: 'role',
    icon: '🎭',
    template: `你是一位{{role}}。

## 你的背景
{{background}}

## 你的能力
- {{ability1}}
- {{ability2}}
- {{ability3}}

## 任务
{{task}}

## 要求
1. 全程以{{role}}的身份思考和回应
2. 输出格式：{{format}}
3. {{extra_requirement}}`,
    variables: [
      { name: 'role', description: '扮演的角色', defaultValue: '资深产品经理' },
      { name: 'background', description: '角色背景', defaultValue: '拥有10年B端产品经验，擅长用户需求分析和产品规划' },
      { name: 'ability1', description: '能力1', defaultValue: '从用户痛点出发设计解决方案' },
      { name: 'ability2', description: '能力2', defaultValue: '用数据驱动决策' },
      { name: 'ability3', description: '能力3', defaultValue: '平衡商业价值和用户体验' },
      { name: 'task', description: '要完成的任务', defaultValue: '分析xx产品的用户反馈，提炼核心需求' },
      { name: 'format', description: '输出格式', defaultValue: 'Markdown 列表' },
      { name: 'extra_requirement', description: '额外要求', defaultValue: '每个建议给出具体案例' },
    ],
    tips: ['角色设定越具体，AI 表现越好', '补充角色的"背景"可以让回答更一致', '明确输出格式能减少二次整理'],
  },
  {
    id: 'role-teacher',
    name: '教学辅导',
    description: '让 AI 作为老师解释复杂概念',
    category: 'general',
    subcategory: 'role',
    icon: '📚',
    template: `你是一位{{subject}}老师，教学经验丰富，擅长用通俗易懂的方式解释复杂概念。

## 你的学生
- 知识水平：{{level}}
- 学习目标：{{goal}}

## 教学任务
请解释以下概念：{{concept}}

## 教学要求
1. 先给出一个生活化的类比
2. 然后用简单的语言解释核心原理
3. 举 2-3 个实际应用例子
4. 最后给出 3 个自测题检验理解
5. 如果发现学生理解有误，耐心纠正`,
    variables: [
      { name: 'subject', description: '学科', defaultValue: '编程' },
      { name: 'level', description: '学生水平', defaultValue: '零基础初学者' },
      { name: 'goal', description: '学习目标', defaultValue: '理解并能实际运用' },
      { name: 'concept', description: '要解释的概念', defaultValue: '闭包（Closure）' },
    ],
    tips: ['先给出类比再讲原理效果最好', '根据学生的水平调整用词的复杂度', '加入自测题能促进理解和记忆'],
  },
  {
    id: 'cot',
    name: '思维链 (Chain of Thought)',
    description: '引导 AI 分步骤推理，适合复杂逻辑问题',
    category: 'general',
    subcategory: 'reasoning',
    icon: '🧠',
    template: `请按照以下步骤思考并解决问题：

## 问题
{{question}}

## 思考步骤
1. **理解问题**：先用自己的话重述问题
2. **分析已知信息**：列出所有已知条件和约束
3. **拆解子问题**：将复杂问题分解为更小的子问题
4. **逐步推理**：对每个子问题进行推理
5. **检查验证**：验证每一步的推理是否正确
6. **得出结论**：基于以上推理给出最终答案

## 输出要求
- 步骤之间用空行分隔
- 每个步骤标注当前进度（如 [步骤 1/6]）
- 如果发现推理错误，回溯到出错步骤重新推理
- 最终答案用 === 包裹`,
    variables: [
      { name: 'question', description: '要解决的问题', defaultValue: '' },
    ],
    tips: ['对数学、逻辑、编程问题特别有效', '明确要求"回溯错误"可以减少幻觉', '可以让 AI 用多种方法验证答案'],
  },
  {
    id: 'tree-of-thought',
    name: '思维树 (Tree of Thoughts)',
    description: '探索多种解决路径并对比，适合开放性问题',
    category: 'general',
    subcategory: 'reasoning',
    icon: '🌳',
    template: `我需要解决以下问题。请帮我探索多种解决路径：

## 问题
{{question}}

## 探索方法
1. **生成多种方案**：提出 {{branch_count}} 种不同的解决思路
2. **评估每条路径**：对每个方案分析可行性、优缺点
3. **深度展开**：选择最有希望的 {{depth}} 条路径深入探索
4. **对比总结**：对比各方案，给出推荐排序

## 约束条件
{{constraints}}

## 输出格式
用树形结构展示探索过程，最终推荐一个最优方案并说明理由。`,
    variables: [
      { name: 'question', description: '要解决的问题', defaultValue: '' },
      { name: 'branch_count', description: '初始方案数量', defaultValue: '3' },
      { name: 'depth', description: '深入探索的路径数', defaultValue: '2' },
      { name: 'constraints', description: '约束条件', defaultValue: '成本优先，兼顾效率' },
    ],
    tips: ['适合评估决策类问题', '分支数建议 3-5 个，太多会降低深度', '明确约束条件能让评估更准确'],
  },
  {
    id: 'step-by-step',
    name: '逐步指导',
    description: '生成分步骤的操作指南',
    category: 'general',
    subcategory: 'reasoning',
    icon: '📝',
    template: `请为以下任务生成详细的分步骤指南：

## 任务描述
{{task}}

## 目标受众
{{audience}}

## 输出要求
1. 将整个过程分解为 {{step_count}} 个主要步骤
2. 每个步骤包含：
   - 步骤标题
   - 具体操作说明
   - 所需时间/资源
   - ⚠️ 常见错误和注意事项
3. 在开头列出所需的前置条件和工具
4. 在结尾给出验证是否成功的检查清单`,
    variables: [
      { name: 'task', description: '任务描述', defaultValue: '' },
      { name: 'audience', description: '目标受众', defaultValue: '新手' },
      { name: 'step_count', description: '步骤数量', defaultValue: '5' },
    ],
    tips: ['明确受众水平可以控制详细程度', '加入"常见错误"能避免用户踩坑', '结尾的检查清单很有价值'],
  },
  {
    id: 'fewshot',
    name: 'Few-Shot 示例学习',
    description: '通过示例让 AI 理解期望的输出模式',
    category: 'general',
    subcategory: 'fewshot',
    icon: '📋',
    template: `以下是一些示例，请理解其中的模式，然后完成新的任务。

## 示例
{{examples}}

## 任务
请按照以上示例的模式，完成以下任务：

{{task}}

## 要求
- 严格遵循示例中的输出格式
- 保持风格和语气一致
- {{extra_requirement}}`,
    variables: [
      { name: 'examples', description: '示例（输入→输出）', defaultValue: '输入：...\n输出：...\n\n输入：...\n输出：...' },
      { name: 'task', description: '要完成的任务', defaultValue: '' },
      { name: 'extra_requirement', description: '额外要求', defaultValue: '如果输入超出示例范围，给出合理的最佳推断' },
    ],
    tips: ['提供 2-3 个示例效果最好', '示例的覆盖范围要广', '示例的格式必须与期望输出完全一致'],
  },
  {
    id: 'style-mimic',
    name: '风格模仿',
    description: '让 AI 模仿特定写作风格',
    category: 'general',
    subcategory: 'fewshot',
    icon: '🎨',
    template: `请分析以下文本的写作风格，然后用相同的风格完成新的写作任务。

## 风格参考文本
{{reference_text}}

## 风格分析要素
1. 用词特点（正式/口语、简单/复杂）
2. 句子结构（长句/短句、复杂/简单）
3. 语气（严肃/幽默、客观/主观）
4. 修辞手法（比喻、排比等）
5. 段落组织方式

## 写作任务
{{task}}`,
    variables: [
      { name: 'reference_text', description: '参考风格的文本', defaultValue: '' },
      { name: 'task', description: '写作任务', defaultValue: '' },
    ],
    tips: ['提供一段有代表性的参考文本', '风格分析要素能让 AI 更准确地把握风格', '先分析再模仿，效果优于直接模仿'],
  },
  {
    id: 'format-json',
    name: '结构化输出 (JSON)',
    description: '要求 AI 以严格的 JSON 格式输出',
    category: 'general',
    subcategory: 'format',
    icon: '📐',
    template: `请分析以下内容，并以 JSON 格式输出结果。

## 内容
{{content}}

## 输出 Schema
\`\`\`json
{{schema}}
\`\`\`

## 要求
1. 严格按照以上 Schema 生成 JSON
2. 不要添加任何额外的说明文字
3. 字段值必须是合法的 JSON 类型
4. 如果某字段无数据，使用 null 而不是空字符串
5. {{extra_requirement}}`,
    variables: [
      { name: 'content', description: '要分析的内容', defaultValue: '' },
      { name: 'schema', description: 'JSON Schema 示例', defaultValue: '{\n  "title": "string",\n  "items": ["string"],\n  "summary": "string"\n}' },
      { name: 'extra_requirement', description: '额外要求', defaultValue: '确保输出的 JSON 可以被 JSON.parse() 直接解析' },
    ],
    tips: ['Schema 越详细输出越稳定', '明确要求"不要额外文字"', '要求合法的 JSON 类型值减少解析错误'],
  },
  {
    id: 'format-table',
    name: '表格输出',
    description: '要求 AI 以表格形式组织和呈现数据',
    category: 'general',
    subcategory: 'format',
    icon: '📊',
    template: `请将以下信息整理为表格形式：

## 源信息
{{content}}

## 表格要求
- 列名：{{columns}}
- 行数：至少 {{row_count}} 行
- 排序方式：{{sort_by}}
- 输出格式：Markdown 表格

## 额外指令
{{extra_requirement}}`,
    variables: [
      { name: 'content', description: '要整理的信息', defaultValue: '' },
      { name: 'columns', description: '列名（逗号分隔）', defaultValue: '项目, 描述, 优缺点, 评分' },
      { name: 'row_count', description: '最少行数', defaultValue: '3' },
      { name: 'sort_by', description: '排序依据', defaultValue: '按评分降序' },
      { name: 'extra_requirement', description: '额外要求', defaultValue: '在表格下方添加简要总结' },
    ],
    tips: ['列名一定要明确', '指定排序方式避免混乱', '要求 Markdown 格式兼容性最好'],
  },
  {
    id: 'expert-review',
    name: '专家评审',
    description: '让 AI 从专业角度评审内容',
    category: 'general',
    subcategory: 'expert',
    icon: '👨‍🔬',
    template: `你是一位{{field}}领域的资深专家，请从专业角度评审以下内容。

## 待评审内容
{{content}}

## 评审维度
1. **准确性**：是否存在事实或逻辑错误？
2. **完整性**：是否遗漏了重要方面？
3. **实用性**：建议是否可落地执行？
4. **前瞻性**：是否考虑了未来趋势？
5. **改进建议**：具体怎么改？

## 评审要求
- 每个维度给出 1-10 分
- 指出 3 个最重要的改进点
- 评分要严格，不要为了客气给高分
- 每个扣分点都要附上具体修改建议`,
    variables: [
      { name: 'field', description: '专业领域', defaultValue: '技术架构' },
      { name: 'content', description: '待评审的内容', defaultValue: '' },
    ],
    tips: ['明确要求"严格评分"能得到更真实的评价', '每个扣分点附修改建议更有建设性', '可以追加追问特定维度的深度评审'],
  },
  {
    id: 'expert-advice',
    name: '专家咨询',
    description: '让 AI 作为专家提供专业建议',
    category: 'general',
    subcategory: 'expert',
    icon: '💡',
    template: `我面临以下问题，请作为{{field}}专家给我建议。

## 背景
{{context}}

## 我的问题
{{question}}

## 我希望得到的建议包括
1. 当前最核心的问题是什么？
2. 有哪些可行的解决方案？
3. 每个方案的优缺点对比
4. 你推荐哪个方案？为什么？
5. 实施路径和时间预估

## 我的约束条件
- 预算：{{budget}}
- 时间：{{timeframe}}
- 其他限制：{{limitations}}`,
    variables: [
      { name: 'field', description: '专业领域', defaultValue: '产品策略' },
      { name: 'context', description: '背景信息', defaultValue: '' },
      { name: 'question', description: '具体问题', defaultValue: '' },
      { name: 'budget', description: '预算限制', defaultValue: '有限' },
      { name: 'timeframe', description: '时间要求', defaultValue: '3个月内' },
      { name: 'limitations', description: '其他限制', defaultValue: '团队只有3人' },
    ],
    tips: ['背景信息越详细建议越有针对性', '明确列出约束条件避免不切实际的建议', '可以要求专家给出多个选项'],
  },
  {
    id: 'creative-story',
    name: '故事创作',
    description: '根据设定生成创意故事',
    category: 'general',
    subcategory: 'creative',
    icon: '✍️',
    template: `请根据以下设定创作一个故事：

## 故事设定
- 类型：{{genre}}
- 背景：{{setting}}
- 主角：{{protagonist}}
- 核心冲突：{{conflict}}
- 风格参考：{{style}}

## 要求
- 字数：{{word_count}} 字左右
- 视角：{{perspective}}
- 开头方式：{{opening}}
- 需要包含以下元素：
  - 一个转折
  - 一段对话
  - 一个令人印象深刻的结尾

## 额外需求
{{extra}}`,
    variables: [
      { name: 'genre', description: '故事类型', defaultValue: '科幻' },
      { name: 'setting', description: '故事背景', defaultValue: '2157年，人类已在火星建立殖民地' },
      { name: 'protagonist', description: '主角', defaultValue: '一位年轻的火星地质学家' },
      { name: 'conflict', description: '核心冲突', defaultValue: '发现了一个可能改变人类历史的遗迹' },
      { name: 'style', description: '风格参考', defaultValue: '硬科幻，注重细节描写' },
      { name: 'word_count', description: '字数', defaultValue: '800' },
      { name: 'perspective', description: '叙述视角', defaultValue: '第一人称' },
      { name: 'opening', description: '开头方式', defaultValue: '从对话开始' },
      { name: 'extra', description: '额外需求', defaultValue: '加入一个出人意料的结局' },
    ],
    tips: ['设定越具体故事越精彩', '明确字数避免过于简略或冗长', '指定风格参考能让结果更可控'],
  },
  {
    id: 'compare',
    name: '对比分析',
    description: '多维度对比分析多个对象',
    category: 'general',
    subcategory: 'analysis',
    icon: '📊',
    template: `请对以下项目进行多维度对比分析：

## 对比对象
{{items}}

## 对比维度
{{dimensions}}

## 分析要求
1. 先用表格进行概览对比
2. 然后对每个维度展开详细分析
3. 指出各自的适用场景和局限性
4. 如果有明显的综合优胜者，给出推荐

## 评分标准
每个维度采用 5 分制，并给出评分理由。

## 额外要求
{{extra}}`,
    variables: [
      { name: 'items', description: '要对比的项目（逗号分隔）', defaultValue: '方案A, 方案B, 方案C' },
      { name: 'dimensions', description: '对比维度', defaultValue: '成本, 效率, 可维护性, 学习曲线, 生态' },
      { name: 'extra', description: '额外要求', defaultValue: '针对我的场景（初创团队）给出最合适的推荐' },
    ],
    tips: ['控制对比对象在 3-5 个', '维度 4-6 个最佳', '加上场景推荐让结论更实用'],
  },
  {
    id: 'pros-cons',
    name: '优缺点分析',
    description: '全面的优缺点分析',
    category: 'general',
    subcategory: 'analysis',
    icon: '⚖️',
    template: `请对以下决策/方案进行全面分析：

## 分析对象
{{subject}}

## 分析框架
### 1. 优点（Pros）
- 短期收益
- 长期收益
- 附加价值

### 2. 缺点（Cons）
- 短期风险
- 长期风险
- 隐性成本

### 3. 风险评估
- 发生概率
- 影响程度
- 应对策略

### 4. 综合建议
权衡所有因素后给出最终建议

## 分析角度
{{perspectives}}

## 决策标准
{{criteria}}`,
    variables: [
      { name: 'subject', description: '要分析对象', defaultValue: '' },
      { name: 'perspectives', description: '分析角度', defaultValue: '技术角度, 商业角度, 团队角度' },
      { name: 'criteria', description: '决策标准', defaultValue: 'ROI > 200%, 6个月内可落地' },
    ],
    tips: ['加上量化标准让分析更有依据', '从多个角度分析避免盲区', '风险评估部分经常被忽略但很有价值'],
  },
  {
    id: 'meeting-minutes',
    name: '会议纪要',
    description: '从散乱笔记整理标准会议纪要',
    category: 'general',
    subcategory: 'format',
    icon: '📋',
    template: `将以下会议内容整理为规范的会议纪要。

## 会议信息
- 主题：{{title}}
- 时间：{{datetime}}
- 参会人：{{attendees}}

## 原始记录
{{raw_notes}}

## 输出格式
### 会议概要
### 讨论要点
### 决议事项
| 事项 | 负责人 | 截止日期 |
### 待办（checkbox 列表）
### 遗留问题`,
    variables: [
      { name: 'title', description: '会议主题', defaultValue: ' sprint 复盘' },
      { name: 'datetime', description: '时间', defaultValue: '2026-06-25 14:00' },
      { name: 'attendees', description: '参会人', defaultValue: '产品、研发、测试' },
      { name: 'raw_notes', description: '原始记录', defaultValue: '（粘贴笔记或转写）' },
    ],
    tips: ['决议和待办分开', '负责人和截止日期必填', '适用于任何 AI 平台'],
  },
  {
    id: 'email-professional',
    name: '商务邮件',
    description: '正式邮件起草与润色',
    category: 'general',
    subcategory: 'format',
    icon: '✉️',
    template: `撰写一封{{tone}}的商务邮件。

## 背景
{{context}}

## 邮件目的
{{purpose}}

## 关键信息（必须包含）
{{key_points}}

## 收件人
{{recipient}}

## 输出
- 主题行（3 个备选）
- 正文（{{language}}）
- 结尾署名建议

不要编造未提供的日期、金额或承诺。`,
    variables: [
      { name: 'tone', description: '语气', defaultValue: '专业、礼貌、简洁' },
      { name: 'context', description: '背景', defaultValue: '向客户说明项目进度延迟一周' },
      { name: 'purpose', description: '目的', defaultValue: '说明原因、给出新时间表、表达歉意与补救措施' },
      { name: 'key_points', description: '关键信息', defaultValue: '延迟因第三方 API 变更；新交付日 7 月 2 日；提供一周免费延期支持' },
      { name: 'recipient', description: '收件人', defaultValue: '客户项目负责人' },
      { name: 'language', description: '语言', defaultValue: '简体中文' },
    ],
    tips: ['主题行给 3 个备选便于选择', '明确禁止编造数据', '英文邮件把 language 改为 English'],
  },
  {
    id: 'user-story',
    name: '用户故事',
    description: '敏捷用户故事 + 验收标准',
    category: 'general',
    subcategory: 'format',
    icon: '📝',
    template: `将以下需求拆解为敏捷用户故事。

## 产品背景
{{product_context}}

## 需求描述
{{requirement}}

## 输出（每条故事包含）
**Story：** As a [role], I want [goal], so that [benefit]

**Acceptance Criteria（Given/When/Then）：**
- ...

**优先级：** P0/P1/P2
**估算：** S/M/L

请输出 {{story_count}} 条故事，覆盖主流程和边界情况。`,
    variables: [
      { name: 'product_context', description: '产品背景', defaultValue: 'PromptCraft 提示词编辑器，含模板库和引导生成' },
      { name: 'requirement', description: '需求', defaultValue: '用户希望能收藏常用模板，并在编辑器快速访问' },
      { name: 'story_count', description: '故事数量', defaultValue: '3-5' },
    ],
    tips: ['验收标准用 Given/When/Then', '边界情况单独一条故事', '适合交给任何 AI 后贴进 Jira'],
  },
];