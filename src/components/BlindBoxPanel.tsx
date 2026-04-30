import { Gift, Sparkles } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import type { BeadGrid } from "../types";
import { getTodayBlindBox } from "../services/blindboxService";
import type { BlindBoxPattern } from "../data/blindboxPools";

interface BlindBoxPanelProps {
  onUsePattern: (grid: BeadGrid) => void;
  compact?: boolean;
}

// 迷你缩略图
function MiniPreview({ grid, size = 60 }: { grid: BeadGrid; size?: number }) {
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
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, w, h);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const color = grid[r][c];
        if (color) {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(c * cellSize + cellSize / 2, r * cellSize + cellSize / 2, cellSize / 2 - 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }, [grid, size]);

  return <canvas ref={canvasRef} style={{ borderRadius: 4 }} />;
}

export function BlindBoxPanel({ onUsePattern, compact = false }: BlindBoxPanelProps) {
  const [patterns, setPatterns] = useState<BlindBoxPattern[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const result = getTodayBlindBox();
    setPatterns(result.patterns);
    setLoading(false);
  }, []);

  return (
    <div className={`bg-paper-soft rounded-card border border-edge-sand ${compact ? "p-5" : "p-6 mb-8"}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-chip bg-honey-glow text-ink-warm text-xs font-semibold mb-2">
            <Gift className="w-3.5 h-3.5" aria-hidden="true" />
            每日盲盒
          </div>
          <h3
            className={`${compact ? "text-lg" : "text-xl"} text-ink-warm`}
            style={{ fontFamily: 'var(--font-headline)', fontWeight: 600 }}
          >
            今日盲盒图案
          </h3>
          <p className="text-xs text-ink-soft mt-1">每天随机 2 个，三天内不重复</p>
        </div>
        <Sparkles className="w-6 h-6 text-terracotta flex-shrink-0" aria-hidden="true" />
      </div>

      {loading ? (
        <p className="text-sm text-ink-soft py-4 text-center">正在加载...</p>
      ) : patterns.length === 0 ? (
        <p className="text-sm text-ink-soft py-4 text-center">暂无盲盒图案</p>
      ) : (
        <div className="space-y-3">
          {patterns.map(p => (
            <button
              key={p.id}
              type="button"
              className="w-full text-left flex items-center gap-3 rounded-surface border border-edge-sand bg-paper-bg p-3 transition-all hover:border-terracotta/60 hover:-translate-y-0.5 cursor-pointer group focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
              onClick={() => onUsePattern(p.grid.map(r => [...r]))}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-bead)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div className="flex-shrink-0 w-[60px] h-[60px] flex items-center justify-center bg-paper-soft rounded-control overflow-hidden border border-edge-sand/60">
                {p.previewUrl ? (
                  <img src={p.previewUrl} alt={p.name} className="max-w-[56px] max-h-[56px] object-contain" />
                ) : (
                  <MiniPreview grid={p.grid} size={52} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-ink-warm truncate">{p.name}</p>
                <p className="text-xs text-ink-soft mt-0.5 line-clamp-1">{p.description}</p>
                <p className="text-[10px] text-ink-soft mt-1" style={{ fontFamily: 'var(--font-num)' }}>
                  {p.grid[0]?.length ?? 0} × {p.grid.length}
                </p>
              </div>
              <span className="text-xs text-terracotta font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                试试 →
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
