import { AI_PLATFORMS, type AIPlatform } from '../utils/templates/types';

interface AIPlatformIconProps {
  platform: AIPlatform;
  size?: number;
  className?: string;
}

const assetBase = import.meta.env.BASE_URL;

/** 官方 Logo（public/ai），兼容 GitHub Pages 子路径 */
/** 深色 Logo，浅底/深色背景上都需垫白底 */
const LIGHT_BACKDROP_PLATFORMS: ReadonlySet<AIPlatform> = new Set(['grok']);

const LOGO_SRC: Partial<Record<AIPlatform, string>> = {
  grok: `${assetBase}ai/grok.png`,
  gemini: `${assetBase}ai/gemini.png`,
  chatgpt: `${assetBase}ai/chatgpt.png`,
  claude: `${assetBase}ai/claude.png`,
  deepseek: `${assetBase}ai/deepseek.png`,
  qwen: `${assetBase}ai/qwen.png`,
  doubao: `${assetBase}ai/doubao.png`,
};

function GeneralIcon({ size, className }: { size: number; className: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <rect width="24" height="24" rx="6" fill="#64748B" />
      <path
        fill="#fff"
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6-6.3 6.3-1.6-1.6a1 1 0 0 0-1.4 1.4l2.3 2.3a1 1 0 0 0 1.4 0l6.3-6.3 1.6 1.6a1 1 0 0 0 1.4-1.4l-2.3-2.3a1 1 0 0 0-1.4 0l-1.6-1.6a1 1 0 0 0-1.4 0zM8 7H6.5a1 1 0 0 0-1 1V18a1 1 0 0 0 1 1H16a1 1 0 0 0 1-1v-1.5a1 1 0 1 0-2 0V17H7.5V8.5H8a1 1 0 0 0 0-2z"
      />
    </svg>
  );
}

export default function AIPlatformIcon({ platform, size = 20, className = '' }: AIPlatformIconProps) {
  const s = size;
  const base = `inline-block flex-shrink-0 object-contain ${className}`.trim();
  const src = LOGO_SRC[platform];
  const alt = AI_PLATFORMS[platform].name;

  if (src) {
    const img = (
      <img
        src={src}
        alt={alt}
        width={s}
        height={s}
        className={`${base} rounded-md`}
        draggable={false}
      />
    );
    if (LIGHT_BACKDROP_PLATFORMS.has(platform)) {
      return (
        <span
          className="inline-flex items-center justify-center rounded-md bg-paper p-0.5 ring-1 ring-espresso/10 flex-shrink-0"
          title={alt}
        >
          {img}
        </span>
      );
    }
    return img;
  }

  return <GeneralIcon size={s} className={base} />;
}

/** 深色 chip 上 Logo 需白底 */
function isDarkChipColor(color: string): boolean {
  return /bg-espresso|espresso|gray-9|gray-8|bg-black|bg-slate-9|bg-zinc-9/.test(color);
}

function ChipLogo({ platform, size }: { platform: AIPlatform; size: number }) {
  const { color } = AI_PLATFORMS[platform];
  const icon = <AIPlatformIcon platform={platform} size={size} />;
  if (!isDarkChipColor(color)) return icon;
  return (
    <span className="inline-flex items-center justify-center rounded-full bg-paper p-0.5 flex-shrink-0 shadow-sm">
      {icon}
    </span>
  );
}

export function PlatformChip({
  platform,
  size = 'md',
  className = '',
}: {
  platform: AIPlatform;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const { name, color } = AI_PLATFORMS[platform];
  const iconSize = size === 'sm' ? 14 : 16;
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'px-3 py-1 text-sm';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClass} ${color} ${className}`}>
      <ChipLogo platform={platform} size={iconSize} />
      {name}
    </span>
  );
}