/**
 * CreateScreen — 创作 tab 的根屏（占位）
 *
 * 后续阶段会做：上传图片 / 抽盲盒 / 从空白画布开始
 * 现在先 placeholder 让框架可见。
 */

import { Sparkles, Upload, Grid3X3, Shuffle } from 'lucide-react';

export function CreateScreen() {
  return (
    <div className="h-full overflow-y-auto bg-paper-bg">
      <div style={{ height: 'max(env(safe-area-inset-top, 0px), 28px)' }} aria-hidden="true" />

      <header className="px-5 pt-3 pb-6">
        <h1
          className="text-3xl text-ink-warm leading-tight mb-1"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          开始创作
        </h1>
        <p className="text-sm text-ink-soft">从一张图、一颗盲盒、或空白画布开始</p>
      </header>

      <div className="px-5 space-y-3">
        <PlaceholderAction Icon={Upload} title="上传你的图" desc="自动转换成可拼的图纸" />
        <PlaceholderAction Icon={Shuffle} title="抽个盲盒" desc="今天的盲盒图纸" />
        <PlaceholderAction Icon={Grid3X3} title="空白画布" desc="自定义尺寸自由创作" />
      </div>

      <div className="px-5 mt-8 p-4 bg-honey-glow/40 border border-honey/40 rounded-surface flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-moss shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-sm text-ink-warm leading-relaxed">
          <p className="font-semibold mb-1">这屏还在搭</p>
          <p className="text-ink-soft">框架先跑通，每个入口后续单独连上真实流程</p>
        </div>
      </div>

      <div style={{ height: 'calc(56px + env(safe-area-inset-bottom, 0px))' }} aria-hidden="true" />
    </div>
  );
}

function PlaceholderAction({
  Icon,
  title,
  desc,
}: {
  Icon: typeof Upload;
  title: string;
  desc: string;
}) {
  return (
    <button className="w-full flex items-center gap-4 p-4 bg-paper-soft border border-edge-sand rounded-card text-left active:scale-[0.99] transition-transform focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2">
      <div className="w-12 h-12 rounded-control bg-paper-deep flex items-center justify-center shrink-0">
        <Icon className="w-6 h-6 text-moss" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-ink-warm">{title}</div>
        <div className="text-sm text-ink-soft truncate">{desc}</div>
      </div>
    </button>
  );
}
