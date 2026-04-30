import { useState, useEffect } from 'react';
import { X, Trash2, Download, Pencil, Check, Image } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black/70 z-[500] flex items-center justify-center p-4">
      <div className="bg-[#f3f1ec] rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#d7d1c3] shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-[#1f2937]">我的作品馆</h2>
            <p className="text-sm text-[#6b7280] mt-0.5">{items.length} 件作品</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#e5e0d8] transition-colors"
          >
            <X className="w-5 h-5 text-[#6b7280]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-[#e5e0d8] rounded-2xl flex items-center justify-center mb-4">
                <Image className="w-10 h-10 text-[#9ca3af]" />
              </div>
              <p className="text-[#6b7280] font-medium mb-1">作品馆还是空的</p>
              <p className="text-sm text-[#9ca3af]">完成并熨烫一件作品后，可以将它保存到这里</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#e5e0d8] hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => setSelected(item)}
                >
                  {/* Thumbnail */}
                  <div className="aspect-square bg-[#f9f8f5] overflow-hidden">
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
                          className="flex-1 text-sm font-semibold border border-[#1f5c57] rounded-lg px-2 py-0.5 outline-none"
                        />
                        <button
                          onClick={() => confirmEdit(item.id)}
                          className="p-1 rounded-lg bg-[#1f5c57] text-white"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm font-semibold text-[#1f2937] truncate">{item.title}</p>
                    )}
                    <p className="text-xs text-[#9ca3af] mt-0.5">{formatDate(item.createdAt)}</p>
                    <p className="text-xs text-[#9ca3af]">
                      {item.gridWidth}×{item.gridHeight} · {item.colorCount} 色 · {item.beadCount} 颗豆
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
          className="fixed inset-0 bg-black/80 z-[510] flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              {editingId === selected.id ? (
                <div className="flex items-center gap-2 flex-1 mr-4">
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && confirmEdit(selected.id)}
                    className="flex-1 text-lg font-semibold border border-[#1f5c57] rounded-xl px-3 py-1 outline-none"
                  />
                  <button
                    onClick={() => confirmEdit(selected.id)}
                    className="p-2 rounded-xl bg-[#1f5c57] text-white"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-[#1f2937]">{selected.title}</h3>
                  <button
                    onClick={() => startEdit(selected)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              )}
              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 rounded-2xl p-4 mb-4 flex items-center justify-center">
                <img
                  src={selected.thumbnailUrl}
                  alt={selected.title}
                  className="max-w-full max-h-[50vh] object-contain rounded-lg shadow"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>

              <div className="flex flex-wrap gap-2 mb-4 text-sm">
                <span className="px-3 py-1 bg-[#e8f4f1] text-[#1f5c57] rounded-full font-medium">
                  {selected.gridWidth}×{selected.gridHeight} 格
                </span>
                <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full font-medium">
                  {selected.colorCount} 种颜色
                </span>
                <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full font-medium">
                  {selected.beadCount} 颗豆
                </span>
                {selected.ironingMethod && (
                  <span className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full font-medium">
                    {selected.ironingMethod}
                  </span>
                )}
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                  {formatDate(selected.createdAt)}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (window.confirm(`确定删除「${selected.title}」吗？`)) {
                      handleDelete(selected.id);
                    }
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
                <button
                  onClick={() => handleDownload(selected)}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:opacity-90 transition-opacity font-semibold flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
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
