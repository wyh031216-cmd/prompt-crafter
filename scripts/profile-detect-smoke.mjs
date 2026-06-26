/**
 * Smoke tests for detectProfile + platform video formatting.
 * Run: npm run test:profiles
 */
import {
  detectProfile,
  generatePromptResult,
  PROFILES,
} from '../src/profiles/engine.js';

const GROK_MARKER_RE = /【Grok 单镜提示词[^】]*】/;

function parseGuideVideoOutput(positive) {
  const grokIdx = positive.search(GROK_MARKER_RE);
  if (grokIdx < 0) return { hasShots: false, shots: [] };
  const tail = positive.slice(grokIdx);
  const shots = tail
    .split(/\n\n---\n\n/)
    .map((s) => s.trim())
    .filter((block) => block && !GROK_MARKER_RE.test(block) && !/^═+$/.test(block));
  return { hasShots: shots.length > 0, shots };
}

const CASES = [
  { input: '写实三视图男性角色', expect: 'image_character' },
  { input: '东亚女性半身肖像写实摄影', expect: 'image_character' },
  { input: '产品宣传海报横版16:9', expect: 'image_scene' },
  { input: '画一张赛博朋克城市夜景壁纸', expect: 'image_scene' },
  { input: '广角镜头风景摄影', expect: 'image_scene' },
  { input: '15秒护肤产品短视频广告', expect: 'video' },
  { input: '抖音竖屏护肤品宣传片30秒', expect: 'video' },
  { input: '写一篇市场分析报告', expect: 'text_writing' },
  { input: '小红书种草文案带货', expect: 'social_copy' },
  { input: '用 Python 写爬虫脚本', expect: 'code' },
  { input: '帮我总结这段文字', expect: 'text_writing' },
  { input: '今天天气怎么样', expect: 'general' },
];

let failed = 0;

for (const { input, expect } of CASES) {
  const got = detectProfile(input).id;
  if (got !== expect) {
    console.error(`FAIL detect: "${input}" → ${got}, expected ${expect}`);
    failed += 1;
  }
}

const video = PROFILES.find((p) => p.id === 'video');
const grokVideo = generatePromptResult('清晨护肤场景展示补水效果', video, {
  platform: 'grok',
  strictness: 'strict',
  product_name: '清透保湿面霜',
  product_look: '白色圆柱瓶、淡蓝瓶盖',
  selling_point: '48小时保湿',
  product_category: 'beauty',
  duration: 'short',
  style: 'commercial',
  target_platform: 'douyin',
  audience: 'young_female',
  ratio: '9:16',
  camera_move: 'dolly',
  shots: ['opening', 'closeup', 'usage', 'ending'],
  pace: 'normal',
  quality: ['stable', 'consistent'],
});

if (!grokVideo.positive.includes('单镜提示词')) {
  console.error('FAIL video/grok: missing per-shot section');
  failed += 1;
}

const mjVideo = generatePromptResult('产品广告', video, {
  platform: 'midjourney',
  strictness: 'strict',
  product_name: '面霜',
  product_look: '白瓶蓝盖',
  selling_point: '保湿',
  product_category: 'beauty',
  duration: 'short',
  style: 'realistic',
  target_platform: 'douyin',
  ratio: '9:16',
  camera_move: 'static',
  shots: ['opening', 'ending'],
});
if (!mjVideo.positive.includes('Keyframe 1')) {
  console.error('FAIL video/mj: missing keyframe output');
  failed += 1;
}

const sdVideo = generatePromptResult('产品广告', video, {
  platform: 'sd',
  strictness: 'strict',
  product_name: '面霜',
  product_look: '白瓶',
  selling_point: '保湿',
  product_category: 'beauty',
  duration: 'short',
  style: 'realistic',
  target_platform: 'general',
  ratio: '9:16',
  camera_move: 'pan',
  shots: ['opening'],
});
if (!sdVideo.positive.includes('smooth motion')) {
  console.error('FAIL video/sd: missing motion keywords');
  failed += 1;
}

const parsedGrok = parseGuideVideoOutput(grokVideo.positive);
if (!parsedGrok.hasShots || parsedGrok.shots.length < 2) {
  console.error('FAIL parse/grok: expected multiple shot blocks');
  failed += 1;
}
if (!grokVideo.positive.includes('【人物锁定】') && !grokVideo.positive.includes('【产品】')) {
  console.error('FAIL video/grok: missing shot structure sections');
  failed += 1;
}

const char = PROFILES.find((p) => p.id === 'image_character');
const grokChar = generatePromptResult('写实三视图东亚男性角色', char, {
  platform: 'grok',
  gender: 'male',
  age: 'young_adult',
  ethnicity: 'asian',
  view_type: 'turnaround',
  body: 'athletic',
  style: 'realistic',
  strictness: 'strict',
  realistic_subtype: 'studio',
  clothing: 'casual',
  background: 'white',
  face_priority: 'ultra',
  face_features: ['skin', 'eyes', 'closeup_panel'],
  expression: 'neutral',
  quality: ['hd', 'consistent', 'face_sharp'],
});
if (!grokChar.positive.includes('【拍摄参数】') || !grokChar.positive.includes('【面部细节')) {
  console.error('FAIL image_character/grok: missing grok template sections');
  failed += 1;
}

if (failed === 0) {
  console.log(`OK — ${CASES.length} detect cases + 6 format checks passed`);
  process.exit(0);
}

console.error(`\n${failed} check(s) failed`);
process.exit(1);