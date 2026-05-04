import {
  Check,
  Download,
  Eraser,
  Eye,
  EyeOff,
  FileText,
  Flame,
  Grid as GridIcon,
  Image as ImageIcon,
  Layers,
  Library,
  Paintbrush,
  PartyPopper,
  Snowflake,
  Sparkles,
  Square,
  Thermometer,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { BeadGrid, BeadColor, ColorSystem } from "../App";
import { generateIronedImage, IRONING_METHODS, IroningMethod } from "./IroningHelpers";
import { generateHDImage } from "./HDRenderHelpers";
import { addToGallery } from "../utils/galleryUtils";
import { PegboardCell } from "./PegboardCell";
import { ViewModeToggle } from "./ViewModeToggle";
import { loadCanvasParams, type CanvasParams } from "../data/canvasParams";

interface BeadCanvasProps {
  beadGrid: BeadGrid;
  setBeadGrid: (grid: BeadGrid) => void;
  selectedColor: string;
  onColorSelect?: (color: string) => void;
  onGridResize?: (grid: BeadGrid) => void;
  beadColors: BeadColor[];
  colorSystem?: ColorSystem;
  referenceGrid: BeadGrid;
}

type Tool = "brush" | "eraser";

export function BeadCanvas({
  beadGrid,
  setBeadGrid,
  selectedColor,
  onColorSelect,
  onGridResize,
  beadColors,
  colorSystem = "mard",
  referenceGrid,
}: BeadCanvasProps) {
  const [activeTool, setActiveTool] = useState<Tool>("brush");
  const [isDrawing, setIsDrawing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [lockedColor, setLockedColor] = useState<string | null>(
    null,
  );
  const [showReference, setShowReference] = useState(() => window.innerWidth > window.innerHeight || window.innerWidth >= 768);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [showCompletionModal, setShowCompletionModal] =
    useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [gridOpacity, setGridOpacity] = useState(1); // 线条不透明度
  const [pourMode, setPourMode] = useState(false); // 滑豆模式
  const [showIroningModal, setShowIroningModal] = useState(false); // 熨烫模态框
  const [ironingMethod, setIroningMethod] = useState<IroningMethod>('paper'); // 熨烫方式
  const [isIroning, setIsIroning] = useState(false); // 熨烫动画状态
  const [ironProgress, setIronProgress] = useState(0); // 熨烫进度
  const [ironPosition, setIronPosition] = useState({ x: 0, y: 0 }); // 熨斗位置
  const [ironedResult, setIronedResult] = useState<string | null>(null); // 熨烫结果预览
  const [showIronPreview, setShowIronPreview] = useState(false); // 显示熨烫预览
  const [removeBackground, setRemoveBackground] = useState(false); // 是否去除背景
  // (removed matchFuzzyColor - no longer needed for glitter method)

  // 高清渲染
  const [showHDModal, setShowHDModal] = useState(false); // 高清渲染模态框
  const [hdScale, setHdScale] = useState(2); // 高清渲染倍数
  const [hdRemoveBackground, setHdRemoveBackground] = useState(false); // 高清渲染去背景
  const [hdResult, setHdResult] = useState<string | null>(null); // 高清渲染结果
  const [showHDPreview, setShowHDPreview] = useState(false); // 显示高清预览

  // 视图模式：简洁模式 vs 拼豆板模式
  const [viewMode, setViewMode] = useState<'simple' | 'pegboard'>('pegboard'); // 默认显示拼豆板模式
  const [canvasParams] = useState<CanvasParams>(() => loadCanvasParams());

  // 参考窗大小
  const [refWindowSize, setRefWindowSize] = useState(0.35); // 相对于主画布的比例
  // 横屏时视为桌面布局（竖屏小屏才走移动端 UI）
  const isLandscape = () => window.innerWidth > window.innerHeight;
  const [showMaterialList, setShowMaterialList] = useState(() => isLandscape() || window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(() => !isLandscape() && window.innerWidth < 768);

  // 单色完成庆祝
  const [celebratingColor, setCelebratingColor] = useState<{ hex: string; code: string; name: string } | null>(null);
  const [celebratedColors, setCelebratedColors] = useState<Set<string>>(new Set());

  // 作品馆保存提示
  const [savedToGallery, setSavedToGallery] = useState(false);

  // 手机侧边栏折叠
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // 统计工作画布的豆子信息
  const getGridStats = () => {
    let beadCount = 0;
    const colorSet = new Set<string>();
    for (const row of workingGrid) {
      for (const cell of row) {
        if (cell) { beadCount++; colorSet.add(cell); }
      }
    }
    return { beadCount, colorCount: colorSet.size };
  };

  const handleAddToGallery = (thumbnailUrl: string, ironingMethodLabel?: string) => {
    const { beadCount, colorCount } = getGridStats();
    addToGallery({
      thumbnailUrl,
      gridWidth: workingGrid[0]?.length ?? 0,
      gridHeight: workingGrid.length,
      beadCount,
      colorCount,
      ironingMethod: ironingMethodLabel,
    });
    setSavedToGallery(true);
    setTimeout(() => setSavedToGallery(false), 2500);
  };

  // 拼豆板模式的智能缩放 - 确保完整显示且两侧留有空间
  const [pegboardScale, setPegboardScale] = useState(1.0);

  // 工作画布：初始为空白
  const [workingGrid, setWorkingGrid] = useState<BeadGrid>(() =>
    beadGrid.length > 0
      ? beadGrid.map((row) => [...row])
      : Array(referenceGrid.length)
          .fill(null)
          .map(() => Array(referenceGrid[0].length).fill(null)),
  );

  const baseSize = 20; // 基础尺寸20px，更合理的拼豆板大小
  const beadSize = baseSize * zoom;

  // 自适应计算拼豆板缩放 - 让拼豆板充满工作区
  useEffect(() => {
    if (viewMode === 'pegboard') {
      const updateScale = () => {
        const gridWidth = workingGrid[0]?.length || referenceGrid[0]?.length || 30;
        const gridHeight = workingGrid.length || referenceGrid.length || 30;

        const padding = 16;
        const border = 6;
        const extra = (padding + border) * 2;

        // 可用空间
        const landscape = window.innerWidth > window.innerHeight;
        const isEffectivelyMobile = !landscape && window.innerWidth < 768;
        const sidebarW = isEffectivelyMobile ? 0 : window.innerWidth < 1024 ? 260 : 320;

        const availableWidth = window.innerWidth - sidebarW - 80;
        const availableHeight = window.innerHeight - 160;

        // 直接算每个格子最大能多大
        const maxCellByWidth = (availableWidth - extra) / gridWidth;
        const maxCellByHeight = (availableHeight - extra) / gridHeight;
        const optimalCell = Math.min(maxCellByWidth, maxCellByHeight);

        // 不再用 CSS scale，直接用 scale=1，通过调整 beadSize 的倍率达到效果
        // pegboardScale 现在表示 beadSize 的乘数
        const cellScale = Math.max(0.3, optimalCell / baseSize);

        setPegboardScale(cellScale);
      };

      updateScale();

      const handleResize = () => updateScale();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [viewMode, workingGrid.length, workingGrid[0]?.length, referenceGrid.length, referenceGrid[0]?.length, baseSize]);

  // 移动端/平板检测：横屏时视为桌面
  useEffect(() => {
    const handleResize = () => {
      const landscape = window.innerWidth > window.innerHeight;
      setIsMobile(!landscape && window.innerWidth < 768);
      setShowMaterialList(landscape || window.innerWidth >= 768);
      // 切换到横屏/大屏时自动显示参考图纸
      if (landscape || window.innerWidth >= 768) {
        setShowReference(true);
      }
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // 触摸绘制支持（iPad / 手机）
  const getCellFromTouch = (touch: Touch): { x: number; y: number } | null => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const visualCellSize = viewMode === 'pegboard' ? beadSize * pegboardScale : beadSize;
    const cellX = Math.floor((touch.clientX - rect.left) / visualCellSize);
    const cellY = Math.floor((touch.clientY - rect.top) / visualCellSize);
    if (
      cellX >= 0 && cellX < workingGrid[0].length &&
      cellY >= 0 && cellY < workingGrid.length
    ) {
      return { x: cellX, y: cellY };
    }
    return null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const cell = getCellFromTouch(touch);
    if (!cell) return;
    const canPlace = !lockedColor || referenceGrid[cell.y]?.[cell.x] === lockedColor;
    if (canPlace) {
      setIsDrawing(true);
      handleCellClick(cell.x, cell.y);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    // 滑豆模式下无需按住也能上色，普通模式需要 isDrawing
    if (!isDrawing && !(pourMode && lockedColor)) return;
    const touch = e.touches[0];
    const cell = getCellFromTouch(touch);
    if (!cell) return;
    const canPlace = !lockedColor || referenceGrid[cell.y]?.[cell.x] === lockedColor;
    if (canPlace) {
      handleCellClick(cell.x, cell.y);
    }
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
  };

  const getColorCode = (colorHex: string): string => {
    const color = beadColors.find((c) => c.hex === colorHex);
    if (!color) return "?";
    return color[colorSystem] || color.mard || "?";
  };

  // 获取颜色统计（基于参考图纸）
  const getColorCount = () => {
    const colorMap = new Map<string, number>();
    referenceGrid.forEach((row) => {
      row.forEach((cell) => {
        if (cell) {
          colorMap.set(cell, (colorMap.get(cell) || 0) + 1);
        }
      });
    });
    return colorMap;
  };

  // 获取已放置的颜色数量
  const getPlacedCount = (colorHex: string): number => {
    let count = 0;
    workingGrid.forEach((row) => {
      row.forEach((cell) => {
        if (cell === colorHex) count++;
      });
    });
    return count;
  };

  const colorCount = useMemo(() => getColorCount(), [referenceGrid]);

  // 计算所有颜色的总已放置数（修复：直接遍历entries，避免重复数量导致find返回错误key）
  const getTotalPlaced = () => {
    let sum = 0;
    for (const [colorHex] of colorCount.entries()) {
      sum += getPlacedCount(colorHex);
    }
    return sum;
  };
  const getTotalRequired = () => {
    let sum = 0;
    for (const count of colorCount.values()) {
      sum += count;
    }
    return sum;
  };

  const handleCellClick = (x: number, y: number) => {
    if (lockedColor) {
      // 锁定颜色模式：只能在对应颜色位置放置
      const referenceColor = referenceGrid[y][x];
      if (referenceColor !== lockedColor) {
        return; // 不允许放置
      }
    }

    const newGrid = workingGrid.map((row) => [...row]);
    if (activeTool === "brush") {
      if (lockedColor) {
        newGrid[y][x] = lockedColor;
      } else {
        newGrid[y][x] =
          selectedColor === "#00000000" ? null : selectedColor;
      }
    } else {
      newGrid[y][x] = null;
    }
    setWorkingGrid(newGrid);
    setBeadGrid(newGrid);

    // 检测单色完成
    if (activeTool === 'brush') {
      const placedColor = lockedColor || (selectedColor !== '#00000000' ? selectedColor : null);
      if (placedColor && !celebratedColors.has(placedColor)) {
        // 统计这个颜色在参考图里的总数 vs 已放置数
        let total = 0, placed = 0;
        for (let ry = 0; ry < referenceGrid.length; ry++) {
          for (let rx = 0; rx < referenceGrid[0].length; rx++) {
            if (referenceGrid[ry][rx] === placedColor) {
              total++;
              if (newGrid[ry][rx] === placedColor) placed++;
            }
          }
        }
        if (total > 0 && placed >= total) {
          setCelebratedColors(prev => new Set([...prev, placedColor]));
          const colorInfo = beadColors.find(c => c.hex === placedColor);
          setCelebratingColor({
            hex: placedColor,
            code: colorInfo?.[colorSystem] || colorInfo?.mard || '?',
            name: colorInfo?.name || '',
          });
          setTimeout(() => setCelebratingColor(null), 2800);
        }
      }
    }
  };

  const handleMouseDown = (x: number, y: number) => {
    setIsDrawing(true);
    handleCellClick(x, y);
  };

  const handleMouseEnter = (x: number, y: number) => {
    setHoveredCell({ x, y });
    // 滑豆模式：只在锁定颜色且开启滑豆模式时，鼠标滑过即上色
    if (pourMode && lockedColor) {
      handleCellClick(x, y);
    } else if (isDrawing) {
      // 普通模式：需要按住鼠标拖动
      handleCellClick(x, y);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () =>
      document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const handleZoomIn = () =>
    setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () =>
    setZoom((prev) => Math.max(prev - 0.25, 0.5));

  const downloadCanvas = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const cellSize = 30;

    canvas.width = workingGrid[0].length * cellSize;
    canvas.height = workingGrid.length * cellSize;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    workingGrid.forEach((row, y) => {
      row.forEach((color, x) => {
        const xPos = x * cellSize;
        const yPos = y * cellSize;

        ctx.strokeStyle = "#E5E7EB";
        ctx.strokeRect(xPos, yPos, cellSize, cellSize);

        if (color) {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(
            xPos + cellSize / 2,
            yPos + cellSize / 2,
            cellSize / 2 - 4,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      });
    });

    const link = document.createElement("a");
    const w = workingGrid[0]?.length ?? 0;
    const h = workingGrid.length;
    link.download = `拼豆图纸-${w}x${h}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  // 高精度渲染
  const renderHighResolution = () => {
    setIsRendering(true);

    setTimeout(() => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const w = workingGrid[0].length;
      const h = workingGrid.length;
      const MAX_SIDE = 8000;
      const cellSize = Math.min(100, Math.floor(MAX_SIDE / Math.max(w, h)));

      canvas.width = w * cellSize;
      canvas.height = h * cellSize;

      // 白色背景
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      workingGrid.forEach((row, y) => {
        row.forEach((color, x) => {
          const centerX = x * cellSize + cellSize / 2;
          const centerY = y * cellSize + cellSize / 2;
          const radius = cellSize / 2 - 10;

          if (color) {
            // 豆子主体
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();

            // 内阴影效果
            const gradient = ctx.createRadialGradient(
              centerX - radius * 0.3,
              centerY - radius * 0.3,
              0,
              centerX,
              centerY,
              radius,
            );
            gradient.addColorStop(
              0,
              "rgba(255, 255, 255, 0.4)",
            );
            gradient.addColorStop(
              0.5,
              "rgba(255, 255, 255, 0)",
            );
            gradient.addColorStop(1, "rgba(0, 0, 0, 0.3)");

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();

            // 高光
            ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
            ctx.beginPath();
            ctx.arc(
              centerX - radius * 0.4,
              centerY - radius * 0.4,
              radius * 0.3,
              0,
              Math.PI * 2,
            );
            ctx.fill();

            // 边框
            ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
          }
        });
      });

      const link = document.createElement("a");
      link.download = `拼豆图纸-${w}x${h}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();

      setIsRendering(false);
      if (checkCompletion()) {
        setShowCompletionModal(true);
      }
    }, 100);
  };

  const handleColorLock = (colorHex: string) => {
    if (lockedColor === colorHex) {
      setLockedColor(null);
      setPourMode(false); // 解锁时关闭倒豆模式
    } else {
      setLockedColor(colorHex);
      if (onColorSelect) {
        onColorSelect(colorHex);
      }
      setActiveTool("brush");
    }
  };

  const isColorCompleted = (colorHex: string): boolean => {
    const total = colorCount.get(colorHex) || 0;
    const placed = getPlacedCount(colorHex);
    return placed >= total;
  };

  const checkCompletion = () => {
    const totalRequired = getTotalRequired();
    if (totalRequired === 0) return false;
    return getTotalPlaced() >= totalRequired;
  };

  const renderCompletionModal = () => {
    if (isRendering) return;
    setIsRendering(true);
    setTimeout(() => {
      if (checkCompletion()) {
        setShowCompletionModal(true);
      }
      setIsRendering(false);
    }, 500);
  };

  // 熨烫渲染函数 - 使用新的辅助函数
  const handleIroning = async () => {
    setIsIroning(true);
    setIronProgress(0);
    setIronPosition({ x: 0, y: 0 });

    const totalRows = workingGrid.length;
    const totalCols = workingGrid[0].length;

    // 模拟熨斗移动动画
    const animateIron = () => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 1.5;
        if (progress >= 100) {
          clearInterval(interval);
          setIronProgress(100);
        } else {
          setIronProgress(progress);
          const row = Math.floor((progress / 100) * totalRows);
          const col = Math.floor(((progress % 10) / 10) * totalCols);
          setIronPosition({ x: col, y: row });
        }
      }, 25);
    };

    animateIron();
    await new Promise((resolve) => setTimeout(resolve, 1700));

    // 使用新的辅助函数生成熨烫效果
    const ironedImageUrl = await generateIronedImage(workingGrid, {
      method: ironingMethod,
      removeBackground,
    });

    // 显示预览而不是直接下载
    setIronedResult(ironedImageUrl);
    setIronProgress(0);
    setIsIroning(false);
    setShowIronPreview(true);
  };

  // 高清渲染处理函数
  const handleHDRender = async () => {
    const hdImageUrl = await generateHDImage(workingGrid, {
      removeBackground: hdRemoveBackground,
      scale: hdScale,
    });

    setHdResult(hdImageUrl);
    setShowHDModal(false);
    setShowHDPreview(true);
  };

  return (
    <div className="flex flex-col gap-3" style={{ minHeight: 'calc(100dvh - 80px)' }}>
      {/* 工具栏 */}
      <div className="bg-white rounded-2xl shadow-xl p-3 sm:p-4 shrink-0">
        <div className={`flex items-center gap-2 ${isMobile ? 'flex-wrap gap-y-2' : 'flex-wrap gap-3'}`}>
          {/* 工具选择 */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTool("brush")}
              className={`p-3 rounded-xl transition-all ${
                activeTool === "brush"
                  ? "bg-purple-500 text-white shadow-lg"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              <Paintbrush className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTool("eraser")}
              className={`p-3 rounded-xl transition-all ${
                activeTool === "eraser"
                  ? "bg-purple-500 text-white shadow-lg"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              <Eraser className="w-5 h-5" />
            </button>
          </div>

          <div className="h-8 w-px bg-gray-300" />

          {/* 缩放控制 */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>

          <div className="h-8 w-px bg-gray-300" />

          {/* 网格显示 */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-lg transition-all ${
              showGrid
                ? "bg-purple-100 text-purple-700"
                : "bg-gray-100"
            }`}
            title="网格"
          >
            <GridIcon className="w-5 h-5" />
          </button>

          {/* 参考图纸显��� */}
          <button
            onClick={() => setShowReference(!showReference)}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${
              showReference
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100"
            }`}
          >
            {showReference ? (
              <Eye className="w-5 h-5" />
            ) : (
              <EyeOff className="w-5 h-5" />
            )}
            <span className="text-sm font-medium hidden sm:inline">
              参考图纸
            </span>
          </button>

          {/* 材料清单显示 - 只在拼豆板模式下显示 */}
          {viewMode === 'pegboard' && (
            <button
              onClick={() => setShowMaterialList(!showMaterialList)}
              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${
                showMaterialList
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100"
              }`}
            >
              {showMaterialList ? (
                <Square className="w-5 h-5" />
              ) : (
                <EyeOff className="w-5 h-5" />
              )}
              <span className="text-sm font-medium hidden sm:inline">
                材料清单
              </span>
            </button>
          )}

          {/* 滑豆模式 + 锁色指示 — 桌面内联，手机隐藏（改为画布浮动徽章） */}
          {lockedColor && !isMobile && (
            <>
              <div className="h-8 w-px bg-gray-300" />
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">滑豆</span>
                <button
                  onClick={() => setPourMode(!pourMode)}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 ${pourMode ? "bg-gradient-to-r from-orange-500 to-red-500" : "bg-gray-300"}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${pourMode ? "translate-x-6" : "translate-x-0"}`}>
                    {pourMode && <Sparkles className="w-3 h-3 text-orange-500" />}
                  </div>
                </button>
              </div>
              <div className="h-8 w-px bg-gray-300" />
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-100 rounded-lg border border-amber-300">
                <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: lockedColor }} />
                <span className="text-sm font-semibold text-amber-900">锁定: {getColorCode(lockedColor)}</span>
                {pourMode && <span className="text-xs text-orange-600">⚡</span>}
                <button onClick={() => { setLockedColor(null); setPourMode(false); }} className="ml-1 text-amber-700 hover:text-amber-900 text-xs">解锁</button>
              </div>
            </>
          )}

          {/* 右侧按钮组 - 桌面/iPad内联，手机隐藏（底部栏显示） */}
          <div className="ml-auto hidden sm:flex flex-wrap gap-2">
            <button
              onClick={() => setShowIroningModal(true)}
              disabled={isIroning}
              className="px-3 sm:px-5 py-2.5 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 shadow-lg font-semibold whitespace-nowrap"
              title="一键熨烫"
            >
              {isIroning ? (
                <>
                  <Flame className="w-5 h-5 animate-pulse" />
                  <span className="hidden sm:inline">熨烫中...</span>
                </>
              ) : (
                <>
                  <Flame className="w-5 h-5" />
                  <span className="hidden sm:inline">一键熨烫</span>
                </>
              )}
            </button>
            <button
              onClick={() => setShowHDModal(true)}
              className="px-3 sm:px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 font-semibold whitespace-nowrap shadow-lg"
              title="高清渲染"
            >
              <Sparkles className="w-5 h-5" />
              <span className="hidden sm:inline">高清渲染</span>
            </button>
            <button
              onClick={downloadCanvas}
              className="px-3 sm:px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 font-semibold whitespace-nowrap"
              title="下载图纸"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">下载图纸</span>
            </button>
          </div>
        </div>
      </div>

      {/* 手机专用底部操作栏 */}
      {isMobile && (
        <div className="shrink-0 flex gap-2">
          <button
            onClick={() => setShowIroningModal(true)}
            disabled={isIroning}
            className="flex-1 py-3 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-xl flex items-center justify-center gap-2 font-semibold disabled:opacity-50 shadow-lg"
          >
            <Flame className={`w-5 h-5 ${isIroning ? 'animate-pulse' : ''}`} />
            {isIroning ? '熨烫中...' : '一键熨烫'}
          </button>
          <button
            onClick={() => setShowHDModal(true)}
            className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl flex items-center justify-center gap-2 font-semibold shadow-lg"
          >
            <Sparkles className="w-5 h-5" />
            高清渲染
          </button>
          <button
            onClick={downloadCanvas}
            className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl flex items-center justify-center gap-2 font-semibold"
          >
            <Download className="w-5 h-5" />
            下载
          </button>
        </div>
      )}

      {/* 主内容区域 */}
      <div className={`flex-1 min-h-0 flex gap-4 relative ${
        viewMode === 'pegboard'
          ? (isMobile ? 'flex-col' : 'flex-row')
          : (isMobile ? 'flex-col' : 'flex-row-reverse')
      }`}>
        {/* 拼豆板模式：侧边栏 */}
        {viewMode === 'pegboard' && (
          <div className={isMobile
            ? 'shrink-0'
            : 'w-[260px] lg:w-[320px] shrink-0 overflow-y-auto'
          }>
          {/* 手机：折叠切换条 */}
          {isMobile && (
            <button
              onClick={() => setSidebarCollapsed(v => !v)}
              className="w-full flex items-center justify-between px-4 py-2 bg-white rounded-xl shadow text-sm font-semibold text-gray-700 mb-2"
            >
              <span>{sidebarCollapsed ? '展开参考 / 颜色' : '收起'}</span>
              <span className="text-gray-400">{sidebarCollapsed ? '▼' : '▲'}</span>
            </button>
          )}
          <div className={`space-y-3 ${isMobile && sidebarCollapsed ? 'hidden' : ''}`}>
            {/* 参考图纸 */}
            {showReference && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-purple-300">
            {/* 顶部标题栏 */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span className="font-semibold text-sm">参考图纸</span>
              </div>
              <button
                onClick={() => setShowReference(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title="关闭"
              >
                <EyeOff className="w-3 h-3" />
              </button>
            </div>

            {/* 当前锁定颜色提示 */}
            {lockedColor && (
              <div className="px-4 py-2 bg-amber-100 border-b border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full border border-amber-400"
                    style={{ backgroundColor: lockedColor }}
                  />
                  <span className="text-xs font-semibold text-amber-800">
                    已锁定：{getColorCode(lockedColor)}
                  </span>
                </div>
                <button
                  onClick={() => handleColorLock(lockedColor)}
                  className="text-xs text-amber-700 hover:text-amber-900 underline"
                >
                  解锁
                </button>
              </div>
            )}

            {/* 参考图内容 */}
            <div className="bg-white p-3 overflow-auto" style={{ maxHeight: '40vh' }}>
              <div className="inline-block">
                <div
                  className="grid gap-0 rounded-lg overflow-hidden border border-gray-200"
                  style={{
                    gridTemplateColumns: `repeat(${referenceGrid[0].length}, ${baseSize * zoom * 0.3}px)`,
                    width: "fit-content",
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  {referenceGrid.map((row, y) =>
                    row.map((color, x) => {
                      const shouldHighlight =
                        lockedColor &&
                        color === lockedColor;
                      const cellSize = baseSize * zoom * 0.3;
                      
                      return (
                        <div
                          key={`ref-${x}-${y}`}
                          className={`transition-transform hover:scale-110 ${color ? 'cursor-pointer' : ''}`}
                          onClick={() => {
                            if (color) {
                              handleColorLock(color);
                            }
                          }}
                        >
                          <PegboardCell
                            x={x}
                            y={y}
                            color={color}
                            beadSize={cellSize}
                            viewMode="simple"
                            showGrid={true}
                            shouldHighlight={shouldHighlight}
                            canPlace={true}
                            isEmpty={!color}
                            canvasParams={canvasParams}
                          />
                        </div>
                      );
                    }),
                  )}
                </div>
              </div>
            </div>

            {/* 提示文字 */}
            <div className="px-4 py-2 bg-purple-50 border-t border-purple-200">
              <p className="text-xs text-purple-700 text-center">
                💡 点击豆子锁定颜色
              </p>
            </div>
          </div>
        )}

        {/* 材料清单 */}
        {showMaterialList && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-green-300">
            {/* 顶部标题栏 */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Square className="w-4 h-4" />
                <span className="font-semibold text-sm">材料清单</span>
              </div>
              <button
                onClick={() => setShowMaterialList(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title="关闭"
              >
                <EyeOff className="w-3 h-3" />
              </button>
            </div>

            {/* 材料清单内容 */}
            <div className="overflow-y-auto p-4" style={{ maxHeight: '40vh' }}>
              <div className="text-sm text-gray-600 mb-3">
                点击颜色自动拾取并高亮对应区域
              </div>
              <div className="space-y-2">
                {Array.from(colorCount.entries())
                  .sort((a, b) => b[1] - a[1])
                  .map(([colorHex, total]) => {
                    const placed = getPlacedCount(colorHex);
                    const completed = placed >= total;
                    const isLocked = lockedColor === colorHex;
                    const code = getColorCode(colorHex);
                    const progress = (placed / total) * 100;

                    return (
                      <button
                        key={colorHex}
                        onClick={() => handleColorLock(colorHex)}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all hover:shadow-md ${
                          isLocked
                            ? "border-amber-400 bg-amber-50 shadow-md"
                            : "border-gray-200 bg-gray-50 hover:border-purple-300"
                        } ${
                          completed
                            ? "opacity-60"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-lg border-2 border-gray-300 shadow-sm"
                              style={{
                                backgroundColor: colorHex,
                              }}
                            />
                            <div className="flex flex-col">
                              <span className="font-mono font-bold text-sm text-gray-700">
                                {code}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900">
                                  {placed}/{total}
                                </span>
                              </div>
                            </div>
                          </div>
                          {isLocked && (
                            <div className="text-amber-700 font-bold text-sm">
                              锁定中
                            </div>
                          )}
                        </div>
                        {/* 进度条 */}
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              completed
                                ? "bg-green-500"
                                : "bg-purple-500"
                            }`}
                            style={{
                              width: `${Math.min(progress, 100)}%`,
                            }}
                          />
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* 总进度 */}
            <div className="px-4 py-3 border-t bg-gray-50">
              <div className="text-sm text-gray-600 mb-2">
                总进度
              </div>
              <div className="flex justify-between text-lg font-bold mb-2">
                <span>{getTotalPlaced()}</span>
                <span>/</span>
                <span>{getTotalRequired()}</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                  style={{
                    width: `${getTotalRequired() > 0 ? (getTotalPlaced() / getTotalRequired()) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

            {/* 颜色选择面板 */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-700">选色</span>
                {lockedColor && (
                  <button
                    onClick={() => { setLockedColor(null); setPourMode(false); }}
                    className="text-xs text-amber-700 underline"
                  >
                    解锁
                  </button>
                )}
              </div>
              <div className="p-3 overflow-y-auto" style={{ maxHeight: isMobile ? '28vh' : '40vh' }}>
                {/* 当前选中色 */}
                {lockedColor && (
                  <div className="flex items-center gap-2 mb-3 px-2 py-1.5 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="w-5 h-5 rounded-full border-2 border-amber-400 flex-shrink-0"
                      style={{ backgroundColor: lockedColor }} />
                    <span className="text-xs font-bold text-amber-800">
                      {getColorCode(lockedColor)}
                    </span>
                    <span className="text-xs text-amber-600 truncate">
                      {beadColors.find(c => c.hex === lockedColor)?.name || ''}
                    </span>
                  </div>
                )}
                {/* 颜色网格 */}
                <div className="flex flex-wrap gap-1.5">
                  {beadColors.map(color => {
                    const isSelected = lockedColor === color.hex;
                    const completed = isColorCompleted(color.hex);
                    return (
                      <button
                        key={color.hex}
                        title={`${color[colorSystem] || color.mard} ${color.name}`}
                        onClick={() => handleColorLock(color.hex)}
                        className="relative rounded-full transition-transform hover:scale-110 active:scale-95"
                        style={{
                          width: 22, height: 22,
                          backgroundColor: color.hex,
                          boxShadow: isSelected
                            ? `0 0 0 2px white, 0 0 0 4px ${color.hex}`
                            : '0 1px 3px rgba(0,0,0,0.25)',
                          opacity: completed ? 0.4 : 1,
                        }}
                      >
                        {completed && (
                          <span className="absolute inset-0 flex items-center justify-center text-white text-[8px] font-bold">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
          </div>
        )}

        {/* 主画布区域 */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col">
          {/* 拼豆板模式：全屏主画布 */}
          {viewMode === 'pegboard' ? (
            <div className="bg-white rounded-2xl shadow-xl p-3 sm:p-4 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Paintbrush className="w-5 h-5 text-purple-600" />
                  拼豆创作台
                </h3>
                <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
              </div>
              {/* 手机锁色浮动徽章 */}
              {isMobile && lockedColor && (
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 border border-amber-300 rounded-full text-sm">
                    <div className="w-4 h-4 rounded-full border border-amber-400" style={{ backgroundColor: lockedColor }} />
                    <span className="font-semibold text-amber-900">{getColorCode(lockedColor)}</span>
                    <button onClick={() => { setLockedColor(null); setPourMode(false); }} className="text-amber-600 text-xs underline">解锁</button>
                  </div>
                  <button
                    onClick={() => setPourMode(!pourMode)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${pourMode ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    滑豆{pourMode ? ' 开' : ' 关'}
                  </button>
                </div>
              )}
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-4 flex items-center justify-center flex-1 overflow-auto min-h-0">
                <div 
                  className="rounded-xl shadow-2xl relative"
                  style={{
                    backgroundColor: '#E8E4DD',
                    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.15)',
                    padding: '16px',
                    /* pegboardScale 现在直接调整格子大小，不需要 CSS scale */
                    border: '6px solid #d0d0d0',
                    borderRadius: '12px',
                  }}
                >
                  <div
                    ref={canvasRef}
                    className="grid gap-0"
                    style={{
                      gridTemplateColumns: `repeat(${workingGrid[0].length}, ${baseSize * pegboardScale}px)`,
                      width: "fit-content",
                      backgroundColor: 'transparent',
                      touchAction: 'none',
                      userSelect: 'none',
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    {workingGrid.map((row, y) =>
                      row.map((color, x) => {
                        const referenceColor =
                          referenceGrid[y][x];
                        const shouldHighlight =
                          lockedColor &&
                          referenceColor === lockedColor;
                        const canPlace =
                          !lockedColor ||
                          referenceColor === lockedColor;
                        const isEmpty = !color;

                        return (
                          <PegboardCell
                            key={`work-${x}-${y}`}
                            x={x}
                            y={y}
                            color={color}
                            beadSize={baseSize * pegboardScale}
                            viewMode={viewMode}
                            showGrid={false}
                            shouldHighlight={shouldHighlight}
                            canPlace={canPlace}
                            isEmpty={isEmpty}
                            onMouseDown={() => canPlace && handleMouseDown(x, y)}
                            onMouseEnter={() => handleMouseEnter(x, y)}
                            canvasParams={canvasParams}
                          />
                        );
                      }),
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 简洁模式：左右分屏 */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 参考图纸 */}
              {showReference && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-600" />
                    参考图纸
                  </h3>
                  <div className="bg-white rounded-xl p-4 overflow-auto max-h-[40vh] sm:max-h-[600px]">
                    <div className="inline-block">
                      <div
                        className="grid gap-0 rounded-lg overflow-hidden shadow-inner border border-gray-200"
                        style={{
                          gridTemplateColumns: `repeat(${referenceGrid[0].length}, ${beadSize}px)`,
                          width: "fit-content",
                          backgroundColor: '#FFFFFF',
                        }}
                      >
                        {referenceGrid.map((row, y) =>
                          row.map((color, x) => {
                            const shouldHighlight =
                              lockedColor &&
                              color === lockedColor;
                            return (
                              <div
                                key={`ref-${x}-${y}`}
                                className={`flex items-center justify-center relative ${
                                  shouldHighlight
                                    ? "ring-2 ring-amber-400"
                                    : ""
                                }`}
                                style={{
                                  width: beadSize,
                                  height: beadSize,
                                  backgroundColor: shouldHighlight
                                    ? "#FEF3C7"
                                    : color || "#FAFAFA",
                                  opacity:
                                    lockedColor &&
                                    !shouldHighlight
                                      ? 0.3
                                      : 1,
                                  border: "0.15px solid rgba(130, 130, 130, 1)",
                                }}
                              >
                                {color && (
                                  <div
                                    className="absolute inset-0 rounded-full m-1"
                                    style={{
                                      backgroundColor: color,
                                      boxShadow:
                                        "inset 0 1px 3px rgba(0,0,0,0.2)",
                                    }}
                                  />
                                )}
                                {/* 显示已放置的豆子 */}
                                {workingGrid[y][x] && (
                                  <div
                                    className="absolute inset-0 rounded-full m-1 ring-2 ring-green-400"
                                    style={{
                                      backgroundColor: workingGrid[y][x] || '',
                                      boxShadow:
                                        "inset 0 1px 3px rgba(0,0,0,0.2), 0 0 8px rgba(34, 197, 94, 0.5)",
                                    }}
                                  />
                                )}
                              </div>
                            );
                          }),
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 编辑画板 */}
              <div
                className={`bg-white rounded-2xl shadow-xl p-6 ${showReference ? "" : "lg:col-span-2"}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Paintbrush className="w-5 h-5 text-purple-600" />
                    编辑画板
                  </h3>
                  <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
                </div>
                <div className="bg-gray-50 rounded-xl p-4 overflow-auto max-h-[40vh] sm:max-h-[600px]">
                  <div className="inline-block">
                    <div
                      ref={canvasRef}
                      className="grid gap-0 rounded-lg overflow-hidden shadow-inner border border-gray-300"
                      style={{
                        gridTemplateColumns: `repeat(${workingGrid[0].length}, ${beadSize}px)`,
                        width: "fit-content",
                        backgroundColor: '#FFFFFF',
                        touchAction: 'none',
                        userSelect: 'none',
                      }}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      {workingGrid.map((row, y) =>
                        row.map((color, x) => {
                          const referenceColor =
                            referenceGrid[y][x];
                          const shouldHighlight =
                            lockedColor &&
                            referenceColor === lockedColor;
                          const canPlace =
                            !lockedColor ||
                            referenceColor === lockedColor;
                          const isEmpty = !color;

                          return (
                            <PegboardCell
                              key={`edit-${x}-${y}`}
                              x={x}
                              y={y}
                              color={color}
                              beadSize={baseSize * pegboardScale}
                              viewMode={viewMode}
                              showGrid={showGrid}
                              shouldHighlight={shouldHighlight}
                              canPlace={canPlace}
                              isEmpty={isEmpty}
                              onMouseDown={() => canPlace && handleMouseDown(x, y)}
                              onMouseEnter={() => handleMouseEnter(x, y)}
                              canvasParams={canvasParams}
                            />
                          );
                        }),
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 材料单 - 只在简洁模式下显示在右侧 */}
        {viewMode === 'simple' && (
          <div className="bg-white rounded-2xl shadow-xl p-6 h-fit sticky top-4">
          <h3 className="text-xl font-bold mb-4">材料清单</h3>
          <div className="text-sm text-gray-600 mb-4">
            点击颜色自动拾取并高亮对应区域
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {Array.from(colorCount.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([colorHex, total]) => {
                const placed = getPlacedCount(colorHex);
                const completed = placed >= total;
                const isLocked = lockedColor === colorHex;
                const code = getColorCode(colorHex);
                const progress = (placed / total) * 100;

                return (
                  <button
                    key={colorHex}
                    onClick={() => handleColorLock(colorHex)}
                    className={`w-full p-3 rounded-xl transition-all text-left ${
                      isLocked
                        ? "bg-amber-100 border-2 border-amber-400 shadow-md"
                        : completed
                          ? "bg-green-50 border-2 border-green-300"
                          : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                          style={{ backgroundColor: colorHex }}
                        >
                          {completed && (
                            <span className="text-white text-lg">
                              ✓
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-mono font-bold text-sm">
                            {code}
                          </div>
                          <div className="text-xs text-gray-600">
                            {placed}/{total} 颗
                          </div>
                        </div>
                      </div>
                      {isLocked && (
                        <div className="text-amber-700 font-bold text-sm">
                          锁定中
                        </div>
                      )}
                    </div>
                    {/* 进度条 */}
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          completed
                            ? "bg-green-500"
                            : "bg-purple-500"
                        }`}
                        style={{
                          width: `${Math.min(progress, 100)}%`,
                        }}
                      />
                    </div>
                  </button>
                );
              })}
          </div>

          {/* 总进度 */}
          <div className="mt-6 pt-6 border-t">
            <div className="text-sm text-gray-600 mb-2">
              总进度
            </div>
            <div className="flex justify-between text-lg font-bold mb-2">
              <span>{getTotalPlaced()}</span>
              <span className="text-gray-400">/</span>
              <span>{getTotalRequired()}</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                style={{
                  width: `${getTotalRequired() > 0 ? (getTotalPlaced() / getTotalRequired()) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* 使用提示 */}
          <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-200">
            <p className="text-sm text-orange-800 font-semibold mb-2">
              ⚡ 滑豆模式使用提示
            </p>
            <ul className="text-sm text-orange-700 space-y-1 pl-4">
              <li>• 点击材料清单中的颜色可锁定该颜色</li>
              <li>• 锁定后开启<span className="font-bold">滑豆模式</span>开关</li>
              <li>• 鼠标滑过即上色，大面积填色超高效！</li>
            </ul>
          </div>
        </div>
        )}

      </div>

      {/* 完成提示模态框 */}
      {showCompletionModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          style={{ backgroundColor: 'rgba(58, 52, 42, 0.6)' }}
        >
          <div className="relative bg-paper-soft border border-edge-sand rounded-t-card sm:rounded-card p-6 sm:p-10 max-w-md w-full text-center max-h-[92vh] sm:max-h-none overflow-y-auto animate-in slide-in-from-bottom duration-200 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            {/* 手机端 drag handle */}
            <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-bead bg-edge-sand" aria-hidden="true" />

            {/* 庆祝图标 */}
            <div className="mb-6 flex justify-center">
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 bg-honey rounded-bead flex items-center justify-center animate-bounce"
                style={{ boxShadow: 'var(--shadow-lift-bead)' }}
                aria-hidden="true"
              >
                <PartyPopper className="w-10 h-10 sm:w-12 sm:h-12 text-ink-warm" />
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-semibold mb-3 text-ink-warm" style={{ fontFamily: 'var(--font-display)' }}>
              恭喜完成！
            </h2>
            <p className="text-ink-warm mb-1">
              您已成功完成所有{" "}
              <span style={{ fontFamily: 'var(--font-num)' }}>
                {Array.from(colorCount.values()).reduce((a, b) => a + b, 0)}
              </span>{" "}
              颗拼豆
            </p>
            <p className="text-sm text-ink-soft mb-8">
              使用了 <span style={{ fontFamily: 'var(--font-num)' }}>{colorCount.size}</span> 种颜色
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <button
                onClick={renderHighResolution}
                disabled={isRendering}
                className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-3 bg-paper-bg border border-edge-sand text-ink-warm rounded-control font-semibold hover:bg-paper-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
              >
                {isRendering ? (
                  <><Sparkles className="w-5 h-5 animate-spin" aria-hidden="true" />渲染中…</>
                ) : (
                  <><Sparkles className="w-5 h-5" aria-hidden="true" />导出高清</>
                )}
              </button>
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  setShowHDModal(true);
                }}
                disabled={savedToGallery}
                className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-3 bg-paper-bg border border-edge-sand text-ink-warm rounded-control font-semibold hover:bg-paper-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
              >
                {savedToGallery ? (
                  <><Check className="w-5 h-5 text-moss" aria-hidden="true" />已加入</>
                ) : (
                  <><Library className="w-5 h-5" aria-hidden="true" />作品馆</>
                )}
              </button>
              <button
                onClick={downloadCanvas}
                className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-3 bg-terracotta text-paper-bg rounded-control font-semibold hover:bg-terracotta-deep transition-colors focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
                style={{ boxShadow: 'var(--shadow-lift-bead)' }}
              >
                <Download className="w-5 h-5" aria-hidden="true" />
                下载
              </button>
            </div>

            <button
              onClick={() => setShowCompletionModal(false)}
              className="text-ink-soft hover:text-ink-warm text-sm transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 熨烫选择模态框 */}
      {showIroningModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          style={{ backgroundColor: 'rgba(58, 52, 42, 0.6)' }}
        >
          <div className="relative bg-paper-soft border border-edge-sand rounded-t-card sm:rounded-card max-w-2xl w-full overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-200 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            {/* 手机端 drag handle */}
            <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-bead bg-edge-sand z-10" aria-hidden="true" />

            <div className="overflow-y-auto p-4 sm:p-8">
              <div className="flex items-center justify-center mb-6">
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 bg-terracotta rounded-bead flex items-center justify-center"
                  style={{ boxShadow: 'var(--shadow-lift-bead)' }}
                  aria-hidden="true"
                >
                  <Flame className="w-7 h-7 sm:w-8 sm:h-8 text-paper-bg" />
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-2 text-ink-warm" style={{ fontFamily: 'var(--font-display)' }}>
                选择熨烫方式
              </h2>
              <p className="text-center text-ink-soft mb-6 leading-relaxed">
                不同的熨烫方式会产生不同的视觉效果
              </p>

              {/* 去除背景选项 */}
              <div className="mb-6 p-4 bg-paper-bg border border-edge-sand rounded-surface">
                <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={removeBackground}
                    onChange={(e) => setRemoveBackground(e.target.checked)}
                    className="w-5 h-5 rounded border-edge-sand accent-moss shrink-0"
                  />
                  <div>
                    <div className="font-semibold text-ink-warm">去除背景</div>
                    <div className="text-xs text-ink-soft mt-0.5">导出透明背景图片，只保留主体图案</div>
                  </div>
                </label>
              </div>

              {/* 熨烫方式选择 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
                {([
                  { key: 'paper', label: '铜版纸烫', desc: '最常见烫法，表面平整光滑，保留轻微孔洞，立体感适中', Icon: FileText },
                  { key: 'towel', label: '毛巾烫', desc: '表面非常平滑，细微绒面质感，孔洞几乎不可见，哑光效果', Icon: Layers },
                  { key: 'direct', label: '直烫', desc: '无烫纸直接熨烫，表面光滑有光泽，孔洞基本消失，最平整', Icon: Zap },
                  { key: 'glitter', label: '格里特烫', desc: '使用闪光烫纸，表面带有细密闪片，折射彩虹光泽，华丽闪耀', Icon: Sparkles },
                ] as const).map(({ key, label, desc, Icon }) => {
                  const selected = ironingMethod === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setIroningMethod(key)}
                      className={`text-left p-4 sm:p-6 rounded-surface border-2 transition-colors focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2 ${
                        selected
                          ? 'border-terracotta bg-paper-deep'
                          : 'border-edge-sand bg-paper-bg hover:bg-paper-deep'
                      }`}
                      aria-pressed={selected}
                    >
                      <Icon
                        className={`w-7 h-7 mb-3 ${selected ? 'text-terracotta' : 'text-ink-soft'}`}
                        aria-hidden="true"
                      />
                      <h3 className="font-semibold text-base mb-1.5 text-ink-warm">{label}</h3>
                      <p className="text-sm text-ink-soft leading-relaxed">{desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* 按钮组 */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowIroningModal(false)}
                  className="flex-1 inline-flex items-center justify-center min-h-[48px] px-6 py-3 bg-paper-bg border border-edge-sand text-ink-warm rounded-control font-semibold hover:bg-paper-deep transition-colors focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
                >
                  取消
                </button>
                <button
                  onClick={handleIroning}
                  className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 bg-terracotta text-paper-bg rounded-control font-semibold hover:bg-terracotta-deep transition-colors focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
                  style={{ boxShadow: 'var(--shadow-lift-bead)' }}
                >
                  <Flame className="w-5 h-5" aria-hidden="true" />
                  开始熨烫
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 高清渲染模态框 */}
      {showHDModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          style={{ backgroundColor: 'rgba(58, 52, 42, 0.6)' }}
        >
          <div className="relative bg-paper-soft border border-edge-sand rounded-t-card sm:rounded-card max-w-xl w-full p-4 sm:p-8 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            {/* 手机端 drag handle */}
            <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-bead bg-edge-sand" aria-hidden="true" />

            <div className="flex items-center justify-center mb-6">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 bg-moss rounded-bead flex items-center justify-center"
                style={{ boxShadow: 'var(--shadow-lift-bead)' }}
                aria-hidden="true"
              >
                <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-paper-bg" />
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-2 text-ink-warm" style={{ fontFamily: 'var(--font-display)' }}>
              高清渲染设置
            </h2>
            <p className="text-center text-ink-soft mb-8 leading-relaxed">
              导出高质量的拼豆作品图片
            </p>

            {/* 渲染倍数选择 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3 text-ink-warm">
                渲染倍数
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[2, 4, 8].map(scale => {
                  const selected = hdScale === scale;
                  return (
                    <button
                      key={scale}
                      onClick={() => setHdScale(scale)}
                      className={`p-3 sm:p-4 rounded-control border-2 transition-colors focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2 ${
                        selected
                          ? 'border-moss bg-paper-deep'
                          : 'border-edge-sand bg-paper-bg hover:bg-paper-deep'
                      }`}
                      aria-pressed={selected}
                    >
                      <div
                        className={`text-2xl font-bold ${selected ? 'text-moss' : 'text-ink-warm'}`}
                        style={{ fontFamily: 'var(--font-num)' }}
                      >
                        {scale}x
                      </div>
                      <div className="text-xs text-ink-soft mt-1" style={{ fontFamily: 'var(--font-num)' }}>
                        {workingGrid[0].length * 40 * scale} × {workingGrid.length * 40 * scale}px
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 去除背景选项 */}
            <div className="mb-6 p-4 bg-paper-bg border border-edge-sand rounded-surface">
              <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  checked={hdRemoveBackground}
                  onChange={(e) => setHdRemoveBackground(e.target.checked)}
                  className="w-5 h-5 rounded border-edge-sand accent-moss shrink-0"
                />
                <div>
                  <div className="font-semibold text-ink-warm">去除背景</div>
                  <div className="text-xs text-ink-soft mt-0.5">导出透明背景的 PNG 图片</div>
                </div>
              </label>
            </div>

            {/* 按钮 */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowHDModal(false)}
                className="flex-1 inline-flex items-center justify-center min-h-[48px] px-6 py-3 bg-paper-bg border border-edge-sand text-ink-warm rounded-control font-semibold hover:bg-paper-deep transition-colors focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
              >
                取消
              </button>
              <button
                onClick={handleHDRender}
                className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 bg-terracotta text-paper-bg rounded-control font-semibold hover:bg-terracotta-deep transition-colors focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
                style={{ boxShadow: 'var(--shadow-lift-bead)' }}
              >
                <Sparkles className="w-5 h-5" aria-hidden="true" />
                开始渲染
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 熨烫预览模态框 */}
      {showIronPreview && ironedResult && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          style={{ backgroundColor: 'rgba(58, 52, 42, 0.7)' }}
        >
          <div className="relative bg-paper-soft border border-edge-sand rounded-t-card sm:rounded-card p-4 sm:p-8 max-w-4xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            {/* 手机端 drag handle */}
            <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-bead bg-edge-sand" aria-hidden="true" />

            <div className="mb-6 mt-2 sm:mt-0">
              <h2 className="text-xl sm:text-2xl font-semibold text-center mb-2 text-ink-warm" style={{ fontFamily: 'var(--font-headline)' }}>熨烫效果预览</h2>
              <p className="text-center text-ink-soft text-sm">
                {IRONING_METHODS[ironingMethod].name} · {removeBackground ? '透明背景' : '白色背景'}
              </p>
            </div>

            <div className="bg-paper-deep border border-edge-sand rounded-surface p-4 sm:p-6 mb-6 overflow-auto max-h-[50vh] sm:max-h-[500px] flex items-center justify-center">
              <img
                src={ironedResult}
                alt="熨烫效果"
                className="max-w-full h-auto rounded-control"
                style={{
                  imageRendering: 'pixelated',
                  backgroundColor: removeBackground ? 'transparent' : 'var(--bead-paper-bg)',
                }}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setShowIronPreview(false);
                  setIronedResult(null);
                }}
                className="flex-1 min-w-[40%] inline-flex items-center justify-center min-h-[48px] px-4 py-3 bg-paper-bg border border-edge-sand text-ink-warm rounded-control font-semibold hover:bg-paper-deep transition-colors focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  setShowIronPreview(false);
                  setShowIroningModal(true);
                }}
                className="flex-1 min-w-[40%] inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-3 bg-paper-bg border border-edge-sand text-ink-warm rounded-control font-semibold hover:bg-paper-deep transition-colors focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
              >
                <Flame className="w-4 h-4" aria-hidden="true" />
                重新熨烫
              </button>
              <button
                onClick={() => {
                  const methodNames: Record<string, string> = {
                    paper: '铜版纸烫', towel: '毛巾烫', direct: '直烫', glitter: '格里特烫',
                  };
                  handleAddToGallery(ironedResult!, methodNames[ironingMethod]);
                }}
                disabled={savedToGallery}
                className="flex-1 min-w-[40%] inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-3 bg-paper-bg border border-edge-sand text-ink-warm rounded-control font-semibold hover:bg-paper-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
              >
                {savedToGallery ? (
                  <><Check className="w-4 h-4 text-moss" aria-hidden="true" />已加入</>
                ) : (
                  <><Library className="w-4 h-4" aria-hidden="true" />加入作品馆</>
                )}
              </button>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  const methodNames: Record<string, string> = {
                    paper: '铜版纸烫', towel: '毛巾烫', direct: '直烫', glitter: '格里特烫',
                  };
                  link.download = `拼豆作品-${methodNames[ironingMethod]}${removeBackground ? '-透明' : ''}.png`;
                  link.href = ironedResult!;
                  link.click();
                }}
                className="flex-1 min-w-[40%] inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-3 bg-terracotta text-paper-bg rounded-control font-semibold hover:bg-terracotta-deep transition-colors focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
                style={{ boxShadow: 'var(--shadow-lift-bead)' }}
              >
                <Download className="w-5 h-5" aria-hidden="true" />
                下载
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 高清渲染预览模态框 */}
      {showHDPreview && hdResult && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          style={{ backgroundColor: 'rgba(58, 52, 42, 0.7)' }}
        >
          <div className="relative bg-paper-soft border border-edge-sand rounded-t-card sm:rounded-card p-4 sm:p-8 max-w-4xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            {/* 手机端 drag handle */}
            <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-bead bg-edge-sand" aria-hidden="true" />

            <div className="mb-6 mt-2 sm:mt-0">
              <h2 className="text-xl sm:text-2xl font-semibold text-center mb-2 text-ink-warm" style={{ fontFamily: 'var(--font-headline)' }}>高清渲染预览</h2>
              <p className="text-center text-ink-soft text-sm" style={{ fontFamily: 'var(--font-num)' }}>
                {hdScale}x 渲染 · {hdRemoveBackground ? '透明背景' : '白色背景'}
              </p>
            </div>

            <div className="bg-paper-deep border border-edge-sand rounded-surface p-4 sm:p-6 mb-6 overflow-auto max-h-[50vh] sm:max-h-[500px] flex items-center justify-center">
              <img
                src={hdResult}
                alt="高清渲染"
                className="max-w-full h-auto rounded-control"
                style={{
                  imageRendering: 'auto',
                  backgroundColor: hdRemoveBackground ? 'transparent' : 'var(--bead-paper-bg)',
                }}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => { setShowHDPreview(false); setHdResult(null); }}
                className="flex-1 min-w-[40%] inline-flex items-center justify-center min-h-[48px] px-4 py-3 bg-paper-bg border border-edge-sand text-ink-warm rounded-control font-semibold hover:bg-paper-deep transition-colors focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
              >
                关闭
              </button>
              <button
                onClick={() => { setShowHDPreview(false); setShowHDModal(true); }}
                className="flex-1 min-w-[40%] inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-3 bg-paper-bg border border-edge-sand text-ink-warm rounded-control font-semibold hover:bg-paper-deep transition-colors focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                重新渲染
              </button>
              <button
                onClick={() => handleAddToGallery(hdResult!, `高清${hdScale}x渲染`)}
                disabled={savedToGallery}
                className="flex-1 min-w-[40%] inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-3 bg-paper-bg border border-edge-sand text-ink-warm rounded-control font-semibold hover:bg-paper-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
              >
                {savedToGallery ? (
                  <><Check className="w-4 h-4 text-moss" aria-hidden="true" />已加入</>
                ) : (
                  <><Library className="w-4 h-4" aria-hidden="true" />加入作品馆</>
                )}
              </button>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.download = `拼豆高清-${hdScale}x${hdRemoveBackground ? '-透明' : ''}.png`;
                  link.href = hdResult!;
                  link.click();
                }}
                className="flex-1 min-w-[40%] inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-3 bg-terracotta text-paper-bg rounded-control font-semibold hover:bg-terracotta-deep transition-colors focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
                style={{ boxShadow: 'var(--shadow-lift-bead)' }}
              >
                <Download className="w-5 h-5" aria-hidden="true" />
                下载
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 熨烫进度动画 - 展示熨斗在画板上移动 */}
      {isIroning && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          style={{ backgroundColor: 'rgba(58, 52, 42, 0.7)' }}
        >
          <div className="relative bg-paper-soft border border-edge-sand rounded-t-card sm:rounded-card p-4 sm:p-8 max-w-3xl w-full max-h-[92vh] sm:max-h-none overflow-y-auto animate-in slide-in-from-bottom duration-200 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <h3 className="text-xl sm:text-2xl font-semibold mb-2 mt-2 sm:mt-0 text-center text-ink-warm flex items-center justify-center gap-2" style={{ fontFamily: 'var(--font-headline)' }}>
              <Flame className="w-6 h-6 text-terracotta" aria-hidden="true" />
              熨烫中…
            </h3>
            <p className="text-ink-soft mb-6 text-center text-sm">
              正在用 <span className="text-ink-warm font-semibold">{IRONING_METHODS[ironingMethod].name}</span> 方式熨烫您的作品
            </p>

            {/* 拼豆板和熨斗动画 */}
            <div
              className="mb-6 bg-paper-deep border border-edge-sand rounded-surface p-4 sm:p-6 relative"
              style={{ aspectRatio: `${workingGrid[0].length} / ${workingGrid.length}`, maxHeight: '400px' }}
            >
              {/* 拼豆板网格 */}
              <div
                className="grid gap-0 w-full h-full relative"
                style={{ gridTemplateColumns: `repeat(${workingGrid[0].length}, 1fr)` }}
              >
                {workingGrid.map((row, y) =>
                  row.map((color, x) => {
                    const isPassed = y < ironPosition.y || (y === ironPosition.y && x <= ironPosition.x);
                    return (
                      <div
                        key={`iron-${x}-${y}`}
                        className="border border-edge-sand/40 transition-all duration-300"
                        style={{
                          backgroundColor: color || 'var(--bead-paper-bg)',
                          opacity: isPassed ? 1 : 0.6,
                          transform: isPassed ? 'scale(0.98)' : 'scale(1)',
                        }}
                      >
                        {color && !isPassed && (
                          <div
                            className="w-full h-full rounded-bead m-0.5"
                            style={{
                              backgroundColor: color,
                              boxShadow: 'inset 0 1px 2px rgba(58, 52, 42, 0.2)',
                            }}
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* 熨斗图标 — 暖色调金属手感（保留物体形态，换成 brand 色） */}
              <div
                className="absolute pointer-events-none transition-all duration-300"
                style={{
                  left: `${(ironPosition.x / workingGrid[0].length) * 100}%`,
                  top: `${(ironPosition.y / workingGrid.length) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                aria-hidden="true"
              >
                <div className="relative">
                  {/* 熨斗主体（暖墨色，模拟铸铁） */}
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 bg-ink-warm rounded-t-control relative transform -rotate-12"
                    style={{ boxShadow: 'var(--shadow-lift-bead)' }}
                  >
                    {/* 熨斗底板（稍浅一阶） */}
                    <div className="absolute -bottom-1 left-0 right-0 h-3 bg-ink-soft rounded-b-control" />
                    {/* 手柄（terracotta = "热"的物质暗示） */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-5 bg-terracotta rounded-t-control" />
                    {/* 热蒸汽 */}
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                      <div className="w-1.5 h-3 bg-paper-bg opacity-70 rounded-bead animate-pulse" />
                      <div className="w-1.5 h-4 bg-paper-bg opacity-60 rounded-bead animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <div className="w-1.5 h-3 bg-paper-bg opacity-70 rounded-bead animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                  {/* 热量光晕（honey 取代 orange） */}
                  <div className="absolute inset-0 bg-honey opacity-30 blur-xl rounded-bead animate-pulse" />
                </div>
              </div>

              {/* 热纸图层（如果不是直烫） */}
              {ironingMethod !== 'direct' && (
                <div className="absolute inset-0 bg-paper-bg opacity-10 pointer-events-none rounded-surface" />
              )}
            </div>

            {/* 进度条 — 实色 terracotta + paper-bg shimmer */}
            <div className="w-full h-3 bg-paper-deep border border-edge-sand rounded-bead overflow-hidden mb-2">
              <div
                className="h-full bg-terracotta transition-all duration-300 rounded-bead relative"
                style={{ width: `${ironProgress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-paper-bg to-transparent opacity-40 animate-pulse" />
              </div>
            </div>
            <p className="text-sm text-ink-soft text-center mb-4" style={{ fontFamily: 'var(--font-num)' }}>
              {Math.round(ironProgress)}%
            </p>

            {/* 阶段指示 */}
            <div className="flex items-center justify-center gap-3 text-sm text-ink-soft flex-wrap">
              <div className={`flex items-center gap-1.5 transition-colors ${ironProgress < 30 ? 'text-terracotta font-semibold' : ''}`}>
                <Thermometer className="w-4 h-4" aria-hidden="true" />
                加热
              </div>
              <span className="text-ink-soft" aria-hidden="true">→</span>
              <div className={`flex items-center gap-1.5 transition-colors ${ironProgress >= 30 && ironProgress < 70 ? 'text-terracotta font-semibold' : ''}`}>
                <Flame className="w-4 h-4" aria-hidden="true" />
                熨烫
              </div>
              <span className="text-ink-soft" aria-hidden="true">→</span>
              <div className={`flex items-center gap-1.5 transition-colors ${ironProgress >= 70 ? 'text-moss font-semibold' : ''}`}>
                <Snowflake className="w-4 h-4" aria-hidden="true" />
                冷却
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 单色完成庆祝 Toast */}
      {celebratingColor && (
        <div
          className="fixed z-[300] pointer-events-none"
          style={{
            bottom: isMobile ? '120px' : '36px',
            left: '50%',
            transform: 'translateX(-50%)',
            animation: 'colorDoneToast 2.8s ease forwards',
          }}
        >
          {/* 彩屑 — 用 brand 4 色循环（terracotta / moss / honey / honey-glow），不是霓虹拼盘 */}
          {[
            'var(--bead-terracotta)',
            'var(--bead-moss)',
            'var(--bead-honey)',
            'var(--bead-honey-glow)',
            'var(--bead-terracotta-deep)',
            'var(--bead-moss-deep)',
            'var(--bead-honey)',
            'var(--bead-terracotta)',
          ].map((c, i) => (
            <div
              key={i}
              className="absolute rounded-bead"
              style={{
                width: 7, height: 7,
                backgroundColor: c,
                top: '50%', left: '50%',
                ['--a' as string]: `${i * 45}deg`,
                animation: `confettiPop 0.65s ease-out ${i * 0.04}s forwards`,
                opacity: 0,
              }}
            />
          ))}

          {/* Toast 卡片 */}
          <div
            className="relative bg-paper-soft border-2 rounded-card flex items-center gap-3 px-5 py-3.5 whitespace-nowrap"
            style={{
              borderColor: celebratingColor.hex,
              boxShadow: 'var(--shadow-lift-bead)',
            }}
          >
            <div
              className="w-8 h-8 rounded-bead flex-shrink-0"
              style={{
                backgroundColor: celebratingColor.hex,
                // 用暖色调 inset 模拟塑料反光（不是冷黑）
                boxShadow: `inset -2px -2px 4px rgba(58, 52, 42, 0.25), inset 2px 2px 4px rgba(246, 239, 226, 0.4), 0 2px 8px ${celebratingColor.hex}66`,
              }}
            />
            <div>
              <div className="font-semibold text-ink-warm text-sm leading-tight flex items-center gap-1.5">
                这个色拼完啦
                <PartyPopper className="w-4 h-4 text-honey" aria-hidden="true" />
              </div>
              <div className="text-xs text-ink-soft mt-0.5" style={{ fontFamily: 'var(--font-num)' }}>
                {celebratingColor.code}{celebratingColor.name ? ` · ${celebratingColor.name}` : ''}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}