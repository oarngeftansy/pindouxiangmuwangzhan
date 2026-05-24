/**
 * CreateScreen — 创作 tab（原 HomeScreen 的 trending 内容搬到这里）
 *
 * 改造：tab 内容互换后，这里展示"今日图鉴"——可选可拼的现成图纸。
 * 跟 HomeScreen 的"动作卡"形成"先看灵感、再选模式" 的两路入口。
 *
 * Polish（对比之前的 HomeScreen 版本）：
 * - 边距统一 px-5（之前部分用 px-5 部分用 px-3 不一致）
 * - Hero 改用 ZCOOL display 跟首页一致
 * - 横滑卡 180×180 + meta 行清晰，bead-num 字体
 * - 网格卡 aspect-square 一致，2 列等高
 * - 卡上方加 "X 份" 计数 chip
 */

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import {
  getTrendingPatterns,
  type TrendingPattern,
} from '../../data/trendingPatterns';

interface CreateScreenProps {
  onOpenPattern?: (pattern: TrendingPattern) => void;
}

export function CreateScreen({ onOpenPattern }: CreateScreenProps) {
  const [patterns, setPatterns] = useState<TrendingPattern[]>([]);

  useEffect(() => {
    setPatterns(getTrendingPatterns());
  }, []);

  const featured = patterns.slice(0, 5);
  const rest = patterns.slice(5);

  return (
    <div className="h-full overflow-y-auto bg-paper-bg">
      <div style={{ height: 'max(env(safe-area-inset-top, 0px), 28px)' }} aria-hidden="true" />

      {/* Hero */}
      <header className="px-5 pt-4 pb-6">
        <h1
          className="text-ink-warm leading-[1.05] mb-2"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.25rem',
          }}
        >
          今日图鉴
        </h1>
        <p className="text-sm text-ink-soft">挑一份现成的，点一下就开始拼</p>
      </header>

      {patterns.length === 0 ? <EmptyState /> : null}

      {/* 今日精选 — 横滑 */}
      {featured.length > 0 && (
        <section className="mb-7">
          <div className="px-5 mb-3 flex items-end justify-between">
            <h2
              className="text-base font-semibold text-ink-warm"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              今日精选
            </h2>
            <span
              className="text-xs text-ink-soft px-2 py-0.5 rounded-chip bg-paper-soft border border-edge-sand"
              style={{ fontFamily: 'var(--font-num)' }}
            >
              {featured.length} 份
            </span>
          </div>
          <div
            className="flex gap-3 overflow-x-auto px-5 pb-2 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {featured.map((p) => (
              <FeaturedCard key={p.id} pattern={p} onClick={() => onOpenPattern?.(p)} />
            ))}
            {/* 末尾留 padding，最后一张能完整 snap */}
            <div className="shrink-0 w-1" aria-hidden="true" />
          </div>
        </section>
      )}

      {/* 更多图鉴 — 2 列网格 */}
      {rest.length > 0 && (
        <section className="px-5">
          <div className="mb-3 flex items-end justify-between">
            <h2
              className="text-base font-semibold text-ink-warm"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              更多图鉴
            </h2>
            <span
              className="text-xs text-ink-soft px-2 py-0.5 rounded-chip bg-paper-soft border border-edge-sand"
              style={{ fontFamily: 'var(--font-num)' }}
            >
              {rest.length} 份
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 pb-4">
            {rest.map((p) => (
              <GridCard key={p.id} pattern={p} onClick={() => onOpenPattern?.(p)} />
            ))}
          </div>
        </section>
      )}

      <div
        style={{ height: 'calc(56px + 24px + env(safe-area-inset-bottom, 0px))' }}
        aria-hidden="true"
      />
    </div>
  );
}

function FeaturedCard({
  pattern,
  onClick,
}: {
  pattern: TrendingPattern;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 snap-start w-[200px] text-left rounded-card bg-paper-soft border border-edge-sand overflow-hidden active:scale-[0.98] transition-transform focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
    >
      <div className="aspect-square bg-paper-bg flex items-center justify-center p-3">
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
      <div className="px-3 py-2.5 flex items-center gap-1.5">
        <span
          className="text-[11px] text-ink-warm font-semibold"
          style={{ fontFamily: 'var(--font-num)' }}
        >
          {pattern.gridWidth}×{pattern.gridHeight}
        </span>
        <span className="text-ink-soft/40" aria-hidden="true">
          ·
        </span>
        <span className="text-[11px] text-ink-soft" style={{ fontFamily: 'var(--font-num)' }}>
          {pattern.beadCount} 颗
        </span>
      </div>
    </button>
  );
}

function GridCard({
  pattern,
  onClick,
}: {
  pattern: TrendingPattern;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-surface bg-paper-soft border border-edge-sand overflow-hidden active:scale-[0.98] transition-transform focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
    >
      <div className="aspect-square bg-paper-bg flex items-center justify-center p-2.5">
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
      <div className="px-2.5 py-2 flex items-center gap-1.5">
        <span
          className="text-[10px] text-ink-warm font-semibold"
          style={{ fontFamily: 'var(--font-num)' }}
        >
          {pattern.gridWidth}×{pattern.gridHeight}
        </span>
        <span className="text-ink-soft/40" aria-hidden="true">
          ·
        </span>
        <span className="text-[10px] text-ink-soft" style={{ fontFamily: 'var(--font-num)' }}>
          {pattern.beadCount} 颗
        </span>
      </div>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
      <div className="w-16 h-16 bg-paper-deep border border-edge-sand rounded-card flex items-center justify-center mb-3">
        <Sparkles className="w-8 h-8 text-ink-soft" aria-hidden="true" />
      </div>
      <p className="text-ink-warm font-semibold mb-1">还没有图鉴</p>
      <p className="text-sm text-ink-soft max-w-[20em] leading-relaxed">
        稍后会更新今日精选
      </p>
    </div>
  );
}
