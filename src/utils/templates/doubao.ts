import type { PromptTemplate } from './types';

export const DOUBAO_TEMPLATES: PromptTemplate[] = [
  {
    id: 'doubao-short-video',
    name: '短视频脚本',
    description: '抖音/短视频口播脚本（豆包强项）',
    category: 'doubao',
    icon: '🎬',
    template: `请为「{{platform}}」写一条 {{duration}} 秒的短视频脚本。

## 主题
{{topic}}

## 产品/账号信息
{{account_info}}

## 脚本结构
| 时间 | 画面 | 口播/字幕 | BGM/音效 |
要求：
- 前 3 秒必须有钩子（{{hook_style}}）
- 口播口语化，适合 {{target_audience}}
- 结尾有明确 CTA：{{cta}}
- 总字数口播约 {{word_count}} 字

## 额外要求
{{extra}}`,
    variables: [
      { name: 'platform', description: '平台', defaultValue: '抖音' },
      { name: 'duration', description: '时长', defaultValue: '30' },
      { name: 'topic', description: '主题', defaultValue: '夏日防晒误区科普' },
      { name: 'account_info', description: '账号信息', defaultValue: '美妆科普号，粉丝 20-35 岁女性' },
      { name: 'hook_style', description: '钩子类型', defaultValue: '反问式「你是不是也…」' },
      { name: 'target_audience', description: '受众', defaultValue: '护肤新手' },
      { name: 'cta', description: '行动号召', defaultValue: '关注 + 评论区领防晒指南' },
      { name: 'word_count', description: '口播字数', defaultValue: '120' },
      { name: 'extra', description: '额外', defaultValue: '加 2 个可拍特写镜头建议' },
    ],
    tips: ['豆包对字节系内容理解好', '表格结构便于直接开拍', '钩子类型决定完播率'],
  },
  {
    id: 'doubao-ecommerce',
    name: '电商带货话术',
    description: '直播/短视频带货文案',
    category: 'doubao',
    icon: '🛒',
    template: `你是资深直播带货主播，请为以下商品写带货话术。

## 商品
- 名称：{{product_name}}
- 价格：{{price}}（日常价 {{original_price}}）
- 核心卖点：{{selling_points}}
- 赠品：{{gifts}}

## 话术模块
请分别写：
1. **开场引入**（15 秒，制造紧迫感）
2. **痛点共鸣**（为什么需要这个产品）
3. **卖点讲解**（3 个，每个配使用场景）
4. **价格锚定 + 促单**（限时/限量）
5. **异议处理**（{{objections}}）
6. **收尾逼单**（倒计时话术）

## 风格
{{style}}，适合 {{platform}} 直播`,
    variables: [
      { name: 'product_name', description: '商品', defaultValue: '氨基酸洁面慕斯' },
      { name: 'price', description: '直播价', defaultValue: '59.9 元/2 瓶' },
      { name: 'original_price', description: '日常价', defaultValue: '89 元/瓶' },
      { name: 'selling_points', description: '卖点', defaultValue: '温和不紧绷、敏感肌可用、泡沫绵密' },
      { name: 'gifts', description: '赠品', defaultValue: '送起泡网 + 旅行装' },
      { name: 'objections', description: '常见异议', defaultValue: '「洗面奶都差不多」「怕洗不干净」' },
      { name: 'style', description: '风格', defaultValue: '热情但不吼，像朋友推荐' },
      { name: 'platform', description: '平台', defaultValue: '抖音' },
    ],
    tips: ['异议处理模块很实用', '价格锚定要写具体数字', '豆包直播话术生成快'],
  },
  {
    id: 'doubao-seedream-image',
    name: 'Seedream 图像',
    description: '豆包/即梦 AI 绘画提示词',
    category: 'doubao',
    icon: '🎨',
    template: `{{style}}，{{subject}}。

场景：{{scene}}
情绪：{{mood}}
光影：{{lighting}}
镜头：{{camera}}
色调：{{color_tone}}

画质：超清，细节丰富，适合{{usage}}
画幅：{{aspect_ratio}}

不要出现：{{negative}}`,
    variables: [
      { name: 'style', description: '风格', defaultValue: '电影感写实' },
      { name: 'subject', description: '主体', defaultValue: '都市白领女性手持咖啡走在街头' },
      { name: 'scene', description: '场景', defaultValue: '上海武康路梧桐叶飘落，秋日午后' },
      { name: 'mood', description: '情绪', defaultValue: '松弛、治愈、生活感' },
      { name: 'lighting', description: '光影', defaultValue: '自然光，暖色逆光' },
      { name: 'camera', description: '镜头', defaultValue: '街拍抓拍感，35mm' },
      { name: 'color_tone', description: '色调', defaultValue: '胶片暖调，轻微颗粒' },
      { name: 'usage', description: '用途', defaultValue: '小红书封面' },
      { name: 'aspect_ratio', description: '画幅', defaultValue: '3:4' },
      { name: 'negative', description: '排除', defaultValue: '畸形手、模糊脸、水印文字' },
    ],
    tips: ['即梦/豆包生图中文友好', '写清用途（封面/海报）影响构图', '生活感场景是强项'],
  },
  {
    id: 'doubao-volcengine-api',
    name: '火山引擎 API',
    description: '豆包大模型 API 调用提示结构',
    category: 'doubao',
    icon: '🔌',
    template: `// 火山引擎豆包 API 消息结构参考

// System
{{system_prompt}}

// User
{{user_prompt}}

// 推荐参数
// endpoint: {{endpoint}}
// model: {{model}}
// temperature: {{temperature}}
// max_tokens: {{max_tokens}}

// 注意
{{api_notes}}`,
    variables: [
      { name: 'system_prompt', description: 'System', defaultValue: '你是豆包，一个有帮助的 AI 助手。用简体中文回答，简洁准确。' },
      { name: 'user_prompt', description: 'User', defaultValue: '把以下产品介绍改写成 3 条抖音评论区互动话术' },
      { name: 'endpoint', description: '端点', defaultValue: 'ark.cn-beijing.volces.com' },
      { name: 'model', description: '模型', defaultValue: 'doubao-pro-32k' },
      { name: 'temperature', description: '温度', defaultValue: '0.7' },
      { name: 'max_tokens', description: '最大 token', defaultValue: '2048' },
      { name: 'api_notes', description: '注意事项', defaultValue: '多轮对话需传入完整 messages 数组；system 放首位' },
    ],
    tips: ['火山方舟控制台获取 endpoint id', 'pro 版适合复杂任务', '32k 上下文适合长文案'],
  },
  {
    id: 'doubao-comment-reply',
    name: '评论区互动',
    description: '抖音/小红书评论区神回复',
    category: 'doubao',
    icon: '💬',
    template: `你是{{account_type}}的运营，请为以下视频/笔记写评论区互动内容。

## 内容摘要
{{content_summary}}

## 任务
1. 写 {{pin_count}} 条作者置顶评论（引导互动）
2. 针对以下用户评论写回复：
{{user_comments}}

## 回复要求
- 语气：{{tone}}
- 每条回复 {{reply_length}} 字以内
- 适当用 emoji，但不尬
- 负面评论：{{negative_strategy}}
- 引流评论：{{promo_strategy}}`,
    variables: [
      { name: 'account_type', description: '账号类型', defaultValue: '美妆品牌官方号' },
      { name: 'content_summary', description: '内容摘要', defaultValue: '一条 30 秒防晒科普视频，讲了 SPF 和 PA 的区别' },
      { name: 'pin_count', description: '置顶评论数', defaultValue: '2' },
      { name: 'user_comments', description: '用户评论', defaultValue: '「敏感肌能用吗？」\n「是不是广告？」\n「求链接！」' },
      { name: 'tone', description: '语气', defaultValue: '亲切专业' },
      { name: 'reply_length', description: '回复长度', defaultValue: '50' },
      { name: 'negative_strategy', description: '负面策略', defaultValue: '坦诚回应，不怼人，转私信' },
      { name: 'promo_strategy', description: '引流策略', defaultValue: '引导看主页橱窗，不硬塞链接' },
    ],
    tips: ['置顶评论可设互动话题', '负面评论策略提前定好', '豆包懂国内平台语境'],
  },
  {
    id: 'doubao-trend-hook',
    name: '热点借势文案',
    description: '结合热搜/节日快速产出短视频钩子',
    category: 'doubao',
    icon: '🔥',
    template: `结合当前热点，为账号写一条可拍的短视频切入点。

## 账号定位
{{account}}

## 产品/主题（可软性植入）
{{product}}

## 热点信息
{{trend}}

## 输出
1. **3 个钩子标题**（前 3 秒口播/字幕）
2. **15 秒脚本大纲**（画面+口播）
3. **植入方式** — 自然/硬广，说明选择理由
4. **风险提示** — 热点关联是否可能翻车

风格：{{tone}}`,
    variables: [
      { name: 'account', description: '账号', defaultValue: '美妆科普号，20-30 岁女性' },
      { name: 'product', description: '产品', defaultValue: '防晒霜，SPF50+ PA++++' },
      { name: 'trend', description: '热点', defaultValue: '端午小长假户外出游' },
      { name: 'tone', description: '风格', defaultValue: '轻松有用，不像硬广' },
    ],
    tips: ['热点要写具体事件/节日', '风险提示防翻车', '豆包对字节内容生态熟'],
  },
  {
    id: 'doubao-live-outline',
    name: '直播大纲',
    description: '整场直播节奏与货品排品脚本',
    category: 'doubao',
    icon: '📺',
    template: `策划一场 {{duration}} 分钟的直播大纲。

## 直播信息
- 主题：{{theme}}
- 主播风格：{{host_style}}
- 核心货品：{{products}}

## 输出表格
| 时间段 | 环节 | 货品/内容 | 话术要点 | 互动设计 |

并附：
1. 开场 5 分钟完整话术
2. 逼单节奏建议（何时上秒杀/福袋）
3. 下播预告话术`,
    variables: [
      { name: 'duration', description: '时长', defaultValue: '120' },
      { name: 'theme', description: '主题', defaultValue: '夏日护肤专场' },
      { name: 'host_style', description: '主播风格', defaultValue: '专业亲切，节奏中等' },
      { name: 'products', description: '货品', defaultValue: '洁面、防晒、面霜各 1 款，面膜组合装' },
    ],
    tips: ['排品顺序影响 GPM', '互动设计拉停留', '可对接「带货话术」模板细化'],
  },
  {
    id: 'doubao-video-prompt',
    name: '即梦 · 视频生成',
    description: '豆包/即梦 AI 视频提示词',
    category: 'doubao',
    icon: '🎥',
    template: `{{style}}风格视频：{{subject}}

【画面】{{scene}}
【动作】{{action}}（单一动作，幅度{{motion_level}}）
【镜头】{{camera}} · {{duration}} · {{aspect_ratio}}
【光影】{{lighting}}
【氛围】{{mood}}

画质：流畅稳定，主体清晰，无抖动
避免出现：{{negative}}`,
    variables: [
      { name: 'style', description: '风格', defaultValue: '电影感写实' },
      { name: 'subject', description: '主体', defaultValue: '咖啡师在吧台制作拉花咖啡' },
      { name: 'scene', description: '画面', defaultValue: '午后阳光洒进精品咖啡店，蒸汽升腾' },
      { name: 'action', description: '动作', defaultValue: '倾倒牛奶完成拉花' },
      { name: 'motion_level', description: '幅度', defaultValue: '小' },
      { name: 'camera', description: '镜头', defaultValue: '近景固定机位' },
      { name: 'duration', description: '时长', defaultValue: '5s' },
      { name: 'aspect_ratio', description: '比例', defaultValue: '9:16' },
      { name: 'lighting', description: '光影', defaultValue: '暖色侧光' },
      { name: 'mood', description: '氛围', defaultValue: '治愈、生活感' },
      { name: 'negative', description: '排除', defaultValue: '换脸、抖动、模糊、水印、畸形手' },
    ],
    tips: ['视频只写一个动作', '图生视频先准备静帧', '竖屏 9:16 适合抖音'],
  },
];