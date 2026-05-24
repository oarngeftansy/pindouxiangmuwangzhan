/**
 * HomeScreen — App 首页（动作卡为主）
 *
 * 改造：从"trending 浏览"变为"创作行动起点"。trending 内容搬到了 CreateScreen。
 *
 * 视觉 strategy（per impeccable / DESIGN.md）：
 * - Hero：ZCOOL KuaiLe display，左对齐，38px 偏大，配日期 chip
 * - 3 张大动作卡（每张约 96px 高）—— terracotta / moss / paper 三阶差异化
 * - 底部"继续上次的作品"，从 localStorage 读最近一件，引导回访
 * - 统一 px-5 横边距、py-6 vertical rhythm、gap-3 卡间距
 */

import { useEffect, useState } from 'react';
import { Camera, Shuffle, Grid3X3, ArrowRight } from 'lucide-react';
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
    // 最近的作品（getGallery 按 createdAt desc 返回）
    setRecent(items[0] ?? null);
  }, []);

  const today = new Date();
  const dateLabel = `${today.getMonth() + 1}.${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div className="h-full overflow-y-auto bg-paper-bg">
      <div style={{ height: 'max(env(safe-area-inset-top, 0px), 28px)' }} aria-hidden="true" />

      {/* Hero */}
      <header className="px-5 pt-4 pb-7">
        <div className="flex items-baseline gap-3 mb-2">
          <h1
            className="text-ink-warm leading-[1.05]"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.25rem',
            }}
          >
            今天，
          </h1>
          <span
            className="text-xs text-ink-soft px-2 py-0.5 rounded-chip bg-paper-soft border border-edge-sand"
            style={{ fontFamily: 'var(--font-num)' }}
          >
            {dateLabel}
          </span>
        </div>
        <h1
          className="text-ink-warm leading-[1.05]"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.25rem',
          }}
        >
          想拼点什么？
        </h1>
      </header>

      {/* 3 张动作卡 */}
      <div className="px-5 space-y-3">
        <ActionCard
          variant="primary"
          Icon={Camera}
          title="上传图片"
          desc="把一张图变成拼豆图纸"
          onClick={() => onAction?.('upload')}
        />
        <ActionCard
          variant="honey"
          Icon={Shuffle}
          title="今日盲盒"
          desc="今天的灵感图"
          onClick={() => onAction?.('blindbox')}
        />
        <ActionCard
          variant="ghost"
          Icon={Grid3X3}
          title="空白画布"
          desc="自由创作"
          onClick={() => onAction?.('blank')}
        />
      </div>

      {/* 继续上次的作品 */}
      {recent && (
        <section className="px-5 pt-8 pb-2">
          <div className="flex items-end justify-between mb-3">
            <h2
              className="text-base font-semibold text-ink-warm"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              继续上次的作品
            </h2>
            <button
              onClick={onOpenGallery}
              className="text-xs text-moss font-semibold inline-flex items-center gap-0.5 min-h-[32px] px-1.5 hover:text-moss-deep transition-colors"
            >
              全部
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

interface ActionCardProps {
  variant: 'primary' | 'honey' | 'ghost';
  Icon: typeof Camera;
  title: string;
  desc: string;
  onClick: () => void;
}

function ActionCard({ variant, Icon, title, desc, onClick }: ActionCardProps) {
  // 三种语义化变体
  // - primary: terracotta 实心圈 + 暖色卡 —— 主推上传
  // - honey: honey-glow 圈 —— 次推盲盒
  // - ghost: paper-deep 圈 —— 中性空白画布
  const variantStyles = {
    primary: {
      cardClass: 'bg-paper-soft border-edge-sand',
      iconCircleClass: 'bg-terracotta text-paper-bg',
      shadow: 'var(--shadow-lift-bead)',
    },
    honey: {
      cardClass: 'bg-paper-soft border-edge-sand',
      iconCircleClass: 'bg-honey-glow text-ink-warm border border-honey/50',
      shadow: undefined,
    },
    ghost: {
      cardClass: 'bg-paper-soft border-edge-sand',
      iconCircleClass: 'bg-paper-bg text-ink-warm border border-edge-sand',
      shadow: undefined,
    },
  }[variant];

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 border ${variantStyles.cardClass} rounded-card active:scale-[0.99] transition-transform focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2`}
      style={variantStyles.shadow ? { boxShadow: variantStyles.shadow } : undefined}
    >
      <div
        className={`w-14 h-14 rounded-control flex items-center justify-center shrink-0 ${variantStyles.iconCircleClass}`}
        aria-hidden="true"
      >
        <Icon className="w-7 h-7" strokeWidth={2.2} />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="text-lg font-semibold text-ink-warm leading-tight">{title}</div>
        <div className="text-sm text-ink-soft mt-0.5">{desc}</div>
      </div>
      <ArrowRight className="w-5 h-5 text-ink-soft shrink-0" aria-hidden="true" />
    </button>
  );
}
