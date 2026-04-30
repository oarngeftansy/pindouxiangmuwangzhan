import { useEffect, useState } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { BeadCanvas } from './components/BeadCanvas';
import { BeadPattern } from './components/BeadPattern';
import { BlindBoxPanel } from './components/BlindBoxPanel';
import { TrendingPatternsPanel } from './components/TrendingPatternsPanel';
import { GalleryView } from './components/GalleryView';
import { getGallery } from './utils/galleryUtils';
import { beadColors } from './data/beadColors';
import type { BeadColor, BeadGrid, ColorSystem } from './types';

export type { BeadColor, BeadGrid, ColorSystem };
export { beadColors };


function App() {
  const DRAFT_STORAGE_KEY = 'bead_draft_v1';
  const [mode, setMode] = useState<'upload' | 'pattern' | 'canvas'>('upload');
  const [showGallery, setShowGallery] = useState(false);
  const [galleryCount, setGalleryCount] = useState(() => getGallery().length);
  const [selectedColor, setSelectedColor] = useState<string>(beadColors[2].hex);
  const [beadGrid, setBeadGrid] = useState<BeadGrid>([]);
  const [colorSystem, setColorSystem] = useState<ColorSystem>('mard');
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
  const [referenceGrid, setReferenceGrid] = useState<BeadGrid>([]);

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!saved) return;

    try {
      const draft = JSON.parse(saved) as {
        mode?: 'upload' | 'pattern' | 'canvas';
        selectedColor?: string;
        beadGrid?: BeadGrid;
        referenceGrid?: BeadGrid;
        colorSystem?: ColorSystem;
        originalImageSrc?: string | null;
      };

      const hasGrid = Array.isArray(draft.beadGrid) && draft.beadGrid.length > 0;
      if (!hasGrid) return;

      const restoredGrid = draft.beadGrid!.map((row) => [...row]);
      const restoredReference =
        Array.isArray(draft.referenceGrid) && draft.referenceGrid.length > 0
          ? draft.referenceGrid.map((row) => [...row])
          : restoredGrid.map((row) => [...row]);

      setBeadGrid(restoredGrid);
      setReferenceGrid(restoredReference);
      setSelectedColor(draft.selectedColor || beadColors[2].hex);
      setColorSystem(draft.colorSystem || 'mard');
      setMode(draft.mode === 'canvas' || draft.mode === 'pattern' ? draft.mode : 'canvas');

      if (draft.originalImageSrc) {
        const restoredImage = new Image();
        restoredImage.onload = () => setOriginalImage(restoredImage);
        restoredImage.src = draft.originalImageSrc;
        setOriginalImageSrc(draft.originalImageSrc);
      }
    } catch {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (mode === 'upload' || beadGrid.length === 0) return;

    const timer = setTimeout(() => {
      const draft = {
        mode,
        selectedColor,
        beadGrid,
        referenceGrid,
        colorSystem,
        originalImageSrc,
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    }, 350);

    return () => clearTimeout(timer);
  }, [
    mode,
    selectedColor,
    beadGrid,
    referenceGrid,
    colorSystem,
    originalImageSrc,
  ]);

  const handleImageProcessed = (grid: BeadGrid, image?: HTMLImageElement) => {
    setBeadGrid(grid.map(row => [...row]));
    setReferenceGrid(grid.map(row => [...row])); // 保存参考图纸
    if (image) {
      setOriginalImage(image);
      setOriginalImageSrc(image.currentSrc || image.src || null);
    } else {
      setOriginalImage(null);
      setOriginalImageSrc(null);
    }
    setMode('pattern');
  };

  const handleCreateBlank = (width: number, height: number) => {
    const grid: BeadGrid = Array(height).fill(null).map(() => Array(width).fill(null));
    setBeadGrid(grid);
    setReferenceGrid(grid.map(row => [...row]));
    setOriginalImage(null);
    setOriginalImageSrc(null);
    setMode('canvas');
  };

  const handleStartDIY = () => {
    // 清空 beadGrid（图案保留在 referenceGrid），避免 BeadCanvas 初始化时显示全部已拼好
    setBeadGrid(prev => prev.map(row => row.map(() => null)));
    setMode('canvas');
  };

  const handleGridResize = (grid: BeadGrid) => {
    setBeadGrid(grid);
    setReferenceGrid(grid.map(row => [...row])); // 更新参考图纸
  };

  const handleBackToUpload = () => {
    setMode('upload');
    setBeadGrid([]);
    setReferenceGrid([]);
    setOriginalImage(null);
    setOriginalImageSrc(null);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  };

  const handleUseBlindBox = (grid: BeadGrid) => {
    setBeadGrid(grid.map(row => [...row]));
    setReferenceGrid(grid.map(row => [...row]));
    setOriginalImage(null);
    setOriginalImageSrc(null);
    setMode('pattern');
  };

  return (
    <div className="min-h-screen bg-[#f3f1ec] relative overflow-x-hidden">
      {showGallery && (
        <GalleryView
          onClose={() => {
            setShowGallery(false);
            setGalleryCount(getGallery().length);
          }}
        />
      )}
      {/* Header */}
      <header className="relative z-10 bg-[#f3f1ec] border-b border-[#d7d1c3]">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1f5c57] rounded-md flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="8" cy="8" r="2" />
                  <circle cx="16" cy="8" r="2" />
                  <circle cx="8" cy="16" r="2" />
                  <circle cx="16" cy="16" r="2" />
                </svg>
              </div>
              <h1 className="text-lg sm:text-2xl font-semibold text-[#1f2937] tracking-tight">
                拼豆模拟器
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShowGallery(true); }}
                className="relative px-4 py-2 bg-white border border-[#d5d0c4] rounded-lg hover:bg-[#f3f1eb] transition-colors flex items-center gap-2"
              >
                <span>🏛️</span>
                <span className="hidden sm:inline text-sm font-medium">作品馆</span>
                {galleryCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#1f5c57] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {galleryCount > 99 ? '99+' : galleryCount}
                  </span>
                )}
              </button>
              {mode !== 'upload' && (
                <button
                  onClick={handleBackToUpload}
                  className="px-4 py-2 bg-white border border-[#d5d0c4] rounded-lg hover:bg-[#f3f1eb] transition-colors"
                >
                  返回首页
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-[1240px] mx-auto px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
        {mode === 'upload' && (
          <div className="space-y-5">
            <section className="rounded-lg border border-[#d7d1c3] bg-white px-5 py-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[#1f5c57] font-semibold">Bead Studio</p>
              <h2 className="text-xl sm:text-[30px] leading-tight font-semibold text-[#1f2937] mt-1">上传图片或抽取盲盒，开始今天的拼豆作品</h2>
            </section>
            <TrendingPatternsPanel onUsePattern={handleUseBlindBox} />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <section className="lg:col-span-8">
              <ImageUploader
                onImageProcessed={handleImageProcessed}
                onCreateBlank={handleCreateBlank}
              />
            </section>
            <aside className="lg:col-span-4 lg:sticky lg:top-6">
              <p className="text-sm text-[#5b6470] mb-3 px-1">
                每日随机挑战入口：不需要下滑，在这里直接抽盲盒。
              </p>
              <BlindBoxPanel onUsePattern={handleUseBlindBox} compact />
            </aside>
          </div>
          </div>
        )}

        {mode === 'pattern' && (
          <BeadPattern
            beadGrid={beadGrid}
            beadColors={beadColors}
            onStartDIY={handleStartDIY}
            colorSystem={colorSystem}
            originalImage={originalImage}
            onGridResize={handleGridResize}
          />
        )}

        {mode === 'canvas' && (
          <BeadCanvas
            beadGrid={beadGrid}
            setBeadGrid={setBeadGrid}
            selectedColor={selectedColor}
            onColorSelect={setSelectedColor}
            onGridResize={handleGridResize}
            beadColors={beadColors}
            colorSystem={colorSystem}
            referenceGrid={referenceGrid}
          />
        )}
      </main>
    </div>
  );
}

export default App;
