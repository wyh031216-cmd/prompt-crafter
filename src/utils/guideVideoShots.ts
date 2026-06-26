export type VideoShotKind = 'grok' | 'mj' | 'none';

export type ParsedVideoShot = {
  index: number;
  label: string;
  content: string;
};

export type ParsedVideoOutput = {
  script: string;
  shots: ParsedVideoShot[];
  kind: VideoShotKind;
  hasShots: boolean;
};

const GROK_MARKER_RE = /【Grok 单镜提示词[^】]*】/;

/** 从引导/编辑器中的视频正向提示词拆出可逐镜复制的区块 */
export function parseGuideVideoOutput(positive: string): ParsedVideoOutput {
  const text = positive.trim();
  if (!text) {
    return { script: '', shots: [], kind: 'none', hasShots: false };
  }

  const grokIdx = text.search(GROK_MARKER_RE);
  if (grokIdx >= 0) {
    const script = text.slice(0, grokIdx).trim();
    const tail = text.slice(grokIdx);
    const blocks = tail
      .split(/\n\n---\n\n/)
      .map((s) => s.trim())
      .filter((block) => block && !GROK_MARKER_RE.test(block) && !/^═+$/.test(block));

    const shots = blocks.map((content, i) => {
      const header = content.match(/【镜头\s*(\d+)\s*\|\s*([^】]+)】/);
      return {
        index: header ? Number(header[1]) : i + 1,
        label: header ? `镜头 ${header[1]} · ${header[2].trim()}` : `镜头 ${i + 1}`,
        content,
      };
    });

    return {
      script,
      shots,
      kind: 'grok',
      hasShots: shots.length > 0,
    };
  }

  const keyframeLines = text.split('\n').filter((line) => /^Keyframe\s+\d+/i.test(line.trim()));
  if (keyframeLines.length > 0) {
    const script = text.split('【完整分镜】')[0]?.trim() ?? text;
    const shots = keyframeLines.map((line, i) => {
      const m = line.trim().match(/^Keyframe\s+(\d+)\s*\(([^)]+)\):\s*(.+)$/i);
      return {
        index: m ? Number(m[1]) : i + 1,
        label: m ? `关键帧 ${m[1]} · ${m[2].trim()}` : `关键帧 ${i + 1}`,
        content: m ? m[3].trim() : line.trim(),
      };
    });
    return { script, shots, kind: 'mj', hasShots: true };
  }

  return { script: text, shots: [], kind: 'none', hasShots: false };
}

export function getVideoShotSectionTitle(kind: VideoShotKind): string {
  if (kind === 'grok') return 'Grok 单镜提示词 — 一次复制一条';
  if (kind === 'mj') return 'Midjourney 关键帧 — 逐条生成静图';
  return '';
}