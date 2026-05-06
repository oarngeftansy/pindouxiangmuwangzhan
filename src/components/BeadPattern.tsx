import {
  ChevronDown,
  ChevronUp,
  Download,
  Info,
  Play,
  RefreshCw,
  Settings2,
} from "lucide-react";
import { BeadGrid, BeadColor, ColorSystem } from "../App";
import { useState, useMemo } from "react";
import { 
  rgbToHex, 
  findClosestColor,
  getAveragedColor
} from "../utils/colorMatching";

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
    <div className="max-w-7xl mx-auto">
      {/* 图纸设置面板 */}
      <div className="bg-paper-soft border border-edge-sand rounded-card p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-ink-warm">
            <Settings2 className="w-5 h-5 text-moss" />
            图纸设置
          </h3>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="inline-flex items-center justify-center gap-1 min-h-[44px] min-w-[44px] px-3 rounded-control text-sm font-semibold text-moss hover:bg-paper-deep transition-colors"
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
          <div className="space-y-6 pt-4 border-t border-edge-sand">
            {/* 色号系统 */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-ink-warm">
                色号系统
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {[
                  {
                    value: "mard" as ColorSystem,
                    label: "MARD",
                  },
                  {
                    value: "coco" as ColorSystem,
                    label: "COCO",
                  },
                  {
                    value: "manman" as ColorSystem,
                    label: "漫漫",
                  },
                  {
                    value: "panpan" as ColorSystem,
                    label: "盼盼",
                  },
                  {
                    value: "mxw" as ColorSystem,
                    label: "咪小窝",
                  },
                ].map((system) => (
                  <button
                    key={system.value}
                    onClick={() => setColorSystem(system.value)}
                    className={`px-3 py-2.5 rounded-control text-sm font-semibold transition-colors ${
                      colorSystem === system.value
                        ? "bg-moss text-paper-bg border border-moss"
                        : "bg-paper-bg text-ink-warm border border-edge-sand hover:bg-paper-deep"
                    }`}
                  >
                    {system.label}
                  </button>
                ))}
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

      <div className="bg-paper-soft border border-edge-sand rounded-card p-4 sm:p-8">
        <div className="flex flex-col md:flex-row gap-4 sm:gap-8">
          {/* 图纸预览 */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-2xl font-semibold text-ink-warm" style={{ fontFamily: 'var(--font-headline)' }}>拼豆图纸</h2>
              <div className="text-sm text-ink-soft" style={{ fontFamily: 'var(--font-num)' }}>
                {beadGrid[0].length} × {beadGrid.length} · 共需{" "}
                {Array.from(colorCount.values()).reduce((a, b) => a + b, 0)} 颗
              </div>
            </div>

            <div className="bg-paper-deep rounded-surface p-3 sm:p-6 overflow-auto">
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
                            border: `0.15px solid rgba(58, 52, 42, ${gridOpacity * 0.5})`,
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
                              <div
                                className="absolute inset-0 rounded-full m-1 pointer-events-none"
                                style={{
                                  backgroundColor: color,
                                  // 暖色调 inset 模拟塑料反光
                                  boxShadow:
                                    "inset 0 1px 3px rgba(58, 52, 42, 0.2)",
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

          {/* 颜色统计和操作 */}
          <div className="md:w-64 lg:w-80">
            <h3 className="text-xl font-semibold mb-4 text-ink-warm" style={{ fontFamily: 'var(--font-headline)' }}>
              所需材料清单
            </h3>
            <div className="bg-paper-bg border border-edge-sand rounded-surface p-4 mb-6">
              <div className="text-sm text-ink-soft mb-3 flex justify-between" style={{ fontFamily: 'var(--font-num)' }}>
                <span>
                  总计{" "}
                  {Array.from(colorCount.values()).reduce(
                    (a, b) => a + b,
                    0,
                  )}{" "}
                  颗
                </span>
                <span>{Array.from(colorCount.entries()).filter(([_, count]) => count >= minColorCount).length} 种色</span>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Array.from(colorCount.entries())
                  .filter(([_, count]) => count >= minColorCount)
                  .sort((a, b) => b[1] - a[1])
                  .map(([colorHex, count]) => {
                    const code = getColorCode(colorHex);
                    return (
                      <div
                        key={colorHex}
                        className="flex items-center justify-between bg-paper-soft rounded-control p-3 border border-edge-sand"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-10 h-10 rounded-full border border-edge-sand flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: colorHex,
                            }}
                          >
                            <span
                              className="text-xs font-bold"
                              style={{
                                color: "var(--bead-ink)",
                                fontFamily: "var(--font-num)",
                                textShadow:
                                  "0 0 2px var(--bead-paper-bg)",
                              }}
                            >
                              {code}
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-ink-warm truncate" style={{ fontFamily: 'var(--font-num)' }}>
                            {code}
                          </div>
                        </div>
                        <span className="text-sm font-bold text-ink-warm shrink-0" style={{ fontFamily: 'var(--font-num)' }}>
                          {count}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="space-y-3">
              <button
                onClick={onStartDIY}
                className="w-full inline-flex items-center justify-center gap-2 min-h-[52px] px-6 py-4 bg-terracotta text-paper-bg rounded-control text-base font-semibold hover:bg-terracotta-deep transition-colors focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
                style={{ boxShadow: 'var(--shadow-lift-bead)' }}
              >
                <Play className="w-5 h-5" aria-hidden="true" />
                开始拼豆DIY
              </button>

              <button
                onClick={downloadPattern}
                className="w-full inline-flex items-center justify-center gap-2 min-h-[52px] px-6 py-4 bg-paper-bg border border-edge-sand text-ink-warm rounded-control text-base font-semibold hover:bg-paper-deep transition-colors focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
              >
                <Download className="w-5 h-5" aria-hidden="true" />
                下载图纸
              </button>
            </div>

            <div className="mt-6 p-4 bg-honey-glow/40 rounded-surface border border-honey/40 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-ink-warm shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-ink-warm leading-relaxed">
                {typeof window !== 'undefined' && 'ontouchstart' in window
                  ? '轻触任意格子可查看色号，再点一下取消。'
                  : '鼠标悬停或点击任意格子可查看色号。'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}