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
      <div className="flex items-baseline justify-between mb-4 px-1">
        <div className="flex items-baseline gap-3">
          <h3
            className="font-wordmark text-nj-navy"
            style={{ fontSize: 'clamp(1.6rem, 2.6vw, 2rem)' }}
          >
            gallery
          </h3>
          <span className="text-sm text-nj-ink-soft">·</span>
          <span className="text-sm text-nj-ink-soft">图鉴</span>
        </div>
        <span
          className="font-pixel-arcade text-nj-navy"
          style={{ fontSize: 10, letterSpacing: 0.5 }}
        >
          {String(patterns.length).padStart(2, '0')} ITEMS
        </span>
      </div>

      {/* 标签筛选 — NJ glossy pill */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5 px-1">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              selectedTag === null
                ? 'bg-nj-navy text-nj-cloud nj-shadow-card'
                : 'bg-nj-cloud text-nj-ink border border-nj-edge hover:bg-nj-cloud-deep'
            }`}
          >
            全部
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedTag === tag
                  ? 'bg-nj-navy text-nj-cloud nj-shadow-card'
                  : 'bg-nj-cloud text-nj-ink border border-nj-edge hover:bg-nj-cloud-deep'
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
            className="group relative text-left nj-card overflow-hidden cursor-pointer focus-visible:outline-2 focus-visible:outline-nj-navy focus-visible:outline-offset-2 transition-transform hover:-translate-y-1"
          >
            {/* 主图区 — 占 80% */}
            <div className="relative flex items-center justify-center bg-nj-sky-mist p-3 aspect-[4/3]">
              {p.previewImage ? (
                <img
                  src={p.previewImage}
                  alt={p.name}
                  className="max-h-full max-w-full object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              ) : (
                <PatternThumbnail grid={p.grid} size={100} />
              )}
              {/* hover 时 glossy + 角标 */}
              <span
                className="absolute top-2 right-2 w-7 h-7 bg-nj-coral text-nj-cloud rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-lg font-bold"
                aria-hidden="true"
                style={{ boxShadow: '0 2px 6px rgba(44, 58, 94, 0.25)' }}
              >
                +
              </span>
            </div>
            {/* 信息条 — ID card 风：左 difficulty dot + label，右 bead count（小像素字） */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-nj-edge bg-nj-cloud">
              <span className="inline-flex items-center gap-1.5 text-xs text-nj-ink-soft">
                <span className={`w-1.5 h-1.5 rounded-full ${DIFFICULTY_DOT[p.difficulty]}`} aria-hidden="true" />
                {DIFFICULTY_LABELS[p.difficulty]}
              </span>
              <span
                className="font-pixel-arcade text-nj-navy"
                style={{ fontSize: 9, letterSpacing: 0.5 }}
              >
                {p.beadCount}b
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
