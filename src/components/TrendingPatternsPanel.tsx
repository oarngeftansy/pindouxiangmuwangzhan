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

  return <canvas ref={canvasRef} style={{ borderRadius: 6 }} />;
}

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
      <div className="flex items-center justify-between mb-4 px-1">
        <h3
          className="font-pixel-cn text-ink-warm flex items-center gap-2"
          style={{ fontSize: 'clamp(1.05rem, 1.8vw, 1.3rem)', letterSpacing: '0.05em' }}
        >
          <span className="sparkle sparkle-sm sparkle-twinkle" style={{ ['--sparkle-color' as string]: 'var(--y2k-sky)' }} aria-hidden="true" />
          图鉴
        </h3>
        <span
          className="font-pixel-arcade text-y2k-navy"
          style={{ fontSize: 9, letterSpacing: 0.5 }}
        >
          {String(patterns.length).padStart(2, '0')} ITEMS
        </span>
      </div>

      {/* 标签筛选 */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 px-1">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1.5 rounded-chip text-xs font-semibold border transition-colors ${
              selectedTag === null
                ? 'bg-terracotta text-paper-bg border-terracotta'
                : 'bg-paper-soft text-ink-warm border-edge-sand hover:bg-paper-deep'
            }`}
          >
            全部
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-chip text-xs font-semibold border transition-colors ${
                selectedTag === tag
                  ? 'bg-terracotta text-paper-bg border-terracotta'
                  : 'bg-paper-soft text-ink-warm border-edge-sand hover:bg-paper-deep'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* 图纸卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {filtered.map(p => (
          <button
            key={p.id}
            onClick={() => onUsePattern(p.grid)}
            className="group relative text-left bg-paper-soft cursor-pointer focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2 transition-transform hover:-translate-y-0.5 overflow-hidden"
            style={{
              // Y2K 1px 步阶外边 + lavender 双层硬阴影
              boxShadow: [
                '0 -2px 0 var(--bead-ink)',
                '0 2px 0 var(--bead-ink)',
                '-2px 0 0 var(--bead-ink)',
                '2px 0 0 var(--bead-ink)',
                '4px 4px 0 var(--y2k-lavender)',
              ].join(', '),
            }}
            onMouseEnter={(e) => {
              const s = e.currentTarget.style;
              s.boxShadow = [
                '0 -2px 0 var(--bead-ink)', '0 2px 0 var(--bead-ink)',
                '-2px 0 0 var(--bead-ink)', '2px 0 0 var(--bead-ink)',
                '4px 4px 0 var(--y2k-sky)',
              ].join(', ');
            }}
            onMouseLeave={(e) => {
              const s = e.currentTarget.style;
              s.boxShadow = [
                '0 -2px 0 var(--bead-ink)', '0 2px 0 var(--bead-ink)',
                '-2px 0 0 var(--bead-ink)', '2px 0 0 var(--bead-ink)',
                '4px 4px 0 var(--y2k-lavender)',
              ].join(', ');
            }}
          >
            {/* mini Win95 title bar — 每张卡是一个小窗口 */}
            <div
              className="flex items-center justify-between px-1.5"
              style={{ height: 14, backgroundColor: 'var(--y2k-navy)', color: 'var(--bead-paper-bg)' }}
            >
              <span
                className="font-pixel-arcade truncate"
                style={{ fontSize: 6, letterSpacing: 0.3 }}
              >
                {p.gridWidth}×{p.gridHeight}.PIN
              </span>
              <div className="flex gap-px shrink-0" aria-hidden="true">
                <div className="w-2 h-2 bg-paper-bg/50" />
                <div className="w-2 h-2 bg-y2k-coral" />
              </div>
            </div>

            <div className="relative flex items-center justify-center bg-paper-bg p-2 min-h-[96px] sm:min-h-[120px]">
              {p.previewImage ? (
                <img src={p.previewImage} alt={p.name} className="max-h-[88px] sm:max-h-[110px] max-w-full object-contain" style={{ imageRendering: 'pixelated' }} />
              ) : (
                <PatternThumbnail grid={p.grid} size={100} />
              )}
              <span
                className="absolute -top-1 -right-1 w-6 h-6 bg-honey text-ink-warm font-pixel-arcade flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-hidden="true"
                style={{ fontSize: 10, boxShadow: '2px 2px 0 var(--bead-ink)' }}
              >
                +
              </span>
            </div>
            <div className="flex items-center justify-between px-2 py-1.5 bg-paper-soft border-t border-edge-sand">
              <span className="inline-flex items-center gap-1 text-[9px] text-ink-soft">
                <span className={`w-1.5 h-1.5 ${DIFFICULTY_DOT[p.difficulty]}`} aria-hidden="true" />
                {DIFFICULTY_LABELS[p.difficulty]}
              </span>
              <span className="font-pixel-arcade text-ink-soft" style={{ fontSize: 7 }}>
                {p.beadCount}b
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
