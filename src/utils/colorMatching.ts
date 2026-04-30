// 高精度颜色匹配工具
// 使用 CIEDE2000 (Delta E 2000) 算法 - 最符合人眼感知的颜色差异度量

// RGB to Lab 色彩空间转换
export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  // 第一步：RGB to XYZ
  let rNorm = r / 255;
  let gNorm = g / 255;
  let bNorm = b / 255;

  // Gamma 校正 (sRGB)
  rNorm = rNorm > 0.04045 ? Math.pow((rNorm + 0.055) / 1.055, 2.4) : rNorm / 12.92;
  gNorm = gNorm > 0.04045 ? Math.pow((gNorm + 0.055) / 1.055, 2.4) : gNorm / 12.92;
  bNorm = bNorm > 0.04045 ? Math.pow((bNorm + 0.055) / 1.055, 2.4) : bNorm / 12.92;

  // 转换到 XYZ 色彩空间（使用 D65 标准光源矩阵）
  let x = rNorm * 0.4124564 + gNorm * 0.3575761 + bNorm * 0.1804375;
  let y = rNorm * 0.2126729 + gNorm * 0.7151522 + bNorm * 0.0721750;
  let z = rNorm * 0.0193339 + gNorm * 0.1191920 + bNorm * 0.9503041;

  // 第二步：XYZ to Lab（使用 D65 标准白点）
  x = x / 0.95047;
  y = y / 1.00000;
  z = z / 1.08883;

  // Lab 转换函数
  const f = (t: number) => t > 0.008856 ? Math.pow(t, 1/3) : (7.787 * t + 16/116);
  
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);

  const L = 116 * fy - 16;      // 明度 (0-100)
  const a = 500 * (fx - fy);    // 红绿轴 (-128 to 127)
  const b_lab = 200 * (fy - fz); // 黄蓝轴 (-128 to 127)

  return [L, a, b_lab];
}

// CIEDE2000 (Delta E 2000) - 最精确的颜色差异度量
// 比 Delta E 76 更符合人眼感知，考虑了色相、饱和度、明度的不同权重
export function deltaE2000(
  L1: number, a1: number, b1: number,
  L2: number, a2: number, b2: number
): number {
  // 权重系数
  const kL = 1.0; // 明度权重
  const kC = 1.0; // 彩度权重
  const kH = 1.0; // 色相权重

  // 计算 C' (chroma)
  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const Cab = (C1 + C2) / 2;

  // 计算 G
  const G = 0.5 * (1 - Math.sqrt(Math.pow(Cab, 7) / (Math.pow(Cab, 7) + Math.pow(25, 7))));

  // 计算 a'
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;

  // 计算 C'
  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);

  // 计算 h'
  const h1p = (Math.atan2(b1, a1p) * 180 / Math.PI + 360) % 360;
  const h2p = (Math.atan2(b2, a2p) * 180 / Math.PI + 360) % 360;

  // 计算 ΔL', ΔC', ΔH'
  const deltaLp = L2 - L1;
  const deltaCp = C2p - C1p;
  
  let deltahp;
  if (C1p * C2p === 0) {
    deltahp = 0;
  } else if (Math.abs(h2p - h1p) <= 180) {
    deltahp = h2p - h1p;
  } else if (h2p - h1p > 180) {
    deltahp = h2p - h1p - 360;
  } else {
    deltahp = h2p - h1p + 360;
  }

  const deltaHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(deltahp * Math.PI / 360);

  // 计算平均值
  const Lp = (L1 + L2) / 2;
  const Cp = (C1p + C2p) / 2;
  
  let hp;
  if (C1p * C2p === 0) {
    hp = h1p + h2p;
  } else if (Math.abs(h1p - h2p) <= 180) {
    hp = (h1p + h2p) / 2;
  } else if (h1p + h2p < 360) {
    hp = (h1p + h2p + 360) / 2;
  } else {
    hp = (h1p + h2p - 360) / 2;
  }

  // 计算 T
  const T = 1 - 0.17 * Math.cos((hp - 30) * Math.PI / 180)
            + 0.24 * Math.cos(2 * hp * Math.PI / 180)
            + 0.32 * Math.cos((3 * hp + 6) * Math.PI / 180)
            - 0.20 * Math.cos((4 * hp - 63) * Math.PI / 180);

  // 计算 SL, SC, SH
  const SL = 1 + (0.015 * Math.pow(Lp - 50, 2)) / Math.sqrt(20 + Math.pow(Lp - 50, 2));
  const SC = 1 + 0.045 * Cp;
  const SH = 1 + 0.015 * Cp * T;

  // 计算 RT
  const deltaTheta = 30 * Math.exp(-Math.pow((hp - 275) / 25, 2));
  const RC = 2 * Math.sqrt(Math.pow(Cp, 7) / (Math.pow(Cp, 7) + Math.pow(25, 7)));
  const RT = -RC * Math.sin(2 * deltaTheta * Math.PI / 180);

  // 最终计算 CIEDE2000
  const deltaE = Math.sqrt(
    Math.pow(deltaLp / (kL * SL), 2) +
    Math.pow(deltaCp / (kC * SC), 2) +
    Math.pow(deltaHp / (kH * SH), 2) +
    RT * (deltaCp / (kC * SC)) * (deltaHp / (kH * SH))
  );

  return deltaE;
}

// 简化的 Delta E 76（作为对比）
export function deltaE76(
  L1: number, a1: number, b1: number,
  L2: number, a2: number, b2: number
): number {
  const deltaL = L1 - L2;
  const deltaA = a1 - a2;
  const deltaB = b1 - b2;
  
  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
}

// RGB to Hex
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Hex to RGB
export function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

// 区域采样 - 从周围像素中获取更准确的颜色
export function getAveragedColor(
  imageData: Uint8ClampedArray,
  x: number,
  y: number,
  width: number,
  height: number,
  sampleSize: number = 1
): [number, number, number] {
  let totalR = 0, totalG = 0, totalB = 0;
  let count = 0;

  for (let dy = -sampleSize; dy <= sampleSize; dy++) {
    for (let dx = -sampleSize; dx <= sampleSize; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const i = (ny * width + nx) * 4;
        totalR += imageData[i];
        totalG += imageData[i + 1];
        totalB += imageData[i + 2];
        count++;
      }
    }
  }

  return [
    Math.round(totalR / count),
    Math.round(totalG / count),
    Math.round(totalB / count)
  ];
}

// 颜色匹配 - 使用纯粹的 Delta E 2000，精确匹配
export function findClosestColor(
  targetHex: string,
  colorPalette: Array<{ hex: string; [key: string]: any }>,
  useDeltaE2000: boolean = true
): string {
  const [r1, g1, b1] = hexToRgb(targetHex);
  const [L1, a1, b1_lab] = rgbToLab(r1, g1, b1);

  let minDistance = Infinity;
  let closestColor = colorPalette[0].hex;

  colorPalette.forEach(color => {
    const [r2, g2, b2] = hexToRgb(color.hex);
    const [L2, a2, b2_lab] = rgbToLab(r2, g2, b2);
    
    const distance = useDeltaE2000 
      ? deltaE2000(L1, a1, b1_lab, L2, a2, b2_lab)
      : deltaE76(L1, a1, b1_lab, L2, a2, b2_lab);
    
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color.hex;
    }
  });

  return closestColor;
}

// 颜色量化 - 减少颜色数量以提高识别准确性
export function quantizeColors(
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  colorPalette: Array<{ hex: string; [key: string]: any }>,
  useDeltaE2000: boolean = true
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(imageData);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];

      const hex = rgbToHex(r, g, b);
      const closestHex = findClosestColor(hex, colorPalette, useDeltaE2000);
      const [newR, newG, newB] = hexToRgb(closestHex);

      result[i] = newR;
      result[i + 1] = newG;
      result[i + 2] = newB;
    }
  }

  return result;
}