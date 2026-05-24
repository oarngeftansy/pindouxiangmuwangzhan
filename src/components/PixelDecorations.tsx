/**
 * Pixel 装饰小物件 —— 给页面加"游戏机厅 kiosk"氛围。
 * 全用 SVG + shape-rendering: crispEdges 保持真像素感（不被 webkit 抗锯齿糊掉）。
 * NewJeans.kr 那种 NJ 街机 kiosk 视觉的灵魂：
 *   - chunky 8-bit 云朵、心心、星星、joystick、1UP 徽章
 *   - 漂浮在主体周围，配 pixel-float 动画
 *   - 颜色限定在 lavender / coral / honey / sky / mint / moss 几种 Y2K 柔色
 */

type Props = {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
};

// 16-bit 云朵（chunky 4 段堆）
export function PixelCloud({ size = 36, color = 'var(--bead-honey)', className = '', style }: Props) {
  return (
    <svg
      viewBox="0 0 16 8"
      width={size}
      height={(size * 8) / 16}
      style={{ shapeRendering: 'crispEdges', display: 'block', ...style }}
      className={className}
      aria-hidden="true"
    >
      <rect x="4" y="2" width="3" height="1" fill={color} />
      <rect x="9" y="1" width="4" height="1" fill={color} />
      <rect x="3" y="3" width="11" height="1" fill={color} />
      <rect x="2" y="4" width="13" height="2" fill={color} />
      <rect x="3" y="6" width="11" height="1" fill={color} />
      <rect x="5" y="7" width="7" height="1" fill={color} />
    </svg>
  );
}

// 经典 7×6 像素心
export function PixelHeart({ size = 18, color = 'var(--bead-terracotta)', className = '', style }: Props) {
  return (
    <svg
      viewBox="0 0 7 6"
      width={size}
      height={(size * 6) / 7}
      style={{ shapeRendering: 'crispEdges', display: 'block', ...style }}
      className={className}
      aria-hidden="true"
    >
      <rect x="1" y="0" width="2" height="1" fill={color} />
      <rect x="4" y="0" width="2" height="1" fill={color} />
      <rect x="0" y="1" width="7" height="2" fill={color} />
      <rect x="1" y="3" width="5" height="1" fill={color} />
      <rect x="2" y="4" width="3" height="1" fill={color} />
      <rect x="3" y="5" width="1" height="1" fill={color} />
    </svg>
  );
}

// 4-点像素星（+ 形）
export function PixelStar({ size = 14, color = 'var(--bead-terracotta)', className = '', style }: Props) {
  return (
    <svg
      viewBox="0 0 7 7"
      width={size}
      height={size}
      style={{ shapeRendering: 'crispEdges', display: 'block', ...style }}
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="0" width="1" height="7" fill={color} />
      <rect x="0" y="3" width="7" height="1" fill={color} />
      <rect x="2" y="2" width="1" height="1" fill={color} />
      <rect x="4" y="2" width="1" height="1" fill={color} />
      <rect x="2" y="4" width="1" height="1" fill={color} />
      <rect x="4" y="4" width="1" height="1" fill={color} />
    </svg>
  );
}

// 像素箭头 → （用在按钮里替代 lucide）
export function PixelArrow({ size = 14, color = 'currentColor', className = '', style }: Props) {
  return (
    <svg
      viewBox="0 0 9 7"
      width={size}
      height={(size * 7) / 9}
      style={{ shapeRendering: 'crispEdges', display: 'block', ...style }}
      className={className}
      aria-hidden="true"
    >
      <rect x="0" y="3" width="6" height="1" fill={color} />
      <rect x="5" y="2" width="1" height="3" fill={color} />
      <rect x="6" y="1" width="1" height="5" fill={color} />
      <rect x="7" y="2" width="1" height="3" fill={color} />
      <rect x="8" y="3" width="1" height="1" fill={color} />
    </svg>
  );
}

// 街机摇杆（小图标版 — 顶部圆球 + 底座）
export function PixelJoystick({ size = 20, ballColor = 'var(--bead-terracotta)', className = '', style }: Props) {
  return (
    <svg
      viewBox="0 0 10 12"
      width={size}
      height={(size * 12) / 10}
      style={{ shapeRendering: 'crispEdges', display: 'block', ...style }}
      className={className}
      aria-hidden="true"
    >
      {/* 顶部球 */}
      <rect x="3" y="0" width="4" height="1" fill={ballColor} />
      <rect x="2" y="1" width="6" height="3" fill={ballColor} />
      <rect x="3" y="4" width="4" height="1" fill={ballColor} />
      {/* 杆 */}
      <rect x="4" y="5" width="2" height="3" fill="var(--bead-ink)" />
      {/* 底座 */}
      <rect x="1" y="8" width="8" height="1" fill="var(--bead-ink)" />
      <rect x="0" y="9" width="10" height="3" fill="var(--bead-ink-soft)" />
    </svg>
  );
}

// 小街机按钮（圆球状有反光）
export function ArcadeButton({ size = 16, color = 'var(--bead-terracotta)', className = '', style }: Props) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        boxShadow: [
          'inset 0 -2px 0 rgba(0,0,0,0.28)',
          'inset 0 1px 0 rgba(255,255,255,0.45)',
          '0 1px 0 var(--bead-ink)',
        ].join(', '),
        ...style,
      }}
      aria-hidden="true"
    >
      {/* 顶部高光 */}
      <span
        className="absolute"
        style={{
          top: size * 0.15,
          left: size * 0.2,
          width: size * 0.25,
          height: size * 0.18,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.55)',
        }}
      />
    </div>
  );
}

// 1UP / PLAY / READY 像素徽章（街机文字标签）
// 外框统一 navy chrome（不再用 hue-70 暖棕 ink，避免读起来"土陶"）
export function PixelBadge({
  text = '1UP',
  color = 'var(--bead-terracotta)',
  className = '',
  style,
}: { text?: string; color?: string; className?: string; style?: React.CSSProperties }) {
  return (
    <span
      className={`font-pixel-arcade inline-block ${className}`}
      style={{
        backgroundColor: color,
        color: 'var(--bead-paper-bg)',
        fontSize: 13,
        padding: '3px 5px',
        letterSpacing: '0.05em',
        boxShadow: [
          '0 -1px 0 var(--y2k-navy)',
          '0 1px 0 var(--y2k-navy)',
          '-1px 0 0 var(--y2k-navy)',
          '1px 0 0 var(--y2k-navy)',
          '2px 2px 0 var(--y2k-navy-deep)',
        ].join(', '),
        ...style,
      }}
    >
      {text}
    </span>
  );
}

// chrome italic 椭圆光环（包在 wordmark 后面 — NewJeans 招牌"halo arc"）
export function ChromeHalo({
  width = 360,
  height = 80,
  className = '',
  style,
  color = 'var(--bead-terracotta-deep)',
}: {
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 360 80"
      width={width}
      height={height}
      className={className}
      style={{ display: 'block', ...style }}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      {/* 略倾斜的椭圆光环 — 双层（外淡 + 内深） */}
      <ellipse
        cx="180"
        cy="40"
        rx="170"
        ry="32"
        fill="none"
        stroke={color}
        strokeWidth="2"
        opacity="0.4"
        transform="rotate(-6 180 40)"
      />
      <ellipse
        cx="180"
        cy="40"
        rx="168"
        ry="30"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        transform="rotate(-6 180 40)"
      />
    </svg>
  );
}
