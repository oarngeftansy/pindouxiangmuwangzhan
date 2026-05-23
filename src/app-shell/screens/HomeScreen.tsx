/**
 * HomeScreen — App 首页（"今日图鉴" 风格的卡片流）
 *
 * 复用 web 端的 trending 数据，但 UI 完全重做：
 * - 顶部 hero：松弛欢迎语 + 当前日期 badge
 * - 横向滚动的"今日精选"（顶部，前 3-5 张）
 * - 下面是网格"图鉴"（全部 trending）
 * - 点任意卡 → 推入图纸预览屏（后续 phase）
 */

import { useEffect, useState } from 'react';
import { getTrendingPatterns, type TrendingPattern } from '../../data/trendingPatterns';

export function HomeScreen() {
  const [patterns, setPatterns] = useState<TrendingPattern[]>([]);

  useEffect(() => {
    setPatterns(getTrendingPatterns());
  }, []);

  const today = new Date();
  const dateLabel = `${today.getMonth() + 1} 月 ${today.getDate()} 日`;

  const featured = patterns.slice(0, 5);
  const rest = patterns.slice(5);

  return (
    <div className="h-full overflow-y-auto bg-paper-bg">
      {/* App 顶部 status bar 留位 (iOS notch + status bar 高度约 47px) */}
      <div style={{ height: 'max(env(safe-area-inset-top, 0px), 28px)' }} aria-hidden="true" />

      {/* Hero */}
      <header className="px-5 pt-3 pb-4">
        <div className="flex items-end justify-between mb-1">
          <h1
            className="text-3xl text-ink-warm leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            今天想拼点什么？
          </h1>
        </div>
        <p className="text-sm text-ink-soft" style={{ fontFamily: 'var(--font-num)' }}>
          {dateLabel} · 已为你准备好今日图鉴
        </p>
      </header>

      {/* 今日精选 — 横向滚动 */}
      {featured.length > 0 && (
        <section className="mb-6">
          <div className="px-5 mb-3 flex items-end justify-between">
            <h2
              className="text-lg font-semibold text-ink-warm"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              今日精选
            </h2>
            <span className="text-xs text-ink-soft">{featured.length} 份</span>
          </div>
          <div
            className="flex gap-3 overflow-x-auto px-5 pb-2 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {featured.map((p) => (
              <FeaturedCard key={p.id} pattern={p} />
            ))}
          </div>
        </section>
      )}

      {/* 全部图鉴 — 2 列网格 */}
      {rest.length > 0 && (
        <section className="px-5 pb-8">
          <h2
            className="text-lg font-semibold text-ink-warm mb-3"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            更多图鉴
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {rest.map((p) => (
              <GridCard key={p.id} pattern={p} />
            ))}
          </div>
        </section>
      )}

      {/* 底部 tab bar 高度（56px）留位避免被遮 */}
      <div style={{ height: 'calc(56px + env(safe-area-inset-bottom, 0px))' }} aria-hidden="true" />
    </div>
  );
}

function FeaturedCard({ pattern }: { pattern: TrendingPattern }) {
  return (
    <button
      className="shrink-0 snap-start w-[180px] text-left rounded-card bg-paper-soft border border-edge-sand overflow-hidden active:scale-[0.98] transition-transform focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
      onClick={() => {
        // TODO: 推入图纸预览屏
        console.log('open pattern', pattern.id);
      }}
    >
      <div className="aspect-square bg-paper-bg flex items-center justify-center p-2">
        {pattern.previewImage ? (
          <img
            src={pattern.previewImage}
            alt={pattern.name}
            className="max-w-full max-h-full object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
        ) : (
          <div className="w-full h-full bg-paper-deep rounded-control" />
        )}
      </div>
      <div className="px-3 py-2">
        <div className="flex items-center gap-1.5 text-[11px] text-ink-soft" style={{ fontFamily: 'var(--font-num)' }}>
          <span>{pattern.gridWidth}×{pattern.gridHeight}</span>
          <span className="text-ink-soft/60">·</span>
          <span>{pattern.beadCount} 颗</span>
        </div>
      </div>
    </button>
  );
}

function GridCard({ pattern }: { pattern: TrendingPattern }) {
  return (
    <button
      className="text-left rounded-surface bg-paper-soft border border-edge-sand overflow-hidden active:scale-[0.98] transition-transform focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
      onClick={() => {
        console.log('open pattern', pattern.id);
      }}
    >
      <div className="aspect-square bg-paper-bg flex items-center justify-center p-2">
        {pattern.previewImage ? (
          <img
            src={pattern.previewImage}
            alt={pattern.name}
            className="max-w-full max-h-full object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
        ) : (
          <div className="w-full h-full bg-paper-deep rounded-control" />
        )}
      </div>
      <div className="px-2.5 py-1.5 flex items-center gap-1.5 text-[10px] text-ink-soft" style={{ fontFamily: 'var(--font-num)' }}>
        <span>{pattern.gridWidth}×{pattern.gridHeight}</span>
        <span className="text-ink-soft/60">·</span>
        <span>{pattern.beadCount}颗</span>
      </div>
    </button>
  );
}
