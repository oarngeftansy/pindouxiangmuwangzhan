import { Upload, Grid, Settings, Camera, Palette, FileDown, Sparkles } from 'lucide-react';
import { useState, useRef } from 'react';
import { BeadGrid, beadColors } from '../App';
import {
  PixelCloud,
  PixelHeart,
  PixelStar,
  PixelArrow,
  PixelJoystick,
  ArcadeButton,
  PixelBadge,
} from './PixelDecorations';
import { 
  rgbToLab, 
  deltaE2000, 
  deltaE76,
  rgbToHex, 
  findClosestColor,
  getAveragedColor
} from '../utils/colorMatching';
import { 
  simplifyImageColors,
  medianFilter,
  mergeSmallColorRegions,
  limitColorPalette
} from '../utils/colorSimplification';
import {
  kMeansColorQuantization,
  smoothColorRegions,
  edgePreservingSmooth
} from '../utils/advancedColorProcessing';

interface ImageUploaderProps {
  onImageProcessed: (grid: BeadGrid, image?: HTMLImageElement) => void;
  onCreateBlank: (width: number, height: number) => void;
}

export function ImageUploader({ onImageProcessed, onCreateBlank }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBlankModal, setShowBlankModal] = useState(false);
  const [showImageConfig, setShowImageConfig] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingImage, setPendingImage] = useState<HTMLImageElement | null>(null);
  
  // 配置选项 - 默认更小的尺寸减少豆子数量
  const [gridWidth, setGridWidth] = useState(30);
  const [gridHeight, setGridHeight] = useState(30);
  const [colorMergeThreshold, setColorMergeThreshold] = useState(20); // 降低默认值，保持颜色准确性
  const [processMode, setProcessMode] = useState<'cartoon' | 'photo'>('cartoon');
  const [useDithering, setUseDithering] = useState(false); // 默认关闭抖动减少杂色
  const [maxColors, setMaxColors] = useState(16); // 限制最大颜色数量，稍微放宽
  const [useAdvancedProcessing, setUseAdvancedProcessing] = useState(true); // 使用高级处理
  const [detailLevel, setDetailLevel] = useState<'low' | 'medium' | 'high'>('medium'); // 细节保留级别
  
  // 空白画布尺寸
  const [blankWidth, setBlankWidth] = useState(30);
  const [blankHeight, setBlankHeight] = useState(30);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 高斯模糊算法 - 用于平滑图片过渡
  const applyGaussianBlur = (
    imageData: ImageData, 
    width: number, 
    height: number, 
    radius: number
  ): ImageData => {
    const pixels = imageData.data;
    const output = new ImageData(width, height);
    const outPixels = output.data;
    
    // 简化的高斯核（3x3）
    const kernel = [
      [1, 2, 1],
      [2, 4, 2],
      [1, 2, 1]
    ];
    const kernelSum = 16;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0;
        
        // 应用卷积核
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const px = Math.max(0, Math.min(width - 1, x + kx));
            const py = Math.max(0, Math.min(height - 1, y + ky));
            const i = (py * width + px) * 4;
            const weight = kernel[ky + 1][kx + 1];
            
            r += pixels[i] * weight;
            g += pixels[i + 1] * weight;
            b += pixels[i + 2] * weight;
            a += pixels[i + 3] * weight;
          }
        }
        
        const i = (y * width + x) * 4;
        outPixels[i] = r / kernelSum;
        outPixels[i + 1] = g / kernelSum;
        outPixels[i + 2] = b / kernelSum;
        outPixels[i + 3] = a / kernelSum;
      }
    }
    
    return output;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setPendingFile(file);
      setShowImageConfig(true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      // 预加载图片以获取尺寸
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setPendingImage(img);
          
          // 根据原图尺寸智能推荐画布大小
          let width = img.naturalWidth;
          let height = img.naturalHeight;
          
          // 默认目标尺寸改为60，保留更多细节
          let maxSize = 60;
          
          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          
          // 确保至少有10x10的尺寸
          width = Math.max(10, width);
          height = Math.max(10, height);
          
          setGridWidth(width);
          setGridHeight(height);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
      setShowImageConfig(true);
    }
  };

  const handleCreateBlank = () => {
    onCreateBlank(blankWidth, blankHeight);
    setShowBlankModal(false);
  };

  const handleConfirmImageProcess = () => {
    if (pendingFile) {
      processImageFile(pendingFile);
    }
  };

  const processImageFile = (file: File) => {
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        canvas.width = gridWidth;
        canvas.height = gridHeight;

        // 启用高质量图片缩放
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, 0, 0, gridWidth, gridHeight);
        
        const imageData = ctx.getImageData(0, 0, gridWidth, gridHeight);
        const pixels = imageData.data;

        // 应用Floyd-Steinberg抖动算法改善颜色过渡（仅照片模式）
        let workingPixels = new Uint8ClampedArray(pixels);
        
        if (useDithering && processMode === 'photo') {
          for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
              const i = (y * gridWidth + x) * 4;
              const oldR = workingPixels[i];
              const oldG = workingPixels[i + 1];
              const oldB = workingPixels[i + 2];
              
              // 使用 Delta E 2000 找到最接近的豆子颜色
              const oldHex = rgbToHex(oldR, oldG, oldB);
              const newHex = findClosestColor(oldHex, beadColors, true);
              const newR = parseInt(newHex.slice(1, 3), 16);
              const newG = parseInt(newHex.slice(3, 5), 16);
              const newB = parseInt(newHex.slice(5, 7), 16);
              
              // 设置新颜色
              workingPixels[i] = newR;
              workingPixels[i + 1] = newG;
              workingPixels[i + 2] = newB;
              
              // 计算误差并分散到邻近像素 (Floyd-Steinberg)
              const errR = oldR - newR;
              const errG = oldG - newG;
              const errB = oldB - newB;
              
              const distributeError = (dx: number, dy: number, factor: number) => {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
                  const ni = (ny * gridWidth + nx) * 4;
                  workingPixels[ni] += errR * factor;
                  workingPixels[ni + 1] += errG * factor;
                  workingPixels[ni + 2] += errB * factor;
                }
              };
              
              distributeError(1, 0, 7/16);   // 右边像素
              distributeError(-1, 1, 3/16);  // 左下像素
              distributeError(0, 1, 5/16);   // 下方像素
              distributeError(1, 1, 1/16);   // 右下像素
            }
          }
        }

        // 生成拼豆网格 - 使用精确的像素采样
        let grid: BeadGrid = [];
        for (let y = 0; y < gridHeight; y++) {
          const row: (string | null)[] = [];
          for (let x = 0; x < gridWidth; x++) {
            const i = (y * gridWidth + x) * 4;
            const a = workingPixels[i + 3];

            if (a < 128) {
              row.push(null);
            } else {
              // 直接使用像素颜色，不进行区域采样，保留更多细节
              const r = workingPixels[i];
              const g = workingPixels[i + 1];
              const b = workingPixels[i + 2];
              
              const hex = rgbToHex(r, g, b);
              // 使用 Delta E 2000 进行精确颜色匹配
              const closestColor = findClosestColor(hex, beadColors, true);
              row.push(closestColor);
            }
          }
          grid.push(row);
        }

        // 后处理：仅在阈值较高时进行颜色合并
        if (colorMergeThreshold > 30) {
          // 合并小区域杂色
          const minRegionSize = Math.max(2, Math.floor(colorMergeThreshold / 20));
          grid = mergeSmallColorRegions(grid, beadColors, minRegionSize);
        }
        
        // 限制颜色数量（如果设置了，但放宽限制）
        if (maxColors > 0 && maxColors < 50) {
          grid = limitColorPalette(grid, beadColors, maxColors);
        }

        onImageProcessed(grid, img);
        setIsProcessing(false);
        setShowImageConfig(false);
        setPendingFile(null);
      };
      img.src = e.target?.result as string;
      setPendingImage(img);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full">
      {/* 街机 kiosk 容器 — UPLOAD.EXE 窗口外漂浮 pixel 装饰小物 */}
      <div className="relative mb-6 mx-auto" style={{ maxWidth: 600 }}>
        {/* 窗口外的浮动 pixel 装饰 — NJ 全彩 pastel pop */}
        <PixelCloud
          size={38}
          color="var(--y2k-sky)"
          className="absolute pixel-float-slow z-10"
          style={{ top: -16, left: -18 }}
        />
        <PixelCloud
          size={28}
          color="var(--y2k-lavender)"
          className="absolute pixel-float z-10"
          style={{ top: -22, right: 32 }}
        />
        <PixelStar
          size={14}
          color="var(--y2k-mint)"
          className="absolute pixel-float-fast z-10"
          style={{ top: 28, right: -16 }}
        />
        <PixelHeart
          size={16}
          color="var(--y2k-coral)"
          className="absolute pixel-float z-10"
          style={{ bottom: 28, left: -22 }}
        />

        <div
          className={`relative transition-transform ${
            isDragging ? 'translate-x-[2px] translate-y-[2px]' : ''
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          role="region"
          aria-label="上传图片"
        >
          {/* 主窗口体 */}
          <div
            className="relative bg-paper-bg"
            style={{
              padding: '36px 24px 26px 24px',
              boxShadow: [
                '0 -2px 0 var(--bead-ink)',
                '0 2px 0 var(--bead-ink)',
                '-2px 0 0 var(--bead-ink)',
                '2px 0 0 var(--bead-ink)',
                /* 硬阴影 navy — 跟 UPLOAD.EXE title bar 同色，chrome 一致 */
                '6px 6px 0 var(--y2k-navy)',
              ].join(', '),
              backgroundImage:
                'radial-gradient(circle, rgba(58, 52, 42, 0.07) 1px, transparent 1px)',
              backgroundSize: '14px 14px',
            }}
          >
            {/* Win95 风 title bar — 保留 navy 作为唯一冷锚点，让暖系画面有一处对比 */}
            <div
              className="absolute left-0 right-0 flex items-center justify-between px-2"
              style={{
                top: 2,
                height: 16,
                backgroundColor: 'var(--y2k-navy)',
                color: 'var(--bead-paper-bg)',
              }}
            >
              <span className="font-pixel-arcade" style={{ fontSize: 8, letterSpacing: 0 }}>
                UPLOAD.EXE
              </span>
              <div className="flex gap-0.5">
                <div className="w-2 h-2 bg-paper-bg/80" aria-hidden="true" />
                <div className="w-2 h-2 bg-paper-bg/80" aria-hidden="true" />
                <div className="w-2 h-2 bg-y2k-coral" aria-hidden="true" />
              </div>
            </div>

            {/* 窗口内角落 sparkle — NJ pop */}
            <span
              className="sparkle sparkle-sm sparkle-twinkle absolute"
              style={{ top: 28, right: 22, ['--sparkle-color' as string]: 'var(--y2k-coral)' }}
              aria-hidden="true"
            />
            <span
              className="sparkle sparkle-sm sparkle-twinkle absolute"
              style={{ top: 64, left: 28, ['--sparkle-color' as string]: 'var(--y2k-mint)', animationDelay: '400ms' }}
              aria-hidden="true"
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="relative flex flex-col items-center justify-center text-center pt-3">
              {isProcessing ? (
                <>
                  <PixelBadge text="PROCESSING" color="var(--bead-terracotta)" className="mb-4" />
                  <div
                    className="w-56 h-3 bg-paper-deep overflow-hidden"
                    style={{
                      boxShadow: [
                        '0 -1px 0 var(--bead-ink)',
                        '0 1px 0 var(--bead-ink)',
                        '-1px 0 0 var(--bead-ink)',
                        '1px 0 0 var(--bead-ink)',
                      ].join(', '),
                    }}
                  >
                    <div className="h-full bg-terracotta animate-pulse" />
                  </div>
                  <p
                    className="font-pixel-arcade text-y2k-navy arcade-blink mt-3"
                    style={{ fontSize: 9, letterSpacing: '0.2em' }}
                  >
                    PIXELATING<span>...</span>
                  </p>
                </>
              ) : (
                <>
                  {/* "赛博拼豆"主标题 — 锁到 33px = Cubic 11 字号 3× 倍数，硬像素无糊 */}
                  <p
                    className="font-pixel-cn text-ink-warm mb-1"
                    style={{
                      fontSize: 33,
                      letterSpacing: '0.25em',
                      lineHeight: 1.1,
                    }}
                  >
                    赛博拼豆
                  </p>
                  <p
                    className="font-pixel-arcade text-y2k-navy mb-5"
                    style={{ fontSize: 9, letterSpacing: '0.25em' }}
                  >
                    DROP IMAGE TO PIXELATE
                  </p>

                  {/* 主 CTA — NJ "ID Card" 同款：navy 深底 + coral 硬阴 + 银光泽 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="arcade-pill font-pixel-cn text-paper-bg cursor-pointer"
                    style={{
                      backgroundColor: 'var(--y2k-navy)',
                      fontSize: 15,
                      letterSpacing: '0.1em',
                    }}
                  >
                    <span>插入图片</span>
                    <PixelArrow size={14} color="var(--bead-paper-bg)" />
                  </button>

                  {/* 副提示 — 文件格式 */}
                  <p
                    className="font-pixel-arcade text-ink-soft mt-4"
                    style={{ fontSize: 8, letterSpacing: '0.18em' }}
                  >
                    JPG · PNG · GIF · 1-10 MB
                  </p>

                  {/* 底部街机控制台栏 — NJ 全彩 pop（红 coral / 黄 honey / 绿 mint / 蓝 sky） */}
                  <div className="mt-6 flex items-center justify-center gap-6 pt-3"
                    style={{ borderTop: '1px dashed var(--y2k-navy)' }}
                  >
                    <PixelJoystick size={22} ballColor="var(--y2k-coral)" />
                    <div className="flex items-center gap-2">
                      <ArcadeButton size={14} color="var(--y2k-coral)" />
                      <ArcadeButton size={14} color="var(--bead-honey)" />
                      <ArcadeButton size={14} color="var(--y2k-mint)" />
                      <ArcadeButton size={14} color="var(--y2k-sky)" />
                    </div>
                    <PixelJoystick size={22} ballColor="var(--y2k-lavender-deep)" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 4 角像素角珍 (lavender) */}
          <div
            className="absolute"
            style={{ top: -4, left: -4, width: 4, height: 4, backgroundColor: 'var(--y2k-navy)' }}
            aria-hidden="true"
          />
          <div
            className="absolute"
            style={{ top: -4, right: -4, width: 4, height: 4, backgroundColor: 'var(--y2k-navy)' }}
            aria-hidden="true"
          />
          <div
            className="absolute"
            style={{ bottom: -4, left: -4, width: 4, height: 4, backgroundColor: 'var(--y2k-navy)' }}
            aria-hidden="true"
          />
          <div
            className="absolute"
            style={{ bottom: -4, right: -4, width: 4, height: 4, backgroundColor: 'var(--y2k-navy)' }}
            aria-hidden="true"
          />
        </div>

        {/* 窗口下方 PRESS START 闪烁标语 — 街机经典 */}
        <div className="mt-7 text-center">
          <p
            className="font-pixel-arcade text-y2k-coral arcade-blink"
            style={{ fontSize: 10, letterSpacing: '0.3em' }}
          >
            ▶ PRESS START ◀
          </p>
        </div>
      </div>

      {/* 辅助：空白画布入口 — 暖色 ghost link */}
      <div className="text-center mt-2">
        <button
          onClick={() => setShowBlankModal(true)}
          className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-terracotta transition-colors px-4 py-2 focus-visible:outline-2 focus-visible:outline-terracotta focus-visible:outline-offset-2"
        >
          <Grid className="w-4 h-4" aria-hidden="true" />
          <span>或者，从一张空白画布开始</span>
        </button>
      </div>

      {/* 图片处理配置模态框 */}
      {showImageConfig && pendingFile && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:p-4">
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-4 sm:p-8 max-w-lg w-full max-h-[92vh] sm:max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            {/* 手机端顶部 drag handle 视觉提示 */}
            <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-bead bg-edge-sand" aria-hidden="true" />
            <div className="flex items-center gap-3 mb-6 mt-2 sm:mt-0">
              <Settings className="w-6 h-6 text-moss" aria-hidden="true" />
              <h3 className="text-xl sm:text-2xl font-semibold text-ink-warm" style={{ fontFamily: 'var(--font-headline)' }}>图片转换设置</h3>
            </div>

            <div className="space-y-6">
              {/* 快捷预设 — 3 个按钮统一 ghost 形态，去除杂色渐变 */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-ink-warm">快捷预设</label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      setGridWidth(Math.min(40, Math.max(10, gridWidth)));
                      setGridHeight(Math.min(40, Math.max(10, gridHeight)));
                      setColorMergeThreshold(10);
                      setMaxColors(30);
                    }}
                    className="inline-flex flex-col items-center justify-center gap-1 min-h-[64px] px-3 py-3 bg-paper-bg border border-edge-sand rounded-control text-sm font-semibold text-ink-warm hover:bg-paper-deep transition-colors focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2 [&>*]:pointer-events-none"
                  >
                    <span>简单图案</span>
                    <span className="text-xs font-normal text-ink-soft">低豆子数</span>
                  </button>
                  <button
                    onClick={() => {
                      if (pendingImage) {
                        let width = pendingImage.naturalWidth;
                        let height = pendingImage.naturalHeight;
                        const maxSize = 60;
                        if (width > maxSize || height > maxSize) {
                          const ratio = Math.min(maxSize / width, maxSize / height);
                          width = Math.round(width * ratio);
                          height = Math.round(height * ratio);
                        }
                        setGridWidth(Math.max(10, width));
                        setGridHeight(Math.max(10, height));
                      }
                      setColorMergeThreshold(15);
                      setMaxColors(40);
                    }}
                    className="inline-flex flex-col items-center justify-center gap-1 min-h-[64px] px-3 py-3 bg-paper-bg border border-edge-sand rounded-control text-sm font-semibold text-ink-warm hover:bg-paper-deep transition-colors focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2 [&>*]:pointer-events-none"
                  >
                    <span>普通照片</span>
                    <span className="text-xs font-normal text-ink-soft">推荐</span>
                  </button>
                  <button
                    onClick={() => {
                      if (pendingImage) {
                        let width = pendingImage.naturalWidth;
                        let height = pendingImage.naturalHeight;
                        const maxSize = 90;
                        if (width > maxSize || height > maxSize) {
                          const ratio = Math.min(maxSize / width, maxSize / height);
                          width = Math.round(width * ratio);
                          height = Math.round(height * ratio);
                        }
                        setGridWidth(Math.min(120, Math.max(10, width)));
                        setGridHeight(Math.min(120, Math.max(10, height)));
                      }
                      setColorMergeThreshold(5);
                      setMaxColors(60);
                    }}
                    className="inline-flex flex-col items-center justify-center gap-1 min-h-[64px] px-3 py-3 bg-paper-bg border border-edge-sand rounded-control text-sm font-semibold text-ink-warm hover:bg-paper-deep transition-colors focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2 [&>*]:pointer-events-none"
                  >
                    <span>高清照片</span>
                    <span className="text-xs font-normal text-ink-soft">保留细节</span>
                  </button>
                </div>
                <div className="flex items-start gap-2 mt-2 text-xs text-ink-soft">
                  <Sparkles className="w-3.5 h-3.5 text-moss shrink-0 mt-0.5" aria-hidden="true" />
                  <p>照片建议用"普通照片"或"高清照片"预设以保留更多细节</p>
                </div>
              </div>

              {/* 画板尺寸 */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-ink-warm">画板尺寸（格子数量）</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-ink-soft mb-1">宽度</label>
                    <input
                      type="number"
                      min="10"
                      max="120"
                      value={gridWidth}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') return;
                        const num = parseInt(value);
                        if (!isNaN(num)) setGridWidth(num);
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setGridWidth(10);
                        } else {
                          const num = parseInt(value);
                          setGridWidth(Math.max(10, Math.min(120, num)));
                        }
                      }}
                      className="w-full px-4 py-3 border border-edge-sand bg-paper-bg text-ink-warm rounded-control text-base focus:outline-none focus:ring-2 focus:ring-moss focus:border-moss"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-soft mb-1">高度</label>
                    <input
                      type="number"
                      min="10"
                      max="120"
                      value={gridHeight}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') return;
                        const num = parseInt(value);
                        if (!isNaN(num)) setGridHeight(num);
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setGridHeight(10);
                        } else {
                          const num = parseInt(value);
                          setGridHeight(Math.max(10, Math.min(120, num)));
                        }
                      }}
                      className="w-full px-4 py-3 border border-edge-sand bg-paper-bg text-ink-warm rounded-control text-base focus:outline-none focus:ring-2 focus:ring-moss focus:border-moss"
                    />
                  </div>
                </div>
                <div className="text-center mt-2 text-sm text-ink-warm">
                  画板尺寸 <span style={{ fontFamily: 'var(--font-num)' }}>{gridWidth} × {gridHeight}</span> 格 ≈ 最多 <span style={{ fontFamily: 'var(--font-num)' }}>{gridWidth * gridHeight}</span> 颗
                </div>
                <div className="text-center text-xs text-ink-soft mt-1">
                  实际豆子数量 = 图片中有颜色的格子数量
                </div>
              </div>

              {/* 颜色合并阈值 — 加 py-3 触摸 hitbox */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-ink-warm">
                  颜色合并阈值 <span className="text-ink-soft" style={{ fontFamily: 'var(--font-num)' }}>({colorMergeThreshold})</span>
                </label>
                <div className="py-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={colorMergeThreshold}
                    onChange={(e) => setColorMergeThreshold(parseInt(e.target.value))}
                    className="w-full h-2 rounded-bead appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, var(--bead-moss) 0%, var(--bead-moss) ${colorMergeThreshold}%, var(--bead-paper-deep) ${colorMergeThreshold}%, var(--bead-paper-deep) 100%)`,
                    }}
                    aria-label="颜色合并阈值"
                  />
                </div>
                <div className="flex justify-between text-xs text-ink-soft mt-1">
                  <span>精细（颜色多）</span>
                  <span>简化（颜色少）</span>
                </div>
              </div>

              {/* 处理模式 */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-ink-warm">处理模式</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setProcessMode('cartoon')}
                    className={`min-h-[48px] px-4 py-3 rounded-control text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2 ${
                      processMode === 'cartoon'
                        ? 'bg-moss text-paper-bg border border-moss'
                        : 'bg-paper-bg text-ink-warm border border-edge-sand hover:bg-paper-deep'
                    }`}
                    aria-pressed={processMode === 'cartoon'}
                  >
                    卡通风格
                  </button>
                  <button
                    onClick={() => setProcessMode('photo')}
                    className={`min-h-[48px] px-4 py-3 rounded-control text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2 ${
                      processMode === 'photo'
                        ? 'bg-moss text-paper-bg border border-moss'
                        : 'bg-paper-bg text-ink-warm border border-edge-sand hover:bg-paper-deep'
                    }`}
                    aria-pressed={processMode === 'photo'}
                  >
                    照片风格
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setShowImageConfig(false);
                  setPendingFile(null);
                }}
                className="flex-1 inline-flex items-center justify-center min-h-[48px] px-6 py-3 bg-paper-bg border border-edge-sand text-ink-warm rounded-control font-semibold hover:bg-paper-deep transition-colors focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
              >
                取消
              </button>
              <button
                onClick={handleConfirmImageProcess}
                className="flex-1 inline-flex items-center justify-center min-h-[48px] px-6 py-3 bg-terracotta text-paper-bg rounded-control font-semibold hover:bg-terracotta-deep transition-colors focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
                style={{ boxShadow: 'var(--shadow-lift-bead)' }}
              >
                开始转换
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 空白画布设置模态框 */}
      {showBlankModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:p-4">
          <div className="relative bg-paper-soft border border-edge-sand rounded-t-card sm:rounded-card p-4 sm:p-8 max-w-md w-full max-h-[92vh] sm:max-h-none overflow-y-auto animate-in slide-in-from-bottom duration-200 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-bead bg-edge-sand" aria-hidden="true" />
            <h3 className="text-xl sm:text-2xl font-semibold mb-6 mt-2 sm:mt-0 text-ink-warm" style={{ fontFamily: 'var(--font-headline)' }}>创建空白画布</h3>

            <div className="space-y-6 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-ink-warm">宽度（格子数）</label>
                <input
                  type="number"
                  min="10"
                  max="120"
                  value={blankWidth}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') return;
                    const num = parseInt(value);
                    if (!isNaN(num)) setBlankWidth(num);
                  }}
                  onBlur={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setBlankWidth(10);
                    } else {
                      const num = parseInt(value);
                      setBlankWidth(Math.max(10, Math.min(120, num)));
                    }
                  }}
                  className="w-full px-4 py-3 border border-edge-sand bg-paper-bg text-ink-warm rounded-control text-lg focus:outline-none focus:ring-2 focus:ring-moss focus:border-moss"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-ink-warm">高度（格子数）</label>
                <input
                  type="number"
                  min="10"
                  max="120"
                  value={blankHeight}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') return;
                    const num = parseInt(value);
                    if (!isNaN(num)) setBlankHeight(num);
                  }}
                  onBlur={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setBlankHeight(10);
                    } else {
                      const num = parseInt(value);
                      setBlankHeight(Math.max(10, Math.min(120, num)));
                    }
                  }}
                  className="w-full px-4 py-3 border border-edge-sand bg-paper-bg text-ink-warm rounded-control text-lg focus:outline-none focus:ring-2 focus:ring-moss focus:border-moss"
                />
              </div>

              <div className="text-center p-4 bg-paper-bg border border-edge-sand rounded-surface">
                <div className="text-sm text-ink-soft mb-1">画布尺寸</div>
                <div className="text-2xl font-semibold text-moss" style={{ fontFamily: 'var(--font-num)' }}>
                  {blankWidth} × {blankHeight}
                </div>
                <div className="text-sm text-ink-soft mt-1">
                  共 <span style={{ fontFamily: 'var(--font-num)' }}>{blankWidth * blankHeight}</span> 颗豆子
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBlankModal(false)}
                className="flex-1 inline-flex items-center justify-center min-h-[48px] px-6 py-3 bg-paper-bg border border-edge-sand text-ink-warm rounded-control font-semibold hover:bg-paper-deep transition-colors focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
              >
                取消
              </button>
              <button
                onClick={handleCreateBlank}
                className="flex-1 inline-flex items-center justify-center min-h-[48px] px-6 py-3 bg-terracotta text-paper-bg rounded-control font-semibold hover:bg-terracotta-deep transition-colors focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
                style={{ boxShadow: 'var(--shadow-lift-bead)' }}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 底部 4 卡已删除 — 用户反馈：AI 味重 + 信息冗余。
          产品定位由 hero copy 承担，不需要功能罗列。 */}
    </div>
  );
}
