/**
 * OnboardingTour — 首次访问引导
 * 用 data-tour-id 锚定目标按钮，渲染 pixel chrome 气泡 + 箭头
 * localStorage flag "onboarding_done_v1" 防重复显示
 */

import { useEffect, useLayoutEffect, useState } from 'react';
import { PixelArrow } from './PixelDecorations';

interface TourStep {
  id: string;            // data-tour-id 对应值
  title: string;         // arcade 风 title
  desc: string;          // Cubic 11 中文描述
  placement?: 'top' | 'bottom' | 'left' | 'right'; // 气泡相对目标位置
}

const STEPS: TourStep[] = [
  {
    id: 'upload-zone',
    title: 'STEP 1 / 3',
    desc: '拖图到这里 · 或点击上传\n自动转成拼豆图纸',
    placement: 'bottom',
  },
  {
    id: 'gallery-section',
    title: 'STEP 2 / 3',
    desc: '没图？\n从这些现成图鉴里挑一个直接玩',
    placement: 'top',
  },
  {
    id: 'header-gallery',
    title: 'STEP 3 / 3',
    desc: '熨完的作品都在这里\n随时回来看',
    placement: 'bottom',
  },
];

const STORAGE_KEY = 'onboarding_done_v1';

interface OnboardingTourProps {
  enabled?: boolean; // 外层可强制关闭（比如其他模态打开时）
}

export function OnboardingTour({ enabled = true }: OnboardingTourProps) {
  const [show, setShow] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // 首次访问检测
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }
    // 延迟 600ms 等页面动画/字体加载完成，气泡位置更准
    const t = setTimeout(() => setShow(true), 600);
    return () => clearTimeout(t);
  }, []);

  // 计算目标元素位置
  const step = STEPS[stepIdx];
  useLayoutEffect(() => {
    if (!show || !step) return;
    const update = () => {
      const el = document.querySelector(`[data-tour-id="${step.id}"]`);
      if (el) {
        setRect(el.getBoundingClientRect());
        // 把目标元素滚到视口可见区
        const r = el.getBoundingClientRect();
        if (r.top < 80 || r.bottom > window.innerHeight - 80) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // 滚完后再 update 一次
          setTimeout(() => {
            const newR = el.getBoundingClientRect();
            setRect(newR);
          }, 400);
        }
      } else {
        // 目标不存在（页面状态切换）→ 跳过这一步
        setRect(null);
      }
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
    };
  }, [show, step]);

  const finish = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    setShow(false);
  };

  const next = () => {
    if (stepIdx >= STEPS.length - 1) {
      finish();
    } else {
      setStepIdx((i) => i + 1);
    }
  };

  if (!enabled || !show || !step) return null;

  // 气泡位置算
  const BUBBLE_W = 280;
  const BUBBLE_H = 120;
  const GAP = 16;

  let bubbleStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 1000,
    width: BUBBLE_W,
  };

  let arrowStyle: React.CSSProperties = {
    position: 'absolute',
  };

  if (rect) {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    switch (step.placement || 'bottom') {
      case 'bottom':
        bubbleStyle.top = rect.bottom + GAP;
        bubbleStyle.left = Math.max(8, Math.min(window.innerWidth - BUBBLE_W - 8, cx - BUBBLE_W / 2));
        arrowStyle = { position: 'absolute', top: -10, left: cx - (bubbleStyle.left as number) - 8 };
        break;
      case 'top':
        bubbleStyle.top = Math.max(8, rect.top - BUBBLE_H - GAP);
        bubbleStyle.left = Math.max(8, Math.min(window.innerWidth - BUBBLE_W - 8, cx - BUBBLE_W / 2));
        arrowStyle = { position: 'absolute', bottom: -10, left: cx - (bubbleStyle.left as number) - 8 };
        break;
      case 'left':
        bubbleStyle.top = cy - BUBBLE_H / 2;
        bubbleStyle.left = Math.max(8, rect.left - BUBBLE_W - GAP);
        arrowStyle = { position: 'absolute', right: -10, top: BUBBLE_H / 2 - 8 };
        break;
      case 'right':
        bubbleStyle.top = cy - BUBBLE_H / 2;
        bubbleStyle.left = rect.right + GAP;
        arrowStyle = { position: 'absolute', left: -10, top: BUBBLE_H / 2 - 8 };
        break;
    }
  } else {
    // 目标找不到，居中显示
    bubbleStyle.top = window.innerHeight / 2 - BUBBLE_H / 2;
    bubbleStyle.left = window.innerWidth / 2 - BUBBLE_W / 2;
  }

  return (
    <>
      {/* 半透 backdrop — 不挡点击但视觉聚焦 */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 999,
          background: rect
            ? `radial-gradient(ellipse ${Math.max(rect.width, rect.height) * 0.9}px ${Math.max(rect.width, rect.height) * 0.9}px at ${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px, transparent 30%, rgba(44, 58, 94, 0.45) 100%)`
            : 'rgba(44, 58, 94, 0.45)',
        }}
        aria-hidden="true"
      />

      {/* 目标元素高亮环 */}
      {rect && (
        <div
          className="fixed pointer-events-none animate-pulse"
          style={{
            zIndex: 1000,
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: [
              '0 -3px 0 var(--y2k-coral)',
              '0 3px 0 var(--y2k-coral)',
              '-3px 0 0 var(--y2k-coral)',
              '3px 0 0 var(--y2k-coral)',
              '0 0 24px rgba(232, 164, 140, 0.6)',
            ].join(', '),
          }}
          aria-hidden="true"
        />
      )}

      {/* 气泡本体 */}
      <div style={bubbleStyle} className="animate-in fade-in slide-in-from-bottom-2 duration-200">
        {/* 箭头 — 简单三角 */}
        <div
          style={{
            ...arrowStyle,
            width: 0,
            height: 0,
            ...(step.placement === 'bottom' ? {
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderBottom: '10px solid var(--y2k-coral)',
            } : step.placement === 'top' ? {
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '10px solid var(--y2k-coral)',
            } : step.placement === 'left' ? {
              borderTop: '8px solid transparent',
              borderBottom: '8px solid transparent',
              borderLeft: '10px solid var(--y2k-coral)',
            } : {
              borderTop: '8px solid transparent',
              borderBottom: '8px solid transparent',
              borderRight: '10px solid var(--y2k-coral)',
            }),
          }}
          aria-hidden="true"
        />

        {/* 气泡 chrome 容器 */}
        <div
          className="relative bg-paper-bg p-4"
          style={{
            boxShadow: [
              '0 -2px 0 var(--y2k-navy)',
              '0 2px 0 var(--y2k-navy)',
              '-2px 0 0 var(--y2k-navy)',
              '2px 0 0 var(--y2k-navy)',
              '4px 4px 0 var(--y2k-coral)',
            ].join(', '),
            backgroundImage: 'radial-gradient(circle, rgba(44, 58, 94, 0.06) 1px, transparent 1px)',
            backgroundSize: '10px 10px',
          }}
        >
          {/* TIP 标 */}
          <div className="flex items-baseline justify-between mb-2">
            <span
              className="font-pixel-arcade text-y2k-coral arcade-blink"
              style={{ fontSize: 11, letterSpacing: '0.2em' }}
            >
              ✦ {step.title} ✦
            </span>
            <button
              onClick={finish}
              className="font-pixel-arcade text-y2k-navy hover:text-y2k-coral transition-colors"
              style={{ fontSize: 11, letterSpacing: '0.1em' }}
              aria-label="跳过引导"
            >
              SKIP
            </button>
          </div>

          {/* 描述文字 */}
          <p
            className="font-pixel-cn text-ink-warm whitespace-pre-line mb-3"
            style={{ fontSize: 14, letterSpacing: '0.05em', lineHeight: 1.6 }}
          >
            {step.desc}
          </p>

          {/* 下一步 / 知道了 按钮 */}
          <button
            onClick={next}
            className="w-full arcade-pill font-pixel-cn text-paper-bg cursor-pointer"
            style={{
              backgroundColor: 'var(--y2k-navy)',
              fontSize: 13,
              letterSpacing: '0.1em',
              padding: '10px 16px',
            }}
          >
            <span>{stepIdx >= STEPS.length - 1 ? '开始玩吧' : '下一步'}</span>
            <PixelArrow size={12} color="var(--bead-paper-bg)" />
          </button>
        </div>
      </div>
    </>
  );
}
