/**
 * GalleryScreen — 作品馆 tab 的根屏（占位）
 *
 * 复用 web 端的 galleryUtils 读取已保存的作品
 * 后续阶段：实际渲染缩略图 + tap 进详情屏
 */

import { useEffect, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { getGallery, type GalleryItem } from '../../utils/galleryUtils';

export function GalleryScreen() {
  const [items, setItems] = useState<GalleryItem[]>([]);

  useEffect(() => {
    setItems(getGallery());
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-paper-bg">
      <div style={{ height: 'max(env(safe-area-inset-top, 0px), 28px)' }} aria-hidden="true" />

      <header className="px-5 pt-3 pb-4">
        <h1
          className="text-3xl text-ink-warm leading-tight mb-1"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          作品馆
        </h1>
        <p className="text-sm text-ink-soft" style={{ fontFamily: 'var(--font-num)' }}>
          {items.length} 件作品
        </p>
      </header>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="px-5 grid grid-cols-2 gap-3 pb-8">
          {items.map((it) => (
            <button
              key={it.id}
              className="text-left rounded-surface bg-paper-soft border border-edge-sand overflow-hidden active:scale-[0.98] transition-transform focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
            >
              <div className="aspect-square bg-paper-bg">
                <img
                  src={it.thumbnailUrl}
                  alt={it.title}
                  className="w-full h-full object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <div className="px-2.5 py-2">
                <div className="text-sm font-semibold text-ink-warm truncate">{it.title}</div>
                <div className="text-[10px] text-ink-soft mt-0.5" style={{ fontFamily: 'var(--font-num)' }}>
                  {it.gridWidth}×{it.gridHeight} · {it.beadCount}颗
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div style={{ height: 'calc(56px + env(safe-area-inset-bottom, 0px))' }} aria-hidden="true" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-20 text-center">
      <div className="w-20 h-20 bg-paper-deep border border-edge-sand rounded-card flex items-center justify-center mb-4">
        <ImageIcon className="w-10 h-10 text-ink-soft" aria-hidden="true" />
      </div>
      <p className="text-ink-warm font-semibold mb-1">作品馆还是空的</p>
      <p className="text-sm text-ink-soft max-w-[20em] leading-relaxed">
        完成一件作品后会出现在这里
      </p>
    </div>
  );
}
