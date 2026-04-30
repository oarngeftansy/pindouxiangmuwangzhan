// 熨烫渲染辅助函数
import { BeadGrid } from "../App";
import { loadIroningParams, IroningParams } from "../data/ironingParams";

export type IroningMethod = 'towel' | 'paper' | 'direct' | 'glitter';

export interface IroningOptions {
  method: IroningMethod;
  removeBackground: boolean;
  partialBeads?: Set<string>; // 格式: "x,y" - 需要熨烫的豆子位置集合
  params?: IroningParams;     // 可选，传入自定义参数（dev工具用）
}

// 伪随机：基于坐标的确定性随机数，保证每次渲染结果一致
function seededRandom(x: number, y: number, i: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + i * 43.758) * 43758.5453;
  return n - Math.floor(n);
}

// 生成熨烫效果图片
export async function generateIronedImage(
  workingGrid: BeadGrid,
  options: IroningOptions
): Promise<string> {
  const params = options.params || loadIroningParams();
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const cellSize = params.cellSize;

  canvas.width = workingGrid[0].length * cellSize;
  canvas.height = workingGrid.length * cellSize;

  // 紧密填充各色块——pixel art 底，颜色清晰无糊
  workingGrid.forEach((row, y) => {
    row.forEach((color, x) => {
      if (!color) return;

      const beadKey = `${x},${y}`;
      const shouldIron = !options.partialBeads || options.partialBeads.has(beadKey);

      if (!shouldIron) {
        // 未熨烫区域：圆形豆子保留
        const centerX = x * cellSize + cellSize / 2;
        const centerY = y * cellSize + cellSize / 2;
        const radius = cellSize / 2 - 8;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.beginPath();
        ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
        ctx.fill();

        const holeRadius = radius * 0.15;
        ctx.fillStyle = options.removeBackground ? "rgba(255, 255, 255, 0.3)" : "rgba(200, 200, 200, 0.5)";
        ctx.beginPath();
        ctx.arc(centerX, centerY, holeRadius, 0, Math.PI * 2);
        ctx.fill();

        return;
      }

      ctx.fillStyle = color;
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    });
  });

  // 添加豆子间融合效果
  const gw = params.fusionGradientWidth;
  workingGrid.forEach((row, y) => {
    row.forEach((color, x) => {
      if (!color) return;

      const beadKey = `${x},${y}`;
      const shouldIron = !options.partialBeads || options.partialBeads.has(beadKey);
      if (!shouldIron) return;

      const centerX = x * cellSize + cellSize / 2;
      const centerY = y * cellSize + cellSize / 2;

      if (x < workingGrid[0].length - 1) {
        const rightColor = workingGrid[y][x + 1];
        const rightKey = `${x + 1},${y}`;
        const rightShouldIron = !options.partialBeads || options.partialBeads.has(rightKey);

        if (rightColor && rightShouldIron) {
          const halfGw = gw / 2;
          const gradient = ctx.createLinearGradient(
            centerX + cellSize * (0.5 - halfGw), centerY,
            centerX + cellSize * (0.5 + halfGw), centerY
          );
          // 全程平滑过渡——左色到右色一气呵成，无中点骤变
          gradient.addColorStop(0, color);
          gradient.addColorStop(1, rightColor);

          ctx.fillStyle = gradient;
          ctx.fillRect(
            centerX + cellSize * (0.5 - halfGw),
            y * cellSize,
            cellSize * gw,
            cellSize
          );
        }
      }

      if (y < workingGrid.length - 1) {
        const bottomColor = workingGrid[y + 1][x];
        const bottomKey = `${x},${y + 1}`;
        const bottomShouldIron = !options.partialBeads || options.partialBeads.has(bottomKey);

        if (bottomColor && bottomShouldIron) {
          const halfGw = gw / 2;
          const gradient = ctx.createLinearGradient(
            centerX, centerY + cellSize * (0.5 - halfGw),
            centerX, centerY + cellSize * (0.5 + halfGw)
          );
          gradient.addColorStop(0, color);
          gradient.addColorStop(1, bottomColor);

          ctx.fillStyle = gradient;
          ctx.fillRect(
            x * cellSize,
            centerY + cellSize * (0.5 - halfGw),
            cellSize,
            cellSize * gw
          );
        }
      }
    });
  });

  // 根据不同熨烫方式添加效果
  workingGrid.forEach((row, y) => {
    row.forEach((color, x) => {
      if (!color) return;

      const beadKey = `${x},${y}`;
      const shouldIron = !options.partialBeads || options.partialBeads.has(beadKey);
      if (!shouldIron) return;

      const centerX = x * cellSize + cellSize / 2;
      const centerY = y * cellSize + cellSize / 2;

      switch (options.method) {
        case 'glitter': { // 格里特烫：闪光纸烫，表面带有细密闪片效果
          const gp = params.glitter;

          // 底层光泽 - 模拟闪光纸的整体光泽感
          ctx.globalAlpha = gp.baseShineAlpha;
          const baseGlow = ctx.createRadialGradient(
            centerX - cellSize * 0.15, centerY - cellSize * 0.15, 0,
            centerX, centerY, cellSize * 0.5
          );
          baseGlow.addColorStop(0, "rgba(255, 255, 255, 0.8)");
          baseGlow.addColorStop(0.5, "rgba(255, 255, 255, 0.3)");
          baseGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
          ctx.fillStyle = baseGlow;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          ctx.globalAlpha = 1;

          // 散布闪光点 - 用伪随机保证确定性
          for (let i = 0; i < gp.sparkleCount; i++) {
            const sx = x * cellSize + seededRandom(x, y, i * 3) * cellSize;
            const sy = y * cellSize + seededRandom(x, y, i * 3 + 1) * cellSize;
            const size = gp.sparkleMinSize + seededRandom(x, y, i * 3 + 2) * (gp.sparkleMaxSize - gp.sparkleMinSize);

            // 彩虹色散效果 - 闪光片在不同角度反射不同颜色
            const hueShift = seededRandom(x, y, i * 7) * 360;
            const rainbowAlpha = gp.rainbowIntensity * (0.3 + seededRandom(x, y, i * 7 + 1) * 0.7);

            ctx.globalAlpha = gp.sparkleAlpha * (0.4 + seededRandom(x, y, i * 5) * 0.6);

            // 闪光点本体 - 白色高亮
            ctx.fillStyle = `rgba(255, 255, 255, 1)`;
            ctx.beginPath();
            ctx.arc(sx, sy, size * 0.5, 0, Math.PI * 2);
            ctx.fill();

            // 彩虹色散叠加
            if (gp.rainbowIntensity > 0) {
              ctx.globalAlpha = rainbowAlpha;
              ctx.fillStyle = `hsl(${hueShift}, 80%, 70%)`;
              ctx.beginPath();
              ctx.arc(sx, sy, size * 0.8, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.globalAlpha = 1;

          // 十字星光 - 较大的闪光点呈十字形
          for (let i = 0; i < gp.crossSparkleCount; i++) {
            const cx2 = x * cellSize + seededRandom(x + 100, y, i * 2) * cellSize;
            const cy2 = y * cellSize + seededRandom(x, y + 100, i * 2 + 1) * cellSize;
            const len = gp.crossSparkleSize;

            ctx.globalAlpha = gp.highlightAlpha * (0.5 + seededRandom(x, y, i * 11) * 0.5);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
            ctx.lineWidth = 0.8;
            ctx.lineCap = "round";

            // 横线
            ctx.beginPath();
            ctx.moveTo(cx2 - len / 2, cy2);
            ctx.lineTo(cx2 + len / 2, cy2);
            ctx.stroke();

            // 竖线
            ctx.beginPath();
            ctx.moveTo(cx2, cy2 - len / 2);
            ctx.lineTo(cx2, cy2 + len / 2);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;

          // 整体高光区域
          ctx.globalAlpha = gp.highlightAlpha * 0.5;
          const highlightGrad = ctx.createRadialGradient(
            centerX - cellSize * 0.2, centerY - cellSize * 0.2, 0,
            centerX, centerY, cellSize * 0.45
          );
          highlightGrad.addColorStop(0, "rgba(255, 255, 255, 0.4)");
          highlightGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.1)");
          highlightGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
          ctx.fillStyle = highlightGrad;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          ctx.globalAlpha = 1;
          break;
        }

        case 'paper': { // 铜版纸烫
          const pp = params.paper;
          const holeRadius = cellSize * pp.holeRadius;
          ctx.fillStyle = `rgba(0, 0, 0, ${pp.holeAlpha})`;
          ctx.beginPath();
          ctx.arc(centerX, centerY, holeRadius, 0, Math.PI * 2);
          ctx.fill();

          const paperShine = ctx.createRadialGradient(
            centerX - cellSize * pp.shineOffset,
            centerY - cellSize * pp.shineOffset,
            0,
            centerX, centerY,
            cellSize * pp.shineRadius
          );
          paperShine.addColorStop(0, `rgba(255, 255, 255, ${pp.shineAlpha})`);
          paperShine.addColorStop(0.6, `rgba(255, 255, 255, ${pp.shineAlpha * 0.2})`);
          paperShine.addColorStop(1, "rgba(255, 255, 255, 0)");
          ctx.fillStyle = paperShine;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          break;
        }

        case 'towel': { // 毛巾烫
          const tp = params.towel;
          ctx.globalAlpha = tp.weaveAlpha;

          for (let i = 0; i < cellSize; i += tp.weaveSpacing) {
            const lineY = y * cellSize + i;
            ctx.fillStyle = i % (tp.weaveSpacing * 2) === 0 ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.6)";
            ctx.fillRect(x * cellSize, lineY, cellSize, tp.weaveWidth);
          }

          for (let i = 0; i < cellSize; i += tp.weaveSpacing) {
            const lineX = x * cellSize + i;
            ctx.fillStyle = i % (tp.weaveSpacing * 2) === 0 ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.8)";
            ctx.fillRect(lineX, y * cellSize, tp.weaveWidth, cellSize);
          }

          ctx.globalAlpha = 1;

          ctx.globalAlpha = tp.crossAlpha;
          for (let i = 0; i < cellSize; i += tp.crossSpacing) {
            for (let j = 0; j < cellSize; j += tp.crossSpacing) {
              const crossX2 = x * cellSize + i;
              const crossY2 = y * cellSize + j;
              ctx.fillStyle = (i + j) % (tp.crossSpacing * 2) === 0 ? "rgba(255, 255, 255, 1)" : "rgba(0, 0, 0, 1)";
              ctx.fillRect(crossX2, crossY2, 2, 2);
            }
          }
          ctx.globalAlpha = 1;

          const towelMatte = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, cellSize * 0.5
          );
          towelMatte.addColorStop(0, `rgba(255, 255, 255, ${tp.matteAlpha})`);
          towelMatte.addColorStop(0.7, `rgba(255, 255, 255, ${tp.matteAlpha * 0.33})`);
          towelMatte.addColorStop(1, `rgba(0, 0, 0, ${tp.matteAlpha * 0.5})`);
          ctx.fillStyle = towelMatte;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

          ctx.globalAlpha = tp.edgeAlpha;
          const towelEdge = ctx.createRadialGradient(
            centerX, centerY, cellSize * 0.4,
            centerX, centerY, cellSize * 0.5
          );
          towelEdge.addColorStop(0, "rgba(0, 0, 0, 0)");
          towelEdge.addColorStop(1, "rgba(0, 0, 0, 1)");
          ctx.fillStyle = towelEdge;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          ctx.globalAlpha = 1;
          break;
        }

        case 'direct': { // 直烫
          const dp = params.direct;
          const directShine = ctx.createRadialGradient(
            centerX - cellSize * dp.shineOffset,
            centerY - cellSize * dp.shineOffset,
            0,
            centerX, centerY,
            cellSize * 0.5
          );
          directShine.addColorStop(0, `rgba(255, 255, 255, ${dp.shineAlpha})`);
          directShine.addColorStop(0.4, `rgba(255, 255, 255, ${dp.shineMidAlpha})`);
          directShine.addColorStop(0.8, `rgba(255, 255, 255, ${dp.shineEdgeAlpha})`);
          directShine.addColorStop(1, `rgba(0, 0, 0, ${dp.shadowAlpha})`);
          ctx.fillStyle = directShine;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          break;
        }
      }
    });
  });

  // 方形 mask：每颗有色豆子方形 fillRect，紧密拼接——pixel art 风的锯齿外缘
  // 真实烫熔的拼豆外缘就是方形锯齿，不要圆角化
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = canvas.width;
  maskCanvas.height = canvas.height;
  const maskCtx = maskCanvas.getContext('2d')!;
  workingGrid.forEach((row, y) => {
    row.forEach((color, x) => {
      if (!color) return;
      maskCtx.fillStyle = 'black';
      maskCtx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    });
  });

  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(maskCanvas, 0, 0);
  ctx.globalCompositeOperation = 'source-over';

  if (!options.removeBackground) {
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height;
    const finalCtx = finalCanvas.getContext('2d')!;
    finalCtx.fillStyle = '#FFFFFF';
    finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    finalCtx.drawImage(canvas, 0, 0);
    return finalCanvas.toDataURL('image/png', 1.0);
  }

  return canvas.toDataURL("image/png", 1.0);
}

export const IRONING_METHODS = {
  paper: { name: '铜版纸烫', icon: '📄', desc: '最常见烫法，表面平整光滑，保留轻微孔洞，立体感适中' },
  towel: { name: '毛巾烫', icon: '🧺', desc: '表面非常平滑，细微绒面质感，孔洞几乎不可见，哑光效果' },
  direct: { name: '直烫', icon: '✨', desc: '无烫纸直接熨烫，表面光滑有光泽，孔洞基本消失，最平整' },
  glitter: { name: '格里特烫', icon: '💎', desc: '使用闪光烫纸，表面带有细密闪片，折射彩虹光泽，华丽闪耀' },
} as const;
