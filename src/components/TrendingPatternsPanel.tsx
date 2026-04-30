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
      <div className="flex items-end justify-between mb-4 px-1">
        <div>
          <h3
            className="text-ink-warm leading-tight"
            style={{ fontFamily: 'var(--font-headline)', fontSize: 'clamp(1.35rem, 2.2vw, 1.75rem)', fontWeight: 600 }}
          >
            今日图鉴
          </h3>
          <p className="text-sm text-ink-soft mt-1">挑一份现成的，点一下就开始拼。</p>
        </div>
        <span
          className="text-xs text-ink-soft bg-paper-soft border border-edge-sand px-2.5 py-1 rounded-chip"
          style={{ fontFamily: 'var(--font-num)' }}
        >
          {patterns.length} 份
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
            className="group text-left rounded-surface bg-paper-soft border border-edge-sand p-3 transition-all hover:-translate-y-0.5 hover:bg-paper-bg cursor-pointer focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
            style={{ boxShadow: 'none' }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-card)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div className="relative flex items-center justify-center bg-paper-bg rounded-control p-2 mb-2.5 min-h-[120px] border border-edge-sand/60">
              {p.previewImage ? (
                <img src={p.previewImage} alt={p.name} className="max-h-[110px] max-w-full object-contain" />
              ) : (
                <PatternThumbnail grid={p.grid} size={100} />
              )}
              <span
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-honey text-ink-warm text-base font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-hidden="true"
                style={{ boxShadow: 'var(--shadow-bead)' }}
              >
                +
              </span>
            </div>
            <p className="font-semibold text-sm text-ink-warm truncate">{p.name}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] text-ink-soft">
                <span className={`w-2 h-2 rounded-full ${DIFFICULTY_DOT[p.difficulty]}`} aria-hidden="true" />
                {DIFFICULTY_LABELS[p.difficulty]}
              </span>
              <span className="text-[10px] text-ink-soft" style={{ fontFamily: 'var(--font-num)' }}>
                {p.gridWidth}×{p.gridHeight} · {p.beadCount}颗
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
