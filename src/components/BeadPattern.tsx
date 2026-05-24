import {
  ChevronDown,
  ChevronUp,
  Download,
  Info,
  RefreshCw,
} from "lucide-react";
import { BeadGrid, BeadColor, ColorSystem } from "../App";
import { useState, useMemo } from "react";
import {
  rgbToHex,
  findClosestColor,
  getAveragedColor
} from "../utils/colorMatching";
import { PixelArrow, PixelStar } from "./PixelDecorations";

// NJ kiosk 风窗口 chrome — 跟 UPLOAD.EXE / GALLERY.EXE 同款
const WIN95_SHADOW = [
  '0 -2px 0 var(--y2k-navy)',
  '0 2px 0 var(--y2k-navy)',
  '-2px 0 0 var(--y2k-navy)',
  '2px 0 0 var(--y2k-navy)',
  '6px 6px 0 var(--y2k-navy-deep)',
].join(', ');

const CARD_SHADOW = [
  '0 -2px 0 var(--y2k-navy)',
  '0 2px 0 var(--y2k-navy)',
  '-2px 0 0 var(--y2k-navy)',
  '2px 0 0 var(--y2k-navy)',
  '4px 4px 0 var(--y2k-navy-deep)',
].join(', ');

function TitleBar({ name }: { name: string }) {
  return (
    <div
      className="absolute left-0 right-0 flex items-center justify-between px-2"
      style={{
        top: 2,
        height: 16,
        backgroundColor: 'var(--y2k-navy)',
        color: 'var(--bead-paper-bg)',
      }}
    >
      <span className="font-pixel-arcade" style={{ fontSize: 12, letterSpacing: 0 }}>
        {name}
      </span>
      <div className="flex gap-0.5">
        <div className="w-2 h-2 bg-paper-bg/80" aria-hidden="true" />
        <div className="w-2 h-2 bg-paper-bg/80" aria-hidden="true" />
        <div className="w-2 h-2 bg-y2k-coral" aria-hidden="true" />
      </div>
    </div>
  );
}

function CornerPearls() {
  return (
    <>
      <div className="absolute pointer-events-none" style={{ top: -4, left: -4, width: 4, height: 4, backgroundColor: 'var(--y2k-navy)' }} aria-hidden="true" />
      <div className="absolute pointer-events-none" style={{ top: -4, right: -4, width: 4, height: 4, backgroundColor: 'var(--y2k-navy)' }} aria-hidden="true" />
      <div className="absolute pointer-events-none" style={{ bottom: -4, left: -4, width: 4, height: 4, backgroundColor: 'var(--y2k-navy)' }} aria-hidden="true" />
      <div className="absolute pointer-events-none" style={{ bottom: -4, right: -4, width: 4, height: 4, backgroundColor: 'var(--y2k-navy)' }} aria-hidden="true" />
    </>
  );
}

interface BeadPatternProps {
  beadGrid: BeadGrid;
  beadColors: BeadColor[];
  onStartDIY: () => void;
  colorSystem?: ColorSystem;
  originalImage?: HTMLImageElement | null;
  onGridResize?: (grid: BeadGrid) => void;
}

export function BeadPattern({
  beadGrid,
  beadColors,
  onStartDIY,
  colorSystem: initialColorSystem = "mard",
  originalImage = null,
  onGridResize,
}: BeadPatternProps) {
  // 响应式最大尺寸：手机留边距，桌面用 800
  const maxDisplaySize = typeof window !== 'undefined'
    ? Math.min(800, window.innerWidth - 64)
    : 800;
  const beadSize = Math.max(
    Math.min(
      maxDisplaySize / beadGrid[0].length,
      maxDisplaySize / beadGrid.length,
    ),
    6,
  );

  // 图纸设置
  const [colorSystem, setColorSystem] = useState<ColorSystem>(
    initialColorSystem,
  );
  const [customWidth, setCustomWidth] = useState(
    beadGrid[0].length,
  );
  const [customHeight, setCustomHeight] = useState(
    beadGrid.length,
  );
  const [isResizing, setIsResizing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [gridOpacity, setGridOpacity] = useState(1); // 线条不透明度
  const [minColorCount, setMinColorCount] = useState(1); // 最小颜色数量，用于过滤杂色
  // 选中的格子（点击查看色号；触摸设备的 hover 替代方案，桌面 hover 仍生效）
  const [selectedBead, setSelectedBead] = useState<{ x: number; y: number } | null>(null);

  const getColorCount = () => {
    const colorMap = new Map<string, number>();
    beadGrid.forEach((row) => {
      row.forEach((color) => {
        if (color) {
          colorMap.set(color, (colorMap.get(color) || 0) + 1);
        }
      });
    });
    return colorMap;
  };

  const getColorCode = (hex: string): string => {
    const color = beadColors.find((c) => c.hex === hex);
    if (!color) return "?";
    return color[colorSystem] || color.mard || "?";
  };

  const downloadPattern = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    const cellSize = 25;
    const coordMargin = 40;
    canvas.width =
      beadGrid[0].length * cellSize + coordMargin * 2;
    canvas.height =
      beadGrid.length * cellSize + coordMargin * 2;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#333333";

    for (let x = 0; x < beadGrid[0].length; x++) {
      const colNum = String(x + 1);
      const xPos = coordMargin + x * cellSize + cellSize / 2;
      ctx.fillText(colNum, xPos, 20);
      ctx.fillText(colNum, xPos, canvas.height - 20);
    }

    for (let y = 0; y < beadGrid.length; y++) {
      const rowNum = String(y + 1);
      const yPos = coordMargin + y * cellSize + cellSize / 2;
      ctx.fillText(rowNum, 20, yPos);
      ctx.fillText(rowNum, canvas.width - 20, yPos);
    }

    beadGrid.forEach((row, y) => {
      row.forEach((color, x) => {
        const offsetX = coordMargin + x * cellSize;
        const offsetY = coordMargin + y * cellSize;

        ctx.strokeStyle = "#BBBBBB";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(offsetX, offsetY, cellSize, cellSize);

        if (x % 5 === 0) {
          ctx.strokeStyle = "#666666";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(offsetX, offsetY);
          ctx.lineTo(offsetX, offsetY + cellSize);
          ctx.stroke();
        }
        if (y % 5 === 0) {
          ctx.strokeStyle = "#666666";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(offsetX, offsetY);
          ctx.lineTo(offsetX + cellSize, offsetY);
          ctx.stroke();
        }

        if (color) {
          const centerX = offsetX + cellSize / 2;
          const centerY = offsetY + cellSize / 2;

          ctx.fillStyle = color;
          ctx.fillRect(
            offsetX + 1,
            offsetY + 1,
            cellSize - 2,
            cellSize - 2,
          );

          ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
          ctx.beginPath();
          ctx.arc(
            centerX,
            centerY,
            cellSize / 7,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      });
    });

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `拼豆图纸-${beadGrid[0].length}x${beadGrid.length}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  const colorCount = useMemo(() => getColorCount(), [beadGrid]);

  // RGB转HSL
  const rgbToHsl = (
    r: number,
    g: number,
    b: number,
  ): [number, number, number] => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return [h * 360, s, l];
  };

  // RGB to Lab色彩空间转换 - 更接近人眼感知
  const rgbToLab = (r: number, g: number, b: number): [number, number, number] => {
    // RGB to XYZ
    let rNorm = r / 255;
    let gNorm = g / 255;
    let bNorm = b / 255;

    rNorm = rNorm > 0.04045 ? Math.pow((rNorm + 0.055) / 1.055, 2.4) : rNorm / 12.92;
    gNorm = gNorm > 0.04045 ? Math.pow((gNorm + 0.055) / 1.055, 2.4) : gNorm / 12.92;
    bNorm = bNorm > 0.04045 ? Math.pow((bNorm + 0.055) / 1.055, 2.4) : bNorm / 12.92;

    let x = rNorm * 0.4124564 + gNorm * 0.3575761 + bNorm * 0.1804375;
    let y = rNorm * 0.2126729 + gNorm * 0.7151522 + bNorm * 0.0721750;
    let z = rNorm * 0.0193339 + gNorm * 0.1191920 + bNorm * 0.9503041;

    // XYZ to Lab (D65 illuminant)
    x = x / 0.95047;
    y = y / 1.00000;
    z = z / 1.08883;

    x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
    y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
    z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);

    const L = 116 * y - 16;
    const a = 500 * (x - y);
    const b_lab = 200 * (y - z);

    return [L, a, b_lab];
  };

  const colorDistance = (
    hex1: string,
    hex2: string,
  ): number => {
    const r1 = parseInt(hex1.slice(1, 3), 16);
    const g1 = parseInt(hex1.slice(3, 5), 16);
    const b1 = parseInt(hex1.slice(5, 7), 16);
    const r2 = parseInt(hex2.slice(1, 3), 16);
    const g2 = parseInt(hex2.slice(3, 5), 16);
    const b2 = parseInt(hex2.slice(5, 7), 16);

    // 使用CIE Lab色彩空间计算Delta E距离 - 更符合人眼感知
    const [L1, a1, b1_lab] = rgbToLab(r1, g1, b1);
    const [L2, a2, b2_lab] = rgbToLab(r2, g2, b2);
    
    const deltaL = L1 - L2;
    const deltaA = a1 - a2;
    const deltaB = b1_lab - b2_lab;
    
    // CIE76 Delta E公式
    return Math.sqrt(
      deltaL * deltaL +
      deltaA * deltaA +
      deltaB * deltaB
    );
  };

  const handleResizeGrid = (width: number, height: number) => {
    if (!onGridResize) return;

    if (!originalImage) {
      const newGrid: BeadGrid = Array(height)
        .fill(null)
        .map((_, y) =>
          Array(width)
            .fill(null)
            .map((_, x) => {
              if (
                y < beadGrid.length &&
                x < beadGrid[0].length
              ) {
                return beadGrid[y][x];
              }
              return null;
            }),
        );
      onGridResize(newGrid);
      setIsResizing(false);
    } else {
      setIsResizing(true);

      // 使用 setTimeout 让界面有机会更新
      setTimeout(() => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(originalImage, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const pixels = imageData.data;

        const grid: BeadGrid = [];
        for (let y = 0; y < height; y++) {
          const row: (string | null)[] = [];
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];

            if (a < 128) {
              row.push(null);
            } else {
              const hex = rgbToHex(r, g, b);
              const closestColor = findClosestColor(hex, beadColors);
              row.push(closestColor);
            }
          }
          grid.push(row);
        }

        onGridResize(grid);
        setIsResizing(false);
      }, 50);
    }
  };

  const handleAdaptToOriginal = () => {
    if (!originalImage || !onGridResize) return;

    let width = originalImage.naturalWidth;
    let height = originalImage.naturalHeight;
    const maxSize = 100;

    // 等比例缩放到100x100以内
    if (width > maxSize || height > maxSize) {
      const ratio = Math.min(maxSize / width, maxSize / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    setCustomWidth(width);
    setCustomHeight(height);
    handleResizeGrid(width, height);
  };

  const handleApplyResize = () => {
    handleResizeGrid(customWidth, customHeight);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* SETTINGS.EXE 窗口 — 图纸设置（可折叠） */}
      <div className="relative">
        <div
          className="relative bg-paper-bg p-4 pt-7 sm:p-6 sm:pt-8"
          style={{
            boxShadow: WIN95_SHADOW,
            backgroundImage:
              'radial-gradient(circle, rgba(44, 58, 94, 0.05) 1px, transparent 1px)',
            backgroundSize: '14px 14px',
          }}
        >
          <TitleBar name="SETTINGS.EXE" />

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-baseline gap-3">
              <h3
                className="font-pixel-cn text-ink-warm"
                style={{ fontSize: 22, letterSpacing: '0.1em', lineHeight: 1.1 }}
              >
                图纸设置
              </h3>
              <span
                className="font-pixel-arcade text-y2k-navy"
                style={{ fontSize: 13, letterSpacing: '0.15em' }}
              >
                CONFIG
              </span>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-2 bg-paper-soft text-ink-warm font-pixel-cn transition-transform hover:-translate-y-0.5"
              style={{
                fontSize: 11,
                letterSpacing: '0.05em',
                boxShadow: [
                  '0 -2px 0 var(--y2k-navy)',
                  '0 2px 0 var(--y2k-navy)',
                  '-2px 0 0 var(--y2k-navy)',
                  '2px 0 0 var(--y2k-navy)',
                  '3px 3px 0 var(--y2k-coral)',
                ].join(', '),
              }}
              aria-label={showSettings ? "收起图纸设置" : "展开图纸设置"}
            >
              <span>{showSettings ? "收起" : "展开"}</span>
              {showSettings ? (
                <ChevronUp className="w-4 h-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>

        {showSettings && (
          <div className="space-y-6 pt-4" style={{ borderTop: '2px dashed var(--y2k-navy)' }}>
            {/* 色号系统 — pixel pill style */}
            <div>
              <label className="block font-pixel-cn text-ink-warm mb-3" style={{ fontSize: 13, letterSpacing: '0.08em' }}>
                色号系统
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {[
                  { value: "mard" as ColorSystem, label: "MARD" },
                  { value: "coco" as ColorSystem, label: "COCO" },
                  { value: "manman" as ColorSystem, label: "漫漫" },
                  { value: "panpan" as ColorSystem, label: "盼盼" },
                  { value: "mxw" as ColorSystem, label: "咪小窝" },
                ].map((system) => {
                  const active = colorSystem === system.value;
                  return (
                    <button
                      key={system.value}
                      onClick={() => setColorSystem(system.value)}
                      className="font-pixel-cn px-3 py-2 transition-transform hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px]"
                      style={{
                        fontSize: 12,
                        letterSpacing: '0.05em',
                        backgroundColor: active ? 'var(--y2k-navy)' : 'var(--bead-paper-soft)',
                        color: active ? 'var(--bead-paper-bg)' : 'var(--bead-ink)',
                        boxShadow: [
                          '0 -2px 0 var(--y2k-navy)',
                          '0 2px 0 var(--y2k-navy)',
                          '-2px 0 0 var(--y2k-navy)',
                          '2px 0 0 var(--y2k-navy)',
                          active ? '3px 3px 0 var(--y2k-coral)' : '3px 3px 0 var(--y2k-navy-deep)',
                        ].join(', '),
                      }}
                    >
                      {system.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 尺寸调整 */}
            {originalImage && onGridResize && (
              <div>
                <label className="block text-sm font-semibold mb-3 text-ink-warm">
                  画板尺寸调整
                </label>
                {/* 第一行：宽 × 高 + 颗数 */}
                <div className="flex items-center gap-3 flex-wrap mb-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-ink-soft">
                      宽:
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="200"
                      value={customWidth}
                      onChange={(e) =>
                        setCustomWidth(
                          parseInt(e.target.value) || 40,
                        )
                      }
                      className="w-20 px-3 py-3 border border-edge-sand rounded-control bg-paper-bg text-ink-warm text-base focus:outline-none focus:ring-2 focus:ring-moss focus:border-moss"
                    />
                  </div>

                  <span className="text-ink-soft" aria-hidden="true">×</span>

                  <div className="flex items-center gap-2">
                    <label className="text-sm text-ink-soft">
                      高:
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="200"
                      value={customHeight}
                      onChange={(e) =>
                        setCustomHeight(
                          parseInt(e.target.value) || 40,
                        )
                      }
                      className="w-20 px-3 py-3 border border-edge-sand rounded-control bg-paper-bg text-ink-warm text-base focus:outline-none focus:ring-2 focus:ring-moss focus:border-moss"
                    />
                  </div>

                  <div className="text-sm text-ink-soft" style={{ fontFamily: 'var(--font-num)' }}>
                    = {customWidth * customHeight} 颗
                  </div>
                </div>

                {/* 第二行：两个按钮，手机各占半宽 */}
                <div className="flex flex-wrap gap-3 mb-2">
                  <button
                    onClick={handleAdaptToOriginal}
                    disabled={isResizing}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 bg-paper-bg border border-edge-sand text-ink-warm rounded-control text-sm font-semibold hover:bg-paper-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isResizing ? "animate-spin" : ""}`}
                      aria-hidden="true"
                    />
                    自适应原图
                  </button>

                  <button
                    onClick={handleApplyResize}
                    disabled={
                      isResizing ||
                      (customWidth === beadGrid[0].length &&
                        customHeight === beadGrid.length)
                    }
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center min-h-[44px] px-4 py-2 bg-moss text-paper-bg rounded-control text-sm font-semibold hover:bg-moss-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isResizing ? "处理中..." : "应用尺寸"}
                  </button>
                </div>

                <div className="text-xs text-ink-soft" style={{ fontFamily: 'var(--font-num)' }}>
                  原图: {originalImage.naturalWidth} × {originalImage.naturalHeight} px
                </div>
              </div>
            )}

            {/* 网格线不透明度 */}
            <div>
              <label className="block text-sm font-semibold mb-3 text-ink-warm">
                网格线不透明度
              </label>
              <div className="flex items-center gap-4">
                {/* py-3 包裹给 2px 滑轨提供 ≥24px 的触摸 hitbox */}
                <div className="flex-1 py-3">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={gridOpacity}
                    onChange={(e) => setGridOpacity(parseFloat(e.target.value))}
                    className="w-full h-2 rounded-bead appearance-none cursor-pointer"
                    style={{
                      // 用 moss-pine 替代紫；轨道色用 paper-deep
                      background: `linear-gradient(to right, var(--bead-moss) 0%, var(--bead-moss) ${gridOpacity * 100}%, var(--bead-paper-deep) ${gridOpacity * 100}%, var(--bead-paper-deep) 100%)`
                    }}
                    aria-label="网格线不透明度"
                  />
                </div>
                <span className="text-sm font-semibold text-ink-warm w-12 text-right" style={{ fontFamily: 'var(--font-num)' }}>
                  {Math.round(gridOpacity * 100)}%
                </span>
              </div>
            </div>

            {/* 最小颜色数量 */}
            <div>
              <label className="block text-sm font-semibold mb-3 text-ink-warm">
                过滤杂色（最小颜色数量）
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={minColorCount}
                  onChange={(e) => setMinColorCount(parseInt(e.target.value) || 1)}
                  className="w-20 px-3 py-3 border border-edge-sand rounded-control bg-paper-bg text-ink-warm text-base focus:outline-none focus:ring-2 focus:ring-moss focus:border-moss"
                />
                <span className="text-sm text-ink-soft">
                  颗以下的颜色将被隐藏
                </span>
              </div>
              <p className="text-xs text-ink-soft mt-2">
                提示：设置更大的值可以过滤掉材料清单中的杂色
              </p>
            </div>
          </div>
        )}
        </div>
        <CornerPearls />
      </div>

      {/* PATTERN.EXE + MATERIALS.EXE 两窗并排 */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 sm:gap-8 items-start">
        {/* PATTERN.EXE — 拼豆图纸主窗口 */}
        <div className="relative">
          <div
            className="relative bg-paper-bg p-4 pt-8 sm:p-6 sm:pt-9"
            style={{
              boxShadow: WIN95_SHADOW,
              backgroundImage:
                'radial-gradient(circle, rgba(44, 58, 94, 0.05) 1px, transparent 1px)',
              backgroundSize: '14px 14px',
            }}
          >
            <TitleBar name="PATTERN.EXE" />
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-baseline gap-3">
                <PixelStar size={14} color="var(--y2k-coral)" className="self-center pixel-float-fast" style={{ marginBottom: 3 }} />
                <h2 className="font-pixel-cn text-ink-warm" style={{ fontSize: 22, letterSpacing: '0.1em', lineHeight: 1.1 }}>
                  拼豆图纸
                </h2>
              </div>
              <div className="flex items-center gap-2 font-pixel-arcade text-y2k-navy" style={{ fontSize: 13, letterSpacing: '0.1em' }}>
                <span>{beadGrid[0].length}×{beadGrid.length}</span>
                <span className="text-ink-soft">·</span>
                <span>{Array.from(colorCount.values()).reduce((a, b) => a + b, 0)}b TOTAL</span>
              </div>
            </div>

            <div
              className="bg-paper-soft p-3 sm:p-5 overflow-auto"
              style={{
                boxShadow: 'inset 0 0 0 2px var(--y2k-navy)',
                backgroundImage:
                  'radial-gradient(circle, rgba(44, 58, 94, 0.08) 1px, transparent 1px)',
                backgroundSize: '10px 10px',
              }}
            >
              <div className="inline-block">
                <div
                  className="grid gap-0 bg-paper-bg rounded-control overflow-hidden border border-edge-sand"
                  style={{
                    gridTemplateColumns: `repeat(${beadGrid[0].length}, ${beadSize}px)`,
                    width: "fit-content",
                  }}
                >
                  {beadGrid.map((row, y) =>
                    row.map((color, x) => {
                      const colorCode = color
                        ? getColorCode(color)
                        : "";
                      const isSelected =
                        selectedBead?.x === x && selectedBead?.y === y;
                      return (
                        <div
                          key={`${x}-${y}`}
                          className="flex items-center justify-center relative group cursor-pointer"
                          style={{
                            width: beadSize,
                            height: beadSize,
                            backgroundColor: color || "var(--bead-paper-bg)",
                            border: `0.15px solid rgba(44, 58, 94, ${gridOpacity * 0.55})`,
                          }}
                          onClick={() => {
                            if (!color) return;
                            setSelectedBead(
                              isSelected ? null : { x, y },
                            );
                          }}
                          aria-label={color ? `第 ${y + 1} 行 ${x + 1} 列，色号 ${colorCode}` : undefined}
                        >
                          {color && (
                            <>
                              {/* 图纸渲染：方格满 cell（图纸样式），不是圆豆 */}
                              <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                  backgroundColor: color,
                                }}
                              />
                              {beadSize > 15 && (
                                <span
                                  className={`relative z-10 font-bold select-none transition-opacity pointer-events-none ${
                                    isSelected
                                      ? "opacity-100"
                                      : "opacity-0 group-hover:opacity-100"
                                  }`}
                                  style={{
                                    color: "var(--bead-ink)",
                                    fontFamily: "var(--font-num)",
                                    textShadow:
                                      "0 0 3px var(--bead-paper-bg), 0 0 5px rgba(246, 239, 226, 0.8)",
                                    fontSize: Math.max(
                                      beadSize * 0.35,
                                      10,
                                    ),
                                  }}
                                >
                                  {colorCode}
                                </span>
                              )}
                              {beadSize <= 15 && (
                                <div
                                  className={`absolute z-50 -top-8 left-1/2 transform -translate-x-1/2 bg-ink-warm text-paper-bg px-2 py-1 rounded-chip text-xs whitespace-nowrap transition-opacity pointer-events-none ${
                                    isSelected
                                      ? "opacity-100"
                                      : "opacity-0 group-hover:opacity-100"
                                  }`}
                                  style={{ fontFamily: "var(--font-num)" }}
                                >
                                  {colorCode}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    }),
                  )}
                </div>
              </div>
            </div>
          </div>
          <CornerPearls />
        </div>

        {/* MATERIALS.EXE — 材料清单 + 操作按钮 */}
        <div className="relative md:w-72 lg:w-80 md:shrink-0">
          <div
            className="relative bg-paper-bg p-4 pt-8 sm:p-5 sm:pt-9"
            style={{
              boxShadow: WIN95_SHADOW,
              backgroundImage:
                'radial-gradient(circle, rgba(44, 58, 94, 0.05) 1px, transparent 1px)',
              backgroundSize: '14px 14px',
            }}
          >
            <TitleBar name="MATERIALS.EXE" />

            <div className="flex items-baseline gap-3 mb-4">
              <h3 className="font-pixel-cn text-ink-warm" style={{ fontSize: 22, letterSpacing: '0.1em', lineHeight: 1.1 }}>
                材料清单
              </h3>
              <span className="font-pixel-arcade text-y2k-navy" style={{ fontSize: 13, letterSpacing: '0.15em' }}>
                ITEMS
              </span>
            </div>

            {/* 总览 — pixel chip 行 */}
            <div className="flex items-center justify-between mb-4 px-3 py-2 bg-paper-soft"
              style={{ boxShadow: 'inset 0 0 0 2px var(--y2k-navy)' }}
            >
              <span className="font-pixel-arcade text-y2k-navy" style={{ fontSize: 13, letterSpacing: '0.1em' }}>
                {Array.from(colorCount.values()).reduce((a, b) => a + b, 0)}b
              </span>
              <span className="font-pixel-arcade text-y2k-coral" style={{ fontSize: 13, letterSpacing: '0.1em' }}>
                {Array.from(colorCount.entries()).filter(([_, count]) => count >= minColorCount).length} COLORS
              </span>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {Array.from(colorCount.entries())
                .filter(([_, count]) => count >= minColorCount)
                .sort((a, b) => b[1] - a[1])
                .map(([colorHex, count]) => {
                  const code = getColorCode(colorHex);
                  return (
                    <div
                      key={colorHex}
                      className="flex items-center justify-between bg-paper-soft p-2"
                      style={{
                        boxShadow: [
                          '0 -1px 0 var(--y2k-navy)',
                          '0 1px 0 var(--y2k-navy)',
                          '-1px 0 0 var(--y2k-navy)',
                          '1px 0 0 var(--y2k-navy)',
                          '2px 2px 0 var(--y2k-navy-deep)',
                        ].join(', '),
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* 色块 — 方形像素 chip 替代圆 */}
                        <div
                          className="w-8 h-8 flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: colorHex,
                            boxShadow: [
                              '0 -1px 0 var(--y2k-navy)',
                              '0 1px 0 var(--y2k-navy)',
                              '-1px 0 0 var(--y2k-navy)',
                              '1px 0 0 var(--y2k-navy)',
                            ].join(', '),
                          }}
                        >
                          <span
                            className="font-pixel-arcade"
                            style={{
                              fontSize: 12,
                              color: 'var(--bead-ink)',
                              textShadow: '0 0 2px var(--bead-paper-bg)',
                              letterSpacing: 0,
                            }}
                          >
                            {code}
                          </span>
                        </div>
                        <span className="font-pixel-cn text-ink-warm truncate" style={{ fontSize: 11 }}>
                          {code}
                        </span>
                      </div>
                      <span className="font-pixel-arcade text-y2k-navy shrink-0" style={{ fontSize: 13, letterSpacing: '0.05em' }}>
                        ×{count}
                      </span>
                    </div>
                  );
                })}
            </div>

            {/* 操作按钮 — 主 CTA arcade-pill + 副下载 chrome */}
            <div className="space-y-3 mt-5 pt-4" style={{ borderTop: '2px dashed var(--y2k-navy)' }}>
              <button
                onClick={onStartDIY}
                className="w-full arcade-pill font-pixel-cn text-paper-bg cursor-pointer"
                style={{
                  backgroundColor: 'var(--y2k-navy)',
                  fontSize: 14,
                  letterSpacing: '0.1em',
                }}
              >
                <span>开始拼豆 DIY</span>
                <PixelArrow size={14} color="var(--bead-paper-bg)" />
              </button>

              <button
                onClick={downloadPattern}
                className="w-full inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-3 bg-paper-soft text-ink-warm font-pixel-cn transition-transform hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px]"
                style={{
                  fontSize: 13,
                  letterSpacing: '0.1em',
                  boxShadow: [
                    '0 -2px 0 var(--y2k-navy)',
                    '0 2px 0 var(--y2k-navy)',
                    '-2px 0 0 var(--y2k-navy)',
                    '2px 0 0 var(--y2k-navy)',
                    '4px 4px 0 var(--y2k-coral)',
                  ].join(', '),
                }}
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                下载图纸
              </button>
            </div>

            {/* 提示 ribbon */}
            <div
              className="mt-4 p-3 flex items-start gap-2 bg-paper-soft"
              style={{
                boxShadow: [
                  '0 -1px 0 var(--y2k-navy)',
                  '0 1px 0 var(--y2k-navy)',
                  '-1px 0 0 var(--y2k-navy)',
                  '1px 0 0 var(--y2k-navy)',
                ].join(', '),
              }}
            >
              <Info className="w-4 h-4 text-y2k-coral shrink-0 mt-0.5" aria-hidden="true" />
              <p className="font-pixel-cn text-ink-warm leading-relaxed" style={{ fontSize: 11, letterSpacing: '0.03em' }}>
                {typeof window !== 'undefined' && 'ontouchstart' in window
                  ? '轻触格子查看色号'
                  : '鼠标悬停或点击格子查看色号'}
              </p>
            </div>
          </div>
          <CornerPearls />
        </div>
      </div>
    </div>
  );
}