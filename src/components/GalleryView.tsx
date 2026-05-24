import { useState, useEffect } from 'react';
import { X, Trash2, Download, Pencil, Check } from 'lucide-react';
import {
  getGallery,
  removeFromGallery,
  updateGalleryTitle,
  type GalleryItem,
} from '../utils/galleryUtils';
import {
  PixelCloud,
  PixelHeart,
  PixelArrow,
} from './PixelDecorations';

interface GalleryViewProps {
  onClose: () => void;
}

// NJ kiosk 风窗口 chrome — 跟 UPLOAD.EXE / 图鉴卡同款
const WIN95_SHADOW = [
  '0 -2px 0 var(--y2k-navy)',
  '0 2px 0 var(--y2k-navy)',
  '-2px 0 0 var(--y2k-navy)',
  '2px 0 0 var(--y2k-navy)',
  '6px 6px 0 var(--y2k-navy-deep)',
].join(', ');

const CARD_SHADOW = [
  '0 -2px 0 var(--y2k-navy)',
  '0 2px 0 var(--y2k-navy)',
  '-2px 0 0 var(--y2k-navy)',
  '2px 0 0 var(--y2k-navy)',
  '4px 4px 0 var(--y2k-navy-deep)',
].join(', ');

function TitleBar({ name, onClose }: { name: string; onClose?: () => void }) {
  return (
    <div
      className="absolute left-0 right-0 flex items-center justify-between px-2"
      style={{
        top: 2,
        height: 18,
        backgroundColor: 'var(--y2k-navy)',
        color: 'var(--bead-paper-bg)',
      }}
    >
      <span className="font-pixel-arcade" style={{ fontSize: 12, letterSpacing: 0 }}>
        {name}
      </span>
      <div className="flex gap-0.5 items-center">
        <div className="w-2.5 h-2.5 bg-paper-bg/80" aria-hidden="true" />
        <div className="w-2.5 h-2.5 bg-paper-bg/80" aria-hidden="true" />
        <button
          onClick={onClose}
          className="w-2.5 h-2.5 bg-y2k-coral cursor-pointer hover:bg-y2k-coral/80 transition-colors"
          aria-label="关闭"
        />
      </div>
    </div>
  );
}

function CornerPearls() {
  return (
    <>
      <div className="absolute pointer-events-none" style={{ top: -4, left: -4, width: 4, height: 4, backgroundColor: 'var(--y2k-navy)' }} aria-hidden="true" />
      <div className="absolute pointer-events-none" style={{ top: -4, right: -4, width: 4, height: 4, backgroundColor: 'var(--y2k-navy)' }} aria-hidden="true" />
      <div className="absolute pointer-events-none" style={{ bottom: -4, left: -4, width: 4, height: 4, backgroundColor: 'var(--y2k-navy)' }} aria-hidden="true" />
      <div className="absolute pointer-events-none" style={{ bottom: -4, right: -4, width: 4, height: 4, backgroundColor: 'var(--y2k-navy)' }} aria-hidden="true" />
    </>
  );
}

export function GalleryView({ onClose }: GalleryViewProps) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    setItems(getGallery());
  }, []);

  const handleDelete = (id: string) => {
    removeFromGallery(id);
    setItems(getGallery());
    if (selected?.id === id) setSelected(null);
  };

  const handleDownload = (item: GalleryItem) => {
    const link = document.createElement('a');
    link.href = item.thumbnailUrl;
    link.download = `${item.title}.png`;
    link.click();
  };

  const startEdit = (item: GalleryItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
  };

  const confirmEdit = (id: string) => {
    if (editTitle.trim()) {
      updateGalleryTitle(id, editTitle.trim());
      setItems(getGallery());
      if (selected?.id === id) {
        setSelected((prev) => prev ? { ...prev, title: editTitle.trim() } : prev);
      }
    }
    setEditingId(null);
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div
      className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center sm:p-6"
      style={{ backgroundColor: 'rgba(44, 58, 94, 0.55)' }}
      onClick={onClose}
    >
      <div className="relative max-w-4xl w-full max-h-[92vh] sm:max-h-[88vh]" onClick={(e) => e.stopPropagation()}>
        {/* 主窗口 GALLERY.EXE */}
        <div
          className="relative bg-paper-bg overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh]"
          style={{
            paddingTop: 28,
            boxShadow: WIN95_SHADOW,
            backgroundImage:
              'radial-gradient(circle, rgba(44, 58, 94, 0.05) 1px, transparent 1px)',
            backgroundSize: '14px 14px',
          }}
        >
          <TitleBar name="GALLERY.EXE" onClose={onClose} />

          {/* 标题 + 件数 */}
          <div className="flex items-center justify-between px-5 sm:px-6 pt-4 pb-4 shrink-0"
            style={{ borderBottom: '2px solid var(--y2k-navy)' }}
          >
            <div className="flex items-baseline gap-3 min-w-0">
              <h2
                className="font-pixel-cn text-ink-warm shrink-0"
                style={{ fontSize: 22, letterSpacing: '0.1em', lineHeight: 1.1 }}
              >
                我的作品馆
              </h2>
              <span
                className="font-pixel-arcade text-y2k-navy"
                style={{ fontSize: 13, letterSpacing: '0.15em' }}
              >
                COLLECTION
              </span>
            </div>
            <span
              className="font-pixel-arcade text-y2k-navy"
              style={{ fontSize: 13, letterSpacing: '0.1em' }}
            >
              {String(items.length).padStart(2, '0')} ITEMS
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6">
            {items.length === 0 ? (
              // 空状态 — pixel cloud + cubic 11 提示
              <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
                <div className="relative mb-6">
                  <PixelCloud size={64} color="var(--y2k-sky)" className="pixel-float-slow" />
                  <PixelHeart
                    size={20}
                    color="var(--y2k-coral)"
                    className="absolute pixel-float-fast"
                    style={{ top: -8, right: -10 }}
                  />
                </div>
                <p
                  className="font-pixel-cn text-ink-warm mb-2"
                  style={{ fontSize: 22, letterSpacing: '0.1em', lineHeight: 1.2 }}
                >
                  作品馆还是空的
                </p>
                <p
                  className="font-pixel-arcade text-y2k-navy arcade-blink mt-1"
                  style={{ fontSize: 13, letterSpacing: '0.2em' }}
                >
                  ▶ PIXEL YOUR FIRST WORK ◀
                </p>
                <p className="text-sm text-ink-soft mt-4 max-w-[24em] leading-relaxed">
                  完成并熨烫一件作品后，可以将它保存到这里
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-7 p-1">
                {items.map((item, idx) => (
                  <div key={item.id} className="relative">
                    <div
                      className="group relative cursor-pointer transition-transform hover:-translate-y-1"
                      style={{
                        backgroundColor: 'var(--bead-paper-bg)',
                        boxShadow: CARD_SHADOW,
                      }}
                      onClick={() => setSelected(item)}
                    >
                      {/* Thumbnail */}
                      <div
                        className="aspect-square bg-paper-soft overflow-hidden flex items-center justify-center p-2"
                        style={{
                          backgroundImage:
                            'radial-gradient(circle, rgba(44, 58, 94, 0.08) 1px, transparent 1px)',
                          backgroundSize: '10px 10px',
                          boxShadow: 'inset 0 -2px 0 var(--y2k-navy)',
                        }}
                      >
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-full h-full object-contain pixel-render"
                        />
                      </div>
                      {/* Info */}
                      <div className="p-2.5 bg-paper-bg">
                        {editingId === item.id ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              autoFocus
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && confirmEdit(item.id)}
                              className="flex-1 min-w-0 text-sm font-semibold bg-paper-bg text-ink-warm px-2 py-1.5 outline-none"
                              style={{
                                boxShadow: [
                                  '0 -1px 0 var(--y2k-navy)',
                                  '0 1px 0 var(--y2k-navy)',
                                  '-1px 0 0 var(--y2k-navy)',
                                  '1px 0 0 var(--y2k-navy)',
                                ].join(', '),
                              }}
                            />
                            <button
                              onClick={() => confirmEdit(item.id)}
                              className="inline-flex items-center justify-center w-8 h-8 bg-y2k-navy text-paper-bg shrink-0"
                              aria-label="确认重命名"
                            >
                              <Check className="w-4 h-4" aria-hidden="true" />
                            </button>
                          </div>
                        ) : (
                          <p className="font-pixel-cn text-ink-warm truncate" style={{ fontSize: 11, letterSpacing: '0.05em', lineHeight: 1.3 }}>
                            {item.title}
                          </p>
                        )}
                        <p
                          className="font-pixel-arcade text-y2k-navy mt-1.5"
                          style={{ fontSize: 12, letterSpacing: '0.08em' }}
                        >
                          {item.gridWidth}×{item.gridHeight} · {item.beadCount}b
                        </p>
                      </div>
                    </div>

                    {/* 序号徽章 #01 / #02 ... — pop 在卡角 */}
                    <div
                      className="absolute pointer-events-none z-20 font-pixel-arcade text-paper-bg"
                      style={{
                        top: -10,
                        left: -8,
                        backgroundColor: idx % 3 === 0 ? 'var(--y2k-coral)' : idx % 3 === 1 ? 'var(--y2k-mint)' : 'var(--bead-honey)',
                        fontSize: 13,
                        padding: '3px 5px',
                        letterSpacing: '0.05em',
                        boxShadow: [
                          '0 -1px 0 var(--y2k-navy)',
                          '0 1px 0 var(--y2k-navy)',
                          '-1px 0 0 var(--y2k-navy)',
                          '1px 0 0 var(--y2k-navy)',
                          '2px 2px 0 var(--y2k-navy-deep)',
                        ].join(', '),
                      }}
                    >
                      #{String(idx + 1).padStart(2, '0')}
                    </div>

                    {/* 4 角珍 */}
                    <div className="absolute pointer-events-none" style={{ top: -3, left: -3, width: 3, height: 3, backgroundColor: 'var(--y2k-navy)' }} aria-hidden="true" />
                    <div className="absolute pointer-events-none" style={{ top: -3, right: -3, width: 3, height: 3, backgroundColor: 'var(--y2k-navy)' }} aria-hidden="true" />
                    <div className="absolute pointer-events-none" style={{ bottom: -3, left: -3, width: 3, height: 3, backgroundColor: 'var(--y2k-navy)' }} aria-hidden="true" />
                    <div className="absolute pointer-events-none" style={{ bottom: -3, right: -3, width: 3, height: 3, backgroundColor: 'var(--y2k-navy)' }} aria-hidden="true" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <CornerPearls />
      </div>

      {/* 详情弹层 PREVIEW.EXE */}
      {selected && (
        <div
          className="fixed inset-0 z-[510] flex items-end sm:items-center justify-center sm:p-6"
          style={{ backgroundColor: 'rgba(44, 58, 94, 0.65)' }}
          onClick={() => setSelected(null)}
        >
          <div
            className="relative max-w-2xl w-full max-h-[92vh] sm:max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative bg-paper-bg overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh]"
              style={{
                paddingTop: 28,
                boxShadow: WIN95_SHADOW,
                backgroundImage:
                  'radial-gradient(circle, rgba(44, 58, 94, 0.05) 1px, transparent 1px)',
                backgroundSize: '14px 14px',
              }}
            >
              <TitleBar name="PREVIEW.EXE" onClose={() => setSelected(null)} />

              {/* 标题 + 编辑 */}
              <div
                className="flex items-center justify-between px-5 sm:px-6 pt-4 pb-3 shrink-0"
                style={{ borderBottom: '2px solid var(--y2k-navy)' }}
              >
                {editingId === selected.id ? (
                  <div className="flex items-center gap-2 flex-1 mr-4 min-w-0">
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && confirmEdit(selected.id)}
                      className="flex-1 min-w-0 font-pixel-cn bg-paper-bg text-ink-warm px-3 py-2 outline-none"
                      style={{
                        fontSize: 15,
                        letterSpacing: '0.05em',
                        boxShadow: [
                          '0 -2px 0 var(--y2k-navy)',
                          '0 2px 0 var(--y2k-navy)',
                          '-2px 0 0 var(--y2k-navy)',
                          '2px 0 0 var(--y2k-navy)',
                        ].join(', '),
                      }}
                    />
                    <button
                      onClick={() => confirmEdit(selected.id)}
                      className="inline-flex items-center justify-center w-10 h-10 bg-y2k-navy text-paper-bg shrink-0"
                      aria-label="确认重命名"
                    >
                      <Check className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 min-w-0">
                    <h3
                      className="font-pixel-cn text-ink-warm truncate"
                      style={{ fontSize: 22, letterSpacing: '0.05em', lineHeight: 1.1 }}
                    >
                      {selected.title}
                    </h3>
                    <button
                      onClick={() => startEdit(selected)}
                      className="inline-flex items-center justify-center w-8 h-8 hover:bg-paper-deep transition-colors shrink-0"
                      aria-label="重命名作品"
                    >
                      <Pencil className="w-4 h-4 text-y2k-navy" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                {/* 缩略图区 — 内置 paper-soft 暖底 + dot grid */}
                <div
                  className="bg-paper-soft p-4 mb-5 flex items-center justify-center"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle, rgba(44, 58, 94, 0.08) 1px, transparent 1px)',
                    backgroundSize: '10px 10px',
                    boxShadow: [
                      '0 -2px 0 var(--y2k-navy)',
                      '0 2px 0 var(--y2k-navy)',
                      '-2px 0 0 var(--y2k-navy)',
                      '2px 0 0 var(--y2k-navy)',
                    ].join(', '),
                  }}
                >
                  <img
                    src={selected.thumbnailUrl}
                    alt={selected.title}
                    className="max-w-full max-h-[50vh] object-contain pixel-render"
                  />
                </div>

                {/* meta chip 行 — 全部像素 chip */}
                <div className="flex flex-wrap gap-2.5 mb-5">
                  <PixelMetaChip label={`${selected.gridWidth}×${selected.gridHeight}`} caption="GRID" color="var(--y2k-navy)" />
                  <PixelMetaChip label={`${selected.colorCount}`} caption="COLORS" color="var(--bead-moss)" />
                  <PixelMetaChip label={`${selected.beadCount}`} caption="BEADS" color="var(--y2k-coral)" />
                  {selected.ironingMethod && (
                    <PixelMetaChip label={selected.ironingMethod} caption="IRON" color="var(--bead-honey)" />
                  )}
                  <PixelMetaChip label={formatDate(selected.createdAt)} caption="DATE" color="var(--y2k-lavender-deep)" />
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  {/* 删除 — paper-soft + navy 步阶 + coral hard shadow */}
                  <button
                    onClick={() => {
                      if (window.confirm(`确定删除「${selected.title}」吗？`)) {
                        handleDelete(selected.id);
                      }
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 bg-paper-soft text-ink-warm font-pixel-cn transition-transform hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px]"
                    style={{
                      fontSize: 13,
                      letterSpacing: '0.1em',
                      boxShadow: [
                        '0 -2px 0 var(--y2k-navy)',
                        '0 2px 0 var(--y2k-navy)',
                        '-2px 0 0 var(--y2k-navy)',
                        '2px 0 0 var(--y2k-navy)',
                        '4px 4px 0 var(--y2k-coral)',
                      ].join(', '),
                    }}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    删除
                  </button>
                  {/* 下载 — 主 CTA arcade-pill (navy + coral hard shadow) */}
                  <button
                    onClick={() => handleDownload(selected)}
                    className="flex-1 arcade-pill font-pixel-cn text-paper-bg cursor-pointer"
                    style={{
                      backgroundColor: 'var(--y2k-navy)',
                      fontSize: 13,
                      letterSpacing: '0.1em',
                    }}
                  >
                    <Download className="w-4 h-4" aria-hidden="true" />
                    <span>下载图片</span>
                    <PixelArrow size={12} color="var(--bead-paper-bg)" />
                  </button>
                </div>
              </div>
            </div>

            <CornerPearls />
          </div>
        </div>
      )}
    </div>
  );
}

// 元数据 pixel chip — 上面像素徽章 label，下面 caption 小标
function PixelMetaChip({ label, caption, color }: { label: string; caption: string; color: string }) {
  return (
    <div className="inline-flex flex-col items-stretch">
      <span
        className="font-pixel-arcade text-paper-bg px-2.5 py-1"
        style={{
          backgroundColor: color,
          fontSize: 13,
          letterSpacing: '0.05em',
          boxShadow: [
            '0 -1px 0 var(--y2k-navy)',
            '0 1px 0 var(--y2k-navy)',
            '-1px 0 0 var(--y2k-navy)',
            '1px 0 0 var(--y2k-navy)',
          ].join(', '),
        }}
      >
        {label}
      </span>
      <span
        className="font-pixel-arcade text-y2k-navy text-center mt-1"
        style={{ fontSize: 12, letterSpacing: '0.1em' }}
      >
        {caption}
      </span>
    </div>
  );
}
