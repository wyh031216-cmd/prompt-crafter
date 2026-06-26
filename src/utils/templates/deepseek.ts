import type { PromptTemplate } from './types';

export const DEEPSEEK_TEMPLATES: PromptTemplate[] = [
  {
    id: 'deepseek-r1-reasoning',
    name: 'R1 深度推理',
    description: 'DeepSeek-R1 推理模式提示词',
    category: 'deepseek',
    icon: '🧠',
    template: `请深入思考以下问题，展示完整推理过程后给出结论。

## 问题
{{question}}

## 推理要求
1. 先明确问题的核心约束
2. 列出所有已知条件和未知量
3. 尝试至少 {{approach_count}} 种思路
4. 逐步推导，每步说明依据
5. 验证结论是否满足所有约束
6. 若存在多种合理解，说明取舍理由

## 输出格式
- 推理过程用中文
- 最终结论用 **加粗** 标出
- 如有公式，用 LaTeX`,
    variables: [
      { name: 'question', description: '问题', defaultValue: '一个水池有两个进水管和一个排水管，进水管 A 单独注满需 6 小时，B 需 8 小时，排水管单独排空需 12 小时。三管同开，多久注满？' },
      { name: 'approach_count', description: '思路数量', defaultValue: '2' },
    ],
    tips: ['R1 会自动展开思维链，不必写 think step by step', '数学/逻辑题效果突出', 'API 可设 model: deepseek-reasoner'],
  },
  {
    id: 'deepseek-code',
    name: '代码生成',
    description: 'DeepSeek Coder / V3 编程任务',
    category: 'deepseek',
    icon: '💻',
    template: `## 任务
{{task}}

## 技术栈
- 语言：{{language}}
- 框架/库：{{framework}}
- 运行环境：{{runtime}}

## 当前代码（如有）
\`\`\`{{language}}
{{existing_code}}
\`\`\`

## 要求
1. {{req1}}
2. {{req2}}
3. 包含必要的错误处理
4. 关键逻辑加简短注释

## 输出
- 完整可运行代码
- 简要说明设计思路（3 条以内）`,
    variables: [
      { name: 'task', description: '编程任务', defaultValue: '实现一个函数，将提示词模板中的 {{变量}} 替换为用户输入值' },
      { name: 'language', description: '语言', defaultValue: 'TypeScript' },
      { name: 'framework', description: '框架', defaultValue: '无额外依赖' },
      { name: 'runtime', description: '环境', defaultValue: '浏览器 / Node 18+' },
      { name: 'existing_code', description: '现有代码', defaultValue: '' },
      { name: 'req1', description: '要求1', defaultValue: '支持默认值 fallback' },
      { name: 'req2', description: '要求2', defaultValue: '未填变量保留 {{name}} 占位符' },
    ],
    tips: ['DeepSeek Coder 性价比高', '给出技术栈减少无关 import', '粘贴现有代码便于增量修改'],
  },
  {
    id: 'deepseek-api-json',
    name: 'API JSON 输出',
    description: 'DeepSeek API 结构化响应',
    category: 'deepseek',
    icon: '📐',
    template: `从以下内容提取信息，仅输出 JSON，不要任何其他文字。

## 内容
{{content}}

## JSON 格式
{
  {{json_schema}}
}

## 规则
- 严格合法 JSON
- 缺失字段用 null
- {{extra_rules}}`,
    variables: [
      { name: 'content', description: '输入内容', defaultValue: '（粘贴文本）' },
      { name: 'json_schema', description: 'Schema', defaultValue: '"name": "string",\n  "category": "string",\n  "tags": ["string"],\n  "confidence": 0.0' },
      { name: 'extra_rules', description: '额外规则', defaultValue: 'confidence 为 0-1 浮点数' },
    ],
    tips: ['配合 response_format: { type: "json_object" }', '中文提取任务表现良好', 'Schema 给示例值更稳'],
  },
  {
    id: 'deepseek-math-proof',
    name: '数学证明',
    description: '形式化数学推理与证明',
    category: 'deepseek',
    icon: '📐',
    template: `请完成以下数学任务。

## 题目
{{problem}}

## 要求
1. 写出已知条件和求证目标
2. 给出完整证明过程，每步注明所用定理/性质
3. 如有多种证法，给出最简洁的一种
4. 最后检验结论

## 格式
- 使用 LaTeX 书写公式
- 证明步骤编号
- 语言：{{language}}`,
    variables: [
      { name: 'problem', description: '题目', defaultValue: '证明：若 n 为大于 2 的整数，则方程 x^n + y^n = z^n 无正整数解。（说明证明思路即可，无需完整费马大定理证明）' },
      { name: 'language', description: '语言', defaultValue: '简体中文' },
    ],
    tips: ['R1 适合奥数/竞赛题', '要求注明定理来源', '可追问「有没有更短的证法」'],
  },
  {
    id: 'deepseek-translate-tech',
    name: '技术文档翻译',
    description: '中英文技术文档互译',
    category: 'deepseek',
    icon: '🌐',
    template: `将以下{{source_lang}}技术文档翻译为{{target_lang}}。

## 翻译原则
- 术语一致：{{glossary}}
- 代码、命令、API 名称保持原文
- 保留 Markdown 格式
- 不通顺处意译，但不改变技术含义

## 原文
{{source_text}}

## 输出
仅输出译文，不加解释。`,
    variables: [
      { name: 'source_lang', description: '源语言', defaultValue: '英文' },
      { name: 'target_lang', description: '目标语言', defaultValue: '简体中文' },
      { name: 'glossary', description: '术语表', defaultValue: 'prompt → 提示词, template → 模板, token → token（不译）' },
      { name: 'source_text', description: '原文', defaultValue: '（粘贴待翻译内容）' },
    ],
    tips: ['给术语表保证一致性', '技术翻译 DeepSeek 性价比高', '长文档可分段翻译'],
  },
  {
    id: 'deepseek-debug',
    name: 'Bug 排查',
    description: '根据报错与代码定位根因并给修复',
    category: 'deepseek',
    icon: '🐛',
    template: `Help debug this issue.

## Symptom
{{symptom}}

## Error Message / Logs
\`\`\`
{{error_log}}
\`\`\`

## Relevant Code
\`\`\`{{language}}
{{code}}
\`\`\`

## Environment
{{environment}}

## What I tried
{{tried}}

## Output
1. **Most likely root cause** (rank top 3 hypotheses)
2. **Minimal fix** with code patch
3. **How to verify** the fix
4. **Regression risks**`,
    variables: [
      { name: 'symptom', description: '现象', defaultValue: '模板库页面左侧平台列表无法滚动' },
      { name: 'error_log', description: '报错', defaultValue: '（粘贴控制台/终端报错，无则写「无」）' },
      { name: 'language', description: '语言', defaultValue: 'typescript' },
      { name: 'code', description: '相关代码', defaultValue: '（粘贴相关组件）' },
      { name: 'environment', description: '环境', defaultValue: 'Windows, Chrome, Vite dev 5188' },
      { name: 'tried', description: '已尝试', defaultValue: '刷新页面、重启 dev server' },
    ],
    tips: ['日志+代码一起给命中率最高', '要求 minimal fix 避免大重构', 'DeepSeek Coder 性价比高'],
  },
  {
    id: 'deepseek-sql',
    name: 'SQL 查询生成',
    description: '自然语言转 SQL，含解释与索引建议',
    category: 'deepseek',
    icon: '🗄️',
    template: `Generate SQL for the following request.

## Database
- Engine: {{engine}}
- Schema:
\`\`\`sql
{{schema}}
\`\`\`

## Request
{{request}}

## Output
1. SQL query (formatted)
2. Plain-language explanation
3. Expected result shape
4. Index / performance note (if relevant)
5. **Safety check** — flag any destructive ops`,
    variables: [
      { name: 'engine', description: '数据库', defaultValue: 'PostgreSQL 15' },
      { name: 'schema', description: '表结构', defaultValue: 'users(id, name, created_at)\nprompts(id, user_id, title, content, updated_at)' },
      { name: 'request', description: '需求', defaultValue: '查出每个用户最近更新的 3 条提示词，含标题和更新时间' },
    ],
    tips: ['贴真实 schema 减少幻觉表名', 'Safety check 防 DROP 误伤', '复杂查询可要求 CTE 注释'],
  },
  {
    id: 'deepseek-paper-summary',
    name: '论文速读',
    description: '学术论文结构化摘要',
    category: 'deepseek',
    icon: '📑',
    template: `Summarize this academic paper for a busy engineer.

## Paper
{{paper_content}}

## Output (简体中文)
### 一句话贡献
### 问题与动机
### 方法（用自己的话，避免堆砌术语）
### 关键实验结果（含数字）
### 局限性
### 可落地启示（2-3 条）
### 值得精读的部分 vs 可跳过`,
    variables: [
      { name: 'paper_content', description: '论文内容', defaultValue: '（粘贴摘要+结论，或全文）' },
    ],
    tips: ['不必上传全文，摘要+图表描述也常够', '「可落地启示」适合工程团队', 'R1 对公式推导也友好'],
  },
];