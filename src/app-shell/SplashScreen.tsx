/**
 * SplashScreen V3 — Y2K 像素风（probe）
 *
 * 在 V2（豆子下落拼苹果）基础上加 Y2K 像素装饰：
 * - 苹果豆子周围加一个 Win95 风的 pixel window frame（标题栏 + 角珍）
 * - 副标题"LOADING..." 用 Press Start 2P 像素字
 * - 4 个角加 lavender 像素角珍点缀
 * - 苹果豆子本身保持圆形（因为是"豆"），但豆子之间的视觉密度让整体看着像像素图
 * - 背景加微妙的 dot pattern（仿 OS 桌面）
 *
 * 仍然 ~2.4s 内容 + 0.25s fade out
 */

import { useEffect, useMemo, useState } from 'react';
import { tapHaptic } from '../utils/native';

interface SplashScreenProps {
  onDone: () => void;
}

const APPLE: (string | null)[][] = (() => {
  const R = 'R';
  const G = 'G';
  const _ = null;
  return [
    [_, _, _, _, _, G, _, _, _, _],
    [_, _, _, _, G, G, _, _, _, _],
    [_, _, R, R, R, R, R, _, _, _],
    [_, R, R, R, R, R, R, R, _, _],
    [R, R, R, R, R, R, R, R, R, _],
    [R, R, R, R, R, R, R, R, R, _],
    [R, R, R, R, R, R, R, R, R, _],
    [R, R, R, R, R, R, R, R, R, _],
    [_, R, R, R, R, R, R, R, _, _],
    [_, _, R, R, R, R, R, _, _, _],
  ];
})();

const COLOR_MAP: Record<string, string> = {
  R: 'var(--bead-terracotta)',
  G: 'var(--bead-moss)',
};

const BEAD_SIZE = 22;
const BEAD_GAP = 2;
const TOTAL_DURATION = 2400;
const FADE_OUT_DELAY = 200;

const APPLE_W = APPLE[0].length;
const APPLE_H = APPLE.length;
const TOTAL_WIDTH = APPLE_W * (BEAD_SIZE + BEAD_GAP);
const TOTAL_HEIGHT = APPLE_H * (BEAD_SIZE + BEAD_GAP);

interface BeadSpec {
  x: number;
  y: number;
  color: string;
  delay: number;
  fromY: number;
  bounce: number;
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [exiting, setExiting] = useState(false);

  const beads = useMemo<BeadSpec[]>(() => {
    const list: BeadSpec[] = [];
    APPLE.forEach((row, y) => {
      row.forEach((cellChar, x) => {
        if (!cellChar) return;
        list.push({
          x,
          y,
          color: COLOR_MAP[cellChar],
          delay: y * 25 + x * 8 + Math.random() * 80,
          fromY: -(50 + Math.random() * 60),
          bounce: -(8 + Math.random() * 6),
        });
      });
    });
    return list;
  }, []);

  useEffect(() => {
    beads.forEach((b, i) => {
      if (i % 5 === 0) {
        setTimeout(() => tapHaptic(false), b.delay + 900);
      }
    });
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onDone, FADE_OUT_DELAY);
    }, TOTAL_DURATION);
    return () => clearTimeout(timer);
  }, [beads, onDone]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-paper-bg ${
        exiting ? 'splash-fade-out' : ''
      }`}
      style={{
        // 桌面 dot 网格背景（Y2K window desktop vibe），间距 24px 暖墨色淡点
        backgroundImage:
          'radial-gradient(circle, rgba(58, 52, 42, 0.06) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Y2K window frame — 把苹果包成一个像素窗口 */}
      <div className="relative">
        {/* 主窗口体 */}
        <div
          className="relative bg-paper-bg"
          style={{
            padding: '28px 24px 20px 24px',
            // 像素硬阴影 + 4 段步阶外框（box-shadow 堆叠）
            boxShadow: [
              // 外阶 1px 深墨
              '0 -2px 0 var(--bead-ink)',
              '0 2px 0 var(--bead-ink)',
              '-2px 0 0 var(--bead-ink)',
              '2px 0 0 var(--bead-ink)',
              // 像素硬阴影（lavender）
              '6px 6px 0 var(--y2k-lavender)',
            ].join(', '),
          }}
        >
          {/* 顶部 title bar（Win95 风） */}
          <div
            className="absolute left-0 right-0 flex items-center justify-between px-2"
            style={{
              top: 2,
              height: 16,
              backgroundColor: 'var(--y2k-navy)',
              color: 'var(--bead-paper-bg)',
            }}
          >
            <span
              className="font-pixel-arcade"
              style={{ fontSize: 12, letterSpacing: 0 }}
            >
              APPLE.EXE
            </span>
            {/* 右上 3 个像素 close/min/max 按钮模仿 */}
            <div className="flex gap-0.5">
              <div className="w-2 h-2 bg-paper-bg/80" aria-hidden="true" />
              <div className="w-2 h-2 bg-paper-bg/80" aria-hidden="true" />
              <div className="w-2 h-2 bg-y2k-coral" aria-hidden="true" />
            </div>
          </div>

          {/* 苹果豆子容器 */}
          <div
            className="relative"
            style={{
              width: TOTAL_WIDTH,
              height: TOTAL_HEIGHT,
            }}
            aria-hidden="true"
          >
            {beads.map((bead, i) => (
              <div
                key={i}
                className="splash-bead-fall absolute"
                style={
                  {
                    left: bead.x * (BEAD_SIZE + BEAD_GAP),
                    top: bead.y * (BEAD_SIZE + BEAD_GAP),
                    width: BEAD_SIZE,
                    height: BEAD_SIZE,
                    borderRadius: '50%',
                    backgroundColor: bead.color,
                    boxShadow:
                      'inset -1.5px -2px 4px rgba(58, 52, 42, 0.28), inset 1px 1px 3px rgba(255, 255, 255, 0.32), 0 2px 4px rgba(168, 130, 90, 0.18)',
                    ['--from-y' as string]: `${bead.fromY}vh`,
                    ['--bounce' as string]: `${bead.bounce}px`,
                    ['--delay' as string]: `${bead.delay}ms`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        </div>

        {/* 4 角像素角珍（lavender） */}
        <div
          className="absolute"
          style={{ top: -4, left: -4, width: 4, height: 4, backgroundColor: 'var(--y2k-lavender)' }}
          aria-hidden="true"
        />
        <div
          className="absolute"
          style={{ top: -4, right: -4, width: 4, height: 4, backgroundColor: 'var(--y2k-lavender)' }}
          aria-hidden="true"
        />
        <div
          className="absolute"
          style={{ bottom: -4, left: -4, width: 4, height: 4, backgroundColor: 'var(--y2k-lavender)' }}
          aria-hidden="true"
        />
        <div
          className="absolute"
          style={{ bottom: -4, right: -4, width: 4, height: 4, backgroundColor: 'var(--y2k-lavender)' }}
          aria-hidden="true"
        />
      </div>

      {/* 中文标题 — 中文用 Cubic 11 像素字（fallback ZCOOL） */}
      <h1
        className="splash-fade-up font-pixel-cn text-2xl text-ink-warm mt-8"
        style={{
          animationDelay: '1750ms',
          letterSpacing: '0.05em',
        }}
      >
        拼豆模拟器
      </h1>

      {/* 副标题 — 英文像素字"LOADING..."，更"游戏机厅"感 */}
      <p
        className="splash-fade-up font-pixel-arcade text-y2k-navy mt-3"
        style={{
          animationDelay: '1950ms',
          fontSize: 13,
          letterSpacing: '0.1em',
        }}
      >
        LOADING<span className="splash-dots">...</span>
      </p>
    </div>
  );
}
