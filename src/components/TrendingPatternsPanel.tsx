import { useState, useEffect, useRef } from 'react';
import { getTrendingPatterns, type TrendingPattern } from '../data/trendingPatterns';
import type { BeadGrid } from '../types';

interface TrendingPatternsPanelProps {
  onUsePattern: (grid: BeadGrid) => void;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: '入门',
  medium: '中级',
  hard: '挑战',
};

// 难度色对应到品牌色卡：moss=易、honey=中、terracotta=难
const DIFFICULTY_DOT: Record<string, string> = {
  easy: 'bg-moss',
  medium: 'bg-honey',
  hard: 'bg-terracotta',
};

// 缩略图组件
function PatternThumbnail({ grid, size = 100 }: { grid: BeadGrid; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !grid.length || !grid[0].length) return;

    const rows = grid.length;
    const cols = grid[0].length;
    const cellSize = Math.max(1, Math.floor(size / Math.max(rows, cols)));
    const w = cols * cellSize;
    const h = rows * cellSize;

    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, w, h);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const color = grid[r][c];
        if (color) {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(
            c * cellSize + cellSize / 2,
            r * cellSize + cellSize / 2,
            cellSize / 2 - 0.3,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
    }
  }, [grid, size]);

  return <canvas ref={canvasRef} className="pixel-render" />;
}

// 像素 1px 步阶外框 + lavender 硬阴影 — 跟 SplashScreen / UPLOAD.EXE 同款
const PIXEL_WINDOW_SHADOW = [
  '0 -2px 0 var(--bead-ink)',
  '0 2px 0 var(--bead-ink)',
  '-2px 0 0 var(--bead-ink)',
  '2px 0 0 var(--bead-ink)',
  '4px 4px 0 var(--y2k-lavender)',
].join(', ');

const PIXEL_WINDOW_SHADOW_ACTIVE = [
  '0 -2px 0 var(--bead-ink)',
  '0 2px 0 var(--bead-ink)',
  '-2px 0 0 var(--bead-ink)',
  '2px 0 0 var(--bead-ink)',
  '4px 4px 0 var(--y2k-coral)',
].join(', ');

export function TrendingPatternsPanel({ onUsePattern }: TrendingPatternsPanelProps) {
  const [patterns, setPatterns] = useState<TrendingPattern[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    setPatterns(getTrendingPatterns());
  }, []);

  if (patterns.length === 0) return null;

  const allTags = [...new Set(patterns.flatMap(p => p.tags))];

  const filtered = selectedTag
    ? patterns.filter(p => p.tags.includes(selectedTag))
    : patterns;

  return (
    <section>
      {/* 标题区 — 中文 Cubic 11 像素字 + 英文 Press Start 2P 像素 ITEMS 计数 */}
      <div className="flex items-baseline justify-between mb-5 px-1">
        <div className="flex items-baseline gap-3">
          <h3
            className="font-pixel-cn text-ink-warm"
            style={{ fontSize: 'clamp(1.5rem, 2.6vw, 1.9rem)', letterSpacing: '0.05em' }}
          >
            图鉴
          </h3>
          <span
            className="font-pixel-arcade text-y2k-navy"
            style={{ fontSize: 10, letterSpacing: '0.1em' }}
          >
            GALLERY
          </span>
        </div>
        <span
          className="font-pixel-arcade text-y2k-navy"
          style={{ fontSize: 10, letterSpacing: '0.1em' }}
        >
          {String(patterns.length).padStart(2, '0')} ITEMS
        </span>
      </div>

      {/* 标签筛选 — 像素 pill（paper-soft 底 + 1px ink 步阶 + lavender 硬阴影；选中态用 navy 反白 + coral 硬阴影） */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2.5 mb-6 px-1">
          <button
            onClick={() => setSelectedTag(null)}
            className="font-pixel-cn text-xs px-3 py-1.5 transition-transform hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px]"
            style={{
              backgroundColor: selectedTag === null ? 'var(--y2k-navy)' : 'var(--bead-paper-soft)',
              color: selectedTag === null ? 'var(--bead-paper-bg)' : 'var(--bead-ink)',
              boxShadow: selectedTag === null ? PIXEL_WINDOW_SHADOW_ACTIVE : PIXEL_WINDOW_SHADOW,
              letterSpacing: '0.05em',
            }}
          >
            全部
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className="font-pixel-cn text-xs px-3 py-1.5 transition-transform hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px]"
              style={{
                backgroundColor: selectedTag === tag ? 'var(--y2k-navy)' : 'var(--bead-paper-soft)',
                color: selectedTag === tag ? 'var(--bead-paper-bg)' : 'var(--bead-ink)',
                boxShadow: selectedTag === tag ? PIXEL_WINDOW_SHADOW_ACTIVE : PIXEL_WINDOW_SHADOW,
                letterSpacing: '0.05em',
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* 图鉴卡片 — 每张都是 mini Win95 window：paper-bg 暖底 + 1px ink 步阶外框 + 4px lavender 硬阴影 + 4 角珍 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 sm:gap-6 p-1">
        {filtered.map(p => (
          <div key={p.id} className="relative">
            <button
              onClick={() => onUsePattern(p.grid)}
              className="group relative text-left w-full cursor-pointer focus-visible:outline-2 focus-visible:outline-y2k-navy focus-visible:outline-offset-4 transition-transform hover:-translate-y-1 active:translate-y-0"
              style={{
                backgroundColor: 'var(--bead-paper-bg)',
                boxShadow: PIXEL_WINDOW_SHADOW,
              }}
            >
              {/* 主图区 — paper-soft 暖底 + 暗淡 dot grid，让豆子缩略图浮出来 */}
              <div
                className="relative flex items-center justify-center bg-paper-soft p-3 aspect-[4/3]"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, rgba(58, 52, 42, 0.06) 1px, transparent 1px)',
                  backgroundSize: '10px 10px',
                  // 主图区底部加一根 1px ink 分隔线（像素卡 separator）
                  boxShadow: 'inset 0 -2px 0 var(--bead-ink)',
                }}
              >
                {p.previewImage ? (
                  <img
                    src={p.previewImage}
                    alt={p.name}
                    className="max-h-full max-w-full object-contain pixel-render"
                  />
                ) : (
                  <PatternThumbnail grid={p.grid} size={100} />
                )}
                {/* hover 时角标 +（terracotta 硬色块按钮，跟上传按钮同色） */}
                <span
                  className="absolute top-2 right-2 w-6 h-6 bg-terracotta text-paper-bg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-pixel-arcade"
                  aria-hidden="true"
                  style={{
                    fontSize: 12,
                    boxShadow: [
                      '0 -1px 0 var(--bead-ink)',
                      '0 1px 0 var(--bead-ink)',
                      '-1px 0 0 var(--bead-ink)',
                      '1px 0 0 var(--bead-ink)',
                    ].join(', '),
                  }}
                >
                  +
                </span>
              </div>
              {/* 信息条 — 像素 ID card 风：左 难度 dot + 中文像素 label，右 b 计数像素字 */}
              <div className="flex items-center justify-between px-3 py-2 bg-paper-bg">
                <span className="inline-flex items-center gap-1.5 font-pixel-cn text-ink-warm" style={{ fontSize: 11 }}>
                  <span
                    className={`w-1.5 h-1.5 ${DIFFICULTY_DOT[p.difficulty]}`}
                    aria-hidden="true"
                  />
                  {DIFFICULTY_LABELS[p.difficulty]}
                </span>
                <span
                  className="font-pixel-arcade text-y2k-navy"
                  style={{ fontSize: 9, letterSpacing: '0.05em' }}
                >
                  {p.beadCount}b
                </span>
              </div>
            </button>

            {/* 4 角像素角珍 (lavender) — 跟开屏一致 */}
            <div
              className="absolute pointer-events-none"
              style={{ top: -3, left: -3, width: 3, height: 3, backgroundColor: 'var(--y2k-lavender)' }}
              aria-hidden="true"
            />
            <div
              className="absolute pointer-events-none"
              style={{ top: -3, right: -3, width: 3, height: 3, backgroundColor: 'var(--y2k-lavender)' }}
              aria-hidden="true"
            />
            <div
              className="absolute pointer-events-none"
              style={{ bottom: -3, left: -3, width: 3, height: 3, backgroundColor: 'var(--y2k-lavender)' }}
              aria-hidden="true"
            />
            <div
              className="absolute pointer-events-none"
              style={{ bottom: -3, right: -3, width: 3, height: 3, backgroundColor: 'var(--y2k-lavender)' }}
              aria-hidden="true"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
