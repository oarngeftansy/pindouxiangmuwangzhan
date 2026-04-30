// 颜色简化工具 - 减少图片中的杂色
import { rgbToLab, deltaE2000, rgbToHex, hexToRgb, findClosestColor } from './colorMatching';

// K-means 颜色聚类 - 减少图片中的颜色数量
export function simplifyImageColors(
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  targetColors: number = 16,
  iterations: number = 10
): Uint8ClampedArray {
  const pixels: [number, number, number][] = [];
  
  // 收集所有像素
  for (let i = 0; i < imageData.length; i += 4) {
    const a = imageData[i + 3];
    if (a > 128) {
      pixels.push([imageData[i], imageData[i + 1], imageData[i + 2]]);
    }
  }

  if (pixels.length === 0) return imageData;

  // 初始化聚类中心（从像素中随机选择）
  const centers: [number, number, number][] = [];
  for (let i = 0; i < targetColors; i++) {
    const randomIndex = Math.floor(Math.random() * pixels.length);
    centers.push([...pixels[randomIndex]]);
  }

  // K-means 迭代
  for (let iter = 0; iter < iterations; iter++) {
    // 分配像素到最近的聚类中心
    const clusters: [number, number, number][][] = Array(targetColors).fill(null).map(() => []);
    
    pixels.forEach(pixel => {
      let minDist = Infinity;
      let closestCenter = 0;
      
      centers.forEach((center, idx) => {
        const [L1, a1, b1] = rgbToLab(pixel[0], pixel[1], pixel[2]);
        const [L2, a2, b2] = rgbToLab(center[0], center[1], center[2]);
        const dist = deltaE2000(L1, a1, b1, L2, a2, b2);
        
        if (dist < minDist) {
          minDist = dist;
          closestCenter = idx;
        }
      });
      
      clusters[closestCenter].push(pixel);
    });

    // 更新聚类中心
    clusters.forEach((cluster, idx) => {
      if (cluster.length > 0) {
        const avgR = cluster.reduce((sum, p) => sum + p[0], 0) / cluster.length;
        const avgG = cluster.reduce((sum, p) => sum + p[1], 0) / cluster.length;
        const avgB = cluster.reduce((sum, p) => sum + p[2], 0) / cluster.length;
        centers[idx] = [Math.round(avgR), Math.round(avgG), Math.round(avgB)];
      }
    });
  }

  // 应用简化的颜色到图像
  const result = new Uint8ClampedArray(imageData);
  for (let i = 0; i < result.length; i += 4) {
    const a = result[i + 3];
    if (a > 128) {
      const r = result[i];
      const g = result[i + 1];
      const b = result[i + 2];
      
      // 找到最近的聚类中心
      let minDist = Infinity;
      let closestCenter = centers[0];
      
      centers.forEach(center => {
        const [L1, a1, b1] = rgbToLab(r, g, b);
        const [L2, a2, b2] = rgbToLab(center[0], center[1], center[2]);
        const dist = deltaE2000(L1, a1, b1, L2, a2, b2);
        
        if (dist < minDist) {
          minDist = dist;
          closestCenter = center;
        }
      });
      
      result[i] = closestCenter[0];
      result[i + 1] = closestCenter[1];
      result[i + 2] = closestCenter[2];
    }
  }

  return result;
}

// 中值滤波 - 去除噪点
export function medianFilter(
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number = 1
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(imageData);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const neighbors: { r: number[], g: number[], b: number[] } = { r: [], g: [], b: [] };
      
      // 收集邻居像素
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const i = (ny * width + nx) * 4;
            neighbors.r.push(imageData[i]);
            neighbors.g.push(imageData[i + 1]);
            neighbors.b.push(imageData[i + 2]);
          }
        }
      }
      
      // 取中值
      neighbors.r.sort((a, b) => a - b);
      neighbors.g.sort((a, b) => a - b);
      neighbors.b.sort((a, b) => a - b);
      
      const mid = Math.floor(neighbors.r.length / 2);
      const i = (y * width + x) * 4;
      result[i] = neighbors.r[mid];
      result[i + 1] = neighbors.g[mid];
      result[i + 2] = neighbors.b[mid];
    }
  }
  
  return result;
}

// 后处理：合并相似颜色
export function mergeSmallColorRegions(
  grid: (string | null)[][],
  beadColors: Array<{ hex: string; [key: string]: any }>,
  minRegionSize: number = 3
): (string | null)[][] {
  const height = grid.length;
  const width = grid[0].length;
  const result = grid.map(row => [...row]);
  
  // 统计每种颜色的数量
  const colorCounts = new Map<string, number>();
  grid.forEach(row => {
    row.forEach(color => {
      if (color) {
        colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
      }
    });
  });
  
  // 找出小区域的颜色
  const smallColors = Array.from(colorCounts.entries())
    .filter(([_, count]) => count < minRegionSize)
    .map(([color, _]) => color);
  
  // 替换小区域颜色为邻近的大区域颜色
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = result[y][x];
      if (color && smallColors.includes(color)) {
        // 查找周围最常见的颜色（非小区域颜色）
        const neighbors = new Map<string, number>();
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const neighborColor = result[ny][nx];
              if (neighborColor && !smallColors.includes(neighborColor)) {
                neighbors.set(neighborColor, (neighbors.get(neighborColor) || 0) + 1);
              }
            }
          }
        }
        
        if (neighbors.size > 0) {
          // 使用最常见的邻居颜色
          const mostCommon = Array.from(neighbors.entries())
            .sort((a, b) => b[1] - a[1])[0][0];
          result[y][x] = mostCommon;
        }
      }
    }
  }
  
  return result;
}

// 减少颜色种类 - 强制限制最多使用N种颜色
export function limitColorPalette(
  grid: (string | null)[][],
  beadColors: Array<{ hex: string; [key: string]: any }>,
  maxColors: number = 12
): (string | null)[][] {
  const height = grid.length;
  const width = grid[0].length;
  
  // 统计颜色使用频率
  const colorCounts = new Map<string, number>();
  grid.forEach(row => {
    row.forEach(color => {
      if (color) {
        colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
      }
    });
  });
  
  // 如果颜色数量已经在限制内，直接返回
  if (colorCounts.size <= maxColors) {
    return grid;
  }
  
  // 选择使用最多的 maxColors 种颜色
  const topColors = Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxColors)
    .map(([color, _]) => color);
  
  // 创建受限调色板
  const limitedPalette = beadColors.filter(bc => topColors.includes(bc.hex));
  
  // 重新映射所有颜色
  const result = grid.map(row => [...row]);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = result[y][x];
      if (color && !topColors.includes(color)) {
        // 找到最接近的top颜色
        result[y][x] = findClosestColor(color, limitedPalette, true);
      }
    }
  }
  
  return result;
}
