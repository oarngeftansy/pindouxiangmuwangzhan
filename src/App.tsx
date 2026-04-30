import { useEffect, useState } from 'react';
import { Library } from 'lucide-react';
import { ImageUploader } from './components/ImageUploader';
import { BeadCanvas } from './components/BeadCanvas';
import { BeadPattern } from './components/BeadPattern';
import { BlindBoxPanel } from './components/BlindBoxPanel';
import { TrendingPatternsPanel } from './components/TrendingPatternsPanel';
import { GalleryView } from './components/GalleryView';
import { getGallery } from './utils/galleryUtils';
import { beadColors } from './data/beadColors';
import type { BeadColor, BeadGrid, ColorSystem } from './types';

// 2×2 拼豆颗粒方阵 logo——四颗真实色卡
function BeadLogoMark({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7.5" fill="var(--bead-terracotta)" />
      <circle cx="29" cy="11" r="7.5" fill="var(--bead-moss)" />
      <circle cx="11" cy="29" r="7.5" fill="var(--bead-honey)" />
      <circle cx="29" cy="29" r="7.5" fill="var(--bead-ink)" />
      {/* 微微塑料反光 */}
      <circle cx="9" cy="9" r="1.6" fill="rgba(255,255,255,0.55)" />
      <circle cx="27" cy="9" r="1.6" fill="rgba(255,255,255,0.55)" />
      <circle cx="9" cy="27" r="1.6" fill="rgba(255,255,255,0.55)" />
      <circle cx="27" cy="27" r="1.6" fill="rgba(255,255,255,0.55)" />
    </svg>
  );
}

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
    <div className="min-h-screen bg-paper-bg text-ink-warm relative overflow-x-hidden">
      {showGallery && (
        <GalleryView
          onClose={() => {
            setShowGallery(false);
            setGalleryCount(getGallery().length);
          }}
        />
      )}
      {/* Header */}
      <header className="relative z-10 bg-paper-bg border-b border-edge-sand">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BeadLogoMark className="w-10 h-10" />
              <h1
                className="text-2xl sm:text-3xl text-ink-warm leading-none"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                拼豆模拟器
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShowGallery(true); }}
                className="relative inline-flex items-center gap-2 px-3.5 py-2 bg-paper-soft border border-edge-sand rounded-control text-ink-warm hover:bg-paper-deep transition-colors"
                aria-label="打开作品馆"
              >
                <Library className="w-4 h-4 text-terracotta" aria-hidden="true" />
                <span className="hidden sm:inline text-sm font-semibold">作品馆</span>
                {galleryCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-honey text-ink-warm text-[10px] font-bold rounded-full flex items-center justify-center"
                    style={{ fontFamily: 'var(--font-num)' }}
                    aria-label={`已收藏 ${galleryCount} 个作品`}
                  >
                    {galleryCount > 99 ? '99+' : galleryCount}
                  </span>
                )}
              </button>
              {mode !== 'upload' && (
                <button
                  onClick={handleBackToUpload}
                  className="px-3.5 py-2 bg-paper-soft border border-edge-sand rounded-control text-sm font-semibold text-ink-warm hover:bg-paper-deep transition-colors"
                >
                  返回首页
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-[1240px] mx-auto px-3 py-6 sm:px-6 sm:py-10 lg:px-8">
        {mode === 'upload' && (
          <div className="space-y-8">
            <section className="px-1 pt-2 pb-1">
              <h2
                className="text-ink-warm leading-[1.1]"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(2rem, 5.5vw, 3.25rem)',
                }}
              >
                今天想拼点什么？
              </h2>
              <p className="text-base sm:text-lg text-ink-soft mt-3 max-w-[34em] leading-[1.65]">
                上传一张图、抽个盲盒，或者从下面挑一份图鉴——都从这里开始。
              </p>
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
