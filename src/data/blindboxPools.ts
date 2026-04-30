import type { BeadGrid } from "../types";

export interface BlindBoxPattern {
  id: string;
  name: string;
  description: string;
  grid: BeadGrid;
  previewUrl?: string;
}

const C = {
  R: "#EF4444",
  O: "#F97316",
  Y: "#FACC15",
  G: "#22C55E",
  B: "#3B82F6",
  P: "#A855F7",
  K: "#111827",
  W: "#FFFFFF",
} as const;

function emptyGrid(size: number): BeadGrid {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null),
  );
}

function paintSymmetric(
  grid: BeadGrid,
  rows: Array<{ y: number; xStart: number; xEnd: number; color: string }>,
) {
  const w = grid[0].length;
  rows.forEach(({ y, xStart, xEnd, color }) => {
    for (let x = xStart; x <= xEnd; x++) {
      grid[y][x] = color;
      grid[y][w - 1 - x] = color;
    }
  });
}

function makeHeart(): BeadGrid {
  const grid = emptyGrid(24);
  paintSymmetric(grid, [
    { y: 4, xStart: 5, xEnd: 7, color: C.R },
    { y: 5, xStart: 4, xEnd: 8, color: C.R },
    { y: 6, xStart: 3, xEnd: 9, color: C.R },
    { y: 7, xStart: 3, xEnd: 9, color: C.R },
    { y: 8, xStart: 4, xEnd: 8, color: C.R },
    { y: 9, xStart: 5, xEnd: 7, color: C.R },
    { y: 10, xStart: 6, xEnd: 6, color: C.R },
  ]);
  return grid;
}

function makeStar(): BeadGrid {
  const grid = emptyGrid(24);
  for (let i = 6; i <= 17; i++) {
    grid[8][i] = C.Y;
    grid[15][i] = C.Y;
    grid[i][11] = C.Y;
    grid[i][12] = C.Y;
  }
  for (let i = 0; i < 5; i++) {
    grid[6 + i][6 + i] = C.Y;
    grid[6 + i][17 - i] = C.Y;
    grid[17 - i][6 + i] = C.Y;
    grid[17 - i][17 - i] = C.Y;
  }
  return grid;
}

function makeRainbow(): BeadGrid {
  const grid = emptyGrid(24);
  const bands = [C.R, C.O, C.Y, C.G, C.B, C.P];
  bands.forEach((color, i) => {
    const y = 6 + i * 2;
    for (let x = 4 + i; x <= 19 - i; x++) {
      grid[y][x] = color;
      grid[y + 1][x] = color;
    }
  });
  return grid;
}

function makeSmile(): BeadGrid {
  const grid = emptyGrid(24);
  for (let y = 5; y <= 18; y++) {
    for (let x = 5; x <= 18; x++) {
      const dx = x - 11.5;
      const dy = y - 11.5;
      if (dx * dx + dy * dy <= 46) grid[y][x] = C.Y;
    }
  }
  grid[9][9] = C.K;
  grid[9][14] = C.K;
  grid[13][8] = C.K;
  grid[14][9] = C.K;
  grid[15][10] = C.K;
  grid[15][11] = C.K;
  grid[15][12] = C.K;
  grid[14][13] = C.K;
  grid[13][14] = C.K;
  return grid;
}

const defaultPool: BlindBoxPattern[] = [];

const placeholderA: BlindBoxPattern = {
  id: "placeholder-a",
  name: "占位盲盒 A",
  description: "开发者上传占位图 1",
  grid: makeHeart(),
  previewUrl: "/blindbox-placeholders/placeholder-1.svg",
};

const placeholderB: BlindBoxPattern = {
  id: "placeholder-b",
  name: "占位盲盒 B",
  description: "开发者上传占位图 2",
  grid: makeStar(),
  previewUrl: "/blindbox-placeholders/placeholder-2.svg",
};

// 开发者可在后台发布每日盲盒；这里是本地 fallback。
// key 格式: YYYY-MM-DD
const dailyOverrides: Record<string, BlindBoxPattern[]> = {
  "2026-04-16": [placeholderA, placeholderB, defaultPool[2]],
  "2026-04-17": [placeholderB, defaultPool[3], defaultPool[0]],
};

export function getLocalBlindBoxPool(dateStr: string): BlindBoxPattern[] {
  // 优先用自定义盲盒，没有则用 dailyOverrides 或 defaultPool
  const custom = getCustomBlindBoxPatterns();
  if (custom.length > 0) {
    // 把自定义盲盒混入池子
    const base = dailyOverrides[dateStr] ?? defaultPool;
    return [...custom, ...base];
  }
  return dailyOverrides[dateStr] ?? defaultPool;
}

// ---- 自定义盲盒 localStorage 管理 ----
const BLINDBOX_STORAGE_KEY = 'custom_blindbox_patterns_v1';

export function getCustomBlindBoxPatterns(): BlindBoxPattern[] {
  try {
    const data = localStorage.getItem(BLINDBOX_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveCustomBlindBoxPattern(pattern: BlindBoxPattern): void {
  const patterns = getCustomBlindBoxPatterns();
  const idx = patterns.findIndex(p => p.id === pattern.id);
  if (idx >= 0) {
    patterns[idx] = pattern;
  } else {
    patterns.push(pattern);
  }
  localStorage.setItem(BLINDBOX_STORAGE_KEY, JSON.stringify(patterns));
}

export function deleteCustomBlindBoxPattern(id: string): void {
  const patterns = getCustomBlindBoxPatterns().filter(p => p.id !== id);
  localStorage.setItem(BLINDBOX_STORAGE_KEY, JSON.stringify(patterns));
}
