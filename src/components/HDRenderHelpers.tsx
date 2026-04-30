// 高清渲染辅助函数
import { BeadGrid } from "../App";

export interface HDRenderOptions {
  removeBackground: boolean;
  scale: number; // 渲染倍数 2x, 4x, 8x
}

// 生成高清渲染图片
export async function generateHDImage(
  workingGrid: BeadGrid,
  options: HDRenderOptions
): Promise<string> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const w = workingGrid[0].length;
  const h = workingGrid.length;
  // 限制 canvas 最大边长为 8000px，防止大画布高倍数时内存溢出崩溃
  const MAX_SIDE = 8000;
  const cellSize = Math.min(40 * options.scale, Math.floor(MAX_SIDE / Math.max(w, h)));

  canvas.width = w * cellSize;
  canvas.height = h * cellSize;

  // 如果不去除背景，先填充白色
  if (!options.removeBackground) {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // 渲染每个豆子
  workingGrid.forEach((row, y) => {
    row.forEach((color, x) => {
      if (!color) return;

      const centerX = x * cellSize + cellSize / 2;
      const centerY = y * cellSize + cellSize / 2;
      const radius = cellSize / 2 - 0.05 * options.scale; // 减小间距

      // 填充豆子主体
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // 高光效果
      const highlightGradient = ctx.createRadialGradient(
        centerX - radius * 0.3,
        centerY - radius * 0.3,
        0,
        centerX - radius * 0.3,
        centerY - radius * 0.3,
        radius * 0.6
      );
      highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.6)");
      highlightGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.2)");
      highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = highlightGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // 环境阴影
      const shadowGradient = ctx.createRadialGradient(
        centerX + radius * 0.2,
        centerY + radius * 0.2,
        radius * 0.4,
        centerX + radius * 0.2,
        centerY + radius * 0.2,
        radius
      );
      shadowGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      shadowGradient.addColorStop(0.7, "rgba(0, 0, 0, 0.05)");
      shadowGradient.addColorStop(1, "rgba(0, 0, 0, 0.15)");
      ctx.fillStyle = shadowGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // 中心孔洞 - 更小
      const holeRadius = radius * 0.01; // 从0.15减小到0.12
      const holeGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        holeRadius
      );
      
      if (options.removeBackground) {
        holeGradient.addColorStop(0, "rgba(200, 200, 200, 0.3)");
        holeGradient.addColorStop(1, "rgba(150, 150, 150, 0.2)");
      } else {
        holeGradient.addColorStop(0, "rgba(180, 180, 180, 0.5)");
        holeGradient.addColorStop(1, "rgba(120, 120, 120, 0.3)");
      }
      
      ctx.fillStyle = holeGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, holeRadius, 0, Math.PI * 2);
      ctx.fill();

      // 孔洞边缘高光
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 0.5 * options.scale;
      ctx.beginPath();
      ctx.arc(centerX - holeRadius * 0.3, centerY - holeRadius * 0.3, holeRadius * 0.8, 0, Math.PI * 2);
      ctx.stroke();
    });
  });

  return canvas.toDataURL("image/png", 1.0);
}
