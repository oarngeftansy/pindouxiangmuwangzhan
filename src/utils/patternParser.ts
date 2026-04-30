import type { BeadGrid } from '../types';
import { beadColors } from '../data/beadColors';
import { findClosestColor, rgbToHex, hexToRgb } from './colorMatching';

export interface ParseDebugInfo {
  detectedBounds: { top: number; left: number; bottom: number; right: number };
  cropWidth: number;
  cropHeight: number;
  cellSize: { w: number; h: number };
  colorCount: number;
  beadCount: number;
  bgColorHex: string | null;
  bgColorCount: number;
}

// 计算一行像素的"颜色变化频率"
function rowVariance(imageData: Uint8ClampedArray, y: number, width: number): number {
  let total = 0;
  for (let x = 1; x < width; x++) {
    const i1 = (y * width + (x - 1)) * 4;
    const i2 = (y * width + x) * 4;
    const dr = imageData[i1] - imageData[i2];
    const dg = imageData[i1 + 1] - imageData[i2 + 1];
    const db = imageData[i1 + 2] - imageData[i2 + 2];
    total += Math.sqrt(dr * dr + dg * dg + db * db);
  }
  return total / (width - 1);
}

// 检测网格边界
function detectGridBounds(
  imageData: Uint8ClampedArray,
  width: number,
  height: number
): { top: number; left: number; bottom: number; right: number } {
  const rowVars: number[] = [];
  for (let y = 0; y < height; y++) {
    rowVars.push(rowVariance(imageData, y, width));
  }

  const avgVar = rowVars.reduce((a, b) => a + b, 0) / rowVars.length;
  const threshold = avgVar * 1.5;

  // 从底部向上找图例分界线
  let gridBottom = Math.floor(height * 0.95);
  let inLegend = false;
  for (let y = height - 1; y >= 0; y--) {
    if (rowVars[y] > threshold) {
      inLegend = true;
    } else if (inLegend) {
      gridBottom = y;
      break;
    }
  }

  // 取左上角像素作为背景色参考
  const bgR = imageData[0], bgG = imageData[1], bgB = imageData[2];

  const isDiff = (i: number) => {
    const dr = imageData[i] - bgR;
    const dg = imageData[i + 1] - bgG;
    const db = imageData[i + 2] - bgB;
    return Math.sqrt(dr * dr + dg * dg + db * db) > 30;
  };

  // 从顶部向下找第一个有内容的行
  let gridTop = 0;
  for (let y = 0; y < gridBottom; y++) {
    let hasContent = false;
    for (let x = Math.floor(width * 0.05); x < Math.floor(width * 0.95); x += 3) {
      if (isDiff((y * width + x) * 4)) { hasContent = true; break; }
    }
    if (hasContent) { gridTop = y; break; }
  }

  // 从左侧向右找第一个有内容的列
  let gridLeft = 0;
  for (let x = 0; x < Math.floor(width * 0.5); x++) {
    let hasContent = false;
    for (let y = gridTop; y < gridBottom; y += 3) {
      if (isDiff((y * width + x) * 4)) { hasContent = true; break; }
    }
    if (hasContent) { gridLeft = x; break; }
  }

  // 从右侧向左找最后一个有内容的列
  let gridRight = Math.floor(width * 0.97);
  for (let x = width - 1; x > Math.floor(width * 0.5); x--) {
    let hasContent = false;
    for (let y = gridTop; y < gridBottom; y += 3) {
      if (isDiff((y * width + x) * 4)) { hasContent = true; break; }
    }
    if (hasContent) { gridRight = x; break; }
  }

  return { top: gridTop, left: gridLeft, bottom: gridBottom, right: gridRight };
}

// 采样单元格颜色（取中心 40% 区域均值，避免网格线干扰）
function sampleCellColor(
  imageData: Uint8ClampedArray,
  cx: number,
  cy: number,
  cellW: number,
  cellH: number,
  width: number,
  height: number
): [number, number, number] {
  const sampleW = Math.max(1, Math.floor(cellW * 0.4));
  const sampleH = Math.max(1, Math.floor(cellH * 0.4));
  const x0 = Math.max(0, Math.floor(cx - sampleW / 2));
  const y0 = Math.max(0, Math.floor(cy - sampleH / 2));
  const x1 = Math.min(width - 1, Math.floor(cx + sampleW / 2));
  const y1 = Math.min(height - 1, Math.floor(cy + sampleH / 2));

  let totalR = 0, totalG = 0, totalB = 0, count = 0;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = (y * width + x) * 4;
      totalR += imageData[i];
      totalG += imageData[i + 1];
      totalB += imageData[i + 2];
      count++;
    }
  }

  if (count === 0) return [255, 255, 255];
  return [Math.round(totalR / count), Math.round(totalG / count), Math.round(totalB / count)];
}

export async function parseMardPatternImage(
  imageSrc: string,
  gridWidth: number,
  gridHeight: number,
  manualBounds?: Partial<{ top: number; left: number; bottom: number; right: number }>
): Promise<{ grid: BeadGrid; debugInfo: ParseDebugInfo }> {
  const img = new Image();
  img.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;

  const autoBounds = detectGridBounds(data, width, height);
  const bounds = {
    top: manualBounds?.top ?? autoBounds.top,
    left: manualBounds?.left ?? autoBounds.left,
    bottom: manualBounds?.bottom ?? autoBounds.bottom,
    right: manualBounds?.right ?? autoBounds.right,
  };

  const cropWidth = bounds.right - bounds.left;
  const cropHeight = bounds.bottom - bounds.top;
  const cellW = cropWidth / gridWidth;
  const cellH = cropHeight / gridHeight;

  // ── 第一遍：采样原始 RGB，跳过接近纯白的格子（格纸背景）──────────────
  // Mard 格纸底色接近 #FFFFFF，空格采样值通常 RGB 均 > 230
  const RAW_WHITE_THRESHOLD = 55; // RGB 距离纯白 < 55 → 视为空格（Mard JPG 格纸非纯白）

  const rawColors: (string | null)[] = []; // 逐格原始匹配色（null = 白色跳过）

  for (let row = 0; row < gridHeight; row++) {
    for (let col = 0; col < gridWidth; col++) {
      const cx = bounds.left + (col + 0.5) * cellW;
      const cy = bounds.top + (row + 0.5) * cellH;
      const [r, g, b] = sampleCellColor(data, cx, cy, cellW, cellH, width, height);

      // 距纯白的欧氏距离
      const distToWhite = Math.sqrt((r - 255) ** 2 + (g - 255) ** 2 + (b - 255) ** 2);
      if (distToWhite < RAW_WHITE_THRESHOLD) {
        rawColors.push(null);
      } else {
        rawColors.push(findClosestColor(rgbToHex(r, g, b), beadColors));
      }
    }
  }

  // ── 第二遍：频率背景过滤 ───────────────────────────────────────────────
  // 把所有"极浅色"（R,G,B 均 > 185）的格子合并统计
  // Mard 格纸底色经 JPG 压缩后会散落到 2-3 个相邻浅灰豆，需整体判断
  const totalCells = gridWidth * gridHeight;
  const lightColorFreq = new Map<string, number>();
  let lightTotal = 0;

  for (const c of rawColors) {
    if (c) {
      const [r, g, b] = hexToRgb(c);
      if (r > 185 && g > 185 && b > 185) {
        lightColorFreq.set(c, (lightColorFreq.get(c) || 0) + 1);
        lightTotal++;
      }
    }
  }

  // 浅色系合计 > 15% → 整组视为背景
  const bgColors = new Set<string>();
  let bgColorHex: string | null = null;
  let bgColorCount = 0;

  if (lightTotal / totalCells > 0.15) {
    for (const [hex, count] of lightColorFreq) {
      bgColors.add(hex);
      bgColorCount += count;
    }
    // 取频率最高的那个作为代表色（用于 UI 展示）
    bgColorHex = [...lightColorFreq.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  // ── 构建最终网格 ──────────────────────────────────────────────────────
  const grid: BeadGrid = [];
  const colorSet = new Set<string>();
  let beadCount = 0;
  let idx = 0;

  for (let row = 0; row < gridHeight; row++) {
    const gridRow: (string | null)[] = [];
    for (let col = 0; col < gridWidth; col++) {
      const c = rawColors[idx++];
      const isBackground = c !== null && bgColors.has(c);
      const finalColor = (c === null || isBackground) ? null : c;
      gridRow.push(finalColor);
      if (finalColor) {
        colorSet.add(finalColor);
        beadCount++;
      }
    }
    grid.push(gridRow);
  }

  return {
    grid,
    debugInfo: {
      detectedBounds: bounds,
      cropWidth,
      cropHeight,
      cellSize: { w: cellW, h: cellH },
      colorCount: colorSet.size,
      beadCount,
      bgColorHex,
      bgColorCount,
    },
  };
}
