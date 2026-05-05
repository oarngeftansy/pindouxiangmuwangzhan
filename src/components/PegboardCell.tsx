// 拼豆板单元格组件 - 渲染单个拼豆位置
import React from 'react';
import type { CanvasParams } from '../data/canvasParams';

interface PegboardCellProps {
  x: number;
  y: number;
  color: string | null;
  beadSize: number;
  viewMode: 'simple' | 'pegboard';
  showGrid: boolean;
  shouldHighlight?: boolean;
  canPlace?: boolean;
  isEmpty?: boolean;
  onMouseDown?: () => void;
  onMouseEnter?: () => void;
  canvasParams?: CanvasParams;
}

// 简单的 CSS filter 拼接: saturate + brightness
function surfaceFilter(sat: number, bright: number): string | undefined {
  if (sat === 1 && bright === 1) return undefined;
  const parts: string[] = [];
  if (sat !== 1) parts.push(`saturate(${sat})`);
  if (bright !== 1) parts.push(`brightness(${bright})`);
  return parts.join(' ');
}

export function PegboardCell({
  x,
  y,
  color,
  beadSize,
  viewMode,
  showGrid,
  shouldHighlight = false,
  canPlace = true,
  isEmpty = false,
  onMouseDown,
  onMouseEnter,
  canvasParams,
}: PegboardCellProps) {

  // ── 简洁模式 ──────────────────────────────────────────
  if (viewMode === 'simple') {
    const sp = canvasParams?.simple;
    const inset = sp?.beadInset ?? 4;
    const borderRadius = sp?.beadBorderRadius ?? 50;
    const shadowBlur = sp?.innerShadowBlur ?? 3;
    const shadowAlpha = sp?.innerShadowAlpha ?? 0.2;
    const borderAlpha = sp?.gridBorderAlpha ?? 0.3;

    return (
      <div
        key={`cell-${x}-${y}`}
        className={`flex items-center justify-center relative ${
          shouldHighlight ? "ring-2 ring-honey" : ""
        } ${canPlace ? "cursor-pointer hover:bg-paper-deep" : "cursor-not-allowed"}`}
        style={{
          width: beadSize,
          height: beadSize,
          backgroundColor: shouldHighlight && isEmpty
            ? 'var(--bead-honey-glow)'
            : color || 'var(--bead-paper-bg)',
          // 网格线用暖墨色（替代冷灰），延续 paper 触感
          border: showGrid
            ? `1px solid rgba(58, 52, 42, ${borderAlpha})`
            : '1px solid transparent',
        }}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
      >
        {color && (
          <div
            className="absolute"
            style={{
              inset: `${inset}px`,
              borderRadius: `${borderRadius}%`,
              backgroundColor: color,
              // 模拟塑料反光的内阴影 — 这里是物理材质渲染，保留 rgba(0,0,0)
              boxShadow: `inset 0 1px ${shadowBlur}px rgba(0,0,0,${shadowAlpha})`,
            }}
          />
        )}
        {shouldHighlight && isEmpty && beadSize > 15 && (
          <span className="text-ink-soft text-xs select-none" aria-hidden="true">+</span>
        )}
      </div>
    );
  }

  // ─�� 拼豆板模式 ────────────────────────────────────────
  const pp = canvasParams?.pegboard;

  // 钉子 — 默认色暖化（边沙偏奶油），用户可通过 ironing-dev 工具页继续微调
  const pegRadiusRatio = pp?.pegRadiusRatio ?? 0.15;
  const pegLight = pp?.pegLightColor ?? "#e6dfce"; // ≈ paper-deep
  const pegDark = pp?.pegDarkColor ?? "#c5bcae";   // ≈ bead-shadow
  const pegShadowAlpha = pp?.pegShadowAlpha ?? 0.25;
  const pegRadius = beadSize * pegRadiusRatio;

  // 豆子形状
  const beadRadiusRatio = pp?.beadRadiusRatio ?? 0.495;
  const beadBorderRadius = pp?.beadBorderRadius ?? 50;
  const beadFlatness = pp?.beadFlatness ?? 0;
  const beadRadius = beadSize * beadRadiusRatio;
  const beadW = beadRadius * 2;
  const beadH = beadRadius * 2 * (1 - beadFlatness * 0.3); // flatness 压缩高度

  // 间距
  const beadGap = pp?.beadGap ?? 0;

  // 内阴影
  const idBlur = pp?.beadInnerDarkBlur ?? 3;
  const idAlpha = pp?.beadInnerDarkAlpha ?? 0.15;
  const idOx = pp?.beadInnerDarkOffsetX ?? -1;
  const idOy = pp?.beadInnerDarkOffsetY ?? -1;
  const ilBlur = pp?.beadInnerLightBlur ?? 3;
  const ilAlpha = pp?.beadInnerLightAlpha ?? 0.25;
  const ilOx = pp?.beadInnerLightOffsetX ?? 1;
  const ilOy = pp?.beadInnerLightOffsetY ?? 1;
  const dsBlur = pp?.beadDropShadowBlur ?? 3;
  const dsAlpha = pp?.beadDropShadowAlpha ?? 0.12;
  const dsOy = pp?.beadDropShadowOffsetY ?? 1;

  // 高光点
  const hlSize = pp?.highlightSize ?? 35;
  const hlTop = pp?.highlightTop ?? 12;
  const hlLeft = pp?.highlightLeft ?? 15;
  const hlAlpha = pp?.highlightAlpha ?? 0.45;
  const hlSpread = pp?.highlightSpread ?? 70;
  const hlFocusX = pp?.highlightFocusX ?? 40;
  const hlFocusY = pp?.highlightFocusY ?? 40;

  // 边缘反光
  const rimAlpha = pp?.rimLightAlpha ?? 0;
  const rimWidth = pp?.rimLightWidth ?? 0.1;
  const rimAngle = pp?.rimLightAngle ?? 220;

  // 孔洞
  const holeRatio = pp?.holeRatio ?? 0.28;
  const holeDarkAlpha = pp?.holeDarkAlpha ?? 0.3;
  const holeLightAlpha = pp?.holeLightAlpha ?? 0.12;
  const holeRingAlpha = pp?.holeRingAlpha ?? 0;

  // 表面质感
  const saturation = pp?.surfaceSaturation ?? 1;
  const brightness = pp?.surfaceBrightness ?? 1;

  // 投影光晕
  const glowInner = pp?.glowInnerStop ?? 65;
  const glowOuter = pp?.glowOuterStop ?? 75;
  const glowAlpha = pp?.glowAlpha ?? 0.06;

  // 空格子
  const emptyBgAlpha = pp?.emptyBgAlpha ?? 0.03;

  // 高亮
  const hbWidth = pp?.highlightBorderWidth ?? 2.5;
  const hbColor = pp?.highlightBorderColor ?? "#e9b347"; // honey 替代 amber
  const hfAlpha = pp?.highlightFillAlpha ?? 0.25;
  const hgAlpha = pp?.highlightGlowAlpha ?? 0.4;

  // 边缘反光位置计算
  const rimRad = (rimAngle * Math.PI) / 180;
  const rimX = 50 + Math.cos(rimRad) * 50; // % position on bead
  const rimY = 50 + Math.sin(rimRad) * 50;

  const filter = surfaceFilter(saturation, brightness);

  return (
    <div
      key={`cell-${x}-${y}`}
      className={`relative flex items-center justify-center ${
        canPlace ? "cursor-pointer" : "cursor-not-allowed"
      }`}
      style={{
        width: beadSize,
        height: beadSize,
        backgroundColor: isEmpty && !color
          ? `rgba(0,0,0,${emptyBgAlpha})`
          : "transparent",
      }}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
    >
      {/* 拼豆板的钉子 */}
      <div
        className="absolute"
        style={{
          width: pegRadius * 2,
          height: pegRadius * 2,
          borderRadius: "50%",
          background: isEmpty
            ? `radial-gradient(circle at 35% 35%, ${pegLight}, ${pegDark})`
            : "transparent",
          boxShadow: isEmpty
            ? `inset -1px -1px 2px rgba(0,0,0,${pegShadowAlpha}), 0 1px 2px rgba(0,0,0,${pegShadowAlpha * 0.6})`
            : "none",
        }}
      />

      {/* 豆子 */}
      {color && (
        <>
          {/* 豆子主��� */}
          <div
            className="absolute"
            style={{
              width: beadW - beadGap,
              height: beadH - beadGap,
              borderRadius: `${beadBorderRadius}%`,
              backgroundColor: color,
              filter,
              boxShadow: `
                inset ${idOx}px ${idOy}px ${idBlur}px rgba(0,0,0,${idAlpha}),
                inset ${ilOx}px ${ilOy}px ${ilBlur}px rgba(255,255,255,${ilAlpha}),
                0 ${dsOy}px ${dsBlur}px rgba(0,0,0,${dsAlpha})
              `,
            }}
          >
            {/* 高光点 */}
            <div
              className="absolute"
              style={{
                width: `${hlSize}%`,
                height: `${hlSize}%`,
                top: `${hlTop}%`,
                left: `${hlLeft}%`,
                borderRadius: `${beadBorderRadius}%`,
                background:
                  `radial-gradient(circle at ${hlFocusX}% ${hlFocusY}%, rgba(255,255,255,${hlAlpha}), rgba(255,255,255,0) ${hlSpread}%)`,
              }}
            />

            {/* 边缘反光 */}
            {rimAlpha > 0 && (
              <div
                className="absolute inset-0"
                style={{
                  borderRadius: `${beadBorderRadius}%`,
                  background:
                    `radial-gradient(ellipse at ${rimX}% ${rimY}%, rgba(255,255,255,${rimAlpha}) 0%, rgba(255,255,255,${rimAlpha * 0.3}) ${rimWidth * 50}%, transparent ${rimWidth * 150}%)`,
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* 中心孔洞 */}
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                width: beadRadius * holeRatio,
                height: beadRadius * holeRatio,
                borderRadius: "50%",
                background:
                  `radial-gradient(circle, rgba(0,0,0,${holeDarkAlpha}), rgba(0,0,0,${holeLightAlpha}))`,
                boxShadow: holeRingAlpha > 0
                  ? `0 0 ${1 + holeRingAlpha * 4}px rgba(255,255,255,${holeRingAlpha}), inset 0 0 ${1 + holeRingAlpha * 2}px rgba(255,255,255,${holeRingAlpha * 0.5})`
                  : 'none',
              }}
            />
          </div>

          {/* 豆子投��� */}
          <div
            className="absolute"
            style={{
              width: beadW * 1.05,
              height: beadH * 1.05,
              borderRadius: `${beadBorderRadius}%`,
              background:
                `radial-gradient(circle, transparent ${glowInner}%, rgba(0,0,0,${glowAlpha}) ${glowOuter}%, transparent 85%)`,
              pointerEvents: "none",
            }}
          />
        </>
      )}

      {/* 高亮提示 - 待放豆位置 — amber rgba(251,191,36) → honey rgba(233,179,71) */}
      {shouldHighlight && isEmpty && (
        <div
          className="absolute"
          style={{
            width: beadW - beadGap,
            height: beadH - beadGap,
            borderRadius: `${beadBorderRadius}%`,
            border: `${hbWidth}px dashed ${hbColor}`,
            backgroundColor: `rgba(233, 179, 71, ${hfAlpha})`,
            boxShadow: `0 0 6px rgba(233, 179, 71, ${hgAlpha})`,
          }}
        />
      )}
    </div>
  );
}
