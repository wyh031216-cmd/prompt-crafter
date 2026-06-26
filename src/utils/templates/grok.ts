import type { PromptTemplate } from './types';

export const GROK_TEMPLATES: PromptTemplate[] = [
  {
    id: 'grok-video-shot',
    name: '视频 · 单镜',
    description: '一次一镜，适合图生视频',
    category: 'grok',
    icon: '🎥',
    template: `【风格锁定 · 最高优先级】
photorealistic, real camera capture, natural skin texture, NOT anime, NOT illustration

【镜头 {{shot_num}} | {{duration}} | {{shot_type}}】

【本镜画面 — 只拍这一件事】
{{shot_action}}

【人物锁定】
{{character_lock}}

【场景】
{{scene_lock}}

{{product_line}}

【规格】{{aspect}}，画面稳定，动作流畅

{{continuity}}

【严禁】换脸、动漫风、抖动模糊、错误产品包装`,
    variables: [
      { name: 'shot_num', description: '镜号', defaultValue: '1' },
      { name: 'duration', description: '时长', defaultValue: '0-3s' },
      { name: 'shot_type', description: '景别', defaultValue: '近景 CU' },
      { name: 'shot_action', description: '本镜动作', defaultValue: '年轻女性睡眼惺忪醒来，阳光洒在面部' },
      { name: 'character_lock', description: '人物', defaultValue: '东亚面孔，黑色中长发，素颜，白色家居服，全片同一张脸' },
      { name: 'scene_lock', description: '场景', defaultValue: '现代家居卧室，清晨暖光' },
      { name: 'product_line', description: '本镜产品说明', defaultValue: '（本镜可无产品）' },
      { name: 'aspect', description: '比例', defaultValue: '9:16 竖屏' },
      { name: 'continuity', description: '连续性', defaultValue: '' },
    ],
    tips: ['一次只复制一条', '镜头2起用上一镜最后一帧图生视频', '每镜只写一个动作'],
  },
  {
    id: 'grok-image-character',
    name: '图像 · 角色锁定',
    description: '写实角色参考图，防换脸',
    category: 'grok',
    icon: '🧑',
    template: `【风格锁定 · 最高优先级】
photorealistic, hyperrealistic photograph, real human skin texture with pores, natural lighting, DSLR photography
NOT illustration, NOT anime, NOT digital art

【生成内容】
{{character_description}}

【面部细节 · 不可省略】
{{face_detail}}

【拍摄参数】
景别：{{framing}} · 光线：{{lighting}} · 背景：{{background}} · {{aspect}}

【严禁】
anime, cartoon, plastic skin, airbrushed, blurry face, doll-like, watermark`,
    variables: [
      { name: 'character_description', description: '角色外观', defaultValue: '东亚年轻女性，黑色中长发，素颜清透，白色家居服，正面半身' },
      { name: 'face_detail', description: '面部要求', defaultValue: '五官清晰，皮肤毛孔可见，眼睛有虹膜细节，禁止磨皮' },
      { name: 'framing', description: '景别', defaultValue: '半身近景' },
      { name: 'lighting', description: '光线', defaultValue: '柔和窗光' },
      { name: 'background', description: '背景', defaultValue: '家居卧室虚化' },
      { name: 'aspect', description: '比例', defaultValue: '9:16' },
    ],
    tips: ['Grok 易偏动漫，务必完整复制', '满意后用于视频图生视频参考'],
  },
  {
    id: 'grok-image-product',
    name: '图像 · 产品展示',
    description: '商业产品摄影，突出包装细节',
    category: 'grok',
    icon: '📦',
    template: `【风格锁定】
Professional product photography, sharp packaging focus, clean commercial lighting

【生成内容】
{{product_name}} — {{product_look}}
摆放：{{placement}}
氛围：{{mood}}

【参数】光线 {{lighting}} · 背景 {{background}} · {{aspect}}

【严禁】错误包装、乱码标签、无关物品、模糊`,
    variables: [
      { name: 'product_name', description: '产品名', defaultValue: '清透保湿面霜' },
      { name: 'product_look', description: '外观', defaultValue: '白色圆柱瓶、淡蓝色瓶盖、50ml' },
      { name: 'placement', description: '摆放', defaultValue: '居中，瓶盖清晰' },
      { name: 'mood', description: '氛围', defaultValue: '简约医疗风' },
      { name: 'lighting', description: '光线', defaultValue: '柔光' },
      { name: 'background', description: '背景', defaultValue: '纯白渐变' },
      { name: 'aspect', description: '比例', defaultValue: '9:16' },
    ],
    tips: ['有实物图优先图生图', '包装描述越细越准'],
  },
  {
    id: 'grok-video-ad-plan',
    name: '视频 · 分镜规划',
    description: '先拆镜，再逐条建提示词',
    category: 'grok',
    icon: '🎬',
    template: `你是商业短视频导演，熟悉 Grok 视频限制（一镜一事）。

## 项目
- {{total_duration}} 秒 · {{aspect}}
- 产品：{{product_name}}（{{product_look}}）
- 人物：{{character_lock}}
- 创意：{{creative_brief}}

## 任务
拆成 {{shot_count}} 个镜头，每镜：
1. 只有一个动作（30字内中文）
2. 标注是否要产品
3. 标注是否建议图生视频

## 输出
表格：镜号 | 时间 | 动作 | 要产品 | 图生视频参考`,
    variables: [
      { name: 'total_duration', description: '总时长', defaultValue: '15' },
      { name: 'aspect', description: '比例', defaultValue: '9:16' },
      { name: 'product_name', description: '产品', defaultValue: '清透保湿面霜' },
      { name: 'product_look', description: '外观', defaultValue: '白色圆柱瓶、淡蓝瓶盖' },
      { name: 'character_lock', description: '人物', defaultValue: '东亚年轻女性，黑长发，素颜' },
      { name: 'creative_brief', description: '创意', defaultValue: '清晨护肤，展示补水，结尾品牌定格' },
      { name: 'shot_count', description: '镜头数', defaultValue: '6-8' },
    ],
    tips: ['复制到 AI 对话生成分镜', '每镜再用「单镜」模板单独保存'],
  },
  {
    id: 'grok-imagine-style',
    name: 'Imagine · 风格图',
    description: 'Grok Imagine 文生图（中文分段，风格词可英）',
    category: 'grok',
    icon: '🖼️',
    template: `【风格锁定】
{{style_keywords}}

【生成内容】
{{subject}}

【构图】{{composition}}
【光线】{{lighting}}
【镜头】{{camera}}
【色调】{{color_palette}}

【画质】超清细节，锐利焦点，稳定构图
【严禁】{{negative_prompt}}`,
    variables: [
      { name: 'subject', description: '主体描述', defaultValue: '年轻女性在温馨咖啡馆窗边看书，侧脸受光，表情放松' },
      {
        name: 'style_keywords',
        description: '风格关键词',
        defaultValue: 'cinematic photography, shallow depth of field, NOT illustration',
      },
      { name: 'composition', description: '构图', defaultValue: '三分法构图，人物偏左，留出窗外景深' },
      { name: 'lighting', description: '光线', defaultValue: '午后暖色窗光，柔和阴影' },
      { name: 'camera', description: '镜头', defaultValue: '85mm 人像镜头，浅景深' },
      { name: 'color_palette', description: '色调', defaultValue: '暖棕与米白，低对比，电影感' },
      {
        name: 'negative_prompt',
        description: '排除项',
        defaultValue: '模糊、水印、文字、畸形手部、动漫风、过度磨皮',
      },
    ],
    tips: [
      '分段标题用中文，照着填就行',
      '【风格锁定】行可保留英文摄影词，写实更稳',
      '主体、构图、光线用中文写通常也够用',
    ],
  },
  {
    id: 'grok-image-scene',
    name: '图像 · 场景氛围',
    description: '空镜、环境、氛围图（无人物特写）',
    category: 'grok',
    icon: '🌆',
    template: `【风格锁定】
{{style_lock}}

【生成内容】
{{scene_description}}

【氛围】{{mood}}
【时间/天气】{{time_weather}}
【镜头】{{camera}} · {{aspect}}

【画质】4K, sharp focus, stable composition
【严禁】人物正脸特写、水印、文字、风格漂移、过度 HDR`,
    variables: [
      { name: 'style_lock', description: '风格', defaultValue: 'cinematic photography, natural color grading, NOT illustration' },
      { name: 'scene_description', description: '场景', defaultValue: '空无一人的东京涩谷十字路口，雨后路面反光，霓虹倒影' },
      { name: 'mood', description: '氛围', defaultValue: '孤独、电影感、静谧' },
      { name: 'time_weather', description: '时间天气', defaultValue: '深夜，小雨刚停' },
      { name: 'camera', description: '镜头', defaultValue: '广角远景，低机位' },
      { name: 'aspect', description: '比例', defaultValue: '16:9' },
    ],
    tips: ['适合视频开场空镜', '不写人物可减少换脸风险', '雨夜霓虹是 Grok 氛围强项'],
  },
  {
    id: 'grok-img2video',
    name: '视频 · 图生视频',
    description: '从参考图延续动效，保持人物/产品一致',
    category: 'grok',
    icon: '🔁',
    template: `【最高优先级 · 与参考图一致】
人物/产品/包装/色调必须与上传的参考图完全一致，不得换脸、不得改包装。

【本镜动作 — 只做一件事】
{{motion}}

【镜头】{{shot_type}} · {{duration}} · {{aspect}}

【运动要求】
- 动作幅度：{{motion_intensity}}
- 相机：{{camera_motion}}
- 保持：面部清晰、无抖动、无风格漂移

【严禁】换脸、动漫化、产品变形、背景突变、模糊`,
    variables: [
      { name: 'motion', description: '动作', defaultValue: '女性微微转头看向窗外，发丝轻动，表情自然' },
      { name: 'shot_type', description: '景别', defaultValue: '近景' },
      { name: 'duration', description: '时长', defaultValue: '3-5s' },
      { name: 'aspect', description: '比例', defaultValue: '9:16' },
      { name: 'motion_intensity', description: '幅度', defaultValue: '轻微，避免大幅肢体变化' },
      { name: 'camera_motion', description: '运镜', defaultValue: '固定机位或极慢推镜' },
    ],
    tips: ['务必上传满意的角色/产品静图', '动作越小越稳', '每镜只写一个动词'],
  },
  {
    id: 'grok-negative-builder',
    name: 'Negative 词生成',
    description: '根据场景生成 Grok 视频反向约束词',
    category: 'grok',
    icon: '🚫',
    template: `你是 Grok 视频提示词专家。根据以下场景，生成一份 Negative Prompt（英文逗号分隔）。

## 场景类型
{{scene_type}}

## 正向提示词摘要
{{positive_summary}}

## 特别担心的问题
{{worries}}

## 输出
1. **Negative 词列表**（15-25 个，英文，逗号分隔，可直接粘贴）
2. **中文说明**（每条为何需要，3-5 条）
3. **优先级标注**：哪些必须保留、哪些可省略`,
    variables: [
      { name: 'scene_type', description: '场景', defaultValue: '写实护肤广告，单人女性，产品特写' },
      { name: 'positive_summary', description: '正向摘要', defaultValue: '东亚女性素颜护肤，白色面霜瓶，家居晨光' },
      { name: 'worries', description: '担心问题', defaultValue: '换脸、动漫化、产品包装错误、画面抖动' },
    ],
    tips: ['复制 Negative 到 Grok 视频设置', '写实场景务必含 anime/cartoon', '产品类场景建议加 wrong packaging、incorrect packaging'],
  },
];