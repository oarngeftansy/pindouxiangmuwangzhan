import { useState, useEffect } from 'react';
import { X, Trash2, Download, Pencil, Check, Image as ImageIcon } from 'lucide-react';
import {
  getGallery,
  removeFromGallery,
  updateGalleryTitle,
  type GalleryItem,
} from '../utils/galleryUtils';

interface GalleryViewProps {
  onClose: () => void;
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
      className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center sm:p-4"
      style={{ backgroundColor: 'rgba(58, 52, 42, 0.6)' }}
    >
      <div className="relative bg-paper-soft border border-edge-sand rounded-t-card sm:rounded-card shadow-lg w-full max-w-4xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 sm:slide-in-from-bottom-0 sm:zoom-in-95">
        {/* 手机端 drag handle */}
        <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-bead bg-edge-sand" aria-hidden="true" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-edge-sand shrink-0">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-ink-warm" style={{ fontFamily: 'var(--font-headline)' }}>我的作品馆</h2>
            <p className="text-sm text-ink-soft mt-0.5" style={{ fontFamily: 'var(--font-num)' }}>{items.length} 件作品</p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-control hover:bg-paper-deep transition-colors"
            aria-label="关闭作品馆"
          >
            <X className="w-5 h-5 text-ink-soft" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
              <div className="w-20 h-20 bg-paper-deep border border-edge-sand rounded-card flex items-center justify-center mb-4">
                <ImageIcon className="w-10 h-10 text-ink-soft" aria-hidden="true" />
              </div>
              <p className="text-ink-warm font-semibold mb-1">作品馆还是空的</p>
              <p className="text-sm text-ink-soft max-w-[24em] leading-relaxed">完成并熨烫一件作品后，可以将它保存到这里</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-paper-bg border border-edge-sand rounded-surface overflow-hidden transition-colors hover:bg-paper-deep cursor-pointer group"
                  onClick={() => setSelected(item)}
                >
                  {/* Thumbnail */}
                  <div className="aspect-square bg-paper-soft overflow-hidden">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          autoFocus
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && confirmEdit(item.id)}
                          className="flex-1 min-w-0 text-sm font-semibold border border-moss bg-paper-bg text-ink-warm rounded-control px-2 py-2 outline-none focus:ring-2 focus:ring-moss"
                        />
                        <button
                          onClick={() => confirmEdit(item.id)}
                          className="inline-flex items-center justify-center min-h-[36px] min-w-[36px] rounded-control bg-moss text-paper-bg hover:bg-moss-deep transition-colors shrink-0"
                          aria-label="确认重命名"
                        >
                          <Check className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm font-semibold text-ink-warm truncate">{item.title}</p>
                    )}
                    <p className="text-xs text-ink-soft mt-0.5" style={{ fontFamily: 'var(--font-num)' }}>{formatDate(item.createdAt)}</p>
                    <p className="text-xs text-ink-soft" style={{ fontFamily: 'var(--font-num)' }}>
                      {item.gridWidth}×{item.gridHeight} · {item.colorCount} 色 · {item.beadCount} 颗
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 详情弹窗 */}
      {selected && (
        <div
          className="fixed inset-0 z-[510] flex items-end sm:items-center justify-center sm:p-4"
          style={{ backgroundColor: 'rgba(58, 52, 42, 0.7)' }}
          onClick={() => setSelected(null)}
        >
          <div
            className="relative bg-paper-soft border border-edge-sand rounded-t-card sm:rounded-card shadow-lg max-w-2xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 sm:slide-in-from-bottom-0 sm:zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 手机端 drag handle */}
            <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-bead bg-edge-sand" aria-hidden="true" />

            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-edge-sand">
              {editingId === selected.id ? (
                <div className="flex items-center gap-2 flex-1 mr-4 min-w-0">
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && confirmEdit(selected.id)}
                    className="flex-1 min-w-0 text-base sm:text-lg font-semibold border border-moss bg-paper-bg text-ink-warm rounded-control px-3 py-2 outline-none focus:ring-2 focus:ring-moss"
                  />
                  <button
                    onClick={() => confirmEdit(selected.id)}
                    className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-control bg-moss text-paper-bg hover:bg-moss-deep transition-colors shrink-0"
                    aria-label="确认重命名"
                  >
                    <Check className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="text-lg font-semibold text-ink-warm truncate" style={{ fontFamily: 'var(--font-headline)' }}>{selected.title}</h3>
                  <button
                    onClick={() => startEdit(selected)}
                    className="inline-flex items-center justify-center min-h-[36px] min-w-[36px] rounded-control hover:bg-paper-deep transition-colors shrink-0"
                    aria-label="重命名作品"
                  >
                    <Pencil className="w-4 h-4 text-ink-soft" aria-hidden="true" />
                  </button>
                </div>
              )}
              <button
                onClick={() => setSelected(null)}
                className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-control hover:bg-paper-deep transition-colors shrink-0"
                aria-label="关闭详情"
              >
                <X className="w-5 h-5 text-ink-soft" aria-hidden="true" />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <div className="bg-paper-bg border border-edge-sand rounded-surface p-4 mb-4 flex items-center justify-center">
                <img
                  src={selected.thumbnailUrl}
                  alt={selected.title}
                  className="max-w-full max-h-[50vh] object-contain rounded-control"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>

              <div className="flex flex-wrap gap-2 mb-4 text-sm">
                {/* 尺寸：中性信息 paper-deep ghost */}
                <span className="px-3 py-1.5 bg-paper-deep border border-edge-sand text-ink-warm rounded-chip font-semibold" style={{ fontFamily: 'var(--font-num)' }}>
                  {selected.gridWidth}×{selected.gridHeight} 格
                </span>
                {/* 颜色数：moss 重音 */}
                <span className="px-3 py-1.5 bg-paper-deep border border-edge-sand text-moss rounded-chip font-semibold" style={{ fontFamily: 'var(--font-num)' }}>
                  {selected.colorCount} 种色
                </span>
                {/* 颗数：中性 */}
                <span className="px-3 py-1.5 bg-paper-deep border border-edge-sand text-ink-warm rounded-chip font-semibold" style={{ fontFamily: 'var(--font-num)' }}>
                  {selected.beadCount} 颗
                </span>
                {selected.ironingMethod && (
                  /* 烫法：honey-glow 高亮（特定的"工艺记号"） */
                  <span className="px-3 py-1.5 bg-honey-glow/40 border border-honey/40 text-ink-warm rounded-chip font-semibold">
                    {selected.ironingMethod}
                  </span>
                )}
                {/* 日期：最弱信息 */}
                <span className="px-3 py-1.5 bg-paper-bg border border-edge-sand text-ink-soft rounded-chip" style={{ fontFamily: 'var(--font-num)' }}>
                  {formatDate(selected.createdAt)}
                </span>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                  onClick={() => {
                    if (window.confirm(`确定删除「${selected.title}」吗？`)) {
                      handleDelete(selected.id);
                    }
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] py-3 bg-paper-bg border border-edge-sand text-ink-warm rounded-control hover:bg-alert-rose/10 hover:border-alert-rose hover:text-alert-rose transition-colors font-semibold focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  删除
                </button>
                <button
                  onClick={() => handleDownload(selected)}
                  className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] py-3 bg-terracotta text-paper-bg rounded-control hover:bg-terracotta-deep transition-colors font-semibold focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
                  style={{ boxShadow: 'var(--shadow-lift-bead)' }}
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  下载图片
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
