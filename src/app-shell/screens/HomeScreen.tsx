/**
 * HomeScreen — App 首页（动作卡为主）
 *
 * V2 重排（per user 反馈 + impeccable 视觉权重原则）：
 * - 去掉 hero 里挤的日期 chip → 移到右上角"角标"位置，跟标题彻底分离
 * - 单行 hero 标题"今天想拼点什么？"代替两行（更紧凑）
 * - 视觉权重重新分配：上传图片做"主推卡"占满宽 + 大插图 + 暖陶色调
 *                    盲盒 + 空白画布 拼成下方 2 列小卡
 * - 创造层级感：1 个主 + 2 个次，不是 3 个同等权重
 */

import { useEffect, useState } from 'react';
import { Camera, Shuffle, Grid3X3, ArrowRight, ArrowUpRight } from 'lucide-react';
import { getGallery, type GalleryItem } from '../../utils/galleryUtils';

type ActionKey = 'upload' | 'blindbox' | 'blank';

interface HomeScreenProps {
  onAction?: (action: ActionKey) => void;
  onOpenGallery?: () => void;
}

export function HomeScreen({ onAction, onOpenGallery }: HomeScreenProps) {
  const [recent, setRecent] = useState<GalleryItem | null>(null);

  useEffect(() => {
    const items = getGallery();
    setRecent(items[0] ?? null);
  }, []);

  const today = new Date();
  const dateLabel = `${today.getMonth() + 1}.${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div className="h-full overflow-y-auto bg-paper-bg">
      <div style={{ height: 'max(env(safe-area-inset-top, 0px), 28px)' }} aria-hidden="true" />

      {/* Hero — 日期挪到右侧"角标"，跟标题不再挤一起 */}
      <header className="px-5 pt-5 pb-7 flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h1
            className="text-ink-warm leading-[1.1]"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
            }}
          >
            今天想拼点什么？
          </h1>
          <p className="text-sm text-ink-soft mt-2">选一种方式开始</p>
        </div>
        <span
          className="shrink-0 ml-3 mt-1 text-xs text-ink-soft px-2 py-1 rounded-chip bg-paper-soft border border-edge-sand"
          style={{ fontFamily: 'var(--font-num)' }}
        >
          {dateLabel}
        </span>
      </header>

      {/* 主推卡：上传图片（大、有插图感、terracotta 主调） */}
      <div className="px-5 mb-3">
        <button
          onClick={() => onAction?.('upload')}
          className="w-full relative overflow-hidden rounded-card active:scale-[0.99] transition-transform focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
          style={{
            backgroundColor: 'var(--bead-terracotta)',
            boxShadow: 'var(--shadow-lift-bead)',
          }}
        >
          {/* 装饰豆粒（右下角，paper-cream 色，半透明营造质感） */}
          <div
            className="absolute right-0 bottom-0 pointer-events-none opacity-25"
            style={{
              width: 120,
              height: 120,
              backgroundImage:
                'radial-gradient(circle at 50% 50%, var(--bead-paper-bg) 30%, transparent 32%)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 10px 10px',
              transform: 'translate(20px, 20px)',
            }}
            aria-hidden="true"
          />
          <div className="relative flex items-center gap-4 p-5 text-left">
            <div className="w-14 h-14 rounded-control bg-paper-bg/15 flex items-center justify-center shrink-0 backdrop-blur-sm">
              <Camera className="w-7 h-7 text-paper-bg" strokeWidth={2.2} aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-xl text-paper-bg leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                上传一张图
              </div>
              <div className="text-sm text-paper-bg/85 mt-1">
                先在屏幕里试拼，看效果再买豆
              </div>
            </div>
            <ArrowUpRight
              className="w-5 h-5 text-paper-bg/80 shrink-0"
              strokeWidth={2.4}
              aria-hidden="true"
            />
          </div>
        </button>
      </div>

      {/* 次推：盲盒 + 空白画布 2 列 */}
      <div className="px-5 grid grid-cols-2 gap-3 mb-7">
        <SecondaryCard
          Icon={Shuffle}
          title="今日盲盒"
          desc="今天先拼啥"
          accent="honey"
          onClick={() => onAction?.('blindbox')}
        />
        <SecondaryCard
          Icon={Grid3X3}
          title="空白画布"
          desc="一颗豆开始"
          accent="ghost"
          onClick={() => onAction?.('blank')}
        />
      </div>

      {/* 继续上次的作品 */}
      {recent && (
        <section className="px-5 pb-2">
          <div className="flex items-end justify-between mb-3">
            <h2
              className="text-base font-semibold text-ink-warm"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              继续上次的
            </h2>
            <button
              onClick={onOpenGallery}
              className="text-xs text-moss font-semibold inline-flex items-center gap-0.5 min-h-[32px] px-1.5 hover:text-moss-deep transition-colors"
            >
              全部作品
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </button>
          </div>
          <button
            className="w-full flex items-center gap-3 p-3 bg-paper-soft border border-edge-sand rounded-card active:scale-[0.99] transition-transform focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
            onClick={onOpenGallery}
          >
            <div className="w-16 h-16 rounded-control bg-paper-bg border border-edge-sand overflow-hidden shrink-0">
              <img
                src={recent.thumbnailUrl}
                alt={recent.title}
                className="w-full h-full object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="font-semibold text-sm text-ink-warm truncate">{recent.title}</div>
              <div
                className="text-xs text-ink-soft mt-0.5"
                style={{ fontFamily: 'var(--font-num)' }}
              >
                {recent.gridWidth}×{recent.gridHeight} · {recent.beadCount} 颗
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-ink-soft shrink-0" aria-hidden="true" />
          </button>
        </section>
      )}

      <div
        style={{ height: 'calc(56px + 24px + env(safe-area-inset-bottom, 0px))' }}
        aria-hidden="true"
      />
    </div>
  );
}

interface SecondaryCardProps {
  Icon: typeof Camera;
  title: string;
  desc: string;
  accent: 'honey' | 'ghost';
  onClick: () => void;
}

function SecondaryCard({ Icon, title, desc, accent, onClick }: SecondaryCardProps) {
  const accentStyles = {
    honey: {
      iconBg: 'bg-honey-glow border border-honey/50',
      iconColor: 'text-ink-warm',
    },
    ghost: {
      iconBg: 'bg-paper-bg border border-edge-sand',
      iconColor: 'text-ink-warm',
    },
  }[accent];

  return (
    <button
      onClick={onClick}
      className="text-left p-4 bg-paper-soft border border-edge-sand rounded-card active:scale-[0.98] transition-transform focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
    >
      <div
        className={`w-11 h-11 rounded-control flex items-center justify-center mb-3 ${accentStyles.iconBg}`}
        aria-hidden="true"
      >
        <Icon className={`w-5 h-5 ${accentStyles.iconColor}`} strokeWidth={2.2} />
      </div>
      <div className="font-semibold text-sm text-ink-warm leading-tight">{title}</div>
      <div className="text-xs text-ink-soft mt-0.5">{desc}</div>
    </button>
  );
}
