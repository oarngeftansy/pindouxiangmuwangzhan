/**
 * NJ kiosk Win95-style 窗口 chrome 共享组件
 * 跟 UPLOAD.EXE / GALLERY.EXE / PATTERN.EXE 同款外观
 */

import type { CSSProperties, ReactNode } from 'react';

// 1px navy 步阶外框 + navy-deep 6px 偏移硬阴 — 主窗口
export const WIN95_SHADOW = [
  '0 -2px 0 var(--y2k-navy)',
  '0 2px 0 var(--y2k-navy)',
  '-2px 0 0 var(--y2k-navy)',
  '2px 0 0 var(--y2k-navy)',
  '6px 6px 0 var(--y2k-navy-deep)',
].join(', ');

// 卡片/小窗 — 4px 偏移
export const CARD_SHADOW = [
  '0 -2px 0 var(--y2k-navy)',
  '0 2px 0 var(--y2k-navy)',
  '-2px 0 0 var(--y2k-navy)',
  '2px 0 0 var(--y2k-navy)',
  '4px 4px 0 var(--y2k-navy-deep)',
].join(', ');

// 按钮 — 3px 偏移
export const BUTTON_SHADOW = [
  '0 -2px 0 var(--y2k-navy)',
  '0 2px 0 var(--y2k-navy)',
  '-2px 0 0 var(--y2k-navy)',
  '2px 0 0 var(--y2k-navy)',
  '3px 3px 0 var(--y2k-coral)',
].join(', ');

export const BUTTON_SHADOW_NAVY = [
  '0 -2px 0 var(--y2k-navy)',
  '0 2px 0 var(--y2k-navy)',
  '-2px 0 0 var(--y2k-navy)',
  '2px 0 0 var(--y2k-navy)',
  '3px 3px 0 var(--y2k-navy-deep)',
].join(', ');

// 输入/小元素 — 1px 步阶，无偏移
export const INPUT_SHADOW = [
  '0 -2px 0 var(--y2k-navy)',
  '0 2px 0 var(--y2k-navy)',
  '-2px 0 0 var(--y2k-navy)',
  '2px 0 0 var(--y2k-navy)',
].join(', ');

// Win95 风 title bar — navy 条 + Press Start 2P EXE 名 + mini/max/close pixel 按钮
export function TitleBar({
  name,
  onClose,
}: {
  name: string;
  onClose?: () => void;
}) {
  return (
    <div
      className="absolute left-0 right-0 flex items-center justify-between px-2"
      style={{
        top: 2,
        height: 16,
        backgroundColor: 'var(--y2k-navy)',
        color: 'var(--bead-paper-bg)',
      }}
    >
      <span className="font-pixel-arcade" style={{ fontSize: 8, letterSpacing: 0 }}>
        {name}
      </span>
      <div className="flex gap-0.5 items-center">
        <div className="w-2 h-2 bg-paper-bg/80" aria-hidden="true" />
        <div className="w-2 h-2 bg-paper-bg/80" aria-hidden="true" />
        {onClose ? (
          <button
            onClick={onClose}
            className="w-2 h-2 bg-y2k-coral cursor-pointer hover:bg-y2k-coral/80 transition-colors"
            aria-label="关闭"
          />
        ) : (
          <div className="w-2 h-2 bg-y2k-coral" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

// 4 个 navy 角珍 — 通常加在 chrome 容器外
export function CornerPearls({ color = 'var(--y2k-navy)' }: { color?: string }) {
  return (
    <>
      <div className="absolute pointer-events-none" style={{ top: -4, left: -4, width: 4, height: 4, backgroundColor: color }} aria-hidden="true" />
      <div className="absolute pointer-events-none" style={{ top: -4, right: -4, width: 4, height: 4, backgroundColor: color }} aria-hidden="true" />
      <div className="absolute pointer-events-none" style={{ bottom: -4, left: -4, width: 4, height: 4, backgroundColor: color }} aria-hidden="true" />
      <div className="absolute pointer-events-none" style={{ bottom: -4, right: -4, width: 4, height: 4, backgroundColor: color }} aria-hidden="true" />
    </>
  );
}

// 完整 chrome 窗口包装器 — bg-paper-bg + dot grid + title bar + 4 角珍
export function ChromeWindow({
  name,
  children,
  className = '',
  contentClassName = '',
  shadowVariant = 'main',
  showCorners = true,
  onClose,
  style,
  innerStyle,
}: {
  name: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  shadowVariant?: 'main' | 'card';
  showCorners?: boolean;
  onClose?: () => void;
  style?: CSSProperties;
  innerStyle?: CSSProperties;
}) {
  return (
    <div className={`relative ${className}`} style={style}>
      <div
        className={`relative bg-paper-bg ${contentClassName}`}
        style={{
          paddingTop: 24,
          boxShadow: shadowVariant === 'card' ? CARD_SHADOW : WIN95_SHADOW,
          backgroundImage:
            'radial-gradient(circle, rgba(44, 58, 94, 0.05) 1px, transparent 1px)',
          backgroundSize: '14px 14px',
          ...innerStyle,
        }}
      >
        <TitleBar name={name} onClose={onClose} />
        {children}
      </div>
      {showCorners && <CornerPearls />}
    </div>
  );
}
