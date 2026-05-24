/**
 * SplashScreen — App 启动开屏（1.5s 快闪版）
 *
 * 叙事：4 颗豆子（terracotta / moss / honey / ink）从屏幕顶部依次错峰落下，
 *      snap 到中央拼成 2×2 logo，"拼豆模拟器" 字浮现，"做点什么吧" 副标题跟上。
 * 时长：~1500ms，再 200ms fade out。
 *
 * 实现：纯 CSS @keyframes（src/index.css 里定义），cubic-bezier(0.34, 1.56, 0.64, 1)
 *      模拟 spring overshoot 弹性，无需 motion 库。
 *
 * 触觉反馈：每颗豆子落到位时触发 light haptic（iOS / Android Capacitor）
 */

import { useEffect, useState } from 'react';
import { tapHaptic } from '../utils/native';

interface SplashScreenProps {
  onDone: () => void;
}

// 4 颗豆子：色 + 错峰 delay（毫秒）
const BEADS = [
  { color: 'var(--bead-terracotta)', delay: 0 },
  { color: 'var(--bead-moss)', delay: 80 },
  { color: 'var(--bead-honey)', delay: 160 },
  { color: 'var(--bead-ink)', delay: 240 },
];

const BEAD_SIZE = 40; // px
const BEAD_GAP = 6;
const TOTAL_DURATION = 1750; // 1.5s 内容 + 0.25s fade out

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // 每颗豆子落到位时触觉反馈（spring 动画约 480ms 后稳定）
    BEADS.forEach((b) => {
      setTimeout(() => tapHaptic(false), b.delay + 480);
    });
    // splash 整体完成后回调
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onDone, 250);
    }, 1500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-paper-bg ${
        exiting ? 'splash-fade-out' : ''
      }`}
    >
      {/* 4 颗豆子 2×2 方阵 */}
      <div
        className="grid grid-cols-2 mb-7"
        style={{ gap: BEAD_GAP, width: BEAD_SIZE * 2 + BEAD_GAP }}
        aria-hidden="true"
      >
        {BEADS.map((bead, i) => (
          <div
            key={i}
            className="splash-bead"
            style={{
              width: BEAD_SIZE,
              height: BEAD_SIZE,
              borderRadius: '50%',
              backgroundColor: bead.color,
              animationDelay: `${bead.delay}ms`,
              // 暖墨色 inset + 微微塑料反光
              boxShadow:
                'inset -2px -3px 6px rgba(58, 52, 42, 0.25), inset 2px 2px 4px rgba(255, 255, 255, 0.35), 0 4px 8px rgba(168, 130, 90, 0.2)',
            }}
          />
        ))}
      </div>

      {/* 标题 — 最后一颗豆子落定后 (240ms delay + 480ms anim = ~720ms) 再淡入 */}
      <h1
        className="splash-fade-up text-3xl text-ink-warm"
        style={{
          fontFamily: 'var(--font-display)',
          animationDelay: '720ms',
        }}
      >
        拼豆模拟器
      </h1>

      {/* 副标题 */}
      <p
        className="splash-fade-up text-sm text-ink-soft mt-2"
        style={{ animationDelay: '950ms' }}
      >
        做点什么吧
      </p>
    </div>
  );
}
