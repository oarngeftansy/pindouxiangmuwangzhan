/**
 * OnboardingTour — 首次访问全流程引导
 * 跨 upload → canvas → ironed 三阶段，按 mode 自动显隐对应步骤
 * localStorage flag "onboarding_done_v2" 防重复（v1 已废弃，全流程更新到 v2）
 */

import { useEffect, useLayoutEffect, useState } from 'react';
import { PixelArrow } from './PixelDecorations';

type TourMode = 'upload' | 'canvas' | 'canvas-ironed';

interface TourStep {
  id: string;
  mode: TourMode;
  title: string;
  desc: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

const STEPS: TourStep[] = [
  // ─── 主页阶段 ───
  {
    id: 'upload-zone',
    mode: 'upload',
    title: '先挑一张图吧',
    desc: '把喜欢的图片拖进来\n或者点这里选一张～\n它会自动变成拼豆图纸哦',
    placement: 'bottom',
  },
  {
    id: 'gallery-section',
    mode: 'upload',
    title: '没图也没关系',
    desc: '下面有好多现成的图鉴呢\n看到喜欢的点一下\n就可以直接开始啦',
    placement: 'top',
  },
  {
    id: 'header-gallery',
    mode: 'upload',
    title: '作品馆藏在这里',
    desc: '拼好熨完的小作品\n都会乖乖收在这里\n想再看一眼随时回来就行',
    placement: 'bottom',
  },
  // ─── 创作阶段 ───
  {
    id: 'view-mode-toggle',
    mode: 'canvas',
    title: '想看哪种视图都行',
    desc: '拼豆板像真的板子那样\n有小钉子可以放豆豆\n简洁模式清爽一些\n看你的心情挑就好',
    placement: 'bottom',
  },
  {
    id: 'pour-mode',
    mode: 'canvas',
    title: '滑豆模式好用哦',
    desc: '挑一个颜色锁定\n再把滑豆打开\n手指轻轻一划就能填好一片\n比一颗一颗点轻松多了',
    placement: 'bottom',
  },
  {
    id: 'iron-button',
    mode: 'canvas',
    title: '拼好了就来熨吧',
    desc: '点这个一键熨烫\n会帮你把背景去掉\n还可以微调亮度和质感哦',
    placement: 'bottom',
  },
  // ─── 熨完后 ───
  {
    id: 'finish-button',
    mode: 'canvas-ironed',
    title: '辛苦啦~',
    desc: '熨完点这个绿色按钮就好啦\n作品已经悄悄收进作品馆\n可以继续做下一个咯',
    placement: 'bottom',
  },
];

// ⚠️ 不要随便改这个 key —— 改了所有老用户都会被强制重看一遍引导。
// 只有真改了步骤数量/顺序/逻辑才升版本号。纯文案 tweaks 保持 v3 不变。
const STORAGE_KEY = 'onboarding_done_v3';
const STEP_KEY = 'onboarding_step_v3'; // 持久化当前 stepIdx 防刷新/返回首页丢进度

// 模式顺序 — 用户进 canvas 后 upload 模式步骤永远不该再出现
const MODE_ORDER: Record<TourMode, number> = {
  'upload': 0,
  'canvas': 1,
  'canvas-ironed': 2,
};

interface OnboardingTourProps {
  currentMode: TourMode;
}

export function OnboardingTour({ currentMode }: OnboardingTourProps) {
  const [show, setShow] = useState(false);
  // stepIdx 从 localStorage 恢复，刷新 / 返回首页 不丢进度
  const [stepIdx, setStepIdx] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STEP_KEY);
      return saved ? Math.max(0, parseInt(saved, 10) || 0) : 0;
    } catch { return 0; }
  });
  const [rect, setRect] = useState<DOMRect | null>(null);

  // 每次 stepIdx 变化时持久化
  useEffect(() => {
    try { localStorage.setItem(STEP_KEY, String(stepIdx)); } catch {}
  }, [stepIdx]);

  // 进 canvas / canvas-ironed 时自动跳过所有更"早"的模式步骤
  // 这样回 upload 时上次已经过了的步骤不会再播
  useEffect(() => {
    if (!show) return;
    const currentOrder = MODE_ORDER[currentMode];
    let i = stepIdx;
    while (i < STEPS.length && MODE_ORDER[STEPS[i].mode] < currentOrder) {
      i++;
    }
    if (i >= STEPS.length) {
      // 全部步骤都消化完 → 提前结束引导
      try { localStorage.setItem(STORAGE_KEY, '1'); localStorage.removeItem(STEP_KEY); } catch {}
      setShow(false);
    } else if (i !== stepIdx) {
      setStepIdx(i);
    }
  }, [currentMode, show, stepIdx]);

  // 首次访问检测
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }
    const t = setTimeout(() => setShow(true), 600);
    return () => clearTimeout(t);
  }, []);

  // 引导一旦显示就立即标记 "已看过"，后续刷新/返回首页绝不重播
  // 用户即使中途关页面，下次也不会再被打扰
  useEffect(() => {
    if (show) {
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    }
  }, [show]);

  const step = STEPS[stepIdx];
  // 当前步骤的 mode 跟 app mode 对得上才显示
  const modeMatch = step && step.mode === currentMode;

  // 计算目标元素位置
  useLayoutEffect(() => {
    if (!show || !step || !modeMatch) {
      setRect(null);
      return;
    }
    const update = () => {
      const el = document.querySelector(`[data-tour-id="${step.id}"]`);
      if (el) {
        setRect(el.getBoundingClientRect());
        const r = el.getBoundingClientRect();
        if (r.top < 80 || r.bottom > window.innerHeight - 80) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => setRect(el.getBoundingClientRect()), 400);
        }
      } else {
        setRect(null);
      }
    };
    update();
    // poll 一会（目标可能延迟挂载）
    const poll = setInterval(update, 500);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update);
    return () => {
      clearInterval(poll);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
    };
  }, [show, step, modeMatch]);

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
      localStorage.removeItem(STEP_KEY); // 引导结束清掉 step 进度
    } catch {}
    setShow(false);
  };

  const next = () => {
    if (stepIdx >= STEPS.length - 1) {
      finish();
    } else {
      setStepIdx((i) => i + 1);
    }
  };

  if (!show || !step || !modeMatch || !rect) return null;

  // 气泡位置算
  const BUBBLE_W = 280;
  const BUBBLE_H = 130;
  const GAP = 16;

  let bubbleStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 1000,
    width: BUBBLE_W,
  };
  let arrowStyle: React.CSSProperties = { position: 'absolute' };

  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  switch (step.placement || 'bottom') {
    case 'bottom':
      bubbleStyle.top = Math.min(window.innerHeight - BUBBLE_H - 8, rect.bottom + GAP);
      bubbleStyle.left = Math.max(8, Math.min(window.innerWidth - BUBBLE_W - 8, cx - BUBBLE_W / 2));
      arrowStyle = { position: 'absolute', top: -10, left: Math.max(20, cx - (bubbleStyle.left as number) - 8) };
      break;
    case 'top':
      bubbleStyle.top = Math.max(8, rect.top - BUBBLE_H - GAP);
      bubbleStyle.left = Math.max(8, Math.min(window.innerWidth - BUBBLE_W - 8, cx - BUBBLE_W / 2));
      arrowStyle = { position: 'absolute', bottom: -10, left: Math.max(20, cx - (bubbleStyle.left as number) - 8) };
      break;
    case 'left':
      bubbleStyle.top = Math.max(8, Math.min(window.innerHeight - BUBBLE_H - 8, cy - BUBBLE_H / 2));
      bubbleStyle.left = Math.max(8, rect.left - BUBBLE_W - GAP);
      arrowStyle = { position: 'absolute', right: -10, top: BUBBLE_H / 2 - 8 };
      break;
    case 'right':
      bubbleStyle.top = Math.max(8, Math.min(window.innerHeight - BUBBLE_H - 8, cy - BUBBLE_H / 2));
      bubbleStyle.left = rect.right + GAP;
      arrowStyle = { position: 'absolute', left: -10, top: BUBBLE_H / 2 - 8 };
      break;
  }

  // 进度
  const progress = `${stepIdx + 1} / ${STEPS.length}`;

  return (
    <>
      {/* radial 高亮 backdrop */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 999,
          background: `radial-gradient(ellipse ${Math.max(rect.width, rect.height) * 0.85}px ${Math.max(rect.width, rect.height) * 0.85}px at ${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px, transparent 30%, rgba(44, 58, 94, 0.5) 100%)`,
        }}
        aria-hidden="true"
      />

      {/* 目标高亮环已移除 — 用户反馈橙色边框不要 */}

      {/* 气泡 */}
      <div style={bubbleStyle} className="animate-in fade-in slide-in-from-bottom-2 duration-200">
        {/* 三角箭头 */}
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
          {/* 进度 + 跳过 */}
          <div className="flex items-baseline justify-between mb-2">
            <span
              className="font-pixel-arcade text-y2k-coral"
              style={{ fontSize: 12, letterSpacing: '0.15em' }}
            >
              ✦ {progress}
            </span>
            <button
              onClick={finish}
              className="font-pixel-cn text-y2k-navy hover:text-y2k-coral transition-colors"
              style={{ fontSize: 12, letterSpacing: '0.05em' }}
              aria-label="跳过引导"
            >
              先不看啦 ×
            </button>
          </div>

          {/* 标题（描述去掉了，引导更轻量） */}
          <p
            className="font-pixel-cn text-ink-warm mb-4"
            style={{ fontSize: 18, letterSpacing: '0.08em', lineHeight: 1.3 }}
          >
            {step.title}
          </p>

          {/* 下一步 */}
          <button
            onClick={next}
            className="w-full arcade-pill font-pixel-cn text-paper-bg cursor-pointer"
            style={{
              backgroundColor: 'var(--y2k-navy)',
              fontSize: 14,
              letterSpacing: '0.1em',
              padding: '10px 16px',
            }}
          >
            <span>{stepIdx >= STEPS.length - 1 ? '开心玩耍吧 ♡' : '看下一个'}</span>
            <PixelArrow size={12} color="var(--bead-paper-bg)" />
          </button>
        </div>
      </div>
    </>
  );
}
