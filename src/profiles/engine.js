/* ── Style & Platform Helpers ────────────────────────────────── */

const STYLE_POSITIVE = {
  realistic: [
    'photorealistic', 'hyperrealistic photograph', 'real camera capture', 'RAW photo',
    'real human skin texture with pores', 'natural lighting', 'DSLR photography',
    'NOT illustration', 'NOT digital art', 'NOT stylized',
  ],
  anime: ['anime style', 'Japanese animation aesthetic', 'cel shading', 'clean anime lineart', '2D anime illustration'],
  semi_realistic: ['semi-realistic digital painting', 'painterly realism', 'detailed illustration with realistic proportions'],
  concept: ['professional concept art', 'character design sheet', 'production-ready reference art'],
  pixel: ['pixel art', 'retro 16-bit game sprite style'],
  watercolor: ['watercolor illustration', 'soft brush strokes', 'paper texture'],
  illustration: ['digital illustration', 'artistic rendering'],
  oil: ['oil painting texture', 'canvas brushwork'],
  '3d': ['3D rendered', 'octane render', 'CGI'],
  flat: ['flat design', 'vector illustration'],
  retro: ['vintage film photography', 'analog grain'],
};

const STYLE_NEGATIVE = {
  realistic: [
    'anime', 'manga', 'cartoon', 'cel shading', 'illustration', 'drawing', 'sketch',
    'painting', 'watercolor', 'comic', 'line art', 'flat colors', 'vector art',
    '3d render', 'cgi', 'game character', 'stylized', 'chibi', 'pixar', 'disney style',
    'oversaturated', 'plastic skin', 'doll-like', 'uncanny smooth skin', 'airbrushed',
  ],
  anime: ['photorealistic', 'real photograph', '3d render', 'western cartoon', 'hyperrealistic'],
  semi_realistic: ['chibi', 'cartoon', 'flat vector'],
  concept: ['amateur sketch', 'messy doodle', 'low effort'],
  illustration: ['photorealistic photograph', 'blurry photo'],
  oil: ['photorealistic', 'digital clean vector'],
  '3d': ['2d illustration', 'hand drawn sketch'],
  flat: ['photorealistic', '3d render', 'complex texture'],
  retro: ['digital clean', 'oversharpened HDR'],
};

const SHARED_IMAGE_QUESTIONS = [
  {
    id: 'platform', label: '使用平台', type: 'single', required: true,
    options: [
      { value: 'grok', label: 'Grok Imagine' },
      { value: 'midjourney', label: 'Midjourney' },
      { value: 'sd', label: 'Stable Diffusion' },
      { value: 'dalle', label: 'DALL·E' },
      { value: 'general', label: '通用 / 其他' },
    ],
  },
  {
    id: 'strictness', label: '风格锁定强度', type: 'single', required: true,
    hint: '选「严格锁定」可最大程度避免风格跑偏（如写实变动漫）',
    options: [
      { value: 'strict', label: '🔒 严格锁定 — 不容偏差' },
      { value: 'normal', label: '适中' },
      { value: 'loose', label: '宽松 — 允许创意发挥' },
    ],
    detect: () => 'strict',
  },
  {
    id: 'purpose', label: '用途 / 交付标准', type: 'single',
    options: [
      { value: 'client', label: '客户交付 — 必须精准' },
      { value: 'reference', label: '内部参考 / 建模用' },
      { value: 'portfolio', label: '作品集展示' },
      { value: 'explore', label: '探索灵感 — 可试错' },
    ],
  },
];

function getVisibleQuestions(profile, answers) {
  const all = [...(profile.sharedQuestions || []), ...profile.questions];
  return all.filter(q => !q.showWhen || q.showWhen(answers));
}

function buildStyleLock(style, strictness) {
  if (!style || !STYLE_POSITIVE[style]) return { lock: '', avoid: STYLE_NEGATIVE[style] || [] };
  const pos = STYLE_POSITIVE[style];
  const neg = [...(STYLE_NEGATIVE[style] || [])];
  if (strictness === 'strict') {
    return {
      lock: `【风格锁定 · 最高优先级】\n${pos.join(', ')}\n风格不得偏离，不得混入其他画风。`,
      avoid: neg,
      repeat: `【风格确认】严格保持 ${pos[0]} 风格，不得变成其他画风。`,
    };
  }
  if (strictness === 'normal') {
    return { lock: `【风格要求】${pos.slice(0, 4).join(', ')}`, avoid: neg.slice(0, 8), repeat: '' };
  }
  return { lock: `风格倾向：${pos[0]}`, avoid: neg.slice(0, 4), repeat: '' };
}

function stripSectionMarkers(text) {
  if (!text) return '';
  return text.replace(/【[^】]+】/g, '').replace(/\s+/g, ' ').trim();
}

function extractEnglishTags(text) {
  if (!text) return '';
  return text
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter((s) => s && !/[\u4e00-\u9fff]/.test(s))
    .join(', ');
}

function buildPlatformTip(platform, profileId, ans) {
  const tips = {
    grok: {
      image_character: [
        ans.style === 'realistic' ? 'Grok 易偏动漫，请完整复制正向提示词。' : '',
        (ans.view_type === 'turnaround' || ans.face_priority === 'ultra')
          ? '三视图易把脸画小：若仍模糊，追加「附放大面部特写，毛孔与五官必须清晰」。'
          : '面部不足时追加：「sharp focus on face, visible skin pores, detailed eyes」。',
      ],
      image_scene: [
        'Grok 场景图用分段结构更稳；写实空镜优先自然光与电影色调。',
        ans.subject === 'architecture' ? '建筑场景写明材质与透视，避免过度 HDR。' : '',
      ],
      video: [
        'Grok 一次只生成一镜：正文末尾有「单镜提示词」区块，逐条复制。',
        '第 2 镜起建议用上一镜最后一帧做图生视频，保持产品/人物一致。',
        ans.duration === 'short' ? '15 秒内广告建议 4–6 镜，每镜只写一个动作。' : '',
      ],
    },
    midjourney: {
      image_character: [
        'MJ 角色表用 --ar 16:9；面部细节可加 ::2 权重或单独 upsample 脸部。',
        ans.view_type === 'turnaround' ? '三视图建议 --style raw + 写实词，必要时拆成正面/侧面两条生成。' : '',
      ],
      image_scene: [
        'MJ 用英文逗号链；氛围词放末尾，主体放最前。',
        ans.ratio ? `已按 ${ans.ratio} 附加 --ar，可在末尾微调 --stylize。` : '',
      ],
      video: [
        'MJ 用于关键帧静图，视频需后期或图生视频工具合成。',
        '已输出首镜关键帧；其余镜头可复制结构改镜号与动作。',
      ],
    },
    sd: {
      image_character: [
        'SD 正向已加质量权重；面部相关词带 (tag:1.2~1.3)。负面提示单独粘贴到 Negative 框。',
        '三视图用 ControlNet OpenPose 或 IP-Adapter 可显著提升一致性。',
      ],
      image_scene: [
        'SD 建议 CFG 7–9；写实场景加 realistic vision 类 checkpoint。',
        '负面提示务必完整复制，可减少水印与畸形。',
      ],
      video: [
        'SD 视频需 AnimateDiff / SVD 等插件；已按首镜运动描述格式化正负向。',
        '产品镜头建议固定机位 + 轻微推拉，减少形变。',
      ],
    },
    dalle: {
      image_character: [
        'DALL·E 偏好自然语言段落；已转为描述句，直接粘贴即可。',
        '若面部仍简化，追加一句：「The face must show pores, iris detail, and natural asymmetry.」',
      ],
      image_scene: [
        'DALL·E 3 用完整句子描述构图与光线；避免堆砌逗号关键词。',
        '需要排除项时写在段落末尾 Do NOT include 句。',
      ],
      video: [
        'DALL·E 仅支持静图；已生成第 1 镜关键帧参考。',
        '完整视频请改用 Grok 视频，或先用关键帧串联图生视频。',
      ],
    },
    general: {
      image_character: ['通用格式保留分段结构，可按目标平台再一键格式化。'],
      image_scene: ['通用格式适合手动改编；选定平台后可获得更优结构。'],
      video: ['完整分镜脚本适合策划；生成视频建议选 Grok 并逐镜复制单镜提示词。'],
    },
  };
  const platformTips = tips[platform] || tips.general;
  const profileTips = platformTips[profileId] || platformTips.image_scene || [];
  return profileTips.filter(Boolean).join(' ');
}

function parseStoryboardShots(storyboard) {
  return storyboard
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => {
      const m = line.match(/^([\d\-]+秒?)\s*\|\s*(.+)$/);
      if (m) return { time: m[1], action: m[2], index: i + 1 };
      return { time: `镜${i + 1}`, action: line, index: i + 1 };
    });
}

function buildGrokShotBlock(shot, ctx) {
  const avoidLines = ctx.avoid.slice(0, 8).map((a) => `- ${a}`);
  const styleHeader = ctx.styleLock.lock?.includes('最高优先级')
    ? ctx.styleLock.lock
    : ctx.styleLock.lock?.replace(/【风格锁定[^】]*】/, '【风格锁定 · 最高优先级】');
  const showProduct = shotNeedsProduct(shot.action);
  const lines = [
    styleHeader,
    '',
    `【镜头 ${shot.index} | ${shot.time} | 近景 CU】`,
    '',
    '【本镜画面 — 只拍这一件事】',
    shot.action.replace(/^[^：:]+[：:]\s*/, ''),
  ];
  if (ctx.characterLock?.trim()) {
    lines.push('', '【人物锁定】', ctx.characterLock.trim());
  }
  if (ctx.sceneLock?.trim()) {
    lines.push('', '【场景】', ctx.sceneLock.trim());
  }
  if (showProduct) {
    lines.push('', '【产品锁定 — 包装必须与描述一致】', ctx.productBlock);
  } else {
    lines.push('', '【产品】', '（本镜可无产品）');
  }
  lines.push(
    '',
    `【规格】${ctx.ratio}，${ctx.cameraMove}，画面稳定，动作流畅`,
  );
  if (ctx.quality?.length) lines.push(`【质量】${ctx.quality.join('，')}`);
  if (shot.index > 1) {
    lines.push('', '【连续性】人物/产品/包装/色调与参考图或上一镜最后一帧完全一致，不得换脸、不得改包装');
  }
  lines.push('', '【严禁】换脸、动漫风、抖动模糊、错误产品包装', ...avoidLines);
  return lines.filter(Boolean).join('\n');
}

function buildVideoFullScript(ctx) {
  const lines = [
    ctx.styleLock.lock,
    '',
    '【产品主体 — 视频中必须清晰呈现，不得替换为其他商品】',
    ctx.productBlock,
    '',
    `【视频类型】${ctx.targetPlatform} · ${ctx.seconds}秒 · ${ctx.ratio} · ${ctx.category}商业宣传`,
    `【目标人群】${ctx.audience}`,
    `【核心诉求】${ctx.desc}`,
    '',
    '【分镜脚本 — 按时间轴生成，直接用于 AI 视频】',
    ctx.storyboard,
    '',
    '【拍摄参数】',
    `- 运镜：${ctx.cameraMove}`,
    `- 节奏：${ctx.pace}`,
    '- 风格：商业广告质感，产品始终是画面焦点',
  ];
  if (ctx.audio && ctx.audio !== 'none') {
    lines.push(`- 音频：${ctx.audio === 'music' ? '轻快背景音乐' : ctx.audio === 'voiceover' ? '旁白解说' : '环境音'}`);
  }
  if (ctx.quality?.length) lines.push(`- 质量：${ctx.quality.join('，')}`);
  if (ctx.extra) lines.push('', `【结尾文案】${ctx.extra}`);
  lines.push('', '【再次确认】视频中展示的产品必须是上述指定产品，包装外观与描述一致，不得生成无关物品或模糊占位符。');
  lines.push('', '【严禁】', ...ctx.avoid.map((a) => `- ${a}`));
  return lines.join('\n');
}

function formatVideoForPlatform(platform, ctx) {
  const shots = parseStoryboardShots(ctx.storyboard);
  const firstShot = shots[0];
  const styleFlat = extractEnglishTags(stripSectionMarkers(ctx.styleLock.lock));
  const productEn = [ctx.productName, ctx.productLook, ctx.sellingPoint].filter(Boolean).join(', ');
  const motionCore = firstShot
    ? firstShot.action.replace(/^[^：:]+[：:]/, '').trim()
    : ctx.desc;

  if (platform === 'grok') {
    const script = buildVideoFullScript(ctx);
    if (shots.length <= 1) return script;
    const shotBlocks = shots.map((s) => buildGrokShotBlock(s, ctx)).join('\n\n---\n\n');
    return `${script}\n\n════════════════════════════════\n【Grok 单镜提示词 — 一次只复制一条】\n════════════════════════════════\n\n${shotBlocks}`;
  }

  if (platform === 'midjourney') {
    const keyframes = shots.slice(0, 3).map((shot, i) => {
      const action = shot.action.replace(/^[^：:]+[：:]/, '').trim();
      const prompt = [
        styleFlat && `${styleFlat}::2`,
        'cinematic commercial video keyframe',
        action,
        productEn,
        ctx.cameraMove,
        'sharp focus, professional product lighting',
      ].filter(Boolean).join(', ');
      const suffix = [
        ctx.ratio ? `--ar ${ctx.ratio}` : '',
        '--style raw',
        `--no ${ctx.avoid.slice(0, 12).join(', ')}`,
      ].filter(Boolean).join(' ');
      return `Keyframe ${i + 1} (${shot.time}): ${prompt} ${suffix}`;
    });
    return [
      `【MJ 关键帧参考 — ${ctx.seconds}s ${ctx.category} ad，${ctx.targetPlatform}】`,
      '说明：Midjourney 生成静图关键帧，视频需后期合成或图生视频。',
      '',
      ...keyframes,
      '',
      '【完整分镜】',
      ctx.storyboard,
    ].join('\n');
  }

  if (platform === 'sd') {
    const qualityPrefix = ctx.strictness === 'strict'
      ? '(best quality:1.2), (smooth motion:1.2), (cinematic:1.1)'
      : 'best quality, smooth motion, cinematic';
    const positive = [
      qualityPrefix,
      styleFlat,
      'commercial product video',
      motionCore,
      productEn,
      ctx.cameraMove,
      ctx.pace,
      `${ctx.ratio} aspect ratio`,
    ].filter(Boolean).join(', ');
    const negative = [
      ...ctx.avoid,
      'static image', 'frozen frame', 'stuttering', 'frame skip', 'morphing product',
    ].join(', ');
    return { positive, negative };
  }

  if (platform === 'dalle') {
    const frame = formatForPlatform('dalle', {
      lock: ctx.styleLock.lock,
      subject: `a cinematic commercial video keyframe: ${motionCore}. Product: ${productEn}`,
      details: `${ctx.cameraMove}, ${ctx.ratio} aspect ratio, ${ctx.pace}`,
      quality: 'sharp focus, stable composition, professional advertising look',
      avoid: ctx.avoid,
      strictness: ctx.strictness,
      profileType: 'video',
    });
    return [
      '【DALL·E 第 1 镜关键帧 — 静图参考】',
      '说明：DALL·E 不支持视频生成；请用 Grok 视频或图生视频完成动效。',
      '',
      frame,
      '',
      '【完整分镜脚本】',
      ctx.storyboard,
    ].join('\n\n');
  }

  return buildVideoFullScript(ctx);
}

function formatGrokImageCharacter(sections) {
  const {
    lock, faceBlock, desc, subject, details, quality, repeat, avoid,
    framing, lighting, background, ratio,
  } = sections;
  const avoidList = avoid?.length ? avoid : [];
  const styleHeader = lock?.includes('最高优先级') ? lock : lock?.replace(
    /【风格锁定[^】]*】/,
    '【风格锁定 · 最高优先级】',
  );
  const content = [desc, subject, details].filter(Boolean).join('\n');
  const lines = [
    styleHeader,
    '',
    '【生成内容】',
    content,
    '',
    faceBlock,
    '',
    `【拍摄参数】\n景别：${framing} · 光线：${lighting} · 背景：${background} · ${ratio}`,
  ];
  if (quality) lines.push('', quality);
  if (repeat) lines.push('', repeat);
  if (avoidList.length) {
    lines.push('', '【严禁】', avoidList.slice(0, 15).join(', '));
    lines.push('', '如果无法确定风格，优先选择写实摄影而非插画风格。');
  }
  return lines.filter(Boolean).join('\n');
}

function shotNeedsProduct(action) {
  return /产品|包装|特写|closeup|usage|使用|成分|质地|品牌/i.test(action);
}

function formatForPlatform(platform, sections) {
  const {
    lock, subject, details, quality, repeat, avoid, desc,
    ratio, strictness, profileType, faceBlock, framing, lighting, background,
  } = sections;
  const avoidList = avoid?.length ? avoid : [];
  const isStrict = strictness === 'strict';
  const styleFlat = extractEnglishTags(stripSectionMarkers(lock)) || stripSectionMarkers(lock);

  if (platform === 'grok') {
    if (profileType === 'image_character' && faceBlock) {
      return formatGrokImageCharacter({ ...sections, avoid: avoidList });
    }
    const lines = [
      lock,
      '',
      '【生成内容】',
      desc,
      subject,
      details,
      quality,
    ].filter(Boolean);
    if (repeat) lines.push('', repeat);
    if (avoidList.length) {
      lines.push('', '【严禁出现以下风格/元素】');
      avoidList.forEach(a => lines.push(`- ${a}`));
      lines.push('', '如果无法确定风格，优先选择写实摄影而非插画风格。');
    }
    return lines.join('\n');
  }

  if (platform === 'midjourney') {
    const core = [subject, details, quality].filter(Boolean).join(', ');
    const styleWeighted = styleFlat
      ? (isStrict ? `${styleFlat}::2` : styleFlat)
      : '';
    const faceBoost = profileType === 'image_character' && isStrict
      ? 'highly detailed face, sharp facial focus::1.5'
      : '';
    const prompt = [styleWeighted, faceBoost, core].filter(Boolean).join(', ');
    const suffix = [
      ratio ? `--ar ${ratio}` : '',
      isStrict && /photorealistic|realistic|photograph/i.test(styleFlat) ? '--style raw' : '',
      avoidList.length ? `--no ${avoidList.slice(0, 15).join(', ')}` : '',
    ].filter(Boolean).join(' ');
    return suffix ? `${prompt} ${suffix}` : prompt;
  }

  if (platform === 'sd') {
    const qualityPrefix = isStrict
      ? '(masterpiece:1.2), (best quality:1.2), (ultra detailed:1.1)'
      : 'masterpiece, best quality, ultra detailed';
    const faceBoost = profileType === 'image_character'
      ? '(detailed face:1.3), (sharp focus on face:1.2), (visible skin texture:1.1)'
      : '';
    const positiveParts = [
      qualityPrefix,
      faceBoost,
      styleFlat,
      subject,
      details,
      quality,
    ].filter(Boolean);
    const positive = positiveParts.join(', ');
    const negExtra = isStrict ? ', worst quality, low quality, normal quality, lowres, jpeg artifacts' : '';
    return { positive, negative: avoidList.join(', ') + negExtra };
  }

  if (platform === 'dalle') {
    const paragraphs = [];
    if (styleFlat) paragraphs.push(`${styleFlat}.`);
    const main = subject || desc;
    if (main) paragraphs.push(`Create a high-quality image of ${main}.`);
    if (details) paragraphs.push(`Additional details: ${details}.`);
    if (quality) paragraphs.push(`${quality}.`);
    const repeatEn = extractEnglishTags(stripSectionMarkers(repeat));
    if (repeatEn) paragraphs.push(`${repeatEn}.`);
    if (avoidList.length) {
      paragraphs.push(`Do NOT include: ${avoidList.slice(0, 12).join(', ')}.`);
    }
    return paragraphs.filter(Boolean).join('\n\n');
  }

  const lines = [lock, '', subject, details, quality].filter(Boolean);
  if (avoidList.length) {
    lines.push('', '---', '【避免】', ...avoidList.map(a => `- ${a}`));
  }
  return lines.join('\n');
}

function buildStoryboard(ans, totalSec) {
  const product = ans.product_name || '该产品';
  const look = ans.product_look || '产品包装';
  const sell = ans.selling_point || '核心卖点';
  const shots = ans.shots || ['opening', 'closeup', 'usage', 'ending'];

  const templates = {
    opening: `0-${Math.ceil(totalSec * 0.2)}秒 | 清晨柔光中，${look} 从虚化背景缓缓入画（仅此一个动作）`,
    closeup: `${Math.ceil(totalSec * 0.15)}-${Math.ceil(totalSec * 0.4)}秒 | ${product} 瓶身缓慢微转15度，标签与瓶盖清晰可见（仅此一个动作）`,
    usage: `${Math.ceil(totalSec * 0.35)}-${Math.ceil(totalSec * 0.7)}秒 | 用户单手拿起 ${product} 轻触面颊，表情自然（仅此一个动作）`,
    ingredient: `${Math.ceil(totalSec * 0.4)}-${Math.ceil(totalSec * 0.6)}秒 | 产品质地特写，手指轻抹展示 ${sell}（仅此一个动作）`,
    transition: `转场：色调统一，硬切或淡入淡出（无新动作）`,
    ending: `${Math.ceil(totalSec * 0.75)}-${totalSec}秒 | ${product} 居中定格，品牌名${ans.extra ? `「${ans.extra}」` : ''}渐入（仅此一个动作）`,
  };

  const order = ['opening', 'closeup', 'usage', 'ingredient', 'transition', 'ending'];
  return order.filter(s => shots.includes(s)).map(s => templates[s]).filter(Boolean).join('\n');
}

function calcPrecision(profile, answers) {
  const visible = getVisibleQuestions(profile, answers);
  const required = visible.filter(q => q.required);
  const optional = visible.filter(q => !q.required && q.type !== 'text');
  const reqDone = required.filter(q => {
    const v = answers[q.id];
    if (q.type === 'text') return v?.trim();
    return q.type === 'multi' ? v?.length > 0 : !!v;
  }).length;
  const optDone = optional.filter(q => {
    const v = answers[q.id];
    return q.type === 'multi' ? v?.length > 0 : !!v;
  }).length;
  const base = required.length ? (reqDone / required.length) * 70 : 50;
  const bonus = optional.length ? (optDone / optional.length) * 30 : 30;
  const strictBonus = answers.strictness === 'strict' ? 5 : 0;
  return Math.min(100, Math.round(base + bonus + strictBonus));
}

/* ── Intent Profiles ─────────────────────────────────────────── */

const PROFILES = [
  {
    id: 'image_character',
    label: '角色 / 人物图像',
    icon: '🧍',
    sharedQuestions: SHARED_IMAGE_QUESTIONS,
    keywords: ['三视图', '立绘', '角色', '人物', '人设', '全身', '肖像', '头像', 'turnaround', 'character sheet', 'concept art', '男性', '女性', '男孩', '女孩'],
    negativeBase: [
      'deformed', 'bad anatomy', 'extra limbs', 'missing limbs', 'fused fingers',
      'too many fingers', 'poorly drawn hands', 'poorly drawn face', 'mutation',
      'blurry', 'low quality', 'lowres', 'watermark', 'text', 'signature',
      'cropped', 'out of frame', 'duplicate',
    ],
    questions: [
      {
        id: 'gender', label: '角色性别', type: 'single', required: true,
        options: [
          { value: 'male', label: '男性' }, { value: 'female', label: '女性' },
          { value: 'neutral', label: '中性' },
        ],
      },
      {
        id: 'age', label: '年龄感', type: 'single', required: true,
        options: [
          { value: 'child', label: '儿童 8-12 岁' }, { value: 'teen', label: '少年 13-17 岁' },
          { value: 'young_adult', label: '青年 18-30 岁' }, { value: 'adult', label: '成年 30-50 岁' },
          { value: 'elder', label: '中老年 50+ 岁' },
        ],
      },
      {
        id: 'ethnicity', label: '人种 / 面部特征', type: 'single',
        options: [
          { value: 'asian', label: '东亚面孔' }, { value: 'caucasian', label: '欧美白人' },
          { value: 'african', label: '非洲裔' }, { value: 'latino', label: '拉丁裔' },
          { value: 'middle_eastern', label: '中东面孔' }, { value: 'mixed', label: '混血 / 不明确' },
        ],
      },
      {
        id: 'view_type', label: '视图类型', type: 'single', required: true,
        detect: (desc) => desc.includes('三视图') ? 'turnaround' : null,
        options: [
          { value: 'turnaround', label: '三视图 (正+侧+背)' },
          { value: 'front', label: '正面全身' },
          { value: 'portrait', label: '半身 / 胸像' },
          { value: 'action', label: '动态姿势' },
        ],
      },
      {
        id: 'body', label: '体态身材', type: 'single', required: true,
        options: [
          { value: 'slim', label: '纤细' }, { value: 'average', label: '标准' },
          { value: 'athletic', label: '健美运动型' }, { value: 'muscular', label: '肌肉发达' },
          { value: 'stocky', label: '壮实敦实' },
        ],
      },
      {
        id: 'style', label: '艺术风格', type: 'single', required: true,
        options: [
          { value: 'realistic', label: '写实摄影' },
          { value: 'anime', label: '日系动漫' },
          { value: 'semi_realistic', label: '半写实插画' },
          { value: 'concept', label: '概念设计 / 原画' },
          { value: 'pixel', label: '像素风' },
          { value: 'watercolor', label: '水彩插画' },
        ],
      },
      {
        id: 'realistic_subtype', label: '写实细分类', type: 'single',
        showWhen: (a) => a.style === 'realistic',
        options: [
          { value: 'studio', label: '影棚证件照式' },
          { value: 'street', label: '街头纪实摄影' },
          { value: 'fashion', label: '时尚杂志摄影' },
          { value: 'cinematic', label: '电影剧照感' },
          { value: 'documentary', label: '纪录片自然光' },
        ],
      },
      {
        id: 'hair', label: '发型', type: 'single',
        options: [
          { value: 'short', label: '短发' }, { value: 'medium', label: '中长发' },
          { value: 'long', label: '长发' }, { value: 'bald', label: '光头 / 寸头' },
          { value: 'styled', label: '有造型感' },
        ],
      },
      {
        id: 'expression', label: '表情', type: 'single',
        options: [
          { value: 'neutral', label: '中性 / 无表情' }, { value: 'confident', label: '自信' },
          { value: 'serious', label: '严肃' }, { value: 'friendly', label: '友善微笑' },
          { value: 'intense', label: '凌厉 / 有张力' },
        ],
      },
      {
        id: 'face_priority', label: '面部细节优先级', type: 'single', required: true,
        hint: '三视图/全身图容易丢失面部细节，建议选「极高」',
        detect: (desc) => desc.includes('三视图') || desc.includes('全身') ? 'ultra' : 'high',
        options: [
          { value: 'ultra', label: '极高 — 面部必须精细可见' },
          { value: 'high', label: '高 — 五官清晰' },
          { value: 'normal', label: '正常' },
        ],
      },
      {
        id: 'face_features', label: '面部细节要素', type: 'multi',
        hint: '勾选你希望保留的面部特征，越多越不容易「磨皮」',
        detect: (desc) => desc.includes('写实') || desc.includes('三视图')
          ? ['skin', 'eyes', 'structure', 'closeup_panel'] : ['eyes', 'structure'],
        options: [
          { value: 'skin', label: '皮肤纹理 / 毛孔' },
          { value: 'eyes', label: '眼部细节 (虹膜、眼神光)' },
          { value: 'structure', label: '眉骨 / 鼻梁 / 下颌轮廓' },
          { value: 'asymmetry', label: '自然面部不对称' },
          { value: 'stubble', label: '胡茬 / 法令纹 / 皱纹' },
          { value: 'closeup_panel', label: '附图：面部特写面板' },
        ],
      },
      {
        id: 'face_closeup', label: '面部呈现方式', type: 'single',
        showWhen: (a) => a.view_type === 'turnaround' || a.view_type === 'front',
        detect: (desc) => desc.includes('三视图') ? 'inset' : 'prominent',
        options: [
          { value: 'inset', label: '三视图 + 面部特写附图 (推荐)' },
          { value: 'prominent', label: '全身图中面部占比较大' },
          { value: 'head_turnaround', label: '额外增加头部转面 (正/侧/3/4)' },
        ],
      },
      {
        id: 'clothing', label: '服装', type: 'single', required: true,
        options: [
          { value: 'casual', label: '休闲便装' }, { value: 'formal', label: '正装西装' },
          { value: 'uniform', label: '制服校服' }, { value: 'fantasy', label: '奇幻铠甲' },
          { value: 'scifi', label: '科幻机能' }, { value: 'traditional', label: '传统服饰' },
          { value: 'minimal', label: '极简素体参考' },
        ],
      },
      {
        id: 'background', label: '背景', type: 'single', required: true,
        options: [
          { value: 'white', label: '纯白背景' }, { value: 'gray', label: '灰色参考底' },
          { value: 'simple', label: '简单纯色' }, { value: 'detailed', label: '完整场景' },
        ],
      },
      {
        id: 'quality', label: '画质 / 构图', type: 'multi',
        detect: (desc) => {
          const q = ['hd', 'sharp'];
          if (desc.includes('三视图')) q.push('consistent', 'full_body');
          if (desc.includes('写实') || desc.includes('三视图')) q.push('face_sharp');
          return q;
        },
        options: [
          { value: 'hd', label: '超高清细节' },
          { value: 'face_sharp', label: '面部锐化 / 焦点在脸' },
          { value: 'consistent', label: '多视图角色一致' },
          { value: 'full_body', label: '完整全身不裁切' },
          { value: 'symmetry', label: '对称构图' },
          { value: 'sharp', label: '边缘锐利清晰' },
        ],
      },
      { id: 'extra', label: '必须包含的细节 (可选)', type: 'text', placeholder: '例：左臂纹身、金框眼镜、小麦色皮肤…' },
    ],
    build(desc, ans) {
      const maps = {
        gender: { male: 'male', female: 'female', neutral: 'androgynous person' },
        age: { child: 'child aged 8-12', teen: 'teenager 13-17', young_adult: 'young adult 18-30', adult: 'adult 30-50', elder: 'elderly over 50' },
        ethnicity: { asian: 'East Asian facial features', caucasian: 'Caucasian features', african: 'African features', latino: 'Latino features', middle_eastern: 'Middle Eastern features', mixed: 'mixed ethnicity' },
        view: {
          turnaround: 'character turnaround reference sheet, front view + side view + back view, full body, T-pose, orthographic layout, equal spacing between views',
          front: 'front view, full body standing, arms at sides', portrait: 'upper body portrait, bust shot', action: 'dynamic action pose, full body',
        },
        body: { slim: 'slim build', average: 'average build', athletic: 'athletic muscular build', muscular: 'very muscular build', stocky: 'stocky broad build' },
        hair: { short: 'short hair', medium: 'medium length hair', long: 'long hair', bald: 'bald or buzz cut', styled: 'styled fashionable hair' },
        expr: { neutral: 'neutral expression', confident: 'confident expression', serious: 'serious expression', friendly: 'friendly slight smile', intense: 'intense focused expression' },
        cloth: { casual: 'casual everyday clothing', formal: 'formal business suit', uniform: 'uniform', fantasy: 'fantasy armor outfit', scifi: 'sci-fi techwear', traditional: 'traditional cultural dress', minimal: 'minimal plain clothing for body reference' },
        bg: { white: 'pure white seamless background', gray: 'neutral gray studio background', simple: 'simple solid color background', detailed: 'detailed environment' },
        realSub: { studio: 'studio portrait photography, even softbox lighting', street: 'street photography, natural urban setting', fashion: 'high fashion editorial photography', cinematic: 'cinematic film still, dramatic lighting', documentary: 'documentary natural light photography' },
      };

      const styleLock = buildStyleLock(ans.style, ans.strictness);

      const facePriorityMap = {
        ultra: 'FACIAL DETAILS ARE CRITICAL — face must be the most detailed part of the image',
        high: 'highly detailed face with clearly visible features',
        normal: 'clear facial features',
      };
      const faceFeatureMap = {
        skin: 'visible skin pores and natural skin texture, subsurface scattering, no airbrushing',
        eyes: 'detailed eyes with visible iris patterns, catchlight reflection, defined eyelids and eyelashes',
        structure: 'defined brow ridge, nose bridge, cheekbones, jawline and chin contour',
        asymmetry: 'natural subtle facial asymmetry, realistic proportions',
        stubble: 'natural facial lines, subtle stubble or age-appropriate wrinkles',
        closeup_panel: 'separate face close-up inset panel alongside body views, head detail reference',
      };
      const faceCloseupMap = {
        inset: 'character sheet layout with dedicated face close-up inset panel next to body turnaround, face shown at larger scale',
        prominent: 'face occupies significant portion of frame, head clearly large enough to show fine detail',
        head_turnaround: 'additional head turnaround row showing front face, 3/4 view and profile with fine facial detail',
      };

      const faceParts = [facePriorityMap[ans.face_priority] || facePriorityMap.high];
      (ans.face_features || []).forEach(f => { if (faceFeatureMap[f]) faceParts.push(faceFeatureMap[f]); });
      if (ans.face_closeup && faceCloseupMap[ans.face_closeup]) faceParts.push(faceCloseupMap[ans.face_closeup]);
      if (ans.view_type === 'turnaround' && !(ans.face_features || []).includes('closeup_panel') && !ans.face_closeup) {
        faceParts.push(faceCloseupMap.inset);
      }

      const faceBlock = `【面部细节 · 不可省略】\n${faceParts.join('. ')}.\n正面视图中面部必须清晰可辨，禁止磨皮、禁止五官模糊。`;

      const subject = [
        maps.view[ans.view_type] || maps.view.turnaround,
        `${maps.gender[ans.gender]}, ${maps.age[ans.age]}`,
        maps.ethnicity[ans.ethnicity],
        maps.body[ans.body],
        maps.hair[ans.hair],
        maps.expr[ans.expression],
        maps.cloth[ans.clothing],
        maps.bg[ans.background],
      ].filter(Boolean).join(', ');

      const details = [];
      if (ans.style === 'realistic' && ans.realistic_subtype) details.push(maps.realSub[ans.realistic_subtype]);
      if (ans.extra?.trim()) details.push(ans.extra.trim());

      const qExtras = {
        hd: '8k resolution, ultra sharp, masterpiece, best quality',
        face_sharp: 'sharp focus on face, facial features in crisp detail, face not out of focus',
        consistent: 'IDENTICAL face and character across all views, same facial features hair and outfit',
        full_body: 'complete full body head to toe, no cropping at ankles or head',
        symmetry: 'centered balanced composition',
        sharp: 'crisp edges, high clarity, no blur',
      };
      const quality = (ans.quality || []).map(q => qExtras[q]).filter(Boolean).join(', ');

      const avoid = [...new Set([...this.negativeBase, ...styleLock.avoid])];
      avoid.push(
        'blurry face', 'featureless face', 'smooth blank face', 'no facial detail',
        'face out of focus', 'low detail face', 'generic face', 'obscured face',
        'airbrushed skin', 'plastic skin', 'doll face', 'waxy skin', 'over-smoothed face',
        'missing facial features', 'undefined eyes', 'blob face',
      );
      if (ans.view_type === 'turnaround') {
        avoid.push('inconsistent outfit between views', 'only one angle shown', 'overlapping views', 'tiny unreadable face', 'face too small to see details');
      }
      if ((ans.quality || []).includes('full_body')) avoid.push('cut off feet', 'cut off head', 'cropped limbs');
      if (ans.style === 'realistic') avoid.push('anime eyes', 'big anime eyes', 'toon shading');
      if (ans.face_priority === 'ultra' || ans.face_priority === 'high') {
        avoid.push('beauty filter', 'skin smoothing', 'soft focus on face');
      }

      const repeatWithFace = [styleLock.repeat, '再次确认：面部五官细节必须清晰可见，不可省略或模糊处理。'].filter(Boolean).join('\n');

      const ratioMap = { turnaround: '16:9', front: '2:3', portrait: '2:3', action: '2:3' };
      const framingMap = {
        turnaround: '三视图全身参考', front: '正面全身', portrait: '半身近景', action: '全身动态姿势',
      };
      const lightingMap = {
        studio: '影棚均匀柔光', street: '自然街景光', fashion: '杂志布光',
        cinematic: '戏剧电影光', documentary: '纪录片自然光',
      };
      const bgLabelMap = {
        white: '纯白无缝背景', gray: '灰色摄影棚背景', simple: '纯色简洁背景', detailed: '完整环境场景',
      };
      const defaultLighting = ans.style === 'realistic' ? '自然柔光' : '风格化均匀光';
      const platform = ans.platform || 'grok';
      const faceEnglish = faceParts.join('. ');
      const isGrok = platform === 'grok';
      const ratio = ratioMap[ans.view_type] || '1:1';

      const formatted = formatForPlatform(platform, {
        lock: styleLock.lock,
        faceBlock: isGrok ? faceBlock : undefined,
        subject,
        details: [details.join(', '), isGrok ? '' : faceEnglish].filter(Boolean).join(', '),
        quality,
        repeat: isGrok ? repeatWithFace : styleLock.repeat,
        avoid,
        desc,
        ratio,
        framing: framingMap[ans.view_type] || framingMap.turnaround,
        lighting: (ans.style === 'realistic' && ans.realistic_subtype)
          ? lightingMap[ans.realistic_subtype] || defaultLighting
          : defaultLighting,
        background: bgLabelMap[ans.background] || bgLabelMap.white,
        strictness: ans.strictness,
        profileType: 'image_character',
      });

      const isSD = platform === 'sd' && typeof formatted === 'object';
      return {
        positive: isSD ? formatted.positive : formatted,
        negative: isSD ? formatted.negative : avoid.join(', '),
        hasNegative: true,
        precision: calcPrecision(this, ans),
        grokTip: buildPlatformTip(platform, 'image_character', ans) || null,
      };
    },
    buildNegative(desc, ans) {
      const sl = buildStyleLock(ans.style, ans.strictness);
      return [...new Set([...this.negativeBase, ...sl.avoid])];
    },
  },

  {
    id: 'image_scene',
    label: '场景 / 通用图像',
    icon: '🖼️',
    sharedQuestions: SHARED_IMAGE_QUESTIONS,
    keywords: ['图片', '图像', '画', '场景', '海报', '封面', '插画', '壁纸', '背景图', 'banner'],
    negativeBase: ['blurry', 'low quality', 'watermark', 'text', 'signature', 'ugly', 'deformed', 'bad composition', 'cropped'],
    questions: [
      {
        id: 'subject', label: '画面主体', type: 'single', required: true,
        options: [
          { value: 'landscape', label: '风景' }, { value: 'architecture', label: '建筑' },
          { value: 'object', label: '物品 / 产品' }, { value: 'food', label: '美食' },
          { value: 'animal', label: '动物' }, { value: 'abstract', label: '抽象' },
        ],
      },
      {
        id: 'style', label: '视觉风格', type: 'single', required: true,
        options: [
          { value: 'realistic', label: '写实摄影' }, { value: 'illustration', label: '数字插画' },
          { value: 'oil', label: '油画' }, { value: '3d', label: '3D 渲染' },
          { value: 'flat', label: '扁平设计' }, { value: 'retro', label: '复古胶片' },
        ],
      },
      {
        id: 'mood', label: '氛围', type: 'single',
        options: [
          { value: 'bright', label: '明亮' }, { value: 'dark', label: '暗沉' },
          { value: 'warm', label: '温暖' }, { value: 'cold', label: '冷峻' },
          { value: 'epic', label: '史诗' }, { value: 'minimal', label: '极简' },
        ],
      },
      {
        id: 'ratio', label: '比例', type: 'single', required: true,
        options: [
          { value: '16:9', label: '横版 16:9' }, { value: '9:16', label: '竖版 9:16' },
          { value: '1:1', label: '方形 1:1' }, { value: '4:3', label: '4:3' },
        ],
      },
      {
        id: 'lighting', label: '光线', type: 'single', required: true,
        options: [
          { value: 'natural', label: '自然光' }, { value: 'golden', label: '黄金时刻' },
          { value: 'studio', label: '影棚光' }, { value: 'neon', label: '霓虹夜景' },
          { value: 'dramatic', label: '戏剧光' },
        ],
      },
      {
        id: 'camera', label: '镜头感', type: 'single',
        showWhen: (a) => a.style === 'realistic',
        options: [
          { value: 'wide', label: '广角全景' }, { value: 'standard', label: '标准镜头' },
          { value: 'telephoto', label: '长焦压缩' }, { value: 'macro', label: '微距特写' },
          { value: 'aerial', label: '航拍俯视' },
        ],
      },
      {
        id: 'quality', label: '画质', type: 'multi',
        options: [
          { value: 'hd', label: '超高清' }, { value: 'detailed', label: '丰富细节' },
          { value: 'cinematic', label: '电影感' },
        ],
      },
      { id: 'extra', label: '画面必须包含 (可选)', type: 'text', placeholder: '具体元素、颜色、位置…' },
    ],
    build(desc, ans) {
      const styleLock = buildStyleLock(ans.style, ans.strictness);
      const platform = ans.platform || 'grok';
      const subjectMap = {
        landscape: 'landscape scenery', architecture: 'architectural scene',
        object: 'product hero shot', food: 'food photography', animal: 'wildlife scene', abstract: 'abstract art',
      };
      const moodMap = {
        bright: 'bright cheerful atmosphere', dark: 'dark moody atmosphere',
        warm: 'warm color tones', cold: 'cold blue tones', epic: 'epic grand scale', minimal: 'minimalist clean composition',
      };
      const lightMap = {
        natural: 'natural daylight', golden: 'golden hour warm light',
        studio: 'professional studio lighting', neon: 'neon-lit night scene', dramatic: 'dramatic cinematic lighting',
      };
      const camMap = {
        wide: 'wide angle establishing shot', standard: '50mm standard lens perspective',
        telephoto: 'telephoto lens compression', macro: 'macro close-up detail', aerial: 'aerial drone overview',
      };

      const sceneCore = [desc, subjectMap[ans.subject], moodMap[ans.mood], lightMap[ans.lighting]].filter(Boolean).join(', ');
      const techParts = [ans.ratio ? `aspect ratio ${ans.ratio}` : ''];
      if (ans.camera) techParts.push(camMap[ans.camera]);
      if ((ans.quality || []).includes('hd')) techParts.push('8k ultra detailed, sharp focus');
      if ((ans.quality || []).includes('detailed')) techParts.push('rich environmental detail');
      if ((ans.quality || []).includes('cinematic')) techParts.push('cinematic composition, depth of field, film grain');
      if (ans.extra?.trim()) techParts.push(ans.extra.trim());

      const avoid = [...new Set([...this.negativeBase, ...styleLock.avoid])];
      if (ans.subject !== 'object' && ans.subject !== 'animal') {
        avoid.push('prominent human face close-up', 'portrait subject', 'watermark text overlay');
      }
      if (ans.style === 'realistic') avoid.push('oversaturated HDR', 'plastic CGI look');

      const formatted = formatForPlatform(platform, {
        lock: styleLock.lock,
        subject: sceneCore,
        details: techParts.filter(Boolean).join(', '),
        quality: (ans.quality || []).includes('hd') ? '' : 'high resolution, professional quality',
        repeat: styleLock.repeat,
        avoid,
        desc,
        ratio: ans.ratio,
        strictness: ans.strictness,
        profileType: 'image_scene',
      });
      const isSD = platform === 'sd' && typeof formatted === 'object';
      return {
        positive: isSD ? formatted.positive : formatted,
        negative: isSD ? formatted.negative : avoid.join(', '),
        hasNegative: true,
        precision: calcPrecision(this, ans),
        grokTip: buildPlatformTip(platform, 'image_scene', ans) || null,
      };
    },
    buildNegative(desc, ans) {
      return [...new Set([...this.negativeBase, ...buildStyleLock(ans.style, ans.strictness).avoid])];
    },
  },

  {
    id: 'video',
    label: '视频生成',
    icon: '🎬',
    sharedQuestions: [SHARED_IMAGE_QUESTIONS[0], SHARED_IMAGE_QUESTIONS[1]],
    keywords: ['视频', '短视频', '动画', '短片', 'clip', 'video', '运镜', '分镜', 'mv', '宣传片', '广告片', '预告', '图生视频'],
    negativeBase: ['blurry', 'flickering', 'jittery', 'low fps', 'watermark', 'text overlay', 'distorted faces', 'wrong product', 'generic placeholder product'],
    questions: [
      {
        id: 'product_name', label: '产品名称', type: 'text', required: true,
        hint: '必填 — 没有产品名，视频 AI 不知道拍什么',
        placeholder: '例：薇诺娜舒敏保湿特护霜',
      },
      {
        id: 'product_look', label: '产品外观描述', type: 'text', required: true,
        hint: '包装颜色、形状、材质，越具体生成越准',
        placeholder: '例：白色圆柱瓶身、淡蓝色瓶盖、50ml、简约医疗风包装',
      },
      {
        id: 'selling_point', label: '核心卖点 (1-2个)', type: 'text', required: true,
        placeholder: '例：敏感肌专用、48小时长效保湿',
      },
      {
        id: 'product_category', label: '产品品类', type: 'single', required: true,
        options: [
          { value: 'beauty', label: '美妆护肤' }, { value: 'food', label: '食品饮料' },
          { value: 'tech', label: '数码电子' }, { value: 'fashion', label: '服饰箱包' },
          { value: 'home', label: '家居日用' }, { value: 'app', label: 'App / 软件' },
          { value: 'service', label: '服务 / 课程' }, { value: 'other', label: '其他' },
        ],
      },
      {
        id: 'duration', label: '时长', type: 'single', required: true,
        detect: (desc) => {
          const m = desc.match(/(\d+)\s*秒/);
          if (m) return +m[1] <= 15 ? 'short' : +m[1] <= 60 ? 'medium' : 'long';
          return desc.includes('短') ? 'short' : null;
        },
        options: [
          { value: 'short', label: '短视频 ≤15秒' }, { value: 'medium', label: '中等 15-60秒' },
          { value: 'long', label: '较长 1-3分钟' },
        ],
      },
      {
        id: 'style', label: '视觉风格', type: 'single', required: true,
        detect: (desc) => desc.includes('宣传') || desc.includes('广告') ? 'commercial' : null,
        options: [
          { value: 'realistic', label: '写实摄影' }, { value: 'cinematic', label: '电影质感' },
          { value: 'anime', label: '动漫' }, { value: 'documentary', label: '纪录片' },
          { value: 'commercial', label: '商业广告' },
        ],
      },
      {
        id: 'target_platform', label: '发布平台', type: 'single', required: true,
        detect: (desc) => desc.includes('抖音') ? 'douyin' : desc.includes('小红书') ? 'xiaohongshu' : 'douyin',
        options: [
          { value: 'douyin', label: '抖音 (竖屏)' }, { value: 'xiaohongshu', label: '小红书' },
          { value: 'bilibili', label: 'B站' }, { value: 'wechat', label: '视频号' },
          { value: 'general', label: '通用' },
        ],
      },
      {
        id: 'audience', label: '目标人群', type: 'single',
        options: [
          { value: 'young_female', label: '年轻女性' }, { value: 'young_male', label: '年轻男性' },
          { value: 'parent', label: '宝妈 / 家庭' }, { value: 'professional', label: '职场人士' },
          { value: 'student', label: '学生' }, { value: 'general', label: '大众' },
        ],
      },
      {
        id: 'ratio', label: '画面比例', type: 'single', required: true,
        detect: (desc) => desc.includes('抖音') || desc.includes('竖') ? '9:16' : '16:9',
        options: [
          { value: '16:9', label: '横版 16:9' }, { value: '9:16', label: '竖版 9:16' },
          { value: '1:1', label: '方形 1:1' },
        ],
      },
      {
        id: 'camera_move', label: '运镜方式', type: 'single', required: true,
        options: [
          { value: 'static', label: '固定机位' }, { value: 'pan', label: '平移' },
          { value: 'dolly', label: '推拉' }, { value: 'orbit', label: '环绕' },
          { value: 'handheld', label: '手持晃动' }, { value: 'aerial', label: '航拍' },
        ],
      },
      {
        id: 'shots', label: '镜头结构', type: 'multi',
        detect: () => ['opening', 'closeup', 'usage', 'ending'],
        options: [
          { value: 'opening', label: '吸睛开场' }, { value: 'closeup', label: '产品特写' },
          { value: 'usage', label: '使用场景演示' }, { value: 'ingredient', label: '成分/细节展示' },
          { value: 'transition', label: '平滑转场' }, { value: 'ending', label: '品牌结尾定格' },
        ],
      },
      {
        id: 'pace', label: '节奏', type: 'single',
        options: [
          { value: 'slow', label: '慢节奏 / 沉稳' }, { value: 'normal', label: '正常' },
          { value: 'fast', label: '快节奏 / 动感' },
        ],
      },
      {
        id: 'audio', label: '音频要求', type: 'single',
        options: [
          { value: 'none', label: '无音频 / 静音' }, { value: 'ambient', label: '环境音' },
          { value: 'music', label: '背景音乐' }, { value: 'voiceover', label: '旁白解说' },
        ],
      },
      {
        id: 'quality', label: '质量约束', type: 'multi',
        options: [
          { value: 'stable', label: '画面稳定不抖动' },
          { value: 'consistent', label: '角色/主体前后一致' },
          { value: 'smooth', label: '动作流畅自然' },
          { value: 'hd', label: '高清画质' },
        ],
      },
      {
        id: 'character_lock', label: '人物锁定 (可选)', type: 'text',
        hint: '有真人出镜时填写；全程同一张脸、同一造型。无人物可留空',
        placeholder: '例：东亚年轻女性，黑色中长发，素颜，白色家居服',
        detect: (d) => /女性|男性|模特|人物|素颜|长发/.test(d) ? '' : null,
      },
      {
        id: 'scene_lock', label: '场景锁定 (可选)', type: 'text',
        hint: '全片统一场景与光线，减少镜头间跳戏',
        placeholder: '例：现代家居卧室，清晨暖光透窗',
        detect: (d) => /家居|卧室|浴室|厨房|晨光|清晨/.test(d) ? '' : null,
      },
      { id: 'extra', label: '品牌 Slogan / 结尾文案 (可选)', type: 'text', placeholder: '例：敏感肌的天敌、XX品牌 守护你的肌肤' },
    ],
    build(desc, ans) {
      const platform = ans.platform || 'grok';
      const styleKey = ans.style === 'cinematic' || ans.style === 'commercial' ? 'realistic' : ans.style;
      const styleLock = buildStyleLock(styleKey, ans.strictness);
      const moveMap = {
        static: 'static camera', pan: 'slow pan shot', dolly: 'dolly push-in',
        orbit: 'slow orbit around product', handheld: 'subtle handheld', aerial: 'aerial establishing shot',
      };
      const paceMap = { slow: 'slow elegant pacing', normal: 'natural commercial pacing', fast: 'fast dynamic cuts' };
      const durSec = { short: 15, medium: 30, long: 90 };
      const seconds = durSec[ans.duration] || 15;
      const platMap = {
        douyin: '抖音竖屏短视频', xiaohongshu: '小红书种草视频', bilibili: 'B站',
        wechat: '微信视频号', general: '通用平台',
      };
      const audMap = {
        young_female: '年轻女性消费者', young_male: '年轻男性', parent: '宝妈群体',
        professional: '职场白领', student: '学生群体', general: '大众消费者',
      };
      const catMap = {
        beauty: '美妆护肤', food: '食品饮料', tech: '数码科技', fashion: '服饰',
        home: '家居', app: '软件应用', service: '服务', other: '消费品',
      };
      const qMap = { stable: '画面稳定无抖动', consistent: '产品外观全程一致', smooth: '动作流畅', hd: '4K高清' };
      const qualityLabels = (ans.quality || []).map((k) => qMap[k]).filter(Boolean);

      const productBlock = [
        `产品名称：${ans.product_name || '[未填写 — 请返回补充]'}`,
        `产品外观：${ans.product_look || '[未填写]'}`,
        `核心卖点：${ans.selling_point || '[未填写]'}`,
        `品类：${catMap[ans.product_category] || '消费品'}`,
      ].join('\n');

      const storyboard = buildStoryboard(ans, seconds);
      const avoid = [...new Set([
        ...this.negativeBase, ...styleLock.avoid,
        'random objects', 'unrelated products', 'blank packaging', 'illegible label',
        'anime', 'cartoon', 'style drift', 'face morphing', 'wrong packaging',
      ])];

      const ctx = {
        styleLock,
        productBlock,
        productName: ans.product_name || '',
        productLook: ans.product_look || '',
        sellingPoint: ans.selling_point || '',
        storyboard,
        desc,
        seconds,
        ratio: ans.ratio || '9:16',
        cameraMove: moveMap[ans.camera_move] || moveMap.static,
        pace: paceMap[ans.pace] || paceMap.normal,
        targetPlatform: platMap[ans.target_platform] || platMap.general,
        audience: audMap[ans.audience] || audMap.general,
        category: catMap[ans.product_category] || '消费品',
        avoid,
        strictness: ans.strictness,
        quality: qualityLabels,
        extra: ans.extra?.trim() || '',
        audio: ans.audio,
        characterLock: ans.character_lock?.trim() || '',
        sceneLock: ans.scene_lock?.trim() || '',
      };

      const formatted = formatVideoForPlatform(platform, ctx);
      const isSD = platform === 'sd' && typeof formatted === 'object';
      const missing = !ans.product_name?.trim() || !ans.product_look?.trim() || !ans.selling_point?.trim();

      return {
        positive: isSD ? formatted.positive : formatted,
        negative: isSD ? formatted.negative : avoid.join(', '),
        hasNegative: true,
        precision: calcPrecision(this, ans),
        grokTip: missing
          ? '⚠️ 产品信息未填完整，视频 AI 只能瞎猜。请返回第 2 步填写产品名称、外观和卖点。'
          : buildPlatformTip(platform, 'video', ans) || null,
      };
    },
    buildNegative(desc, ans) {
      return [...new Set([...this.negativeBase, ...buildStyleLock(ans.style, ans.strictness).avoid])];
    },
  },

  {
    id: 'text_writing',
    label: '文本撰写',
    icon: '✍️',
    keywords: ['写', '撰写', '文案', '论文', '报告', '分析', '论述', '总结', '翻译', '润色', '邮件', '文章', '段落'],
    questions: [
      {
        id: 'type', label: '文本类型', type: 'single', required: true,
        options: [
          { value: 'academic', label: '学术论文' }, { value: 'business', label: '商业报告' },
          { value: 'marketing', label: '营销文案' }, { value: 'summary', label: '摘要总结' },
          { value: 'general', label: '通用写作' },
        ],
        detect: (desc) => {
          if (/论文|学位|学术|期刊|开题|文献综述/.test(desc)) return 'academic';
          if (/报告|调研|白皮书|可行性/.test(desc)) return 'business';
          if (/文案|种草|推广|广告|slogan/i.test(desc)) return 'marketing';
          if (/摘要|总结|概括|纪要/.test(desc)) return 'summary';
          return null;
        },
      },
      {
        id: 'audience', label: '目标读者', type: 'single', required: true,
        options: [
          { value: 'expert', label: '专业人士' }, { value: 'general', label: '普通读者' },
          { value: 'client', label: '甲方 / 客户' }, { value: 'student', label: '学生 / 评审' },
        ],
      },
      {
        id: 'tone', label: '语气', type: 'single', required: true,
        options: [
          { value: 'formal', label: '正式严谨' }, { value: 'professional', label: '专业客观' },
          { value: 'accessible', label: '通俗易懂' }, { value: 'persuasive', label: '有说服力' },
        ],
      },
      {
        id: 'length_academic', label: '篇幅', type: 'single', required: true,
        showWhen: (a) => a.type === 'academic',
        hint: '学术论文通常数千字以上，请按实际交付选择',
        options: [
          { value: 'acad_3k', label: '约 3000 字（课程 / 期末）' },
          { value: 'acad_5k', label: '约 5000 字（期刊短文）' },
          { value: 'acad_8k', label: '约 8000 字（学位论文章节）' },
          { value: 'acad_12k', label: '约 12000 字及以上' },
          { value: 'acad_outline', label: '先出详细提纲，正文另定' },
        ],
        detect: (desc) => {
          const m = desc.match(/(\d+)\s*字/);
          if (m) {
            const n = parseInt(m[1], 10);
            if (n >= 12000) return 'acad_12k';
            if (n >= 8000) return 'acad_8k';
            if (n >= 5000) return 'acad_5k';
            if (n >= 3000) return 'acad_3k';
          }
          if (/提纲|大纲|框架/.test(desc)) return 'acad_outline';
          return 'acad_5k';
        },
      },
      {
        id: 'length_business', label: '篇幅', type: 'single', required: true,
        showWhen: (a) => a.type === 'business',
        options: [
          { value: 'biz_1k5', label: '约 1500 字（执行简报）' },
          { value: 'biz_3k', label: '约 3000 字（标准报告）' },
          { value: 'biz_5k', label: '约 5000 字（深度分析）' },
          { value: 'biz_8k', label: '约 8000 字及以上' },
        ],
        detect: (desc) => (/(\d+)\s*字/.test(desc) ? 'biz_3k' : 'biz_3k'),
      },
      {
        id: 'length_marketing', label: '篇幅', type: 'single', required: true,
        showWhen: (a) => a.type === 'marketing' || a.type === 'summary',
        options: [
          { value: 'short', label: '约 200 字' }, { value: 'medium', label: '约 500 字' },
          { value: 'long', label: '约 1000 字' }, { value: 'paragraph', label: '一个完整段落' },
        ],
      },
      {
        id: 'length_general', label: '篇幅', type: 'single', required: true,
        showWhen: (a) => a.type === 'general' || !a.type,
        options: [
          { value: 'gen_500', label: '约 500 字' },
          { value: 'gen_1500', label: '约 1500 字' },
          { value: 'gen_3000', label: '约 3000 字' },
          { value: 'gen_5000', label: '约 5000 字及以上' },
        ],
      },
      {
        id: 'language', label: '输出语言', type: 'single', required: true,
        options: [
          { value: 'zh', label: '中文' }, { value: 'en', label: '英文' }, { value: 'bilingual', label: '中英双语' },
        ],
      },
      {
        id: 'must_include', label: '必须包含', type: 'multi',
        options: [
          { value: 'data', label: '引用数据支撑' }, { value: 'cases', label: '实际案例' },
          { value: 'comparison', label: '对比分析' }, { value: 'conclusion', label: '明确结论' },
          { value: 'suggestion', label: '可执行建议' },
        ],
      },
      {
        id: 'constraints', label: '写作红线', type: 'multi',
        options: [
          { value: 'no_fabrication', label: '不编造数据/文献' },
          { value: 'cite_needed', label: '标注引用处' },
          { value: 'structured', label: '分段分点' },
          { value: 'logic_chain', label: '逻辑链条' },
          { value: 'no_ai_tone', label: '避免 AI 腔' },
          { value: 'no_hedging', label: '不要模糊回避' },
        ],
      },
      { id: 'keywords', label: '必须出现的关键词 (可选)', type: 'text', placeholder: '用逗号分隔' },
      { id: 'extra', label: '其他要求 (可选)', type: 'text', placeholder: '核心论点、禁忌话题…' },
    ],
    build(desc, ans) {
      const typeMap = { academic: '学术研究写作专家', business: '商业分析专家', marketing: '资深文案策划', summary: '专业编辑', general: '专业写作助手' };
      const audMap = { expert: '面向领域专家，可用专业术语', general: '面向普通读者，术语需解释', client: '面向甲方客户，注重结论和建议', student: '面向学术评审，注重规范性' };
      const toneMap = { formal: '正式严谨', professional: '专业客观', accessible: '通俗易懂', persuasive: '有说服力' };
      const lenMap = {
        short: '约200字', medium: '约500字', long: '约1000字', paragraph: '一个完整段落',
        acad_3k: '约3000字', acad_5k: '约5000字', acad_8k: '约8000字', acad_12k: '约12000字及以上',
        acad_outline: '先输出详细提纲，正文篇幅按章节展开',
        biz_1k5: '约1500字', biz_3k: '约3000字', biz_5k: '约5000字', biz_8k: '约8000字及以上',
        gen_500: '约500字', gen_1500: '约1500字', gen_3000: '约3000字', gen_5000: '约5000字及以上',
      };
      const lengthKey = ans.length_academic || ans.length_business || ans.length_marketing || ans.length_general;
      const langMap = { zh: '中文', en: '英文', bilingual: '中英双语' };
      const mustMap = { data: '用数据支撑论点', cases: '结合具体案例', comparison: '进行对比分析', conclusion: '给出明确结论', suggestion: '提供可执行建议' };
      const cMap = {
        no_fabrication: '严禁编造数据、文献、事实；不确定处标注[待核实]',
        cite_needed: '需引用处标注[需引用]',
        structured: '使用清晰分段或分点',
        logic_chain: '论点之间有逻辑递进',
        no_ai_tone: '避免空洞套话和 AI 写作痕迹',
        no_hedging: '避免「可能」「或许」等过度模糊表述',
      };
      const lines = [
        `你是${typeMap[ans.type]}。`, '',
        '【任务 — 必须完成】', desc, '',
        '【读者与风格】',
        `- 读者：${audMap[ans.audience]}`,
        `- 语气：${toneMap[ans.tone]}`,
        `- 篇幅：${lenMap[lengthKey] || '按任务需要'}`,
        `- 语言：${langMap[ans.language]}`,
      ];
      if ((ans.must_include || []).length) {
        lines.push('', '【必须包含】');
        ans.must_include.forEach(m => lines.push(`- ${mustMap[m]}`));
      }
      if ((ans.constraints || []).length) {
        lines.push('', '【红线 — 严禁违反】');
        ans.constraints.forEach(c => lines.push(`- ${cMap[c]}`));
      }
      if (ans.keywords?.trim()) lines.push('', `【关键词 — 必须出现】${ans.keywords.trim()}`);
      if (ans.extra?.trim()) lines.push('', `【补充】${ans.extra.trim()}`);
      lines.push('', '【输出】直接输出可用正文。不要输出提纲、不要解释过程、不要加免责声明。');
      return { positive: lines.join('\n'), hasNegative: true, precision: calcPrecision(this, ans) };
    },
    buildNegative(desc, ans) {
      const items = ['不编造具体数字、日期、人名', '不输出 AI 免责声明', '不使用「在当今社会」等模板开头', '不遗漏任务描述中的关键要求'];
      if ((ans.constraints || []).includes('no_fabrication')) items.push('不虚构研究来源', '不捏造统计数据');
      if (ans.type === 'academic') items.push('不使用口语化表达', '不跳步直接下结论');
      return items;
    },
  },

  {
    id: 'social_copy',
    label: '社媒 / 种草文案',
    icon: '📱',
    keywords: ['小红书', '种草', '抖音', '微博', '朋友圈', '文案', '推广', '带货', '营销', '标题', 'slogan', '广告语'],
    questions: [
      {
        id: 'platform', label: '发布平台', type: 'single', required: true,
        detect: (desc) => desc.includes('小红书') ? 'xiaohongshu' : desc.includes('抖音') ? 'douyin' : null,
        options: [
          { value: 'xiaohongshu', label: '小红书' }, { value: 'douyin', label: '抖音' },
          { value: 'weibo', label: '微博' }, { value: 'wechat', label: '朋友圈' }, { value: 'general', label: '通用' },
        ],
      },
      {
        id: 'product_type', label: '产品类型', type: 'single', required: true,
        options: [
          { value: 'beauty', label: '美妆护肤' }, { value: 'food', label: '食品饮料' },
          { value: 'tech', label: '数码科技' }, { value: 'fashion', label: '服饰穿搭' },
          { value: 'service', label: '服务 / 课程' }, { value: 'other', label: '其他' },
        ],
      },
      {
        id: 'tone', label: '文案调性', type: 'single', required: true,
        options: [
          { value: 'authentic', label: '真实种草 / 闺蜜分享' }, { value: 'professional', label: '专业测评' },
          { value: 'funny', label: '幽默有趣' }, { value: 'luxury', label: '高端质感' },
          { value: 'urgent', label: '促销紧迫感' },
        ],
      },
      {
        id: 'structure', label: '内容结构', type: 'multi',
        detect: () => ['hook', 'pain', 'solution', 'cta'],
        options: [
          { value: 'hook', label: '吸睛开头' }, { value: 'pain', label: '痛点共鸣' },
          { value: 'solution', label: '产品解决方案' }, { value: 'proof', label: '使用体验 / 证据' },
          { value: 'cta', label: '行动号召' }, { value: 'emoji', label: '适量 emoji' },
        ],
      },
      {
        id: 'length', label: '篇幅', type: 'single', required: true,
        options: [
          { value: 'short', label: '短文案 ≤100字' }, { value: 'medium', label: '中等 ≤300字' },
          { value: 'long', label: '长文案 ≤500字' },
        ],
      },
      {
        id: 'constraints', label: '合规红线', type: 'multi',
        detect: () => ['no_absolute', 'no_fake'],
        options: [
          { value: 'no_absolute', label: '不用绝对化用语 (最好/第一)' },
          { value: 'no_fake', label: '不虚构使用效果' },
          { value: 'no_medical', label: '不做医疗功效承诺' },
          { value: 'natural', label: '避免明显 AI 腔' },
        ],
      },
      { id: 'selling_points', label: '核心卖点 (可选)', type: 'text', placeholder: '成分、价格、差异化优势…' },
      { id: 'extra', label: '其他要求 (可选)', type: 'text', placeholder: '目标人群、禁忌词…' },
    ],
    build(desc, ans) {
      const platMap = { xiaohongshu: '小红书笔记', douyin: '抖音短视频文案', weibo: '微博', wechat: '朋友圈', general: '社交媒体' };
      const toneMap = { authentic: '闺蜜分享口吻，真实不做作', professional: '专业测评口吻，有理有据', funny: '幽默轻松', luxury: '高端质感，克制优雅', urgent: '促销紧迫感但不浮夸' };
      const structMap = { hook: '开头 1 句必须抓眼球', pain: '点出目标用户痛点', solution: '自然引出产品如何解决', proof: '描述真实使用体验（不编造）', cta: '结尾有行动号召', emoji: '适量 emoji 增加可读性' };
      const lenMap = { short: '100字以内', medium: '300字以内', long: '500字以内' };
      const cMap = { no_absolute: '禁止使用「最好」「第一」「100%」等绝对化用语', no_fake: '不虚构使用效果和数据', no_medical: '不做医疗/功效承诺', natural: '避免 AI 模板腔，像真人写的' };
      const lines = [
        `你是${platMap[ans.platform]}爆款文案写手。`, '',
        '【推广内容】', desc, '',
        '【风格】', `- 调性：${toneMap[ans.tone]}`, `- 篇幅：${lenMap[ans.length]}`,
      ];
      if ((ans.structure || []).length) { lines.push('', '【结构 — 按顺序写】'); ans.structure.forEach(s => lines.push(`- ${structMap[s]}`)); }
      if (ans.selling_points?.trim()) lines.push('', `【核心卖点 — 必须体现】${ans.selling_points.trim()}`);
      if ((ans.constraints || []).length) { lines.push('', '【红线】'); ans.constraints.forEach(c => lines.push(`- ${cMap[c]}`)); }
      if (ans.extra?.trim()) lines.push('', `【补充】${ans.extra.trim()}`);
      lines.push('', '【输出】直接输出可发布的完整文案（含标题）。不要解释过程。');
      return { positive: lines.join('\n'), hasNegative: true, precision: calcPrecision(this, ans) };
    },
    buildNegative() {
      return ['不使用绝对化广告法违禁词', '不编造用户好评', '不虚假承诺疗效', '不使用「姐妹们冲」等过度模板开头'];
    },
  },

  {
    id: 'code',
    label: '代码开发',
    icon: '💻',
    keywords: ['代码', '编程', '脚本', '程序', 'python', 'javascript', 'api', '函数', 'bug', '调试', '爬虫', '前端', '后端'],
    questions: [
      {
        id: 'lang', label: '语言', type: 'single', required: true,
        detect: (desc) => {
          const m = { python: /python|py/i, javascript: /javascript|js|node/i, typescript: /typescript|ts/i };
          for (const [k, re] of Object.entries(m)) if (re.test(desc)) return k;
          return null;
        },
        options: [
          { value: 'python', label: 'Python' }, { value: 'javascript', label: 'JavaScript' },
          { value: 'typescript', label: 'TypeScript' }, { value: 'java', label: 'Java' },
          { value: 'go', label: 'Go' }, { value: 'other', label: '其他' },
        ],
      },
      {
        id: 'task_type', label: '任务', type: 'single', required: true,
        options: [
          { value: 'implement', label: '实现功能' }, { value: 'fix', label: '修复 Bug' },
          { value: 'refactor', label: '重构' }, { value: 'review', label: '代码审查' },
        ],
      },
      {
        id: 'env', label: '运行环境', type: 'single', required: true,
        options: [
          { value: 'script', label: '脚本 / 命令行' }, { value: 'web', label: 'Web 应用' },
          { value: 'api', label: 'API 服务' }, { value: 'data', label: '数据处理' },
        ],
      },
      {
        id: 'constraints', label: '代码要求', type: 'multi',
        options: [
          { value: 'runnable', label: '必须可直接运行' },
          { value: 'error_handling', label: '完善错误处理' },
          { value: 'type_safe', label: '类型安全' },
          { value: 'minimal_deps', label: '最少依赖' },
          { value: 'production', label: '生产级质量' },
          { value: 'tested', label: '包含测试思路' },
        ],
      },
      {
        id: 'output', label: '输出形式', type: 'single', required: true,
        options: [
          { value: 'code_only', label: '只要代码' },
          { value: 'code_explain', label: '代码 + 说明' },
          { value: 'step_by_step', label: '分步实现' },
        ],
      },
      { id: 'extra', label: '技术约束 (可选)', type: 'text', placeholder: '框架版本、输入输出格式…' },
    ],
    build(desc, ans) {
      const langMap = { python: 'Python', javascript: 'JavaScript', typescript: 'TypeScript', java: 'Java', go: 'Go', other: '指定语言' };
      const taskMap = { implement: '实现', fix: '修复', refactor: '重构', review: '审查' };
      const envMap = { script: '命令行脚本', web: 'Web 应用', api: 'API 服务', data: '数据处理管道' };
      const cMap = {
        runnable: '代码必须完整可运行，不能是伪代码或片段', error_handling: '处理异常和边界情况',
        type_safe: '使用类型注解', minimal_deps: '优先标准库', production: '生产级质量',
        tested: '说明如何验证正确性',
      };
      const outMap = { code_only: '只输出代码', code_explain: '简要思路 + 完整代码', step_by_step: '分步实现' };
      const lines = [
        `你是资深 ${langMap[ans.lang]} 工程师。`, '',
        '【任务】', `${taskMap[ans.task_type]}：${desc}`, '',
        '【环境】', envMap[ans.env],
      ];
      if ((ans.constraints || []).length) {
        lines.push('', '【必须满足】');
        ans.constraints.forEach(c => lines.push(`- ${cMap[c]}`));
      }
      lines.push('', `【输出】${outMap[ans.output]}`);
      if (ans.extra?.trim()) lines.push(`【补充】${ans.extra.trim()}`);
      return { positive: lines.join('\n'), hasNegative: true, precision: calcPrecision(this, ans) };
    },
    buildNegative(desc, ans) {
      const items = ['不使用已弃用 API', '不硬编码密钥', '不写无法运行的伪代码', '不省略 import 和初始化'];
      if ((ans.constraints || []).includes('production')) items.push('不留 TODO', '不用 print 代替日志');
      return items;
    },
  },
];

const DEFAULT_PROFILE = {
  id: 'general', label: '通用任务', icon: '✨', keywords: [], negativeBase: [],
  questions: [
    { id: 'goal', label: '目标', type: 'single', required: true, options: [
      { value: 'create', label: '创作生成' }, { value: 'analyze', label: '分析解读' },
      { value: 'transform', label: '转换改写' }, { value: 'solve', label: '解决问题' },
    ]},
    { id: 'detail', label: '详细程度', type: 'single', required: true, options: [
      { value: 'brief', label: '简洁' }, { value: 'normal', label: '适中' }, { value: 'detailed', label: '详尽' },
    ]},
    { id: 'output_format', label: '输出格式', type: 'single', options: [
      { value: 'text', label: '纯文本' }, { value: 'markdown', label: 'Markdown' },
      { value: 'list', label: '分点列表' }, { value: 'table', label: '表格' },
    ]},
    { id: 'constraints', label: '约束', type: 'multi', options: [
      { value: 'accurate', label: '准确可靠' }, { value: 'structured', label: '结构清晰' },
      { value: 'actionable', label: '可直接使用' }, { value: 'no_filler', label: '不要废话' },
    ]},
    { id: 'extra', label: '补充 (可选)', type: 'text', placeholder: '其他要求…' },
  ],
  build(desc, ans) {
    const lines = ['【任务】', desc, '', `【目标】${ans.goal}`, `【详细程度】${ans.detail}`];
    if (ans.output_format) lines.push(`【格式】${ans.output_format}`);
    if ((ans.constraints || []).length) lines.push('', '【约束】', ...ans.constraints.map(c => `- ${c}`));
    if (ans.extra?.trim()) lines.push('', `【补充】${ans.extra.trim()}`);
    return { positive: lines.join('\n'), hasNegative: true, precision: calcPrecision(this, ans) };
  },
  buildNegative() { return ['不输出无关内容', '不遗漏关键要求', '不使用模糊表述']; },
};

/* ── Refinement ─────────────────────────────────────────────── */

const REFINE_PATCHES = {
  image_character: [
    { id: 'style_drift', label: '风格仍跑偏 → 加强写实', text: '\n\n【追加约束】这是真实摄影照片，绝对不是动漫、插画或 3D 卡通。photorealistic photograph only.' },
    { id: 'face_blur', label: '面部仍模糊 → 加强特写', text: '\n\n【追加约束】附一张放大的面部特写面板，皮肤毛孔、虹膜细节、眉骨鼻梁必须清晰可见。sharp focus on face.' },
    { id: 'view_inconsistent', label: '三视图不一致', text: '\n\n【追加约束】所有视图中角色脸型、发型、服装、比例必须完全一致，如同同一张照片的不同角度。' },
    { id: 'hand_bad', label: '手部畸形', text: '\n\n【追加约束】双手自然完整，五指清晰，无多余或缺失手指。' },
    { id: 'mj_style', label: 'MJ 仍偏插画', text: '\n\n【追加】photorealistic::2, raw photo, DSLR --style raw --no illustration, cartoon, anime' },
    { id: 'sd_face', label: 'SD 面部权重不够', text: '\n\n【追加】(detailed face:1.4), (beautiful eyes:1.2), (skin pores:1.2)' },
  ],
  image_scene: [
    { id: 'style_drift', label: '风格跑偏', text: '\n\n【追加约束】严格保持所选风格，不得混入其他画风。' },
    { id: 'too_busy', label: '画面太乱', text: '\n\n【追加约束】简化构图，突出主体，减少杂乱背景元素。' },
    { id: 'wrong_mood', label: '氛围不对', text: '\n\n【追加约束】强化目标氛围色调，降低与主题无关的干扰元素。' },
    { id: 'dalle_vague', label: 'DALL·E 太笼统', text: '\n\n【追加】用完整句子描述前景/中景/背景层次，并明确光线方向与时间。' },
  ],
  video: [
    { id: 'shaky', label: '画面抖动', text: '\n\n【追加约束】镜头必须稳定，无抖动、无跳帧，画面平滑过渡。' },
    { id: 'inconsistent', label: '主体前后不一致', text: '\n\n【追加约束】主体在所有帧中保持外观一致，不换脸、不换服装。' },
    { id: 'wrong_product', label: '产品包装不对', text: '\n\n【追加约束】产品包装必须与描述完全一致：颜色、形状、瓶盖、标签清晰可读，不得替换为其他商品。' },
    { id: 'one_action', label: '一镜多动作', text: '\n\n【追加约束】本镜只执行一个动作，不要同时发生多个事件。保持机位稳定。' },
    { id: 'img2video', label: '换脸 / 漂移', text: '\n\n【追加约束】与参考图完全一致：同一张脸、同一包装、同一色调，仅做指定动作。' },
  ],
  text_writing: [
    { id: 'ai_tone', label: '太像 AI 写的', text: '\n\n【追加约束】语言自然，像真人撰写，避免「综上所述」「在当今社会」等套话。' },
    { id: 'too_long', label: '太长了', text: '\n\n【追加约束】精简篇幅，删去冗余，只保留核心论述。' },
    { id: 'need_data', label: '需要更多数据', text: '\n\n【追加约束】每个论点尽量用数据或案例支撑，无数据处标注[待补充数据]。' },
  ],
  social_copy: [
    { id: 'too_sales', label: '太像硬广', text: '\n\n【追加约束】降低推销感，像朋友真诚分享，先共鸣再推荐。' },
    { id: 'need_title', label: '标题不够吸引', text: '\n\n【追加约束】重新拟 3 个吸睛标题供选择，用疑问句或反差制造好奇心。' },
  ],
  code: [
    { id: 'not_runnable', label: '代码跑不起来', text: '\n\n【追加约束】给出完整可运行代码，包含所有 import、依赖说明和入口。' },
    { id: 'need_test', label: '需要测试用例', text: '\n\n【追加约束】附带至少 2 个测试用例和预期输出。' },
  ],
  general: [
    { id: 'too_vague', label: '回答太笼统', text: '\n\n【追加约束】给出具体、可执行的结果，避免空泛描述。' },
    { id: 'off_topic', label: '跑题了', text: '\n\n【追加约束】严格围绕原始任务，不扩展无关内容。' },
  ],
};


export {
  STYLE_POSITIVE, STYLE_NEGATIVE, SHARED_IMAGE_QUESTIONS,
  buildStyleLock, formatForPlatform, formatVideoForPlatform, buildStoryboard,
  getVisibleQuestions, calcPrecision,
  PROFILES, DEFAULT_PROFILE, REFINE_PATCHES,
};

export function detectProfile(desc) {
  const d = desc.trim();
  const find = (id) => PROFILES.find((x) => x.id === id) || DEFAULT_PROFILE;

  const isVideoIntent = /视频|短视频|宣传片|短片|广告片|clip|mv|运镜|分镜|图生视频|文生视频|一镜一事|秒镜/i.test(d);
  const isStaticImage = /海报|封面|插画|壁纸|banner|场景图|空镜|背景图|产品图|静物|宣传图|配图/i.test(d);
  const isCharacterImage = /三视图|立绘|人设|角色图|turnaround|character sheet|全身立绘|人物参考|角色设计|肖像|头像/i.test(d);

  if (isCharacterImage || (/角色|人物/.test(d) && !isVideoIntent && !/写|文案|分析/.test(d))) {
    return find('image_character');
  }

  if (isStaticImage && !isVideoIntent) return find('image_scene');

  if (isVideoIntent || (/宣传|广告/.test(d) && /\d+\s*秒/.test(d) && !isStaticImage)) {
    return find('video');
  }

  if (/小红书|种草|抖音文案|带货文案/i.test(d)) return find('social_copy');
  if (/写.*(论文|报告|分析|论述|文案|段落|邮件)|撰写|润色|翻译/i.test(d)) return find('text_writing');
  if (/代码|编程|脚本|程序|python|爬虫|api|bug|调试/i.test(d)) return find('code');

  if (/图片|图像|画.*(一|张|幅)|生图|文生图/i.test(d) && !isVideoIntent) return find('image_scene');

  if (/风景|摄影|照片|空镜|广角|长焦|景深|风光/.test(d) && !isVideoIntent) return find('image_scene');

  let best = null;
  let bestScore = 0;
  for (const p of PROFILES) {
    let score = 0;
    for (const kw of p.keywords) {
      if (d.includes(kw)) score += kw.length >= 2 ? 2 : 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  if (bestScore >= 2) return best;

  if (/产品.*(宣传|广告)|宣传.*产品/.test(d) && /\d+\s*秒/.test(d)) return find('video');
  if (/宣传|产品/.test(d) && /秒/.test(d) && !isStaticImage) return find('video');

  return DEFAULT_PROFILE;
}

export function getDefaultAnswer(q, desc) {
  if (q.detect) {
    const d = q.detect(desc);
    if (d) return q.type === 'multi' ? [d] : d;
  }
  if (q.type === 'multi') return [];
  if (q.type === 'text') return '';
  return q.options?.[0]?.value ?? '';
}

export function generatePromptResult(description, profile, answers) {
  const result = profile.build(description, answers);
  const negatives = profile.buildNegative?.(description, answers) || [];
  const negative = Array.isArray(negatives) ? negatives.join(', ') : negatives;
  const full = negative
    ? `${result.positive}\n\n---\n【严禁 / Negative】\n${(Array.isArray(negatives) ? negatives : [negatives]).map((n) => '- ' + n).join('\n')}`
    : result.positive;
  const precision = result.precision ?? calcPrecision(profile, answers);
  return { ...result, negative, full, precision };
}
