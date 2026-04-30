// 高级颜色处理 - 精准的颜色区域识别和优化

import { findClosestColor, hexToRgb, rgbToHex, rgbToLab, deltaE2000 } from './colorMatching';

// K-means 聚类算法 - 智能减少颜色数量同时保持精准度
export function kMeansColorQuantization(
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  k: number = 16,
  maxIterations: number = 10
): Map<string, string> {
  // 收集所有唯一颜色
  const colorMap = new Map<string, number>(); // hex -> count
  
  for (let i = 0; i < imageData.length; i += 4) {
    const r = imageData[i];
    const g = imageData[i + 1];
    const b = imageData[i + 2];
    const a = imageData[i + 3];
    
    if (a >= 128) {
      const hex = rgbToHex(r, g, b);
      colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
    }
  }
  
  const uniqueColors = Array.from(colorMap.keys());
  
  // 如果唯一颜色已经很少，直接返回
  if (uniqueColors.length <= k) {
    const mapping = new Map<string, string>();
    uniqueColors.forEach(c => mapping.set(c, c));
    return mapping;
  }
  
  // 初始化聚类中心 - 使用k-means++算法
  const centers: string[] = [];
  centers.push(uniqueColors[Math.floor(Math.random() * uniqueColors.length)]);
  
  while (centers.length < k) {
    const distances: number[] = [];
    let totalDist = 0;
    
    for (const color of uniqueColors) {
      const [L1, a1, b1] = rgbToLab(...hexToRgb(color));
      let minDist = Infinity;
      
      for (const center of centers) {
        const [L2, a2, b2] = rgbToLab(...hexToRgb(center));
        const dist = deltaE2000(L1, a1, b1, L2, a2, b2);
        minDist = Math.min(minDist, dist);
      }
      
      distances.push(minDist);
      totalDist += minDist;
    }
    
    // 概率选择下一个中心
    let rand = Math.random() * totalDist;
    for (let i = 0; i < uniqueColors.length; i++) {
      rand -= distances[i];
      if (rand <= 0) {
        centers.push(uniqueColors[i]);
        break;
      }
    }
  }
  
  // K-means迭代
  for (let iter = 0; iter < maxIterations; iter++) {
    // 分配每个颜色到最近的聚类中心
    const clusters: string[][] = Array.from({ length: k }, () => []);
    
    for (const color of uniqueColors) {
      const [L1, a1, b1] = rgbToLab(...hexToRgb(color));
      let minDist = Infinity;
      let closestIdx = 0;
      
      for (let i = 0; i < centers.length; i++) {
        const [L2, a2, b2] = rgbToLab(...hexToRgb(centers[i]));
        const dist = deltaE2000(L1, a1, b1, L2, a2, b2);
        if (dist < minDist) {
          minDist = dist;
          closestIdx = i;
        }
      }
      
      clusters[closestIdx].push(color);
    }
    
    // 更新聚类中心（取加权平均）
    let changed = false;
    for (let i = 0; i < k; i++) {
      if (clusters[i].length === 0) continue;
      
      let totalR = 0, totalG = 0, totalB = 0, totalWeight = 0;
      
      for (const color of clusters[i]) {
        const [r, g, b] = hexToRgb(color);
        const weight = colorMap.get(color) || 1;
        totalR += r * weight;
        totalG += g * weight;
        totalB += b * weight;
        totalWeight += weight;
      }
      
      const newCenter = rgbToHex(
        Math.round(totalR / totalWeight),
        Math.round(totalG / totalWeight),
        Math.round(totalB / totalWeight)
      );
      
      if (newCenter !== centers[i]) {
        centers[i] = newCenter;
        changed = true;
      }
    }
    
    if (!changed) break;
  }
  
  // 创建颜色映射
  const mapping = new Map<string, string>();
  for (const color of uniqueColors) {
    const [L1, a1, b1] = rgbToLab(...hexToRgb(color));
    let minDist = Infinity;
    let closestCenter = centers[0];
    
    for (const center of centers) {
      const [L2, a2, b2] = rgbToLab(...hexToRgb(center));
      const dist = deltaE2000(L1, a1, b1, L2, a2, b2);
      if (dist < minDist) {
        minDist = dist;
        closestCenter = center;
      }
    }
    
    mapping.set(color, closestCenter);
  }
  
  return mapping;
}

// 连通区域分析 - 识别颜色区域边界
export function findColorRegions(
  grid: (string | null)[][],
  minSize: number = 3
): Map<string, number> {
  const height = grid.length;
  const width = grid[0].length;
  const visited = Array.from({ length: height }, () => Array(width).fill(false));
  const regionSizes = new Map<string, number>();
  
  const floodFill = (startX: number, startY: number, targetColor: string): number => {
    const stack: [number, number][] = [[startX, startY]];
    let size = 0;
    
    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      if (visited[y][x]) continue;
      if (grid[y][x] !== targetColor) continue;
      
      visited[y][x] = true;
      size++;
      
      // 检查4邻域
      stack.push([x + 1, y]);
      stack.push([x - 1, y]);
      stack.push([x, y + 1]);
      stack.push([x, y - 1]);
    }
    
    return size;
  };
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = grid[y][x];
      if (color && !visited[y][x]) {
        const regionSize = floodFill(x, y, color);
        if (regionSize >= minSize) {
          regionSizes.set(color, (regionSizes.get(color) || 0) + regionSize);
        }
      }
    }
  }
  
  return regionSizes;
}

// 智能颜色平滑 - 基于邻域一致性
export function smoothColorRegions(
  grid: (string | null)[][],
  iterations: number = 1
): (string | null)[][] {
  const height = grid.length;
  const width = grid[0].length;
  let result = grid.map(row => [...row]);
  
  for (let iter = 0; iter < iterations; iter++) {
    const newGrid = result.map(row => [...row]);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const currentColor = result[y][x];
        if (!currentColor) continue;
        
        // 统计8邻域的颜色
        const neighborColors = new Map<string, number>();
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const neighborColor = result[ny][nx];
              if (neighborColor) {
                neighborColors.set(neighborColor, (neighborColors.get(neighborColor) || 0) + 1);
              }
            }
          }
        }
        
        // 如果当前像素与大多数邻居不同，考虑替换
        let maxCount = 0;
        let dominantColor = currentColor;
        
        neighborColors.forEach((count, color) => {
          if (count > maxCount) {
            maxCount = count;
            dominantColor = color;
          }
        });
        
        // 如果超过5个邻居是同一颜色，则替换
        if (maxCount >= 5 && dominantColor !== currentColor) {
          newGrid[y][x] = dominantColor;
        }
      }
    }
    
    result = newGrid;
  }
  
  return result;
}

// 边缘保持平滑 - 保留重要边界，平滑噪点
export function edgePreservingSmooth(
  grid: (string | null)[][],
  beadColors: Array<{ hex: string; [key: string]: any }>
): (string | null)[][] {
  const height = grid.length;
  const width = grid[0].length;
  const result = grid.map(row => [...row]);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const currentColor = grid[y][x];
      if (!currentColor) continue;
      
      // 检查是否是孤立像素（4邻域都不同）
      const neighbors = [
        grid[y - 1][x], // 上
        grid[y + 1][x], // 下
        grid[y][x - 1], // 左
        grid[y][x + 1]  // 右
      ];
      
      const sameCount = neighbors.filter(n => n === currentColor).length;
      
      // 如果是孤立像素，替换为最接近的邻居颜色
      if (sameCount === 0) {
        const validNeighbors = neighbors.filter(n => n !== null) as string[];
        if (validNeighbors.length > 0) {
          // 选择与当前颜色最接近的邻居
          const [L1, a1, b1] = rgbToLab(...hexToRgb(currentColor));
          let minDist = Infinity;
          let bestColor = validNeighbors[0];
          
          for (const neighbor of validNeighbors) {
            const [L2, a2, b2] = rgbToLab(...hexToRgb(neighbor));
            const dist = deltaE2000(L1, a1, b1, L2, a2, b2);
            if (dist < minDist) {
              minDist = dist;
              bestColor = neighbor;
            }
          }
          
          result[y][x] = bestColor;
        }
      }
    }
  }
  
  return result;
}
