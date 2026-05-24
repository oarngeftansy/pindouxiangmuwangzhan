/**
 * SplashScreen V2 — App 开屏（多豆子下落弹跳拼成苹果）
 *
 * 升级：从"4 颗豆子拼 logo"换成"~52 颗豆子从屏顶下落、弹跳、拼成一颗苹果"。
 *
 * 实现：
 * - 10×10 苹果 grid（hardcoded，主体 terracotta + 顶部 moss 叶柄）
 * - 每个非空 cell 渲染一颗豆子，绝对定位在 grid 中目标位置
 * - 每颗豆子初始平移到屏顶上方（随机 -100vh ~ -50vh）
 * - CSS @keyframes splashBeadFall 用 ease-in 模拟重力下落 + 2 次弹跳
 * - 错峰 delay：行 × 25ms + 列 × 8ms + 微随机 jitter，呈现"从上往下、左右散开"的下落节奏
 * - 全部落定后 (~1.5s) 标题淡入
 * - 总时长 ~2.4s，再 0.25s fade out
 *
 * 性能：纯 CSS 动画 GPU 加速，50+ 个豆子也流畅。
 */

import { useEffect, useMemo, useState } from 'react';
import { tapHaptic } from '../utils/native';

interface SplashScreenProps {
  onDone: () => void;
}

// 苹果图案：R = 陶土红, G = 苔藓绿叶柄
// 10 行 × 10 列 = 苹果轮廓
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

const BEAD_SIZE = 22; // px，单颗豆子直径
const BEAD_GAP = 2; // 视觉间距（豆子之间留 2px 缝看起来才像颗粒）
const TOTAL_DURATION = 2400; // 内容时长
const FADE_OUT_DELAY = 200;

// 苹果图整体尺寸
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

  // 一次性算好所有豆子的位置 + 延迟 + 起始高度
  const beads = useMemo<BeadSpec[]>(() => {
    const list: BeadSpec[] = [];
    APPLE.forEach((row, y) => {
      row.forEach((cellChar, x) => {
        if (!cellChar) return;
        list.push({
          x,
          y,
          color: COLOR_MAP[cellChar],
          // 错峰：行序 25ms 主节奏 + 列序 8ms 微节奏 + 0-80ms 随机抖动
          // → 上面的豆子先落，下面的稍晚；中间稍微参差，自然
          delay: y * 25 + x * 8 + Math.random() * 80,
          // 起始 Y：屏顶上方 -100vh ~ -50vh 随机
          fromY: -(50 + Math.random() * 60),
          // 弹跳幅度：8-14px 随机
          bounce: -(8 + Math.random() * 6),
        });
      });
    });
    return list;
  }, []);

  useEffect(() => {
    // 部分豆子（每 5 颗中 1 颗）落到位时触发触感反馈
    // 不全部触发避免太密集，挑代表性的几颗
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
    >
      {/* 苹果豆子容器 — 绝对定位每颗豆子 */}
      <div
        className="relative"
        style={{
          width: TOTAL_WIDTH,
          height: TOTAL_HEIGHT,
          marginBottom: 32,
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
                // 暖墨色 inset + 微反光，模拟塑料豆子质感
                boxShadow:
                  'inset -1.5px -2px 4px rgba(58, 52, 42, 0.28), inset 1px 1px 3px rgba(255, 255, 255, 0.32), 0 2px 4px rgba(168, 130, 90, 0.18)',
                // CSS variables 传给 @keyframes
                ['--from-y' as string]: `${bead.fromY}vh`,
                ['--bounce' as string]: `${bead.bounce}px`,
                ['--delay' as string]: `${bead.delay}ms`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* 标题 — 等所有豆子落定后才浮现（最大 delay + 1s 动画 + 一点喘息） */}
      <h1
        className="splash-fade-up text-3xl text-ink-warm"
        style={{
          fontFamily: 'var(--font-display)',
          animationDelay: '1750ms',
        }}
      >
        拼豆模拟器
      </h1>
      <p
        className="splash-fade-up text-sm text-ink-soft mt-2"
        style={{ animationDelay: '1950ms' }}
      >
        做点什么吧
      </p>
    </div>
  );
}
