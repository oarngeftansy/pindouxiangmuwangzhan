import { useState, useRef, useCallback } from 'react';
import { beadColors } from '../data/beadColors';
import { rgbToHex, findClosestColor } from '../utils/colorMatching';
import { mergeSmallColorRegions, limitColorPalette } from '../utils/colorSimplification';
import { saveTrendingPattern, getTrendingPatterns, deleteTrendingPattern, type TrendingPattern } from '../data/trendingPatterns';
import { getCustomBlindBoxPatterns, saveCustomBlindBoxPattern, deleteCustomBlindBoxPattern, type BlindBoxPattern } from '../data/blindboxPools';
import { renderBeadPreview } from '../utils/previewRenderer';
import type { BeadGrid } from '../types';

const PRESET_TAGS = ['水果', '动物', '食物', '可爱', '入门', '中级', '挑战', '花卉', '几何', '人物', '节日'];

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: '入门',
  medium: '中级',
  hard: '挑战',
};

// 迷你拼豆网格预览组件
function MiniBeadGrid({ grid, maxSize = 320 }: { grid: BeadGrid; maxSize?: number }) {
  if (!grid.length || !grid[0].length) return null;
  const rows = grid.length;
  const cols = grid[0].length;
  const cellSize = Math.max(2, Math.min(8, Math.floor(maxSize / Math.max(rows, cols))));

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gap: 1,
        background: '#e5e5e5',
        padding: 2,
        borderRadius: 4,
        width: 'fit-content',
        maxWidth: maxSize,
      }}
    >
      {grid.map((row, ri) =>
        row.map((cell, ci) => (
          <div
            key={`${ri}-${ci}`}
            style={{
              width: cellSize,
              height: cellSize,
              borderRadius: '50%',
              background: cell || '#f3f1ec',
              flexShrink: 0,
            }}
          />
        ))
      )}
    </div>
  );
}

// 图片转拼豆网格（与 ImageUploader 相同逻辑）
function imageToBeadGrid(
  img: HTMLImageElement,
  gridWidth: number,
  gridHeight: number,
  maxColors: number,
  colorMergeThreshold: number,
): { grid: BeadGrid; colorCount: number; beadCount: number } {
  console.log('[DEV] imageToBeadGrid 开始', { gridWidth, gridHeight, maxColors, colorMergeThreshold });
  console.log('[DEV] 图片尺寸:', img.naturalWidth, 'x', img.naturalHeight);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  canvas.width = gridWidth;
  canvas.height = gridHeight;

  // 不填背景，直接绘制，保留原始 alpha
  ctx.clearRect(0, 0, gridWidth, gridHeight);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, gridWidth, gridHeight);

  const imageData = ctx.getImageData(0, 0, gridWidth, gridHeight);
  const pixels = imageData.data;

  // 统计 alpha 分布
  let alphaZero = 0, alphaLow = 0, alphaHigh = 0, alphaFull = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const a = pixels[i + 3];
    if (a === 0) alphaZero++;
    else if (a < 128) alphaLow++;
    else if (a < 255) alphaHigh++;
    else alphaFull++;
  }
  console.log('[DEV] Alpha 分布:', { alphaZero, alphaLow, alphaHigh, alphaFull, total: gridWidth * gridHeight });

  // 打印几个角落像素的 RGBA
  const samplePixel = (x: number, y: number) => {
    const i = (y * gridWidth + x) * 4;
    return { r: pixels[i], g: pixels[i+1], b: pixels[i+2], a: pixels[i+3] };
  };
  console.log('[DEV] 左上角(0,0):', samplePixel(0, 0));
  console.log('[DEV] 右上角:', samplePixel(gridWidth-1, 0));
  console.log('[DEV] 左下角:', samplePixel(0, gridHeight-1));
  console.log('[DEV] 中心:', samplePixel(Math.floor(gridWidth/2), Math.floor(gridHeight/2)));

  let grid: BeadGrid = [];
  const colorSet = new Set<string>();
  let beadCount = 0;
  let nullCount = 0;

  for (let y = 0; y < gridHeight; y++) {
    const row: (string | null)[] = [];
    for (let x = 0; x < gridWidth; x++) {
      const i = (y * gridWidth + x) * 4;
      const a = pixels[i + 3];

      // 透明或半透明 → 空格
      if (a < 128) {
        row.push(null);
        nullCount++;
      } else {
        // 将半透明像素与白色背景混合
        const alpha = a / 255;
        const r = Math.round(pixels[i] * alpha + 255 * (1 - alpha));
        const g = Math.round(pixels[i + 1] * alpha + 255 * (1 - alpha));
        const b = Math.round(pixels[i + 2] * alpha + 255 * (1 - alpha));
        const hex = rgbToHex(r, g, b);
        const closestColor = findClosestColor(hex, beadColors, true);
        row.push(closestColor);
        colorSet.add(closestColor);
        beadCount++;
      }
    }
    grid.push(row);
  }

  console.log('[DEV] 第一遍结果:', { beadCount, nullCount, colorCount: colorSet.size });

  // 后处理：颜色合并
  if (colorMergeThreshold > 30) {
    console.log('[DEV] 执行颜色合并, threshold:', colorMergeThreshold);
    const minRegionSize = Math.max(2, Math.floor(colorMergeThreshold / 20));
    grid = mergeSmallColorRegions(grid, beadColors, minRegionSize);
  }

  // 限制颜色数量
  if (maxColors > 0 && maxColors < 50) {
    console.log('[DEV] 限制颜色数量到:', maxColors);
    grid = limitColorPalette(grid, beadColors, maxColors);
  }

  // 重新统计
  colorSet.clear();
  beadCount = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell) {
        colorSet.add(cell);
        beadCount++;
      }
    }
  }

  return { grid, colorCount: colorSet.size, beadCount };
}

export function PatternImportTool() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [gridWidth, setGridWidth] = useState(30);
  const [gridHeight, setGridHeight] = useState(30);
  const [maxColors, setMaxColors] = useState(40);
  const [colorMergeThreshold, setColorMergeThreshold] = useState(10);
  const [patternName, setPatternName] = useState('');
  const [patternId, setPatternId] = useState(() => `pattern_${Date.now()}`);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

  const [parsedGrid, setParsedGrid] = useState<BeadGrid | null>(null);
  const [colorCount, setColorCount] = useState(0);
  const [beadCount, setBeadCount] = useState(0);
  const [isParsing, setIsParsing] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedPatterns, setSavedPatterns] = useState<TrendingPattern[]>(() => getTrendingPatterns());
  const [savedBlindBox, setSavedBlindBox] = useState<BlindBoxPattern[]>(() => getCustomBlindBoxPatterns());
  const [blindBoxSaved, setBlindBoxSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      setImageSrc(src);
      setParsedGrid(null);
      setGeneratedCode(null);

      // 预加载图片获取尺寸
      const img = new Image();
      img.onload = () => {
        setLoadedImage(img);
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        const maxSize = 90;
        if (w > maxSize || h > maxSize) {
          const ratio = Math.min(maxSize / w, maxSize / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        setGridWidth(Math.max(10, w));
        setGridHeight(Math.max(10, h));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleParse = useCallback(() => {
    if (!loadedImage) return;
    setIsParsing(true);

    // 用 setTimeout 让 UI 先更新
    setTimeout(() => {
      const result = imageToBeadGrid(loadedImage, gridWidth, gridHeight, maxColors, colorMergeThreshold);
      setParsedGrid(result.grid);
      setColorCount(result.colorCount);
      setBeadCount(result.beadCount);
      setIsParsing(false);
    }, 50);
  }, [loadedImage, gridWidth, gridHeight, maxColors, colorMergeThreshold]);

  const handleGenerateCode = useCallback(() => {
    if (!parsedGrid) return;

    // 裁剪掉全 null 的行和列
    const rowHasContent = parsedGrid.map(row => row.some(cell => cell !== null));
    const firstRow = rowHasContent.indexOf(true);
    const lastRow = rowHasContent.lastIndexOf(true);

    if (firstRow === -1) return; // 全空

    const colHasContent: boolean[] = Array(parsedGrid[0].length).fill(false);
    for (let r = firstRow; r <= lastRow; r++) {
      for (let c = 0; c < parsedGrid[r].length; c++) {
        if (parsedGrid[r][c] !== null) colHasContent[c] = true;
      }
    }
    const firstCol = colHasContent.indexOf(true);
    const lastCol = colHasContent.lastIndexOf(true);

    const trimmedGrid = parsedGrid
      .slice(firstRow, lastRow + 1)
      .map(row => row.slice(firstCol, lastCol + 1));

    const trimmedWidth = lastCol - firstCol + 1;
    const trimmedHeight = lastRow - firstRow + 1;

    // 重新统计
    // 四周加 padding（留白边距，避免太贴边）
    const padding = 2;
    const paddedWidth = trimmedWidth + padding * 2;
    const paddedHeight = trimmedHeight + padding * 2;
    const emptyRow = (): (string | null)[] => Array(paddedWidth).fill(null);
    const paddedGrid: BeadGrid = [];

    for (let i = 0; i < padding; i++) paddedGrid.push(emptyRow());
    for (const row of trimmedGrid) {
      paddedGrid.push([...Array(padding).fill(null), ...row, ...Array(padding).fill(null)]);
    }
    for (let i = 0; i < padding; i++) paddedGrid.push(emptyRow());

    let trimmedBeadCount = 0;
    const trimmedColors = new Set<string>();
    for (const row of paddedGrid) {
      for (const cell of row) {
        if (cell) { trimmedBeadCount++; trimmedColors.add(cell); }
      }
    }

    const obj = {
      id: patternId,
      name: patternName || '未命名图纸',
      gridWidth: paddedWidth,
      gridHeight: paddedHeight,
      beadCount: trimmedBeadCount,
      colorCount: trimmedColors.size,
      tags: selectedTags,
      difficulty,
      grid: paddedGrid,
    };

    const json = JSON.stringify(obj, null, 2);
    setGeneratedCode(json);
    setSaved(false);
    lastGeneratedPattern.current = obj as TrendingPattern;
  }, [parsedGrid, patternId, patternName, selectedTags, difficulty]);

  const lastGeneratedPattern = useRef<TrendingPattern | null>(null);

  const handleSave = useCallback(() => {
    if (!lastGeneratedPattern.current) return;
    // 生成成品预览图
    const preview = renderBeadPreview(lastGeneratedPattern.current.grid);
    saveTrendingPattern({ ...lastGeneratedPattern.current, previewImage: preview });
    setSaved(true);
    setSavedPatterns(getTrendingPatterns());
    setTimeout(() => setSaved(false), 2000);
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteTrendingPattern(id);
    setSavedPatterns(getTrendingPatterns());
  }, []);

  const handleRename = useCallback((id: string, newName: string) => {
    const patterns = getTrendingPatterns();
    const p = patterns.find(p => p.id === id);
    if (p) {
      p.name = newName;
      saveTrendingPattern(p);
      setSavedPatterns(getTrendingPatterns());
    }
  }, []);

  const handleSaveBlindBox = useCallback(() => {
    if (!lastGeneratedPattern.current) return;
    const p = lastGeneratedPattern.current;
    const preview = renderBeadPreview(p.grid);
    const blindBox: BlindBoxPattern = {
      id: p.id,
      name: p.name,
      description: `${p.gridWidth}x${p.gridHeight} · ${p.beadCount}颗 · ${p.colorCount}色`,
      grid: p.grid,
      previewUrl: preview,
    };
    saveCustomBlindBoxPattern(blindBox);
    setBlindBoxSaved(true);
    setSavedBlindBox(getCustomBlindBoxPatterns());
    setTimeout(() => setBlindBoxSaved(false), 2000);
  }, []);

  const handleDeleteBlindBox = useCallback((id: string) => {
    deleteCustomBlindBoxPattern(id);
    setSavedBlindBox(getCustomBlindBoxPatterns());
  }, []);

  const handleRenameBlindBox = useCallback((id: string, newName: string) => {
    const patterns = getCustomBlindBoxPatterns();
    const p = patterns.find(p => p.id === id);
    if (p) {
      p.name = newName;
      saveCustomBlindBoxPattern(p);
      setSavedBlindBox(getCustomBlindBoxPatterns());
    }
  }, []);

  const handleCopy = useCallback(() => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [generatedCode]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // 统计颜色数量
  const colorStats = parsedGrid
    ? (() => {
        const counts = new Map<string, number>();
        for (const row of parsedGrid) {
          for (const cell of row) {
            if (cell) counts.set(cell, (counts.get(cell) || 0) + 1);
          }
        }
        return Array.from(counts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([hex, count]) => {
            const color = beadColors.find(c => c.hex === hex);
            return { hex, count, name: color?.name || hex, mard: color?.mard || '' };
          });
      })()
    : [];

  return (
    <div className="min-h-screen bg-paper-bg">
      {/* Header */}
      <header className="bg-moss text-white px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center text-sm font-bold">
            DEV
          </div>
          <div>
            <h1 className="font-semibold text-lg">网红图纸导入工具</h1>
            <p className="text-white/60 text-xs">开发者专用 · 上传图片转拼豆图纸</p>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* 已入库图纸列表 */}
        <section className="bg-white rounded-xl border border-edge-sand p-5">
          <h2 className="font-semibold text-ink-warm mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-moss text-white rounded-full text-xs flex items-center justify-center">{savedPatterns.length}</span>
            已入库图纸
          </h2>
          {savedPatterns.length === 0 ? (
            <p className="text-sm text-ink-soft text-center py-4">还没有入库的图纸，上传图片并转换后点击"入库"</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedPatterns.map(p => (
                <div key={p.id} className="bg-paper-bg rounded-lg p-3">
                  {/* 缩略图 */}
                  <div className="flex items-center justify-center bg-white rounded-lg p-2 mb-2 h-[80px] overflow-hidden">
                    {p.previewImage ? (
                      <img src={p.previewImage} alt={p.name} className="max-h-[72px] max-w-full object-contain" />
                    ) : (
                      <MiniBeadGrid grid={p.grid} maxSize={70} />
                    )}
                  </div>
                  {/* 名称（可编辑） */}
                  <input
                    type="text"
                    defaultValue={p.name}
                    onBlur={e => {
                      const val = e.target.value.trim();
                      if (val && val !== p.name) handleRename(p.id, val);
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    className="w-full text-sm font-medium text-ink-warm bg-transparent border-b border-transparent hover:border-edge-sand focus:border-moss focus:outline-none px-0.5 py-0.5 mb-1"
                  />
                  {/* 信息 */}
                  <p className="text-xs text-ink-soft mb-2">
                    {p.gridWidth}x{p.gridHeight} · {p.beadCount}颗 · {p.colorCount}色
                    {p.tags.length > 0 && ` · ${p.tags.join(', ')}`}
                  </p>
                  {/* 删除 */}
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-xs text-ink-soft hover:text-alert-rose hover:bg-alert-rose/10 px-2 py-1 rounded-control transition-colors"
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 已入库盲盒列表 */}
        <section className="bg-white rounded-xl border border-edge-sand p-5">
          <h2 className="font-semibold text-ink-warm mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-terracotta text-white rounded-full text-xs flex items-center justify-center">{savedBlindBox.length}</span>
            已入库盲盒
          </h2>
          {savedBlindBox.length === 0 ? (
            <p className="text-sm text-ink-soft text-center py-4">还没有入库的盲盒图案，转换后点击"盲盒入库"</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedBlindBox.map(p => (
                <div key={p.id} className="bg-paper-bg rounded-lg p-3">
                  <div className="flex items-center justify-center bg-white rounded-lg p-2 mb-2 h-[80px] overflow-hidden">
                    {p.previewUrl ? (
                      <img src={p.previewUrl} alt={p.name} className="max-h-[72px] max-w-full object-contain" />
                    ) : (
                      <MiniBeadGrid grid={p.grid} maxSize={70} />
                    )}
                  </div>
                  <input
                    type="text"
                    defaultValue={p.name}
                    onBlur={e => {
                      const val = e.target.value.trim();
                      if (val && val !== p.name) handleRenameBlindBox(p.id, val);
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    className="w-full text-sm font-medium text-ink-warm bg-transparent border-b border-transparent hover:border-edge-sand focus:border-moss focus:outline-none px-0.5 py-0.5 mb-1"
                  />
                  <p className="text-xs text-ink-soft mb-2">{p.description}</p>
                  <button
                    onClick={() => handleDeleteBlindBox(p.id)}
                    className="text-xs text-ink-soft hover:text-alert-rose hover:bg-alert-rose/10 px-2 py-1 rounded-control transition-colors"
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Step 1: 上传图片 */}
        <section className="bg-white rounded-xl border border-edge-sand p-5">
          <h2 className="font-semibold text-ink-warm mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-moss text-white rounded-full text-xs flex items-center justify-center">1</span>
            上传图片
          </h2>

          <div
            className="border-2 border-dashed border-edge-sand rounded-control p-8 text-center cursor-pointer hover:border-moss hover:bg-paper-deep transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {imageSrc ? (
              <img src={imageSrc} alt="uploaded" className="max-h-64 mx-auto object-contain rounded" />
            ) : (
              <div className="space-y-2">
                <div className="text-4xl">📎</div>
                <p className="text-ink-soft">点击上传图片</p>
                <p className="text-xs text-ink-soft">支持 JPG / PNG / WEBP</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          {imageSrc && (
            <button
              className="mt-2 text-xs text-ink-soft hover:text-ink-soft"
              onClick={() => fileInputRef.current?.click()}
            >
              重新上传
            </button>
          )}
        </section>

        {/* Step 2: 元数据 + 转换参数 */}
        <section className="bg-white rounded-xl border border-edge-sand p-5">
          <h2 className="font-semibold text-ink-warm mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-moss text-white rounded-full text-xs flex items-center justify-center">2</span>
            填写元数据 & 转换参数
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 图纸名称 */}
            <div>
              <label className="block text-sm font-medium text-ink-warm mb-1">图纸名称</label>
              <input
                type="text"
                value={patternName}
                onChange={e => setPatternName(e.target.value)}
                placeholder="如：苹果图案"
                className="w-full px-3 py-2 border border-edge-sand rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-moss"
              />
            </div>

            {/* ID */}
            <div>
              <label className="block text-sm font-medium text-ink-warm mb-1">图纸 ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={patternId}
                  onChange={e => setPatternId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-edge-sand rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-moss font-mono"
                />
                <button
                  onClick={() => setPatternId(`pattern_${Date.now()}`)}
                  className="px-3 py-2 bg-paper-bg border border-edge-sand rounded-lg text-xs hover:bg-paper-deep"
                  title="重新生成 ID"
                >
                  刷新
                </button>
              </div>
            </div>

            {/* 网格尺寸 */}
            <div>
              <label className="block text-sm font-medium text-ink-warm mb-1">网格尺寸</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={gridWidth}
                  onChange={e => setGridWidth(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-3 py-2 border border-edge-sand rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-moss"
                />
                <span className="text-ink-soft">x</span>
                <input
                  type="number"
                  value={gridHeight}
                  onChange={e => setGridHeight(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-3 py-2 border border-edge-sand rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-moss"
                />
                <span className="text-xs text-ink-soft">（宽 x 高）</span>
              </div>
            </div>

            {/* 最大颜色数 */}
            <div>
              <label className="block text-sm font-medium text-ink-warm mb-1">最大颜色数</label>
              <input
                type="number"
                value={maxColors}
                onChange={e => setMaxColors(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 px-3 py-2 border border-edge-sand rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-moss"
              />
            </div>

            {/* 颜色合并阈值 */}
            <div>
              <label className="block text-sm font-medium text-ink-warm mb-1">
                颜色合并阈值 ({colorMergeThreshold})
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={colorMergeThreshold}
                onChange={e => setColorMergeThreshold(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-ink-soft mt-1">
                <span>精细</span>
                <span>简化</span>
              </div>
            </div>

            {/* 难度 */}
            <div>
              <label className="block text-sm font-medium text-ink-warm mb-1">难度</label>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                      difficulty === d
                        ? 'bg-moss text-white border-moss'
                        : 'bg-white text-ink-warm border-edge-sand hover:bg-paper-bg'
                    }`}
                  >
                    {DIFFICULTY_LABELS[d]}
                  </button>
                ))}
              </div>
            </div>

            {/* 标签 */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-ink-warm mb-2">标签</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-moss text-white border-moss'
                        : 'bg-white text-ink-warm border-edge-sand hover:bg-paper-bg'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleParse}
            disabled={!loadedImage || isParsing}
            className={`mt-5 px-6 py-3 rounded-lg font-medium text-white transition-colors ${
              !loadedImage || isParsing
                ? 'bg-bead-shadow cursor-not-allowed'
                : 'bg-moss hover:bg-moss-deep'
            }`}
          >
            {isParsing ? '转换中...' : '开始转换'}
          </button>
        </section>

        {/* Step 3: 预览 */}
        {parsedGrid && (
          <section className="bg-white rounded-xl border border-edge-sand p-5">
            <h2 className="font-semibold text-ink-warm mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-moss text-white rounded-full text-xs flex items-center justify-center">3</span>
              转换预览
            </h2>

            {/* 统计信息 */}
            <div className="flex flex-wrap gap-4 mb-4 text-sm">
              <div className="bg-paper-bg rounded-lg px-4 py-2">
                <span className="text-ink-soft">颜色数</span>
                <span className="ml-2 font-semibold text-ink-warm">{colorCount}</span>
              </div>
              <div className="bg-paper-bg rounded-lg px-4 py-2">
                <span className="text-ink-soft">豆子数</span>
                <span className="ml-2 font-semibold text-ink-warm">{beadCount}</span>
              </div>
              <div className="bg-paper-bg rounded-lg px-4 py-2">
                <span className="text-ink-soft">尺寸</span>
                <span className="ml-2 font-semibold text-ink-warm">{gridWidth} x {gridHeight}</span>
              </div>
            </div>

            {/* 左右对比 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-ink-warm mb-2">原始图片</p>
                <img src={imageSrc!} alt="original" className="max-w-full max-h-80 object-contain rounded border border-edge-sand" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink-warm mb-2">拼豆网格预览</p>
                <div className="overflow-auto max-h-80">
                  <MiniBeadGrid grid={parsedGrid} maxSize={320} />
                </div>
              </div>
            </div>

            {/* 主要颜色列表 */}
            {colorStats.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-ink-warm mb-2">使用最多的颜色（Top 10）</p>
                <div className="flex flex-wrap gap-2">
                  {colorStats.map(({ hex, count, name, mard }) => (
                    <div key={hex} className="flex items-center gap-1.5 bg-paper-bg rounded-lg px-3 py-1.5 text-xs">
                      <div className="w-4 h-4 rounded-full border border-edge-sand" style={{ background: hex }} />
                      <span className="text-ink-warm">{name}</span>
                      {mard && <span className="text-ink-soft">#{mard}</span>}
                      <span className="text-ink-soft">x{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Step 4: 生成代码 */}
        {parsedGrid && (
          <section className="bg-white rounded-xl border border-edge-sand p-5">
            <h2 className="font-semibold text-ink-warm mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-moss text-white rounded-full text-xs flex items-center justify-center">4</span>
              生成代码
            </h2>

            <button
              onClick={handleGenerateCode}
              className="px-6 py-3 bg-moss text-white rounded-lg hover:bg-moss-deep font-medium transition-colors"
            >
              生成 JSON 片段
            </button>

            {generatedCode && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-ink-soft">JSON 预览</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        copied
                          ? 'bg-moss text-paper-bg'
                          : 'bg-paper-bg text-ink-warm hover:bg-paper-deep'
                      }`}
                    >
                      {copied ? '已复制' : '复制'}
                    </button>
                    <button
                      onClick={handleSave}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        saved
                          ? 'bg-moss text-paper-bg'
                          : 'bg-moss text-white hover:bg-moss-deep'
                      }`}
                    >
                      {saved ? '已入库' : '网红图纸入库'}
                    </button>
                    <button
                      onClick={handleSaveBlindBox}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        blindBoxSaved
                          ? 'bg-moss text-paper-bg'
                          : 'bg-terracotta text-white hover:bg-terracotta-deep'
                      }`}
                    >
                      {blindBoxSaved ? '已入库' : '盲盒入库'}
                    </button>
                  </div>
                </div>
                <pre className="text-xs bg-ink-warm text-paper-bg rounded-control p-4 overflow-auto max-h-96 leading-relaxed">
                  {generatedCode}
                </pre>
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}
