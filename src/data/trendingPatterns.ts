import type { BeadGrid } from '../types';

export interface TrendingPattern {
  id: string;
  name: string;
  gridWidth: number;
  gridHeight: number;
  beadCount: number;
  colorCount: number;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  grid: BeadGrid;
  previewImage?: string; // data URL 成品预览图
}

const STORAGE_KEY = 'trending_patterns_v1';

// 从 localStorage 读取所有已入库的图纸
export function getTrendingPatterns(): TrendingPattern[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// 入库一个图纸
export function saveTrendingPattern(pattern: TrendingPattern): void {
  const patterns = getTrendingPatterns();
  // 如果 id 重复则覆盖
  const idx = patterns.findIndex(p => p.id === pattern.id);
  if (idx >= 0) {
    patterns[idx] = pattern;
  } else {
    patterns.push(pattern);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
}

// 删除一个图纸
export function deleteTrendingPattern(id: string): void {
  const patterns = getTrendingPatterns().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
}
