import type { BeadGrid } from '../types';

/**
 * 将拼豆网格渲染成烫好的哑光成品预览图（data URL）
 * 方块紧密无缝，柔和哑光质感
 */
export function renderBeadPreview(grid: BeadGrid, cellSize = 8): string {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  if (rows === 0 || cols === 0) return '';

  const w = cols * cellSize;
  const h = rows * cellSize;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // 透明背景
  ctx.clearRect(0, 0, w, h);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const color = grid[r][c];
      if (!color) continue;

      const x = c * cellSize;
      const y = r * cellSize;

      // 填满方块，无缝隙
      ctx.fillStyle = color;
      ctx.fillRect(x, y, cellSize, cellSize);

      // 哑光效果：柔和的径向渐变，中心微微亮，边缘微微暗
      const cx = x + cellSize / 2;
      const cy = y + cellSize / 2;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cellSize * 0.7);
      grad.addColorStop(0, 'rgba(255,255,255,0.08)');
      grad.addColorStop(0.6, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.06)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, cellSize, cellSize);
    }
  }

  return canvas.toDataURL('image/png');
}
