import { useEffect, useState } from 'react';
import { Library, ArrowLeft } from 'lucide-react';
import { ImageUploader } from './components/ImageUploader';
import { BeadCanvas } from './components/BeadCanvas';
import { BeadPattern } from './components/BeadPattern';
import { BlindBoxPanel } from './components/BlindBoxPanel';
import { TrendingPatternsPanel } from './components/TrendingPatternsPanel';
import { GalleryView } from './components/GalleryView';
import {
  PixelCloud,
  PixelHeart,
  PixelStar,
  PixelBadge,
  ChromeHalo,
} from './components/PixelDecorations';
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


// 暂时隐藏每日盲盒入口；将来重启用时改回 true，副标题与右侧栏会一起恢复。
const SHOW_BLIND_BOX_PANEL = false;

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
    <div
      className="min-h-screen text-ink-warm relative overflow-x-hidden"
      style={{
        // NJ.kr 街机 kiosk vibe：sky-blue → cream 竖向渐变 + 暗淡 dot grid 桌面感
        backgroundColor: 'var(--bead-paper-bg)',
        backgroundImage: [
          'radial-gradient(circle, rgba(58, 52, 42, 0.06) 1px, transparent 1px)',
          'linear-gradient(180deg, var(--y2k-sky) 0%, var(--y2k-sky) 12%, color-mix(in oklch, var(--y2k-sky) 50%, var(--bead-paper-bg)) 42%, var(--bead-paper-bg) 75%)',
        ].join(', '),
        backgroundSize: '24px 24px, 100% 100%',
        backgroundAttachment: 'scroll, fixed',
      }}
    >
      {showGallery && (
        <GalleryView
          onClose={() => {
            setShowGallery(false);
            setGalleryCount(getGallery().length);
          }}
        />
      )}
      {/* Header — 跟随 sky→cream 渐变底（半透磨砂），navy 描边作为冷锚 */}
      <header
        className="relative z-10"
        style={{
          backgroundColor: 'rgba(252, 248, 230, 0.72)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderBottom: '1px solid var(--y2k-navy)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <BeadLogoMark className="w-9 h-9 sm:w-10 sm:h-10 shrink-0" />
              <h1
                className="text-xl sm:text-3xl text-ink-warm leading-none truncate font-pixel-cn"
                style={{ letterSpacing: '0.03em' }}
              >
                拼豆模拟器
              </h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => { setShowGallery(true); }}
                className="relative inline-flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] sm:min-w-0 px-3 sm:px-4 py-2 bg-paper-soft text-ink-warm transition-colors hover:bg-paper-deep"
                style={{
                  // splash 风像素按钮：1px 步阶外边 + 2px lavender 硬阴影
                  boxShadow: [
                    '0 -2px 0 var(--bead-ink)', '0 2px 0 var(--bead-ink)',
                    '-2px 0 0 var(--bead-ink)', '2px 0 0 var(--bead-ink)',
                    '3px 3px 0 var(--y2k-navy)',
                  ].join(', '),
                }}
                aria-label="打开作品馆"
              >
                <Library className="w-5 h-5 sm:w-4 sm:h-4 text-terracotta" aria-hidden="true" />
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
                  className="inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] sm:min-w-0 px-3 sm:px-4 py-2 bg-paper-soft text-sm font-semibold text-ink-warm hover:bg-paper-deep transition-colors"
                  style={{
                    boxShadow: [
                      '0 -2px 0 var(--bead-ink)', '0 2px 0 var(--bead-ink)',
                      '-2px 0 0 var(--bead-ink)', '2px 0 0 var(--bead-ink)',
                      '3px 3px 0 var(--y2k-navy)',
                    ].join(', '),
                  }}
                  aria-label="返回首页"
                >
                  <ArrowLeft className="w-5 h-5 sm:w-4 sm:h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">返回首页</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-[1240px] mx-auto px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        {mode === 'upload' && (
          <div className="space-y-8">
            <section className="relative px-1 pt-10 pb-10 text-center">
              {/* 浮动 pixel 装饰 — NJ kiosk 全彩 pastel pop（云 sky/lavender、
                  心 coral/honey、星 mint/terracotta）。配 sky→cream 渐变底，
                  上半冷色装饰、下半暖色装饰自然融入背景 */}
              <PixelCloud
                size={48}
                color="var(--y2k-sky)"
                className="absolute pixel-float"
                style={{ top: 8, left: '8%' }}
              />
              <PixelCloud
                size={36}
                color="var(--y2k-lavender)"
                className="absolute pixel-float-slow"
                style={{ top: 28, right: '10%' }}
              />
              <PixelHeart
                size={20}
                color="var(--y2k-coral)"
                className="absolute pixel-float-fast"
                style={{ top: 60, left: '18%' }}
              />
              <PixelStar
                size={16}
                color="var(--y2k-mint)"
                className="absolute pixel-float"
                style={{ top: 90, right: '20%' }}
              />
              <PixelStar
                size={12}
                color="var(--bead-terracotta)"
                className="absolute pixel-float-slow"
                style={{ bottom: 60, left: '12%' }}
              />
              <PixelHeart
                size={14}
                color="var(--bead-honey)"
                className="absolute pixel-float-fast"
                style={{ bottom: 40, right: '14%' }}
              />

              {/* 顶部街机机厅闪烁标语 — coral pop */}
              <p
                className="font-pixel-arcade text-y2k-coral arcade-blink mb-4"
                style={{ fontSize: 9, letterSpacing: '0.25em' }}
              >
                ▶ INSERT COIN ◀
              </p>

              {/* chrome italic wordmark + halo arc — NJ 银色 chrome */}
              <div className="relative inline-block">
                {/* chrome halo 椭圆环 — navy 描线（跟 chrome 银色底色一致） */}
                <ChromeHalo
                  width={420}
                  height={92}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ width: 'clamp(280px, 65vw, 460px)' }}
                  color="var(--y2k-navy)"
                />
                <h1
                  className="font-chrome leading-[0.95] relative"
                  style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)' }}
                >
                  pindou.studio
                </h1>
                <span
                  className="sparkle sparkle-lg sparkle-twinkle absolute"
                  style={{ top: -8, left: -22, ['--sparkle-color' as string]: 'var(--y2k-sky)' }}
                  aria-hidden="true"
                />
                <span
                  className="sparkle sparkle-twinkle absolute"
                  style={{ top: 4, right: -26, ['--sparkle-color' as string]: 'var(--y2k-coral)', animationDelay: '600ms' }}
                  aria-hidden="true"
                />
                <span
                  className="sparkle sparkle-sm sparkle-twinkle absolute"
                  style={{ bottom: -4, left: '40%', ['--sparkle-color' as string]: 'var(--y2k-mint)', animationDelay: '1200ms' }}
                  aria-hidden="true"
                />
              </div>

              {/* 主 tagline —— "赛博拼豆"，1UP coral / GO! mint pastel pop 徽章 */}
              <div className="relative inline-flex items-center justify-center gap-4 mt-7">
                <PixelBadge text="1UP" color="var(--y2k-coral)" />
                <p
                  className="font-pixel-cn text-ink-warm"
                  style={{
                    fontSize: 'clamp(1.5rem, 4.5vw, 2.5rem)',
                    letterSpacing: '0.25em',
                  }}
                >
                  赛博拼豆
                </p>
                <PixelBadge text="GO!" color="var(--y2k-mint)" />
              </div>

              <p
                className="font-pixel-arcade text-y2k-navy mt-4"
                style={{ fontSize: 9, letterSpacing: '0.2em' }}
              >
                EST · 2026 · V1.0
              </p>
            </section>
            {SHOW_BLIND_BOX_PANEL ? (
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
            ) : (
              <section className="w-full">
                <ImageUploader
                  onImageProcessed={handleImageProcessed}
                  onCreateBlank={handleCreateBlank}
                />
              </section>
            )}
            {/* 图鉴在上传区下方作为灵感入口 — 用户先看到主 CTA，再被现成图纸吸引 */}
            <TrendingPatternsPanel onUsePattern={handleUseBlindBox} />
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
