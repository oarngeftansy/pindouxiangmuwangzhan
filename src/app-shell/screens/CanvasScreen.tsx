/**
 * CanvasScreen — App 端拼豆创作页（横屏精简版）
 *
 * 进入时自动锁横屏（Capacitor native 真锁；web 仅尝试）。
 * 离开时解锁恢复。
 *
 * 布局（横屏）：
 * ┌─────────────────────┬───────────────────────────┐
 * │ 左 40% 信息栏        │  右 60% 画布               │
 * │ ┌─────────────────┐ │                            │
 * │ │  返回 / 标题     │ │                            │
 * │ ├─────────────────┤ │                            │
 * │ │  参考图纸缩略    │ │                            │
 * │ │  (≤30%)         │ │      <BeadGrid />          │
 * │ ├─────────────────┤ │                            │
 * │ │  颜色 / 材料清单 │ │                            │
 * │ │  (滚动)         │ │                            │
 * │ ├─────────────────┤ │                            │
 * │ │  滑豆模式 toggle │ │                            │
 * │ └─────────────────┘ │                            │
 * └─────────────────────┴───────────────────────────┘
 *
 * 竖屏 fallback：显示"请横屏"提示，不强制 layout（web 浏览器无法主动转）。
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, RotateCw, Zap } from 'lucide-react';
import { PegboardCell } from '../../components/PegboardCell';
import type { BeadGrid } from '../../App';
import { beadColors } from '../../data/beadColors';
import { loadCanvasParams } from '../../data/canvasParams';
import {
  lockLandscape,
  unlockOrientation,
  isLandscape,
  tapHaptic,
} from '../../utils/native';

interface CanvasScreenProps {
  /** 工作画布初始 grid（一般是全 null 空白；也可是 trending 进入时的彩色） */
  initialWorkingGrid: BeadGrid;
  /** 参考图（左侧缩略图 + 锁色逻辑都按这个走） */
  referenceGrid: BeadGrid;
  /** 标题（如 '空白 30×30' 或 trending name） */
  title: string;
  onBack: () => void;
}

export function CanvasScreen({
  initialWorkingGrid,
  referenceGrid,
  title,
  onBack,
}: CanvasScreenProps) {
  const [workingGrid, setWorkingGrid] = useState<BeadGrid>(() =>
    initialWorkingGrid.map((row) => [...row]),
  );
  const [lockedColor, setLockedColor] = useState<string | null>(null);
  const [pourMode, setPourMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [landscape, setLandscape] = useState(() => isLandscape());

  const canvasParams = useMemo(() => loadCanvasParams(), []);
  const canvasRef = useRef<HTMLDivElement>(null);

  // 锁横屏 + 监听方向变化（web 端用 resize 监听做 fallback 检测）
  useEffect(() => {
    lockLandscape();
    const onResize = () => setLandscape(isLandscape());
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      unlockOrientation();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  // 解锁/锁定颜色（点 reference 或 color list 项触发）
  const handleColorLock = (hex: string) => {
    if (lockedColor === hex) {
      setLockedColor(null);
      setPourMode(false);
    } else {
      setLockedColor(hex);
    }
    tapHaptic(false);
  };

  // 放/擦 一颗豆子（核心逻辑）
  const placeAt = (x: number, y: number) => {
    if (y < 0 || y >= workingGrid.length || x < 0 || x >= workingGrid[0].length) return;
    const ref = referenceGrid[y]?.[x];
    // 锁色模式：只有参考图同色位置才能放
    if (lockedColor && ref !== lockedColor) return;
    const next = workingGrid.map((row) => [...row]);
    // 锁色：放该色；无锁：toggle erase（点已填 → 清除；点空 → no-op）
    if (lockedColor) {
      next[y][x] = lockedColor;
    } else {
      next[y][x] = null;
    }
    setWorkingGrid(next);
    tapHaptic(false);
  };

  // ── 触摸/鼠标事件 ──
  const cellSize = computeCellSize(referenceGrid);

  const getCellFromEvent = (clientX: number, clientY: number): { x: number; y: number } | null => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left) / cellSize);
    const y = Math.floor((clientY - rect.top) / cellSize);
    if (x < 0 || x >= workingGrid[0].length || y < 0 || y >= workingGrid.length) return null;
    return { x, y };
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 1) return; // 多指 → pinch zoom，浏览器接管
    e.preventDefault();
    const t = e.touches[0];
    const cell = getCellFromEvent(t.clientX, t.clientY);
    if (!cell) return;
    setIsDrawing(true);
    placeAt(cell.x, cell.y);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 1) return;
    if (!isDrawing && !(pourMode && lockedColor)) return;
    e.preventDefault();
    const t = e.touches[0];
    const cell = getCellFromEvent(t.clientX, t.clientY);
    if (!cell) return;
    placeAt(cell.x, cell.y);
  };
  const onTouchEnd = () => setIsDrawing(false);
  const onMouseDown = (e: React.MouseEvent) => {
    const cell = getCellFromEvent(e.clientX, e.clientY);
    if (!cell) return;
    setIsDrawing(true);
    placeAt(cell.x, cell.y);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing && !(pourMode && lockedColor)) return;
    const cell = getCellFromEvent(e.clientX, e.clientY);
    if (!cell) return;
    placeAt(cell.x, cell.y);
  };
  const onMouseUp = () => setIsDrawing(false);
  useEffect(() => {
    const up = () => setIsDrawing(false);
    document.addEventListener('mouseup', up);
    return () => document.removeEventListener('mouseup', up);
  }, []);

  // ── 颜色统计 + 进度 ──
  const colorStats = useMemo(() => {
    const required = new Map<string, number>();
    const placed = new Map<string, number>();
    referenceGrid.forEach((row, y) =>
      row.forEach((c, x) => {
        if (c) {
          required.set(c, (required.get(c) || 0) + 1);
          if (workingGrid[y]?.[x] === c) {
            placed.set(c, (placed.get(c) || 0) + 1);
          }
        }
      }),
    );
    return { required, placed };
  }, [referenceGrid, workingGrid]);

  // 竖屏 fallback
  if (!landscape) {
    return <PortraitHint onBack={onBack} />;
  }

  return (
    <div className="fixed inset-0 bg-paper-bg flex z-[60]">
      {/* ─────── 左侧 40% ─────── */}
      <aside
        className="w-[38%] border-r border-edge-sand flex flex-col bg-paper-soft"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {/* 顶部：返回 + 标题 */}
        <header className="flex items-center gap-2 px-3 py-2 border-b border-edge-sand shrink-0">
          <button
            onClick={onBack}
            className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] rounded-control hover:bg-paper-bg active:bg-paper-deep transition-colors"
            aria-label="返回"
          >
            <ArrowLeft className="w-5 h-5 text-ink-warm" aria-hidden="true" />
          </button>
          <h1
            className="text-sm font-semibold text-ink-warm truncate flex-1"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            {title}
          </h1>
        </header>

        {/* 参考图缩略 */}
        <section className="shrink-0 p-3 border-b border-edge-sand">
          <div className="text-[10px] uppercase tracking-wider text-ink-soft font-semibold mb-1.5">
            参考图纸
          </div>
          <div className="bg-paper-bg border border-edge-sand rounded-control p-2 flex items-center justify-center" style={{ maxHeight: '22vh' }}>
            <ReferenceThumbnail
              grid={referenceGrid}
              lockedColor={lockedColor}
              onTap={handleColorLock}
            />
          </div>
        </section>

        {/* 颜色 / 材料清单 — 占剩余空间，滚动 */}
        <section className="flex-1 min-h-0 overflow-y-auto p-3">
          <div className="text-[10px] uppercase tracking-wider text-ink-soft font-semibold mb-2">
            色卡 · 点击锁定
          </div>
          <div className="space-y-1.5">
            {Array.from(colorStats.required.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([hex, total]) => {
                const placed = colorStats.placed.get(hex) || 0;
                const done = placed >= total;
                const isLocked = lockedColor === hex;
                const code =
                  beadColors.find((c) => c.hex === hex)?.mard || '?';
                return (
                  <button
                    key={hex}
                    onClick={() => handleColorLock(hex)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-control border-2 transition-colors text-left ${
                      isLocked
                        ? 'border-honey bg-honey-glow/40'
                        : 'border-edge-sand bg-paper-bg hover:bg-paper-deep'
                    } ${done ? 'opacity-55' : ''}`}
                  >
                    <div
                      className="w-6 h-6 rounded-bead border border-edge-sand shrink-0"
                      style={{ backgroundColor: hex }}
                      aria-hidden="true"
                    />
                    <span
                      className="text-xs font-bold text-ink-warm w-12 shrink-0"
                      style={{ fontFamily: 'var(--font-num)' }}
                    >
                      {code}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="w-full h-1.5 bg-paper-deep rounded-bead overflow-hidden">
                        <div
                          className={`h-full rounded-bead transition-all ${
                            done ? 'bg-moss' : 'bg-terracotta'
                          }`}
                          style={{ width: `${(placed / total) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span
                      className="text-[10px] text-ink-soft shrink-0 w-10 text-right"
                      style={{ fontFamily: 'var(--font-num)' }}
                    >
                      {placed}/{total}
                    </span>
                  </button>
                );
              })}
          </div>
        </section>

        {/* 滑豆模式 toggle */}
        <section className="shrink-0 p-3 border-t border-edge-sand">
          <button
            onClick={() => setPourMode((v) => !v)}
            disabled={!lockedColor}
            className={`w-full inline-flex items-center justify-between gap-2 px-3 py-2.5 rounded-control border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2 ${
              pourMode
                ? 'bg-terracotta text-paper-bg border-terracotta'
                : 'bg-paper-bg text-ink-warm border-edge-sand'
            }`}
            aria-pressed={pourMode}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm font-semibold">滑豆模式</span>
            </div>
            <div
              className={`relative w-9 h-5 rounded-bead transition-colors ${
                pourMode ? 'bg-paper-bg/30' : 'bg-bead-shadow/40'
              }`}
              aria-hidden="true"
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-bead transition-transform ${
                  pourMode ? 'bg-paper-bg translate-x-4' : 'bg-paper-bg translate-x-0.5'
                }`}
              />
            </div>
          </button>
          {!lockedColor && (
            <p className="text-[10px] text-ink-soft mt-1.5 leading-snug">先锁一个颜色再开启滑豆</p>
          )}
        </section>
      </aside>

      {/* ─────── 右侧 62% 画布 ─────── */}
      <main
        className="flex-1 flex items-center justify-center overflow-auto bg-paper-deep"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div
          className="rounded-card relative"
          style={{
            backgroundColor: 'oklch(0.985 0.006 80)',
            border: '5px solid var(--bead-edge)',
            padding: 12,
            boxShadow:
              'inset 0 2px 8px rgba(58, 52, 42, 0.08), 0 4px 16px rgba(168, 130, 90, 0.18)',
          }}
        >
          <div
            ref={canvasRef}
            className="grid gap-0"
            style={{
              gridTemplateColumns: `repeat(${workingGrid[0].length}, ${cellSize}px)`,
              width: 'fit-content',
              touchAction: 'manipulation',
              userSelect: 'none',
            }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
          >
            {workingGrid.map((row, y) =>
              row.map((color, x) => {
                const ref = referenceGrid[y][x];
                const shouldHighlight = lockedColor != null && ref === lockedColor;
                const canPlace = !lockedColor || ref === lockedColor;
                return (
                  <PegboardCell
                    key={`${x}-${y}`}
                    x={x}
                    y={y}
                    color={color}
                    beadSize={cellSize}
                    viewMode="pegboard"
                    showGrid={false}
                    shouldHighlight={shouldHighlight}
                    canPlace={canPlace}
                    isEmpty={!color}
                    canvasParams={canvasParams}
                  />
                );
              }),
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ── helpers ──

function computeCellSize(referenceGrid: BeadGrid): number {
  if (typeof window === 'undefined') return 20;
  // 右侧画布可用空间：屏宽 * 0.62 - padding/border ≈ -50px buffer
  const w = window.innerWidth * 0.62 - 50;
  const h = window.innerHeight - 60; // 减 safe area + border
  const gridW = referenceGrid[0]?.length || 30;
  const gridH = referenceGrid.length || 30;
  return Math.max(8, Math.floor(Math.min(w / gridW, h / gridH)));
}

function ReferenceThumbnail({
  grid,
  lockedColor,
  onTap,
}: {
  grid: BeadGrid;
  lockedColor: string | null;
  onTap: (hex: string) => void;
}) {
  // 参考图小尺寸 grid（每格 ~6-10px），点击豆子锁色
  const size = Math.max(4, Math.min(8, Math.floor(180 / Math.max(grid[0].length, grid.length))));
  return (
    <div
      className="grid gap-0 rounded overflow-hidden border border-edge-sand"
      style={{
        gridTemplateColumns: `repeat(${grid[0].length}, ${size}px)`,
        backgroundColor: 'var(--bead-paper-bg)',
      }}
    >
      {grid.map((row, y) =>
        row.map((color, x) => {
          const highlighted = lockedColor && color === lockedColor;
          return (
            <div
              key={`r-${x}-${y}`}
              onClick={() => color && onTap(color)}
              style={{
                width: size,
                height: size,
                backgroundColor: color || 'var(--bead-paper-bg)',
                cursor: color ? 'pointer' : 'default',
                boxShadow: highlighted ? 'inset 0 0 0 1px var(--bead-honey)' : undefined,
              }}
            />
          );
        }),
      )}
    </div>
  );
}

function PortraitHint({ onBack }: { onBack: () => void }) {
  return (
    <div className="fixed inset-0 bg-paper-bg z-[60] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-card bg-honey-glow flex items-center justify-center mb-5">
        <RotateCw
          className="w-10 h-10 text-terracotta animate-rotate-hint"
          aria-hidden="true"
        />
      </div>
      <h3
        className="text-xl font-semibold text-ink-warm mb-2"
        style={{ fontFamily: 'var(--font-headline)' }}
      >
        请横屏使用
      </h3>
      <p className="text-sm text-ink-soft mb-6 leading-relaxed max-w-[24em]">
        创作页只在横屏体验，画布更大、左右分栏操作更顺手。
      </p>
      <button
        onClick={onBack}
        className="inline-flex items-center justify-center min-h-[40px] px-5 py-2 bg-paper-soft border border-edge-sand text-ink-warm rounded-control text-sm font-semibold hover:bg-paper-deep transition-colors"
      >
        返回首页
      </button>
    </div>
  );
}
