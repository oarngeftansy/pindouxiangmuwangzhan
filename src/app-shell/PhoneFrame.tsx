/**
 * PhoneFrame — 桌面访问时把 app 内容包在一个手机外框里（设计师 mockup 用）
 *
 * 检测逻辑：宽屏 (≥ 768px) 显示外框；窄屏（真手机）全屏无外框
 * 外框尺寸：iPhone 14 比例 390 × 844（含 status bar 区域）
 */

import { type ReactNode, useEffect, useState } from 'react';

interface PhoneFrameProps {
  children: ReactNode;
}

export function PhoneFrame({ children }: PhoneFrameProps) {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth >= 768,
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // 手机端：直接渲染，占满整屏
  if (!isDesktop) {
    return <div className="fixed inset-0 bg-paper-bg overflow-hidden">{children}</div>;
  }

  // 桌面端：模拟一台 iPhone 14 立在屏幕中央
  return (
    <div className="fixed inset-0 bg-ink-warm/15 flex items-center justify-center overflow-hidden">
      <div className="text-center">
        <div
          className="relative bg-paper-bg overflow-hidden mx-auto"
          style={{
            width: 390,
            height: 844,
            borderRadius: 50,
            // 模拟手机外壳的厚度感
            border: '12px solid #1a1a1a',
            boxShadow:
              '0 30px 80px rgba(58, 52, 42, 0.35), 0 8px 24px rgba(58, 52, 42, 0.2), inset 0 0 0 2px #2a2a2a',
          }}
        >
          {/* 顶部 notch（凹槽）— 纯装饰，提示这是手机预览 */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#1a1a1a] z-50"
            style={{
              width: 120,
              height: 28,
              borderBottomLeftRadius: 18,
              borderBottomRightRadius: 18,
            }}
            aria-hidden="true"
          />
          {/* 内容区域 */}
          <div className="absolute inset-0 overflow-hidden">{children}</div>
        </div>
        <div className="mt-4 text-xs text-ink-soft">桌面预览 · iPhone 14 比例 · 手机访问无外框</div>
      </div>
    </div>
  );
}
