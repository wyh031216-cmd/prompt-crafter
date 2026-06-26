import type { OptimizeAction } from '../ai';
import { buildStyleLock } from '../profiles';
import { formatVisualPromptQuick, GROK_NEGATIVE_VIDEO } from './imageFormat';
import { resolveVisualContext, hasVisualTemplate, type ResolvedVisualContext } from './visualContext';

const FILLER_RE = /^(请|帮我|麻烦|能否|可以|我想|我要|那个|这个|嗯|啊)+/;

/** 英文短语 → 中文（长词优先匹配） */
const PHRASE_ZH: [string, string][] = [
  ['hyperrealistic photograph', '超写实照片'],
  ['real camera capture', '真实相机拍摄'],
  ['real human skin texture with pores', '真实人类皮肤质感（可见毛孔）'],
  ['natural skin texture', '自然皮肤质感'],
  ['natural lighting', '自然光线'],
  ['DSLR photography', '单反摄影'],
  ['digital art', '数字艺术'],
  ['shallow depth of field', '浅景深'],
  ['product photography', '产品摄影'],
  ['professional product photography', '专业产品摄影'],
  ['clean commercial lighting', '干净商业布光'],
  ['sharp packaging focus', '包装清晰对焦'],
  ['stable smooth motion', '稳定流畅运动'],
  ['chain of thought', '思维链'],
  ['few-shot', '少样本示例'],
  ['system instruction', '系统指令'],
  ['output format', '输出格式'],
  ['negative prompt', '反向提示词'],
  ['style lock', '风格锁定'],
  ['highest priority', '最高优先级'],
  ['close-up', '特写'],
  ['medium shot', '中景'],
  ['wide shot', '远景'],
  ['full body', '全身'],
  ['portrait lens', '人像镜头'],
  ['golden hour', '黄金时刻'],
  ['soft window light', '柔和窗光'],
  ['rule of thirds', '三分法构图'],
  ['photorealistic', '写实摄影'],
  ['hyperrealistic', '超写实'],
  ['illustration', '插画'],
  ['anime', '动漫'],
  ['cartoon', '卡通'],
  ['watermark', '水印'],
  ['blurry', '模糊'],
  ['professional', '专业'],
  ['character', '角色'],
  ['background', '背景'],
  ['foreground', '前景'],
  ['lighting', '光线'],
  ['composition', '构图'],
  ['atmosphere', '氛围'],
  ['mood', '情绪'],
  ['scene', '场景'],
  ['camera', '相机'],
  ['motion', '运动'],
  ['stable', '稳定'],
  ['smooth', '流畅'],
  ['sharp focus', '锐利对焦'],
  ['high resolution', '高分辨率'],
  ['ultra detailed', '超高细节'],
  ['skin texture', '皮肤质感'],
  ['natural', '自然'],
  ['soft', '柔和'],
  ['warm', '暖色'],
  ['vertical', '竖屏'],
  ['horizontal', '横屏'],
  ['prompt', '提示词'],
  ['negative', '反向约束'],
  ['constraints', '约束条件'],
  ['requirements', '要求'],
  ['examples', '示例'],
  ['context', '上下文'],
  ['format', '格式'],
  ['output', '输出'],
  ['task', '任务'],
  ['role', '角色'],
  ['style', '风格'],
  ['quality', '画质'],
  ['detail', '细节'],
  ['texture', '质感'],
  ['color', '色彩'],
  ['portrait', '肖像'],
  ['avoid', '避免'],
  ['NOT', '非'],
];

const SECTION_TITLE_ZH: Record<string, string> = {
  'style lock': '风格锁定',
  'highest priority': '最高优先级',
  'role': '角色',
  'task': '任务',
  'context': '背景',
  'background': '背景',
  'format': '输出格式',
  'output format': '输出格式',
  'constraints': '约束',
  'negative': '严禁',
  'style': '风格',
  'examples': '示例',
  'specifications': '规格',
  'character lock': '人物锁定',
  'scene lock': '场景锁定',
  'shot action': '本镜动作',
  '严禁': '严禁',
};

const SECTION_PATTERNS: { re: RegExp; title: string }[] = [
  { re: /角色|你是|扮演|as a|you are/i, title: '角色 / Role' },
  { re: /任务|目标|请|生成|写|分析|create|generate|write/i, title: '任务 / Task' },
  { re: /背景|上下文|context|background/i, title: '背景 / Context' },
  { re: /格式|输出|format|output/i, title: '输出格式 / Format' },
  { re: /约束|不要|禁止|avoid|negative|严禁/i, title: '约束 / Constraints' },
  { re: /风格|style|画风/i, title: '风格 / Style' },
  { re: /示例|example|few-shot/i, title: '示例 / Examples' },
];

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function hasStructuredSections(text: string): boolean {
  return /^#{1,3}\s|【[^】]+】/m.test(text);
}

function dedupeLines(text: string): string {
  const seen = new Set<string>();
  return text
    .split('\n')
    .filter((line) => {
      const key = line.trim();
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join('\n');
}

function extractBody(text: string): string {
  return text.replace(/^【[^】]+】\s*/gm, '').trim();
}

function improveLocal(content: string): string {
  const body = normalizeWhitespace(content);
  if (hasStructuredSections(body)) {
    const parts: string[] = [];
    if (!/角色|role|你是|you are/i.test(body)) {
      parts.push('【角色】\n专业助手，按以下要求精确执行。');
    }
    parts.push(body);
    if (!/约束|不要|严禁|avoid|negative/i.test(body)) {
      parts.push(
        '',
        '【约束】',
        '- 严格按上述要求执行，不遗漏关键点',
        '- 不编造未提供的信息或数据',
        '- 输出具体、可验证、可直接使用',
      );
    }
    if (!/格式|format|输出/i.test(body)) {
      parts.push('', '【输出格式】', '- 结构清晰，分段或列表呈现');
    }
    return dedupeLines(parts.join('\n'));
  }

  return [
    '【角色】',
    '你是一位专业助手，擅长理解复杂需求并给出高质量结果。',
    '',
    '【任务】',
    body,
    '',
    '【输出要求】',
    '- 回答具体、完整、可执行',
    '- 结构清晰（标题 + 列表）',
    '- 如有不确定处，明确标注假设',
    '',
    '【约束】',
    '- 不编造事实或数据',
    '- 不输出与任务无关的内容',
  ].join('\n');
}

function elaborateLocal(content: string): string {
  const base = improveLocal(content);
  const extras: string[] = [];

  if (!/背景|context/i.test(base)) {
    extras.push('', '【背景 / 可补充】', '- 目标受众：', '- 使用场景：', '- 已知条件：');
  }
  if (!/示例|example/i.test(base)) {
    extras.push('', '【示例（可选）】', '输入：…', '期望输出：…');
  }
  if (!/验收|标准|criteria/i.test(base)) {
    extras.push('', '【验收标准】', '- [ ] 覆盖所有关键要求', '- [ ] 格式符合预期', '- [ ] 无无关冗余');
  }
  if (/写实|摄影|grok|图像|视频|三视图/i.test(base)) {
    extras.push(
      '',
      '【画质 / 一致性（生成类任务）】',
      '- 主体前后一致，不换脸、不换包装',
      '- 画面稳定，面部细节清晰可辨',
    );
  }

  return base + extras.join('\n');
}

function shortenLocal(content: string): string {
  let text = normalizeWhitespace(content);
  text = dedupeLines(text);

  const lines = text.split('\n').map((line) => {
    let l = line.trim();
    l = l.replace(FILLER_RE, '');
    l = l.replace(/，{2,}/g, '，').replace(/。{2,}/g, '。');
    if (l.length > 120 && !l.startsWith('#') && !l.startsWith('【')) {
      const parts = l.split(/[，,；;]/).filter(Boolean);
      if (parts.length > 3) l = parts.slice(0, 3).join('，') + '…';
    }
    return l;
  });

  return lines.filter((l, i, arr) => l || (arr[i + 1] !== undefined)).join('\n').trim();
}

function restructureLocal(content: string): string {
  const body = normalizeWhitespace(content);
  if (hasStructuredSections(body)) {
    return body
      .split('\n')
      .map((line) => {
        const m = line.match(/^【([^】]+)】\s*(.*)/);
        if (m) return `## ${m[1]}\n${m[2]}`.trim();
        return line;
      })
      .join('\n');
  }

  const paragraphs = body.split(/\n\n+/).filter(Boolean);
  if (paragraphs.length <= 1) {
    const sentences = body.split(/(?<=[。！？.!?])\s*/).filter(Boolean);
    const buckets: Record<string, string[]> = {};
    const other: string[] = [];

    for (const s of sentences) {
      const hit = SECTION_PATTERNS.find((p) => p.re.test(s));
      if (hit) {
        buckets[hit.title] = buckets[hit.title] || [];
        buckets[hit.title].push(s);
      } else {
        other.push(s);
      }
    }

    const parts: string[] = [];
    if (other.length) parts.push('## 任务 / Task', other.join(' '));
    for (const [title, items] of Object.entries(buckets)) {
      parts.push('', `## ${title}`, items.join('\n'));
    }
    return parts.join('\n').trim() || `## 任务\n${body}`;
  }

  return paragraphs
    .map((p, i) => {
      const hit = SECTION_PATTERNS.find((pat) => pat.re.test(p));
      const title = hit?.title || (i === 0 ? '任务 / Task' : `补充 ${i + 1}`);
      return `## ${title}\n${p}`;
    })
    .join('\n\n');
}

function spellcheckLocal(content: string): string {
  return normalizeWhitespace(content)
    .replace(/,,/g, '，')
    .replace(/。。/g, '。')
    .replace(/ ，/g, '，')
    .replace(/ \./g, '.')
    .replace(/（ /g, '（')
    .replace(/ ）/g, '）')
    .replace(/【 /g, '【')
    .replace(/ 】/g, '】')
    .replace(/[ \t]{2,}/g, ' ')
    .split('\n')
    .map((line) => line.replace(/^[\s,，]+/, ''))
    .join('\n');
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyPhraseMap(text: string): string {
  let out = text;
  const sorted = [...PHRASE_ZH].sort((a, b) => b[0].length - a[0].length);
  for (const [en, zh] of sorted) {
    out = out.replace(new RegExp(escapeRegExp(en), 'gi'), zh);
  }
  return out;
}

function translateSectionHeader(inner: string): string {
  const trimmed = inner.trim();
  if (/[\u4e00-\u9fff]/.test(trimmed)) return trimmed;
  const lower = trimmed.toLowerCase();
  for (const [en, zh] of Object.entries(SECTION_TITLE_ZH)) {
    if (lower.includes(en)) {
      return trimmed.replace(new RegExp(en, 'gi'), zh);
    }
  }
  return applyPhraseMap(trimmed);
}

function translateLineToZh(line: string): string {
  let l = line;

  const bracket = l.match(/^(【([^】]+)】)(.*)$/);
  if (bracket) {
    const header = translateSectionHeader(bracket[2]);
    const body = applyPhraseMap(bracket[3].trim());
    return `【${header}】${body ? ' ' + body : ''}`;
  }

  const md = l.match(/^(#{1,3})\s+(.+)$/);
  if (md) {
    return `${md[1]} ${translateSectionHeader(md[2])}`;
  }

  const label = l.match(/^([A-Za-z][\w\s/&.-]{0,40}):\s*(.*)$/);
  if (label && !label[1].includes('http')) {
    return `${translateSectionHeader(label[1])}：${applyPhraseMap(label[2])}`;
  }

  l = l.replace(/\bNOT\s+/gi, '非 ');
  l = l.replace(/\bDo not\b/gi, '不要');
  l = l.replace(/\bAvoid:\s*/gi, '避免：');
  return applyPhraseMap(l);
}

function latinRatio(text: string): number {
  const latin = (text.match(/[a-zA-Z]/g) || []).length;
  const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const total = latin + cjk;
  return total === 0 ? 0 : latin / total;
}

function translateToChineseLocal(content: string): string {
  const text = spellcheckLocal(normalizeWhitespace(content));
  const placeholders: string[] = [];

  let protectedText = text
    .replace(/\{\{[^}]+\}\}/g, (m) => {
      placeholders.push(m);
      return `\x00PH${placeholders.length - 1}\x00`;
    })
    .replace(/`[^`]+`/g, (m) => {
      placeholders.push(m);
      return `\x00PH${placeholders.length - 1}\x00`;
    });

  const lines = protectedText.split('\n').map((line) => {
    if (!line.trim()) return line;
    if (latinRatio(line) < 0.15) return line;
    return translateLineToZh(line);
  });

  let result = lines.join('\n');
  placeholders.forEach((ph, i) => {
    result = result.replace(`\x00PH${i}\x00`, ph);
  });

  return result;
}

function addEnglishHeaders(content: string): string {
  return content
    .split('\n')
    .map((line) => {
      const m = line.match(/^【([^】]+)】\s*(.*)/);
      if (m) {
        const en = SECTION_PATTERNS.find((p) => p.title.includes(m[1]))?.title || m[1];
        return `【${en}】${m[2] ? ' ' + m[2] : ''}`;
      }
      if (line.startsWith('## ')) return line;
      return line;
    })
    .join('\n');
}

function formatVisualLocal(content: string, templateId?: string | null): string {
  const body = extractBody(content) || content;
  const ctx = resolveVisualContext(content, templateId);
  return formatVisualPromptQuick(content, body, ctx);
}

const TEXT_NEGATIVES = ['无关内容', '编造数据', '模糊表述', '遗漏关键要求'];

const ANIME_CONFLICT_RE = /anime|cartoon|动漫|插画风格|manga|cel shading|二次元/i;
const REALISTIC_HINT_RE = /写实|摄影|photorealistic|real camera|raw photo|not anime/i;

function contentHasTerm(content: string, term: string): boolean {
  const t = term.toLowerCase().trim();
  if (!t) return true;
  const lower = content.toLowerCase();
  if (lower.includes(t)) return true;
  const zh = term.replace(/[a-z]/gi, '');
  if (zh.length >= 2 && content.includes(zh)) return true;
  return false;
}

function wantsAnimeOutput(content: string, ctx: ResolvedVisualContext | null): boolean {
  if (ctx?.style === 'anime') return true;
  return /动漫|anime|二次元|cel shading|manga style/i.test(content) && !REALISTIC_HINT_RE.test(content);
}

function wantsRealisticOutput(content: string, ctx: ResolvedVisualContext | null): boolean {
  if (ctx?.style === 'realistic') return true;
  return REALISTIC_HINT_RE.test(content) && !/动漫|anime style/i.test(content);
}

function buildContextualNegatives(content: string, templateId?: string | null): string[] {
  const ctx = resolveVisualContext(content, templateId);
  const isVisual = hasVisualTemplate(templateId) || !!ctx?.locked || /图像|图片|视频|镜头|三视图|立绘/i.test(content);

  if (!isVisual) {
    return TEXT_NEGATIVES.filter((n) => !contentHasTerm(content, n));
  }

  const candidates: string[] = [];
  const style = ctx?.style ?? (wantsAnimeOutput(content, ctx) ? 'anime' : 'realistic');
  const strictness = ctx?.strictness ?? 'strict';
  const styleLock = buildStyleLock(style, strictness);

  if (ctx?.modality === 'video') {
    candidates.push(...GROK_NEGATIVE_VIDEO.split(',').map((s) => s.trim()));
    candidates.push('画面抖动', '换脸', '风格漂移', '错误产品包装');
  } else {
    candidates.push(...styleLock.avoid);
    candidates.push('水印', '低画质', '模糊', '变形', '文字叠加');
    if (wantsRealisticOutput(content, ctx)) {
      candidates.push('塑料皮肤', '磨皮', '模糊面部');
    }
    if (ctx?.platform === 'gemini-imagen' || /do not include/i.test(content)) {
      candidates.push('text', 'watermark', 'oversaturated');
    }
  }

  let filtered = [...new Set(candidates)];

  if (wantsAnimeOutput(content, ctx)) {
    filtered = filtered.filter((n) => !ANIME_CONFLICT_RE.test(n));
  }

  if (/产品|包装|product/i.test(content)) {
    filtered.push('错误产品', '错误包装', 'wrong packaging');
  }
  if (/人脸|面部|角色|face|character/i.test(content)) {
    filtered.push('换脸', '面部变形', 'inconsistent face');
  }

  filtered = [...new Set(filtered)];
  return filtered.filter((n) => !contentHasTerm(content, n));
}

function addConstraintsLocal(content: string, templateId?: string | null): string {
  const toAdd = buildContextualNegatives(content, templateId);
  if (toAdd.length === 0) return content;

  const lines = toAdd.map((n) => `- ${n}`).join('\n');
  if (/严禁|negative|避免|avoid|do not include/i.test(content)) {
    return `${content}\n${lines}`;
  }
  return `${content}\n\n【严禁 / Negative】\n${lines}`;
}

function customLocal(content: string, instruction: string): string {
  const ins = instruction.trim().toLowerCase();
  let result = content;
  if (/格式|grok|midjourney|mj|dalle|imagen|sd\b/i.test(ins)) result = formatVisualLocal(result);
  if (/约束|反向|negative|严禁/.test(ins)) result = addConstraintsLocal(result, null);
  if (/结构|重构/.test(ins)) result = restructureLocal(result);
  if (/精简|缩短|简短/.test(ins)) result = shortenLocal(result);
  if (/扩写|详细|补充/.test(ins)) result = elaborateLocal(result);
  if (/优化|improve/.test(ins)) result = improveLocal(result);
  if (result === content && instruction.trim()) {
    result = `${improveLocal(content)}\n\n【用户追加要求】\n${instruction.trim()}`;
  }
  return result;
}

export function optimizePromptLocal(
  content: string,
  action: OptimizeAction,
  customInstruction?: string,
): string {
  const text = content.trim();
  if (!text) return '';

  switch (action) {
    case 'improve':
      return improveLocal(text);
    case 'elaborate':
      return elaborateLocal(text);
    case 'shorten':
      return shortenLocal(text);
    case 'restructure':
      return restructureLocal(text);
    case 'spellcheck':
      return spellcheckLocal(text);
    case 'translate-cn':
      return translateToChineseLocal(text);
    case 'translate-en':
      return addEnglishHeaders(restructureLocal(text));
    case 'custom':
      return customLocal(text, customInstruction || '');
    default:
      return improveLocal(text);
  }
}

/** 模拟流式输出，提升交互感 */
export async function optimizePromptLocalStream(
  content: string,
  action: OptimizeAction,
  onChunk: (text: string) => void,
  customInstruction?: string,
  signal?: AbortSignal,
): Promise<string> {
  const full = optimizePromptLocal(content, action, customInstruction);
  const chunkSize = 24;
  let acc = '';
  for (let i = 0; i < full.length; i += chunkSize) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    acc = full.slice(0, i + chunkSize);
    onChunk(acc);
    await new Promise((r) => setTimeout(r, 12));
  }
  onChunk(full);
  return full;
}

export const LOCAL_EXTRA_ACTIONS = [
  { id: 'visual-format' as const, label: '格式化' },
  { id: 'add-constraints' as const, label: '补充约束' },
];

export function optimizePromptLocalExtra(
  content: string,
  id: 'visual-format' | 'add-constraints',
  opts?: { templateId?: string | null },
): string {
  if (id === 'visual-format') return formatVisualLocal(content, opts?.templateId);
  return addConstraintsLocal(content, opts?.templateId);
}