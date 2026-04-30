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

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  hard: 'bg-red-100 text-red-700',
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
    <section className="rounded-xl border border-[#d7d1c3] bg-white px-5 py-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-[#1f2937]">网红图纸</h3>
          <p className="text-xs text-[#9ca3af] mt-0.5">精选热门拼豆图纸，点击即可开始创作</p>
        </div>
        <span className="text-xs text-[#9ca3af] bg-[#f3f1ec] px-2 py-1 rounded-full">{patterns.length} 个</span>
      </div>

      {/* 标签筛选 */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${
              selectedTag === null
                ? 'bg-[#1f5c57] text-white border-[#1f5c57]'
                : 'bg-white text-[#374151] border-[#d7d1c3] hover:bg-[#f3f1ec]'
            }`}
          >
            全部
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                selectedTag === tag
                  ? 'bg-[#1f5c57] text-white border-[#1f5c57]'
                  : 'bg-white text-[#374151] border-[#d7d1c3] hover:bg-[#f3f1ec]'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* 图纸卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filtered.map(p => (
          <div
            key={p.id}
            className="rounded-xl border border-[#d7d1c3] p-3 hover:shadow-lg hover:border-[#1f5c57] transition-all cursor-pointer group"
            onClick={() => onUsePattern(p.grid)}
          >
            <div className="flex items-center justify-center bg-[#f9f8f5] rounded-lg p-2 mb-2 min-h-[120px]">
              {p.previewImage ? (
                <img src={p.previewImage} alt={p.name} className="max-h-[110px] max-w-full object-contain" />
              ) : (
                <PatternThumbnail grid={p.grid} size={100} />
              )}
            </div>
            <p className="font-medium text-sm text-[#1f2937] truncate">{p.name}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[p.difficulty]}`}>
                {DIFFICULTY_LABELS[p.difficulty]}
              </span>
              <span className="text-[10px] text-[#9ca3af]">{p.gridWidth}x{p.gridHeight}</span>
              <span className="text-[10px] text-[#9ca3af]">{p.beadCount}颗</span>
            </div>
            <div className="mt-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs text-[#1f5c57] font-medium bg-[#eef6f5] px-3 py-1 rounded-full">开始创作</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
