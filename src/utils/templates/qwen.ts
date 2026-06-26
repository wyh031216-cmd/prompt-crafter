import type { PromptTemplate } from './types';

export const QWEN_TEMPLATES: PromptTemplate[] = [
  {
    id: 'qwen-system-prompt',
    name: '通义系统提示词',
    description: '阿里云百炼 / 通义千问 System Prompt',
    category: 'qwen',
    icon: '⚙️',
    template: `你是{{role}}。

## 能力范围
{{capabilities}}

## 回复规范
- 语言：{{language}}
- 风格：{{style}}
- 格式：{{format}}

## 业务规则
{{business_rules}}

## 禁止事项
{{prohibitions}}`,
    variables: [
      { name: 'role', description: '角色', defaultValue: '通义千问智能客服，服务于某美妆品牌的官方店铺' },
      { name: 'capabilities', description: '能力', defaultValue: '解答产品功效、成分、用法、售后问题；推荐适合肤质的产品' },
      { name: 'language', description: '语言', defaultValue: '简体中文，亲切口语化' },
      { name: 'style', description: '风格', defaultValue: '专业但不生硬，像资深美妆顾问' },
      { name: 'format', description: '格式', defaultValue: '短段落，重点加粗，必要时用列表' },
      { name: 'business_rules', description: '业务规则', defaultValue: '不承诺医疗效果；敏感肌建议先做皮试；促销信息以页面为准' },
      { name: 'prohibitions', description: '禁止', defaultValue: '不贬低竞品；不编造未上市产品；不收集用户隐私' },
    ],
    tips: ['百炼平台放 system 消息', '中文业务场景千问表现好', '业务规则写清减少合规风险'],
  },
  {
    id: 'qwen-xiaohongshu',
    name: '小红书种草文案',
    description: '通义千问中文社媒文案',
    category: 'qwen',
    icon: '📱',
    template: `请为以下产品写一篇小红书种草笔记。

## 产品信息
- 名称：{{product_name}}
- 卖点：{{selling_points}}
- 目标人群：{{target_audience}}
- 价格区间：{{price_range}}

## 文案要求
- 标题：{{title_style}}，带 1-2 个 emoji
- 正文：{{word_count}} 字左右，第一人称真实体验感
- 结构：痛点 → 使用感受 → 效果 → 总结推荐
- 话题标签：{{hashtag_count}} 个，含品牌词和品类词
- 语气：{{tone}}

## 禁忌
不要硬广感、不要夸大疗效、不要用「最好」「第一」等绝对化用语`,
    variables: [
      { name: 'product_name', description: '产品名', defaultValue: '清透保湿面霜' },
      { name: 'selling_points', description: '卖点', defaultValue: '玻尿酸+神经酰胺，24h 保湿，敏感肌可用' },
      { name: 'target_audience', description: '人群', defaultValue: '20-30 岁干敏肌女生' },
      { name: 'price_range', description: '价格', defaultValue: '199 元/50ml' },
      { name: 'title_style', description: '标题风格', defaultValue: '悬念式' },
      { name: 'word_count', description: '字数', defaultValue: '300' },
      { name: 'hashtag_count', description: '标签数', defaultValue: '5' },
      { name: 'tone', description: '语气', defaultValue: '闺蜜分享，真诚不尬' },
    ],
    tips: ['千问中文语感自然', '给具体人群和价格更接地气', '合规禁忌务必写明'],
  },
  {
    id: 'qwen-wanx-image',
    name: '通义万相 · 文生图',
    description: '通义万相图像生成提示词',
    category: 'qwen',
    icon: '🎨',
    template: `{{style}}风格，{{subject}}。

画面描述：{{scene}}
氛围：{{mood}}
光线：{{lighting}}
构图：{{composition}}

画质：高清细腻，{{quality}}
比例：{{aspect_ratio}}

请避免出现：{{negative}}`,
    variables: [
      { name: 'style', description: '风格', defaultValue: '写实摄影' },
      { name: 'subject', description: '主体', defaultValue: '一位穿着汉服的女子在竹林中抚琴' },
      { name: 'scene', description: '画面', defaultValue: '清晨薄雾，竹叶飘落，远处亭台若隐若现' },
      { name: 'mood', description: '氛围', defaultValue: '诗意、宁静、古典' },
      { name: 'lighting', description: '光线', defaultValue: '柔和侧光，丁达尔效应' },
      { name: 'composition', description: '构图', defaultValue: '中景，人物居右，留白意境' },
      { name: 'quality', description: '画质', defaultValue: '8K 细节，皮肤质感自然' },
      { name: 'aspect_ratio', description: '比例', defaultValue: '3:4 竖版' },
      { name: 'negative', description: '排除', defaultValue: '现代元素、西方面孔、文字水印、畸形手指' },
    ],
    tips: ['中文提示词万相支持良好', '古风/国风是强项', '负面描述用「避免出现」'],
  },
  {
    id: 'qwen-multi-turn',
    name: '多轮对话设计',
    description: '设计客服/助手多轮对话流程',
    category: 'qwen',
    icon: '💬',
    template: `请设计一套「{{scenario}}」的多轮对话流程。

## 场景
{{scenario_detail}}

## 对话要求
- 轮次：{{turn_count}} 轮以内完成目标
- 每轮助手回复不超过 {{max_chars}} 字
- 需要收集的信息：{{info_to_collect}}
- 成功标准：{{success_criteria}}

## 输出格式
用表格输出：
| 轮次 | 用户意图 | 助手回复示例 | 分支/槽位 |
并附 2 条完整对话样例（成功 + 用户犹豫）`,
    variables: [
      { name: 'scenario', description: '场景', defaultValue: '护肤品选购咨询' },
      { name: 'scenario_detail', description: '场景细节', defaultValue: '用户不确定自己肤质，想选一款入门面霜' },
      { name: 'turn_count', description: '轮次上限', defaultValue: '5' },
      { name: 'max_chars', description: '回复字数', defaultValue: '80' },
      { name: 'info_to_collect', description: '需收集信息', defaultValue: '肤质、预算、是否敏感肌、当前护肤步骤' },
      { name: 'success_criteria', description: '成功标准', defaultValue: '推荐 1 款匹配产品并说明理由' },
    ],
    tips: ['适合百炼 Agent 编排前置设计', '分支/槽位列清楚便于开发', '附犹豫样例覆盖常见卡点'],
  },
  {
    id: 'qwen-code-assistant',
    name: '代码助手',
    description: '通义灵码 / 千问编程场景',
    category: 'qwen',
    icon: '💻',
    template: `## 需求
{{requirement}}

## 技术环境
- 语言：{{language}}
- 版本：{{version}}
- 依赖约束：{{dependencies}}

## 代码规范
{{code_style}}

## 输出
1. 完整代码（可直接复制运行）
2. 用法示例
3. 注意事项（如有）`,
    variables: [
      { name: 'requirement', description: '需求', defaultValue: '写一个 Python 脚本，批量读取文件夹中的 .txt 文件，提取所有 {{变量名}} 并导出 CSV' },
      { name: 'language', description: '语言', defaultValue: 'Python' },
      { name: 'version', description: '版本', defaultValue: '3.10+' },
      { name: 'dependencies', description: '依赖', defaultValue: '仅用标准库' },
      { name: 'code_style', description: '规范', defaultValue: 'PEP8，函数加 type hints，main 入口' },
    ],
    tips: ['通义灵码 IDE 内可直接用', '约束依赖避免乱引包', '中文需求描述即可'],
  },
  {
    id: 'qwen-function-call',
    name: '工具调用设计',
    description: 'Function Calling / 百炼 Agent 工具描述',
    category: 'qwen',
    icon: '🔧',
    template: `Design a function calling schema for this agent task.

## Agent 场景
{{scenario}}

## 可用工具能力
{{tools}}

## 输出
1. **System Prompt**（中文，200 字内）
2. **Functions JSON Schema**（OpenAI 兼容格式，含 description 和 parameters）
3. **3 条触发样例** — 用户说什么时应调用哪个工具
4. **失败兜底** — 工具不可用时的回复策略`,
    variables: [
      { name: 'scenario', description: '场景', defaultValue: '电商客服：查订单、查物流、推荐商品' },
      { name: 'tools', description: '工具', defaultValue: 'get_order(order_id), track_shipment(order_id), search_product(keyword)' },
    ],
    tips: ['description 写清何时调用', '百炼 Agent 兼容 OpenAI tools 格式', '兜底策略减少死循环'],
  },
  {
    id: 'qwen-weekly-report',
    name: '周报生成',
    description: '从流水账生成结构化工作周报',
    category: 'qwen',
    icon: '📊',
    template: `根据以下本周工作记录，生成一份工作周报。

## 基本信息
- 汇报对象：{{audience}}
- 岗位：{{role}}
- 周期：{{week_range}}

## 本周记录（要点即可）
{{raw_notes}}

## 输出结构
### 本周完成（按项目分组，量化成果）
### 进行中 & 下周计划
### 风险与需协调事项
### 数据/指标（如有）

要求：简洁、可汇报、不夸大；中文；总字数 {{word_limit}} 字以内`,
    variables: [
      { name: 'audience', description: '汇报对象', defaultValue: '直属 leader' },
      { name: 'role', description: '岗位', defaultValue: '前端开发' },
      { name: 'week_range', description: '周期', defaultValue: '2026.06.16 - 2026.06.22' },
      { name: 'raw_notes', description: '工作记录', defaultValue: '完成模板库滚动修复；新增各平台模板；优化补充约束逻辑' },
      { name: 'word_limit', description: '字数', defaultValue: '500' },
    ],
    tips: ['流水账越具体越好', '量化成果用数字', '千问中文公文风格自然'],
  },
  {
    id: 'qwen-ecommerce-title',
    name: '电商标题优化',
    description: '淘宝/天猫/京东搜索标题与卖点提炼',
    category: 'qwen',
    icon: '🏷️',
    template: `优化以下商品的电商搜索标题与卖点。

## 商品信息
{{product_info}}

## 平台规则
- 平台：{{platform}}
- 标题字数上限：{{title_limit}}
- 禁用词：{{banned_words}}

## 输出
1. **标题方案 A/B/C**（含核心搜索词布局说明）
2. **5 个卖点短语**（用于主图/详情页）
3. **长尾关键词列表**（10 个，逗号分隔）`,
    variables: [
      { name: 'product_info', description: '商品信息', defaultValue: '清透保湿面霜 50ml，玻尿酸+神经酰胺，敏感肌，无香精，199 元' },
      { name: 'platform', description: '平台', defaultValue: '天猫' },
      { name: 'title_limit', description: '字数上限', defaultValue: '60' },
      { name: 'banned_words', description: '禁用词', defaultValue: '最好、第一、治愈、药用' },
    ],
    tips: ['搜索词前置', '合规禁用词务必列出', '千问对国内电商语境熟'],
  },
];