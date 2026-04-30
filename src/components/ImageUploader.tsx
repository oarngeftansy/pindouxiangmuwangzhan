import { Upload, Grid, Settings, Camera, Palette, FileDown, Sparkles } from 'lucide-react';
import { useState, useRef } from 'react';
import { BeadGrid, beadColors } from '../App';
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
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-semibold mb-3 text-[#1f2937] tracking-tight">
          开始模拟拼豆创作
        </h2>
        <p className="text-[#5b6470] text-lg">
          上传图片自动转换为拼豆图纸，或创建空白画布自由创作
        </p>
      </div>

      {/* 主上传区域 */}
      <div
        className={`bg-white rounded-lg shadow-[0_2px_10px_rgba(31,41,55,0.06)] p-12 border border-dashed transition-all cursor-pointer hover:shadow-[0_6px_18px_rgba(31,41,55,0.10)] mb-6 ${
          isDragging ? 'border-[#1f5c57] bg-[#eef6f5]' : 'border-[#d8d2c6]'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-[#1f5c57] rounded-md flex items-center justify-center mb-6">
            <Upload className="w-8 h-8 text-white" />
          </div>
          
          {isProcessing ? (
            <>
              <h3 className="text-2xl font-semibold mb-2">正在处理图片...</h3>
              <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mt-4">
                <div className="h-full bg-[#1f5c57] animate-pulse"></div>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-2xl font-semibold mb-3">上传图片</h3>
              <p className="text-gray-500 mb-4 text-lg">
                拖拽图片到这里或点击上传
              </p>
              <p className="text-sm text-gray-400">
                支持 JPG、PNG、GIF 等格式
              </p>
            </>
          )}
        </div>
      </div>

      {/* 辅助功能：创建空白画布 */}
      <div className="text-center">
        <button
          onClick={() => setShowBlankModal(true)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#1f5c57] transition-colors"
        >
          <Grid className="w-4 h-4" />
          <span className="text-sm">或创建空白画布自由创作</span>
        </button>
      </div>

      {/* 图片处理配置模态框 */}
      {showImageConfig && pendingFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-6 h-6 text-[#1f5c57]" />
              <h3 className="text-2xl font-bold">图片转换设置</h3>
            </div>
            
            <div className="space-y-6">
              {/* 快捷预设 */}
              <div>
                <label className="block text-sm font-medium mb-3">快捷预设</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      setGridWidth(Math.min(40, Math.max(10, gridWidth)));
                      setGridHeight(Math.min(40, Math.max(10, gridHeight)));
                      setColorMergeThreshold(10);
                      setMaxColors(30);
                    }}
                    className="px-4 py-3 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-lg font-medium text-sm hover:shadow-md transition-all text-gray-700"
                  >
                    🎨 简单图案<br/>
                    <span className="text-xs text-gray-500">低豆子数</span>
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
                    className="px-4 py-3 bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 rounded-lg font-medium text-sm hover:shadow-md transition-all text-gray-700"
                  >
                    📸 普通照片<br/>
                    <span className="text-xs text-gray-500">推荐设置</span>
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
                    className="px-4 py-3 bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg font-medium text-sm hover:shadow-md transition-all text-gray-700"
                  >
                    ✨ 高清照片<br/>
                    <span className="text-xs text-gray-500">保留细节</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 提示：照片建议使用"普通照片"或"高清照片"预设以保留更多细节
                </p>
              </div>

              {/* 画板尺寸 */}
              <div>
                <label className="block text-sm font-medium mb-3">画板尺寸（格子数量）</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">宽度</label>
                    <input
                      type="number"
                      min="10"
                      max="120"
                      value={gridWidth}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          return; // 允许暂时为空，不做处理
                        }
                        const num = parseInt(value);
                        if (!isNaN(num)) {
                          setGridWidth(num); // 直接设置，不限制范围
                        }
                      }}
                      onBlur={(e) => {
                        // 失去焦点时才限制范围
                        const value = e.target.value;
                        if (value === '') {
                          setGridWidth(10);
                        } else {
                          const num = parseInt(value);
                          setGridWidth(Math.max(10, Math.min(120, num)));
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f5c57] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">高度</label>
                    <input
                      type="number"
                      min="10"
                      max="120"
                      value={gridHeight}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          return; // 允许暂时为空，不做处理
                        }
                        const num = parseInt(value);
                        if (!isNaN(num)) {
                          setGridHeight(num); // 直接设置，不限制范围
                        }
                      }}
                      onBlur={(e) => {
                        // 失去焦点时才限制范围
                        const value = e.target.value;
                        if (value === '') {
                          setGridHeight(10);
                        } else {
                          const num = parseInt(value);
                          setGridHeight(Math.max(10, Math.min(120, num)));
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f5c57] focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="text-center mt-2 text-sm text-gray-600">
                  画板尺寸：{gridWidth} × {gridHeight} 格 = 最多需 {gridWidth * gridHeight} 颗拼豆
                </div>
                <div className="text-center text-xs text-gray-500 mt-1">
                  实际豆子数量 = 图片中有颜色的格子数量
                </div>
              </div>

              {/* 颜色合并阈值 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  颜色合并阈值 ({colorMergeThreshold})
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={colorMergeThreshold}
                  onChange={(e) => setColorMergeThreshold(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>精细（颜色多）</span>
                  <span>简化（颜色少）</span>
                </div>
              </div>

              {/* 处理模式 */}
              <div>
                <label className="block text-sm font-medium mb-2">处理模式</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setProcessMode('cartoon')}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      processMode === 'cartoon'
                        ? 'bg-[#1f5c57] text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    卡通风格
                  </button>
                  <button
                    onClick={() => setProcessMode('photo')}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      processMode === 'photo'
                        ? 'bg-[#1f5c57] text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
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
                className="flex-1 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmImageProcess}
                className="flex-1 px-6 py-3 bg-[#1f5c57] text-white rounded-xl hover:opacity-90 transition-opacity"
              >
                开始转换
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 空白画布设置模态框 */}
      {showBlankModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-6">创建空白画布</h3>
            
            <div className="space-y-6 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">宽度（格子数）</label>
                <input
                  type="number"
                  min="10"
                  max="120"
                  value={blankWidth}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      return; // 允许暂时为空
                    }
                    const num = parseInt(value);
                    if (!isNaN(num)) {
                      setBlankWidth(num); // 直接设置，不限制范围
                    }
                  }}
                  onBlur={(e) => {
                    // 失去焦点时才限制范围
                    const value = e.target.value;
                    if (value === '') {
                      setBlankWidth(10);
                    } else {
                      const num = parseInt(value);
                      setBlankWidth(Math.max(10, Math.min(120, num)));
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f5c57] focus:border-transparent text-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">高度（格子数）</label>
                <input
                  type="number"
                  min="10"
                  max="120"
                  value={blankHeight}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      return; // 允许暂时为空
                    }
                    const num = parseInt(value);
                    if (!isNaN(num)) {
                      setBlankHeight(num); // 直接设置，不限制范围
                    }
                  }}
                  onBlur={(e) => {
                    // 失去焦点时才限制范围
                    const value = e.target.value;
                    if (value === '') {
                      setBlankHeight(10);
                    } else {
                      const num = parseInt(value);
                      setBlankHeight(Math.max(10, Math.min(120, num)));
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f5c57] focus:border-transparent text-lg"
                />
              </div>

              <div className="text-center p-4 bg-[#eef6f5] rounded-lg">
                <div className="text-sm text-gray-600 mb-1">画布尺寸</div>
                <div className="text-2xl font-bold text-[#1f5c57]">
                  {blankWidth} × {blankHeight}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  共 {blankWidth * blankHeight} 颗豆子
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBlankModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateBlank}
                className="flex-1 px-6 py-3 bg-[#1f5c57] text-white rounded-xl hover:opacity-90 transition-opacity"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 功能介绍 */}
      <div className="mt-14 grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-5 border border-[#ddd6c8]">
          <div className="w-10 h-10 bg-[#eef6f5] rounded-md flex items-center justify-center mb-3">
            <Camera className="w-5 h-5 text-[#1f5c57]" />
          </div>
          <h3 className="font-semibold mb-1 text-[#1f2937]">智能转换</h3>
          <p className="text-sm text-[#66707d] leading-relaxed">高精度颜色匹配，适配多种拼豆色号。</p>
        </div>

        <div className="bg-white rounded-lg p-5 border border-[#ddd6c8]">
          <div className="w-10 h-10 bg-[#eef6f5] rounded-md flex items-center justify-center mb-3">
            <Palette className="w-5 h-5 text-[#1f5c57]" />
          </div>
          <h3 className="font-semibold mb-1 text-[#1f2937]">模拟创作</h3>
          <p className="text-sm text-[#66707d] leading-relaxed">在线预览拼豆排布，支持后续细节调整。</p>
        </div>

        <div className="bg-white rounded-lg p-5 border border-[#ddd6c8]">
          <div className="w-10 h-10 bg-[#eef6f5] rounded-md flex items-center justify-center mb-3">
            <FileDown className="w-5 h-5 text-[#1f5c57]" />
          </div>
          <h3 className="font-semibold mb-1 text-[#1f2937]">图纸导出</h3>
          <p className="text-sm text-[#66707d] leading-relaxed">导出标准图纸，便于线下按格拼装。</p>
        </div>

        <div className="bg-white rounded-lg p-5 border border-[#ddd6c8]">
          <div className="w-10 h-10 bg-[#eef6f5] rounded-md flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5 text-[#1f5c57]" />
          </div>
          <h3 className="font-semibold mb-1 text-[#1f2937]">成品预览</h3>
          <p className="text-sm text-[#66707d] leading-relaxed">提供细腻的成品效果和熨烫预览。</p>
        </div>
      </div>
    </div>
  );
}
