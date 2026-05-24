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
  Pin,
  PinOff,
  RotateCw,
  Snowflake,
  Sparkles,
  Square,
  Thermometer,
  Undo2,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { BeadGrid, BeadColor, ColorSystem } from "../App";
import { generateIronedImage, IRONING_METHODS, IroningMethod } from "./IroningHelpers";
import { DEFAULT_IRONING_PARAMS, type IroningParams } from "../data/ironingParams";

// 把用户的"光泽 / 质感 / 闪片" 3 个简单滑块换算成内部 IroningParams
// 全部 0-200 范围，100 = 默认值，0 = 关闭，200 = 加倍
function buildIroningParams(gloss: number, texture: number, sparkle: number): IroningParams {
  const g = gloss / 100;
  const t = texture / 100;
  const s = sparkle / 100;
  const base = DEFAULT_IRONING_PARAMS;
  return {
    ...base,
    paper: {
      ...base.paper,
      shineAlpha: Math.min(1, base.paper.shineAlpha * g),
      holeAlpha: Math.min(1, base.paper.holeAlpha * t),
      holeRadius: Math.min(0.4, base.paper.holeRadius * t),
    },
    towel: {
      ...base.towel,
      weaveAlpha: Math.min(1, base.towel.weaveAlpha * t),
      crossAlpha: Math.min(1, base.towel.crossAlpha * t),
      matteAlpha: Math.min(1, base.towel.matteAlpha * t),
      edgeAlpha: Math.min(1, base.towel.edgeAlpha * t),
    },
    direct: {
      ...base.direct,
      shineAlpha: Math.min(1, base.direct.shineAlpha * g),
      shineMidAlpha: Math.min(1, base.direct.shineMidAlpha * g),
      shineEdgeAlpha: Math.min(1, base.direct.shineEdgeAlpha * g),
      shadowAlpha: Math.min(1, base.direct.shadowAlpha * t),
    },
    glitter: {
      ...base.glitter,
      sparkleAlpha: Math.min(1, base.glitter.sparkleAlpha * s),
      sparkleCount: Math.max(0, Math.round(base.glitter.sparkleCount * s)),
      baseShineAlpha: Math.min(1, base.glitter.baseShineAlpha * g),
      highlightAlpha: Math.min(1, base.glitter.highlightAlpha * g),
      rainbowIntensity: Math.min(1, base.glitter.rainbowIntensity * s),
      crossSparkleCount: Math.max(0, Math.round(base.glitter.crossSparkleCount * s)),
    },
  };
}
import { generateHDImage } from "./HDRenderHelpers";
import { addToGallery } from "../utils/galleryUtils";
import { PegboardCell } from "./PegboardCell";
import { ViewModeToggle } from "./ViewModeToggle";
import { loadCanvasParams, type CanvasParams } from "../data/canvasParams";
import { saveOrShareImage, tapHaptic } from "../utils/native";
import {
  ChromeWindow,
  TitleBar,
  CornerPearls,
  WIN95_SHADOW,
  CARD_SHADOW,
  BUTTON_SHADOW,
  BUTTON_SHADOW_NAVY,
  INPUT_SHADOW,
} from "./ChromeWindow";
import { PixelArrow } from "./PixelDecorations";

// 工具栏小按钮 chrome 风样式 — 未按下 vs 按下两态共用
const toolBtnStyle = (pressed: boolean): React.CSSProperties => ({
  backgroundColor: pressed ? 'var(--y2k-navy)' : 'var(--bead-paper-soft)',
  color: pressed ? 'var(--bead-paper-bg)' : 'var(--bead-ink)',
  boxShadow: [
    '0 -2px 0 var(--y2k-navy)',
    '0 2px 0 var(--y2k-navy)',
    '-2px 0 0 var(--y2k-navy)',
    '2px 0 0 var(--y2k-navy)',
    pressed ? '2px 2px 0 var(--y2k-coral)' : '3px 3px 0 var(--y2k-navy-deep)',
  ].join(', '),
});

// 暂时隐藏高清渲染入口；将来重启用时翻成 true，工具栏 / 手机底栏 / 完成 modal 三处会一起恢复。
const SHOW_HD_RENDER = false;

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

// 参考图纸共享渲染组件 —— 简洁模式 + 拼豆板模式两处共用，保证视觉一致
// 方格像素图 + SVG 自适应 + cell stroke 细网格线 = PATTERN.EXE 同款图纸样式
interface ReferenceGridDisplayProps {
  referenceGrid: BeadGrid;
  workingGrid: BeadGrid;
  lockedColor: string | null;
  onColorLock: (color: string) => void;
  maxHeight?: string;
  showPlacedIndicator?: boolean; // 是否显示已放置标记（pegboard sidebar 不需要，simple 需要）
}

function ReferenceGridDisplay({
  referenceGrid,
  workingGrid,
  lockedColor,
  onColorLock,
  maxHeight = '36vh',
  showPlacedIndicator = true,
}: ReferenceGridDisplayProps) {
  if (!referenceGrid?.length || !referenceGrid[0]?.length) return null;
  const refCols = referenceGrid[0].length;
  const refRows = referenceGrid.length;
  return (
    <div
      className="bg-paper-bg p-2 flex items-center justify-center"
      style={{ boxShadow: 'inset 0 0 0 2px var(--y2k-navy)' }}
    >
      <svg
        viewBox={`0 0 ${refCols} ${refRows}`}
        preserveAspectRatio="xMidYMid meet"
        shapeRendering="crispEdges"
        style={{
          width: '100%',
          maxHeight,
          display: 'block',
          backgroundColor: 'var(--bead-paper-bg)',
        }}
        role="img"
        aria-label="参考图纸"
      >
        {referenceGrid.map((row, y) =>
          row.map((color, x) => {
            if (!color) return null;
            const isHighlight = lockedColor === color;
            const isPlaced = !!workingGrid[y]?.[x];
            const dimmed = lockedColor && !isHighlight;
            return (
              <g
                key={`ref-${x}-${y}`}
                onClick={() => onColorLock(color)}
                style={{ cursor: 'pointer' }}
              >
                {isHighlight && (
                  <rect x={x - 0.05} y={y - 0.05} width={1.1} height={1.1} fill="var(--bead-honey-glow)" />
                )}
                {/* 纯色方格直接相邻，不加 stroke 描边（跟原图纸样式一致） */}
                <rect
                  x={x}
                  y={y}
                  width={1}
                  height={1}
                  fill={color}
                  opacity={dimmed ? 0.3 : 1}
                />
                {/* 已放置指示移除 — 用户拼完后每格都有 stroke 看起来像奇怪的网格描边 */}
              </g>
            );
          }),
        )}
      </svg>
    </div>
  );
}

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
  // 参考图默认显示——之前手机端默认 false 导致用户找不到
  const [showReference, setShowReference] = useState(true);
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
  // 用户简化版熨烫效果调节 — 3 滑块（光泽 / 质感 / 闪片），100 = 默认
  const [effectGloss, setEffectGloss] = useState(100);
  const [effectTexture, setEffectTexture] = useState(100);
  const [effectSparkle, setEffectSparkle] = useState(100);
  const [isRefiningIron, setIsRefiningIron] = useState(false);

  // 撤销历史 — 每一笔（一次按下到松开）作为一个 snapshot，Ctrl+Z 撤销整笔
  const MAX_HISTORY = 50;
  const [history, setHistory] = useState<BeadGrid[]>([]);
  const canUndo = history.length > 0;
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
  // 材料清单默认显示——之前手机端默认 false 导致用户以为只有简洁模式才有
  const [showMaterialList, setShowMaterialList] = useState(true);
  const [isMobile, setIsMobile] = useState(() => !isLandscape() && window.innerWidth < 768);

  // 单色完成庆祝
  const [celebratingColor, setCelebratingColor] = useState<{ hex: string; code: string; name: string } | null>(null);
  const [celebratedColors, setCelebratedColors] = useState<Set<string>>(new Set());

  // 作品馆保存提示
  const [savedToGallery, setSavedToGallery] = useState(false);

  // 手机侧边栏折叠 — 默认展开（之前 true 时所有内容隐藏，用户以为没有 sidebar）
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 横屏提示横幅 — 手机竖屏时建议旋转（浏览器无法主动锁定方向）
  // localStorage 记忆"不再提示"，关一次后就不烦
  const [showRotateHint, setShowRotateHint] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('rotate-hint-dismissed') !== '1';
    } catch {
      return true;
    }
  });
  // 第一次进入手机竖屏 DIY 时的强提示 modal（独立 localStorage key）
  const [showRotateModal, setShowRotateModal] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('rotate-modal-dismissed') !== '1';
    } catch {
      return true;
    }
  });
  const dismissRotateModal = () => {
    setShowRotateModal(false);
    try { localStorage.setItem('rotate-modal-dismissed', '1'); } catch {}
  };

  // 参考图置顶 — 用户滚动画布时仍能看见，sticky 定位
  const [referencePinned, setReferencePinned] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('reference-pinned') === '1';
    } catch {
      return false;
    }
  });
  const togglePinReference = () => {
    setReferencePinned((prev) => {
      const next = !prev;
      try { localStorage.setItem('reference-pinned', next ? '1' : '0'); } catch {}
      return next;
    });
  };

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

  // 智能拼豆板布局 —— 计算板尺寸 + 图案居中偏移
  // 规则：
  //   - 板永远正方形
  //   - 板尺寸 = max(maxImageDim + 4, 29) — 起码 29×29（一块标准小板），或图边 + 4 cells padding
  //   - 图案居中放置（offsetX/Y 表示图左上角在板内坐标）
  const boardLayout = useMemo(() => {
    const cols = workingGrid[0]?.length || 30;
    const rows = workingGrid.length || 30;
    const maxImageDim = Math.max(cols, rows);
    const boardDim = Math.max(maxImageDim + 4, 29);
    const offsetX = Math.floor((boardDim - cols) / 2);
    const offsetY = Math.floor((boardDim - rows) / 2);
    return { boardDim, offsetX, offsetY, cols, rows };
  }, [workingGrid.length, workingGrid[0]?.length]);

  // 自适应计算拼豆板缩放 — 让正方形拼豆板充满工作区（缓冲减小让板更大）
  useEffect(() => {
    if (viewMode === 'pegboard') {
      const updateScale = () => {
        const boardDim = boardLayout.boardDim;

        const padding = 8;
        const border = 4;
        const extra = (padding + border) * 2;

        const landscape = window.innerWidth > window.innerHeight;
        const isEffectivelyMobile = !landscape && window.innerWidth < 768;
        // sidebar 宽 — 跟 STOCK / REF sidebar 实际宽度对齐（lg 时 STOCK 已加宽到 w-96=384）
        const sidebarW = isEffectivelyMobile ? 0 : window.innerWidth < 1024 ? 280 : 384;

        // 缓冲算 toolbar(~80) + 父 gap(~12) + chrome padding+title(~50) = 142
        const availableWidth = window.innerWidth - sidebarW - 30;
        const availableHeight = window.innerHeight - 150;

        const maxCellByWidth = (availableWidth - extra) / boardDim;
        const maxCellByHeight = (availableHeight - extra) / boardDim;
        const optimalCell = Math.min(maxCellByWidth, maxCellByHeight);

        const cellScale = Math.max(0.3, optimalCell / baseSize);
        setPegboardScale(cellScale);
      };

      updateScale();

      const handleResize = () => updateScale();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [viewMode, boardLayout.boardDim, baseSize]);

  // 移动端/平板检测：横屏时视为桌面
  // 注意：不再强制设置 showReference / showMaterialList。
  // 之前的 setShowMaterialList(landscape || width>=768) 会在每次旋转/resize 时
  // 把手机竖屏强制改成 false，覆盖用户的明确选择。现在默认全部 true，
  // 用户可以通过工具栏 toggle 或 sidebar 折叠条隐藏。
  useEffect(() => {
    const handleResize = () => {
      const landscape = window.innerWidth > window.innerHeight;
      setIsMobile(!landscape && window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // 触摸绘制支持（iPad / 手机）
  // 注意：触摸坐标对应"板内 cell"，需要减去 boardLayout.offsetX/Y 才映射到
  // workingGrid 实际行列。板的 padding 区只显示空 peg，不响应触摸。
  const getCellFromTouch = (touch: Touch): { x: number; y: number } | null => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const visualCellSize = viewMode === 'pegboard' ? beadSize * pegboardScale : beadSize;
    const boardCellX = Math.floor((touch.clientX - rect.left) / visualCellSize);
    const boardCellY = Math.floor((touch.clientY - rect.top) / visualCellSize);
    // 板坐标 → workingGrid 坐标
    const cellX = boardCellX - boardLayout.offsetX;
    const cellY = boardCellY - boardLayout.offsetY;
    if (
      cellX >= 0 && cellX < workingGrid[0].length &&
      cellY >= 0 && cellY < workingGrid.length
    ) {
      return { x: cellX, y: cellY };
    }
    return null;
  };

  // 撤销 push（提前声明给 touchStart / mouseDown 共用，避免 TDZ）
  const pushHistory = useCallback(() => {
    const snap = stateRef.current.workingGrid.map((row) => [...row]);
    setHistory((prev) => {
      const next = [...prev, snap];
      if (next.length > MAX_HISTORY) next.shift();
      return next;
    });
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    // 多指（pinch）让浏览器自己缩放页面，不绘制
    if (e.touches.length > 1) {
      setIsDrawing(false);
      return;
    }
    e.preventDefault();
    const touch = e.touches[0];
    const cell = getCellFromTouch(touch);
    if (!cell) return;
    const canPlace = !lockedColor || referenceGrid[cell.y]?.[cell.x] === lockedColor;
    if (canPlace) {
      pushHistory();
      setIsDrawing(true);
      handleCellClick(cell.x, cell.y);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // 多指：放手浏览器处理 pinch zoom
    if (e.touches.length > 1) {
      setIsDrawing(false);
      return;
    }
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

  // ★ Perf: handler 通过 ref 读最新 state，永远稳定引用——这样 PegboardCell 的
  // React.memo 才不会被 inline lambda 引用变化打废，6400 个 cell 不会全部重渲。
  // ref 内是每次 render 同步的 state 快照，避免 stale closure。
  const stateRef = useRef({
    lockedColor, referenceGrid, workingGrid, activeTool,
    selectedColor, celebratedColors, colorSystem,
    pourMode, isDrawing,
  });
  useEffect(() => {
    stateRef.current = {
      lockedColor, referenceGrid, workingGrid, activeTool,
      selectedColor, celebratedColors, colorSystem,
      pourMode, isDrawing,
    };
  });

  const handleCellClick = useCallback((x: number, y: number) => {
    const s = stateRef.current;
    if (s.lockedColor) {
      const referenceColor = s.referenceGrid[y][x];
      if (referenceColor !== s.lockedColor) return;
    }

    const newGrid = s.workingGrid.map((row) => [...row]);
    if (s.activeTool === "brush") {
      newGrid[y][x] = s.lockedColor
        ? s.lockedColor
        : (s.selectedColor === "#00000000" ? null : s.selectedColor);
    } else {
      newGrid[y][x] = null;
    }
    setWorkingGrid(newGrid);
    setBeadGrid(newGrid);

    // iOS: 每放/擦一颗豆子轻触感反馈；Web no-op
    tapHaptic(false);

    if (s.activeTool === 'brush') {
      const placedColor = s.lockedColor || (s.selectedColor !== '#00000000' ? s.selectedColor : null);
      if (placedColor && !s.celebratedColors.has(placedColor)) {
        let total = 0, placed = 0;
        for (let ry = 0; ry < s.referenceGrid.length; ry++) {
          for (let rx = 0; rx < s.referenceGrid[0].length; rx++) {
            if (s.referenceGrid[ry][rx] === placedColor) {
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
            code: colorInfo?.[s.colorSystem] || colorInfo?.mard || '?',
            name: colorInfo?.name || '',
          });
          setTimeout(() => setCelebratingColor(null), 2800);
          // 完成单色：强一档触感作为"成就"反馈
          tapHaptic(true);
        }
      }
    }
  }, []);

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setWorkingGrid(last);
      setBeadGrid(last);
      tapHaptic(false);
      return prev.slice(0, -1);
    });
  }, []);

  // Ctrl+Z / Cmd+Z 撤销
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUndo]);

  const handleMouseDown = useCallback((x: number, y: number) => {
    pushHistory();
    setIsDrawing(true);
    handleCellClick(x, y);
  }, [handleCellClick, pushHistory]);

  const handleMouseEnter = useCallback((x: number, y: number) => {
    setHoveredCell({ x, y });
    const s = stateRef.current;
    if (s.pourMode && s.lockedColor) {
      handleCellClick(x, y);
    } else if (s.isDrawing) {
      handleCellClick(x, y);
    }
  }, [handleCellClick]);

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

  // 把当前工作画布渲染成 PNG dataURL，下载和"加入作品馆"共用
  const generateCanvasDataURL = (): string => {
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

    return canvas.toDataURL();
  };

  const downloadCanvas = () => {
    const w = workingGrid[0]?.length ?? 0;
    const h = workingGrid.length;
    // iOS app: 触发原生分享菜单（保存到照片 / AirDrop / 微信 等）
    // Web: 浏览器下载
    saveOrShareImage(generateCanvasDataURL(), `拼豆图纸-${w}x${h}.png`);
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

    // 使用新的辅助函数生成熨烫效果，套用当前滑块参数
    const ironedImageUrl = await generateIronedImage(workingGrid, {
      method: ironingMethod,
      removeBackground,
      params: buildIroningParams(effectGloss, effectTexture, effectSparkle),
    });

    // 显示预览而不是直接下载
    setIronedResult(ironedImageUrl);
    setIronProgress(0);
    setIsIroning(false);
    setShowIronPreview(true);
  };

  // 用户在预览里拖滑块时，debounced 重生成图片
  useEffect(() => {
    if (!showIronPreview || !workingGrid.length || !workingGrid[0]?.length) return;
    setIsRefiningIron(true);
    const t = setTimeout(async () => {
      const url = await generateIronedImage(workingGrid, {
        method: ironingMethod,
        removeBackground,
        params: buildIroningParams(effectGloss, effectTexture, effectSparkle),
      });
      setIronedResult(url);
      setIsRefiningIron(false);
    }, 220);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectGloss, effectTexture, effectSparkle, ironingMethod, removeBackground, showIronPreview]);

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
    <div className="flex flex-col gap-3" style={{ height: 'calc(100dvh - 80px)' }}>
      {/* TOOLBAR.EXE 工具栏 */}
      <div className="relative shrink-0">
        <div
          className="relative bg-paper-bg p-3 pt-7 sm:p-4 sm:pt-8"
          style={{
            boxShadow: WIN95_SHADOW,
            backgroundImage:
              'radial-gradient(circle, rgba(44, 58, 94, 0.05) 1px, transparent 1px)',
            backgroundSize: '14px 14px',
          }}
        >
          <TitleBar name="TOOLBAR.EXE" />
          <div className={`flex items-center gap-2.5 ${isMobile ? 'flex-wrap gap-y-2.5' : 'flex-wrap gap-3'}`}>
            {/* 画笔 / 橡皮 */}
            <button
              onClick={() => setActiveTool("brush")}
              className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] p-2.5 transition-transform hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px]"
              style={toolBtnStyle(activeTool === "brush")}
              aria-label="画笔"
              aria-pressed={activeTool === "brush"}
            >
              <Paintbrush className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              onClick={() => setActiveTool("eraser")}
              className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] p-2.5 transition-transform hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px]"
              style={toolBtnStyle(activeTool === "eraser")}
              aria-label="橡皮"
              aria-pressed={activeTool === "eraser"}
            >
              <Eraser className="w-5 h-5" aria-hidden="true" />
            </button>

            {/* 撤销 — Ctrl+Z 也可触发，每一笔（按下到松开）算一组 */}
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] p-2.5 transition-transform hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed"
              style={toolBtnStyle(false)}
              aria-label="撤销 Ctrl+Z"
              title={canUndo ? '撤销 (Ctrl+Z)' : '没有可撤销操作'}
            >
              <Undo2 className="w-5 h-5" aria-hidden="true" />
            </button>

            <div className="h-7 w-px bg-y2k-navy" aria-hidden="true" />

            {/* 缩放控制 */}
            <button
              onClick={handleZoomOut}
              className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] p-2 transition-transform hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px]"
              style={toolBtnStyle(false)}
              aria-label="缩小"
            >
              <ZoomOut className="w-5 h-5" aria-hidden="true" />
            </button>
            <span
              className="font-pixel-arcade text-y2k-navy text-center"
              style={{ fontSize: 13, width: 42, letterSpacing: '0.05em' }}
            >
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] p-2 transition-transform hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px]"
              style={toolBtnStyle(false)}
              aria-label="放大"
            >
              <ZoomIn className="w-5 h-5" aria-hidden="true" />
            </button>

            <div className="h-7 w-px bg-y2k-navy" aria-hidden="true" />

            {/* 移除冗余 toggle（网格 / 参考图纸 / 材料清单）— 用户反馈不必要
                参考图和材料清单默认显示，各自 title bar 自带 close X；
                showGrid 默认 false，需要可在代码加回 */}

            {/* 滑豆模式开关 — 始终显示在工具栏，大字 + Zap 图标，
                即使没锁色也能预先开（开了再选色直接 pour） */}
            <button
              onClick={() => setPourMode(!pourMode)}
              className="inline-flex items-center gap-2 min-h-[40px] px-3 py-2 font-pixel-cn transition-transform hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px]"
              style={{
                ...toolBtnStyle(pourMode),
                fontSize: 13,
                letterSpacing: '0.05em',
              }}
              aria-label="切换滑豆模式"
              aria-pressed={pourMode}
              title="滑豆模式：开启后鼠标/手指划过即填豆"
            >
              <Zap className={`w-5 h-5 ${pourMode ? 'animate-pulse' : ''}`} aria-hidden="true" />
              <span>滑豆 {pourMode ? '· ON' : '· OFF'}</span>
            </button>

            {/* 锁色指示 — 仅有锁色时显示 */}
            {lockedColor && (
              <div
                className="flex items-center gap-2 px-3 py-2 bg-paper-soft"
                style={{ boxShadow: INPUT_SHADOW }}
              >
                <div
                  className="w-5 h-5"
                  style={{
                    backgroundColor: lockedColor,
                    boxShadow: [
                      '0 -1px 0 var(--y2k-navy)',
                      '0 1px 0 var(--y2k-navy)',
                      '-1px 0 0 var(--y2k-navy)',
                      '1px 0 0 var(--y2k-navy)',
                    ].join(', '),
                  }}
                  aria-hidden="true"
                />
                <span className="font-pixel-arcade text-y2k-navy" style={{ fontSize: 13, letterSpacing: '0.05em' }}>
                  LOCK {getColorCode(lockedColor)}
                </span>
                <button
                  onClick={() => { setLockedColor(null); setPourMode(false); }}
                  className="ml-1 font-pixel-arcade text-y2k-coral hover:text-y2k-coral/70 transition-colors"
                  style={{ fontSize: 13, letterSpacing: '0.05em' }}
                  aria-label="解锁颜色"
                >
                  × UNLOCK
                </button>
              </div>
            )}

            {/* 右侧主操作（桌面） */}
            <div className="ml-auto hidden sm:flex flex-wrap gap-3">
              <button
                onClick={() => setShowIroningModal(true)}
                disabled={isIroning}
                className="arcade-pill font-pixel-cn text-paper-bg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                style={{
                  backgroundColor: 'var(--y2k-navy)',
                  fontSize: 13,
                  letterSpacing: '0.1em',
                  padding: '10px 22px',
                }}
                title="一键熨烫"
              >
                <Flame className={`w-4 h-4 ${isIroning ? 'animate-pulse' : ''}`} aria-hidden="true" />
                <span>{isIroning ? '熨烫中…' : '一键熨烫'}</span>
                {!isIroning && <PixelArrow size={12} color="var(--bead-paper-bg)" />}
              </button>
              {SHOW_HD_RENDER && (
                <button
                  onClick={() => setShowHDModal(true)}
                  className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 font-pixel-cn whitespace-nowrap transition-transform hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px]"
                  style={{ ...toolBtnStyle(false), fontSize: 12, letterSpacing: '0.05em' }}
                  title="高清渲染"
                >
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                  <span>高清渲染</span>
                </button>
              )}
              <button
                onClick={downloadCanvas}
                className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 font-pixel-cn whitespace-nowrap transition-transform hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px]"
                style={{ ...toolBtnStyle(false), fontSize: 12, letterSpacing: '0.05em' }}
                title="下载图纸"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>下载图纸</span>
              </button>
            </div>
          </div>
        </div>
        <CornerPearls />
      </div>

      {/* 手机专用底部操作栏 */}
      {isMobile && (
        <div className="shrink-0 flex gap-2">
          <button
            onClick={() => setShowIroningModal(true)}
            disabled={isIroning}
            className="flex-1 arcade-pill font-pixel-cn text-paper-bg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--y2k-navy)',
              fontSize: 12,
              letterSpacing: '0.1em',
              padding: '12px 16px',
            }}
          >
            <Flame className={`w-4 h-4 ${isIroning ? 'animate-pulse' : ''}`} aria-hidden="true" />
            {isIroning ? '熨烫中…' : '一键熨烫'}
          </button>
          {SHOW_HD_RENDER && (
            <button
              onClick={() => setShowHDModal(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] py-3 font-pixel-cn"
              style={{ ...toolBtnStyle(false), fontSize: 12, letterSpacing: '0.05em' }}
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              高清
            </button>
          )}
          <button
            onClick={downloadCanvas}
            className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] py-3 font-pixel-cn"
            style={{ ...toolBtnStyle(false), fontSize: 12, letterSpacing: '0.05em' }}
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            下载
          </button>
        </div>
      )}

      {/* 横屏建议 modal — 仅在手机竖屏 + 第一次进 DIY + 还没 dismiss 过时弹一次
          强提示版，比 banner 更难错过 */}
      {isMobile && showRotateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-200"
          style={{ backgroundColor: 'rgba(44, 58, 94, 0.55)' }}
          onClick={dismissRotateModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="rotate-modal-title"
        >
          <div className="relative max-w-sm w-full animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div
              className="relative bg-paper-bg pt-7 px-6 pb-6 sm:px-7 sm:pb-7"
              style={{
                boxShadow: WIN95_SHADOW,
                backgroundImage:
                  'radial-gradient(circle, rgba(44, 58, 94, 0.05) 1px, transparent 1px)',
                backgroundSize: '14px 14px',
              }}
            >
              <TitleBar name="HINT.EXE" onClose={dismissRotateModal} />
              <div className="flex flex-col items-center text-center">
                <div
                  className="w-20 h-20 bg-y2k-coral flex items-center justify-center mb-5"
                  style={{
                    boxShadow: [
                      '0 -2px 0 var(--y2k-navy)',
                      '0 2px 0 var(--y2k-navy)',
                      '-2px 0 0 var(--y2k-navy)',
                      '2px 0 0 var(--y2k-navy)',
                      '4px 4px 0 var(--y2k-navy-deep)',
                    ].join(', '),
                  }}
                >
                  <RotateCw className="w-10 h-10 text-paper-bg animate-rotate-hint" aria-hidden="true" />
                </div>
                <h3
                  id="rotate-modal-title"
                  className="font-pixel-cn text-ink-warm mb-3"
                  style={{ fontSize: 22, letterSpacing: '0.1em', lineHeight: 1.2 }}
                >
                  请试试横屏
                </h3>
                <p
                  className="font-pixel-cn text-ink-soft mb-6 leading-relaxed"
                  style={{ fontSize: 11, letterSpacing: '0.03em' }}
                >
                  画布会大很多，参考图 / 材料清单能一屏看到
                </p>
                <button
                  onClick={dismissRotateModal}
                  className="w-full arcade-pill font-pixel-cn text-paper-bg cursor-pointer"
                  style={{
                    backgroundColor: 'var(--y2k-navy)',
                    fontSize: 13,
                    letterSpacing: '0.1em',
                    padding: '12px 18px',
                  }}
                >
                  <span>知道了</span>
                  <PixelArrow size={12} color="var(--bead-paper-bg)" />
                </button>
              </div>
            </div>
            <CornerPearls />
          </div>
        </div>
      )}

      {/* 横屏体验提示 — 手机竖屏时显示，横屏 / 关闭过 / iPad 桌面均不出现
          视觉策略：solid honey + 摇摆图标 + 大字加粗，让用户一眼看到
          注意：modal 还没 dismiss 时不显示 banner，避免双重提示叠加 */}
      {isMobile && showRotateHint && !showRotateModal && (
        <div
          className="shrink-0 flex items-center justify-between gap-3 px-4 py-3.5 bg-honey rounded-control text-base font-semibold text-ink-warm animate-in slide-in-from-top-2 duration-300"
          style={{ boxShadow: 'var(--shadow-lift-bead)' }}
          role="status"
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* 摇摆图标 — 模拟手机来回旋转的动作，比静态图标抓眼 */}
            <div className="shrink-0 w-8 h-8 rounded-control bg-paper-bg flex items-center justify-center">
              <RotateCw className="w-5 h-5 text-terracotta animate-rotate-hint" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="leading-tight">请试试横屏</div>
              <div className="text-xs font-normal text-ink-soft mt-0.5">画布更大、操作更准</div>
            </div>
          </div>
          <button
            onClick={() => {
              setShowRotateHint(false);
              try { localStorage.setItem('rotate-hint-dismissed', '1'); } catch {}
            }}
            className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] -mr-1 rounded-control text-ink-warm/70 hover:text-ink-warm hover:bg-paper-bg/40 transition-colors"
            aria-label="不再提示横屏建议"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* 主内容区域 — flex-1 min-h-0 让 flex 子能拿到正确 height = 父减toolbar */}
      <div className={`flex-1 min-h-0 flex gap-4 relative items-stretch ${
        viewMode === 'pegboard'
          ? (isMobile ? 'flex-col' : 'flex-row')
          : (isMobile ? 'flex-col' : 'flex-row-reverse')
      }`}>
        {/* 拼豆板模式：侧边栏（加宽匹配 STOCK，跟主画布对齐） */}
        {viewMode === 'pegboard' && (
          <div className={isMobile
            ? 'shrink-0'
            : 'w-[280px] lg:w-[384px] shrink-0 overflow-y-auto self-stretch'
          }>
          {/* 手机：折叠切换条 — 展开时同步打开参考图和材料清单（否则只见色盘） */}
          {isMobile && (
            <button
              onClick={() => {
                setSidebarCollapsed(v => {
                  const next = !v;
                  if (!next) {
                    // 即将展开：把参考图和材料清单都默认打开
                    setShowReference(true);
                    setShowMaterialList(true);
                  }
                  return next;
                });
              }}
              className="w-full flex items-center justify-between min-h-[44px] px-4 py-2 bg-paper-soft border border-edge-sand rounded-control text-sm font-semibold text-ink-warm mb-2 hover:bg-paper-deep transition-colors focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2"
              aria-expanded={!sidebarCollapsed}
            >
              <span>{sidebarCollapsed ? '展开参考 / 材料' : '收起'}</span>
              <span className="text-ink-soft text-xs" aria-hidden="true">{sidebarCollapsed ? '▼' : '▲'}</span>
            </button>
          )}
          <div className={`space-y-3 ${isMobile && sidebarCollapsed ? 'hidden' : ''}`}>
            {/* 参考图纸 — 置顶时强制 fixed 到视口左上角（sticky 受 containing block
                限制只在 sidebar 内"贴"，滚到 canvas 就消失；fixed 不受影响）*/}
            {showReference && (
          <div
            className="relative bg-paper-bg overflow-hidden"
            style={referencePinned ? {
              position: 'fixed',
              top: '8px',
              left: '8px',
              right: '8px',
              zIndex: 40,
              maxHeight: '50vh',
              overflowY: 'auto',
              boxShadow: CARD_SHADOW,
              paddingTop: 20,
            } : { boxShadow: CARD_SHADOW, paddingTop: 20 }}
          >
            {/* REF.EXE title bar */}
            <div
              className="absolute left-0 right-0 flex items-center justify-between px-2"
              style={{ top: 2, height: 16, backgroundColor: 'var(--y2k-navy)', color: 'var(--bead-paper-bg)' }}
            >
              <span className="font-pixel-arcade" style={{ fontSize: 12, letterSpacing: 0 }}>
                REF.EXE{referencePinned ? ' · PINNED' : ''}
              </span>
              <div className="flex gap-0.5 items-center">
                <button
                  onClick={togglePinReference}
                  className="w-2.5 h-2.5 flex items-center justify-center"
                  style={{ backgroundColor: referencePinned ? 'var(--y2k-coral)' : 'var(--bead-paper-bg)', opacity: referencePinned ? 1 : 0.8 }}
                  title={referencePinned ? '取消置顶' : '置顶到视口顶部'}
                  aria-label={referencePinned ? '取消置顶参考图' : '置顶参考图'}
                  aria-pressed={referencePinned}
                />
                <div className="w-2.5 h-2.5 bg-paper-bg/80" aria-hidden="true" />
                <button
                  onClick={() => setShowReference(false)}
                  className="w-2.5 h-2.5 bg-y2k-coral cursor-pointer hover:bg-y2k-coral/80 transition-colors"
                  aria-label="关闭参考图纸"
                />
              </div>
            </div>
            <div className="flex items-center justify-between px-3 py-2"
              style={{ borderBottom: '2px solid var(--y2k-navy)' }}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-pixel-cn text-ink-warm" style={{ fontSize: 13, letterSpacing: '0.08em' }}>参考图纸</span>
                <span className="font-pixel-arcade text-y2k-navy" style={{ fontSize: 12, letterSpacing: '0.1em' }}>REFERENCE</span>
              </div>
            </div>

            {/* 当前锁定颜色提示 */}
            {lockedColor && (
              <div className="px-4 py-2.5 bg-honey-glow/40 border-b border-honey/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-bead border border-edge-sand"
                    style={{ backgroundColor: lockedColor }}
                    aria-hidden="true"
                  />
                  <span className="text-xs font-semibold text-ink-warm" style={{ fontFamily: 'var(--font-num)' }}>
                    已锁定 {getColorCode(lockedColor)}
                  </span>
                </div>
                <button
                  onClick={() => handleColorLock(lockedColor)}
                  className="text-xs text-ink-soft hover:text-ink-warm underline transition-colors"
                  aria-label="解锁颜色"
                >
                  解锁
                </button>
              </div>
            )}

            {/* 参考图内容 — 共享 ReferenceGridDisplay 跟简洁模式同款 */}
            <ReferenceGridDisplay
              referenceGrid={referenceGrid}
              workingGrid={workingGrid}
              lockedColor={lockedColor}
              onColorLock={handleColorLock}
              maxHeight="36vh"
              showPlacedIndicator
            />

            {/* 提示文字 */}
            <div className="px-4 py-2.5 bg-paper-deep border-t border-edge-sand flex items-center justify-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-moss shrink-0" aria-hidden="true" />
              <p className="text-xs text-ink-soft">点击豆子锁定颜色</p>
            </div>
          </div>
        )}

        {/* 材料清单 STOCK.EXE */}
        {showMaterialList && (
          <div className="relative bg-paper-bg overflow-hidden" style={{ boxShadow: CARD_SHADOW, paddingTop: 20 }}>
            <div
              className="absolute left-0 right-0 flex items-center justify-between px-2"
              style={{ top: 2, height: 16, backgroundColor: 'var(--y2k-navy)', color: 'var(--bead-paper-bg)' }}
            >
              <span className="font-pixel-arcade" style={{ fontSize: 12, letterSpacing: 0 }}>STOCK.EXE</span>
              <div className="flex gap-0.5 items-center">
                <div className="w-2.5 h-2.5 bg-paper-bg/80" aria-hidden="true" />
                <div className="w-2.5 h-2.5 bg-paper-bg/80" aria-hidden="true" />
                <button
                  onClick={() => setShowMaterialList(false)}
                  className="w-2.5 h-2.5 bg-y2k-coral cursor-pointer hover:bg-y2k-coral/80 transition-colors"
                  aria-label="关闭材料清单"
                />
              </div>
            </div>
            <div className="flex items-center justify-between px-3 py-2"
              style={{ borderBottom: '2px solid var(--y2k-navy)' }}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-pixel-cn text-ink-warm" style={{ fontSize: 13, letterSpacing: '0.08em' }}>材料清单</span>
                <span className="font-pixel-arcade text-y2k-navy" style={{ fontSize: 12, letterSpacing: '0.1em' }}>STOCK</span>
              </div>
            </div>

            {/* 材料清单内容 */}
            <div className="overflow-y-auto p-4" style={{ maxHeight: '40vh' }}>
              <div className="text-sm text-ink-soft mb-3">
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
                        className={`w-full text-left p-3 rounded-control border-2 transition-colors focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2 ${
                          isLocked
                            ? "border-honey bg-honey-glow/40"
                            : "border-edge-sand bg-paper-bg hover:bg-paper-deep"
                        } ${completed ? "opacity-60" : ""}`}
                        aria-pressed={isLocked}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-8 h-8 rounded-control border border-edge-sand shrink-0"
                              style={{ backgroundColor: colorHex }}
                              aria-hidden="true"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-sm text-ink-warm" style={{ fontFamily: 'var(--font-num)' }}>
                                {code}
                              </span>
                              <span className="text-sm font-semibold text-ink-warm" style={{ fontFamily: 'var(--font-num)' }}>
                                {placed}/{total}
                              </span>
                            </div>
                          </div>
                          {isLocked && (
                            <div className="text-ink-warm font-semibold text-xs shrink-0">
                              锁定中
                            </div>
                          )}
                        </div>
                        {/* 进度条 */}
                        <div className="w-full h-2 bg-paper-deep rounded-bead overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 rounded-bead ${
                              completed ? "bg-moss" : "bg-terracotta"
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* 总进度 */}
            <div className="px-4 py-3 border-t border-edge-sand bg-paper-bg">
              <div className="text-sm text-ink-soft mb-2">总进度</div>
              <div className="flex items-baseline justify-center gap-2 text-lg font-semibold mb-2 text-ink-warm" style={{ fontFamily: 'var(--font-num)' }}>
                <span>{getTotalPlaced()}</span>
                <span className="text-ink-soft">/</span>
                <span>{getTotalRequired()}</span>
              </div>
              <div className="w-full h-3 bg-paper-deep rounded-bead overflow-hidden">
                <div
                  className="h-full bg-terracotta transition-all duration-300 rounded-bead"
                  style={{
                    width: `${getTotalRequired() > 0 ? (getTotalPlaced() / getTotalRequired()) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

            {/* COLORS.EXE 选色面板已移除 — 用户反馈冗余（材料清单的每一行已是色卡选择器） */}

          </div>
          </div>
        )}

        {/* 主画布区域 — flex-1 + 内部 flex-col 让 chrome 撑满高度跟 sidebar 对齐 */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col self-stretch">
          {/* PEGBOARD.EXE 拼豆板模式：chrome 撑满主区，pegboard 内部居中 */}
          {viewMode === 'pegboard' ? (
            <div className="relative flex-1 flex flex-col min-h-0">
              <div
                className="relative bg-paper-bg p-3 pt-7 sm:p-4 sm:pt-8 flex-1 flex flex-col min-h-0"
                style={{
                  boxShadow: WIN95_SHADOW,
                  backgroundImage:
                    'radial-gradient(circle, rgba(44, 58, 94, 0.05) 1px, transparent 1px)',
                  backgroundSize: '14px 14px',
                }}
              >
                <TitleBar name="PEGBOARD.EXE" />
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-baseline gap-3">
                    <h3 className="font-pixel-cn text-ink-warm" style={{ fontSize: 22, letterSpacing: '0.1em', lineHeight: 1.1 }}>
                      拼豆创作台
                    </h3>
                    <span className="font-pixel-arcade text-y2k-navy" style={{ fontSize: 13, letterSpacing: '0.15em' }}>
                      STUDIO
                    </span>
                  </div>
                  <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
                </div>
              {/* 手机锁色浮动徽章 */}
              {isMobile && lockedColor && (
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-honey-glow/40 border border-honey/40 rounded-control text-sm">
                    <div className="w-4 h-4 rounded-bead border border-edge-sand" style={{ backgroundColor: lockedColor }} aria-hidden="true" />
                    <span className="font-semibold text-ink-warm" style={{ fontFamily: 'var(--font-num)' }}>{getColorCode(lockedColor)}</span>
                    <button
                      onClick={() => { setLockedColor(null); setPourMode(false); }}
                      className="text-ink-soft hover:text-ink-warm text-xs underline transition-colors"
                      aria-label="解锁颜色"
                    >解锁</button>
                  </div>
                  <button
                    onClick={() => setPourMode(!pourMode)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control border text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2 ${
                      pourMode
                        ? 'bg-terracotta text-paper-bg border-terracotta'
                        : 'bg-paper-bg text-ink-warm border-edge-sand hover:bg-paper-deep'
                    }`}
                    aria-pressed={pourMode}
                  >
                    <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                    滑豆{pourMode ? ' · 开' : ' · 关'}
                  </button>
                </div>
              )}
              <div
                className="bg-paper-deep rounded-surface p-2 overflow-auto flex-1 min-h-0"
                style={{
                  // 内部 scroll 容器 flex-1 撑满 chrome 高度，pegboard 居中
                  touchAction: 'pan-x pan-y pinch-zoom',
                }}
              >
                {(() => {
                  // 智能 boardLayout —— 板尺寸 + 居中偏移
                  const { boardDim, offsetX, offsetY, cols, rows } = boardLayout;
                  // 关键：cellSize 必须取整 pixel，否则 60 列累积子像素误差让每行豆子位置都偏一点
                  const cellSize = Math.max(4, Math.round(baseSize * pegboardScale * zoom));
                  const boardPx = boardDim * cellSize;
                  return (
                    <div
                      className="rounded-control relative inline-block"
                      style={{
                        // 板底从近纯白 oklch(0.985) 改成跟页面 paper-bg 一致的暖米色
                        // 这样圆豆 border-radius 50% 自然不覆盖的 4 角露的是暖米色不是白色
                        // 视觉上跟页面背景融合，不再看到刺眼"白方格"
                        backgroundColor: 'var(--bead-paper-bg)',
                        boxShadow: 'inset 0 2px 8px rgba(44, 58, 94, 0.08), 0 4px 16px rgba(44, 58, 94, 0.18)',
                        padding: '8px',
                        border: '4px solid var(--y2k-navy)',
                      }}
                    >
                      <div
                        ref={canvasRef}
                        className="grid gap-0"
                        style={{
                          gridTemplateColumns: `repeat(${boardDim}, ${cellSize}px)`,
                          gridTemplateRows: `repeat(${boardDim}, ${cellSize}px)`,
                          width: boardPx,
                          height: boardPx,
                          backgroundColor: 'transparent',
                          touchAction: 'none',
                          overscrollBehavior: 'contain',
                          userSelect: 'none',
                        }}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                      >
                        {Array.from({ length: boardDim * boardDim }).map((_, i) => {
                          const bx = i % boardDim;
                          const by = Math.floor(i / boardDim);
                          // 板坐标 → workingGrid 坐标（图案居中放在板中间）
                          const dx = bx - offsetX;
                          const dy = by - offsetY;
                          const inBounds = dx >= 0 && dx < cols && dy >= 0 && dy < rows;
                          const color = inBounds ? workingGrid[dy][dx] : null;
                          const referenceColor = inBounds ? referenceGrid[dy]?.[dx] : null;
                          const shouldHighlight = lockedColor && referenceColor === lockedColor;
                          const canPlace = inBounds && (!lockedColor || referenceColor === lockedColor);
                          const isEmpty = !color;
                          return (
                            <PegboardCell
                              key={`work-${bx}-${by}`}
                              x={inBounds ? dx : bx}
                              y={inBounds ? dy : by}
                              color={color}
                              beadSize={cellSize}
                              viewMode={viewMode}
                              showGrid={false}
                              shouldHighlight={!!shouldHighlight}
                              canPlace={canPlace}
                              isEmpty={isEmpty}
                              onMouseDown={inBounds ? handleMouseDown : undefined}
                              onMouseEnter={inBounds ? handleMouseEnter : undefined}
                              canvasParams={canvasParams}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
              </div>
              <CornerPearls />
            </div>
          ) : (
            /* 简洁模式：EDIT.EXE 占满主区，REFERENCE 已移到左侧 STOCK 上面 */
            <div className="w-full">
              {/* EDIT.EXE 编辑画板窗口 — 跟 PEGBOARD.EXE 同款正方形板 */}
              <div className="relative w-full">
                <div
                  className="relative bg-paper-bg p-4 pt-7"
                  style={{
                    boxShadow: WIN95_SHADOW,
                    backgroundImage:
                      'radial-gradient(circle, rgba(44, 58, 94, 0.05) 1px, transparent 1px)',
                    backgroundSize: '14px 14px',
                  }}
                >
                  <TitleBar name="EDIT.EXE" />
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-baseline gap-3">
                      <h3 className="font-pixel-cn text-ink-warm" style={{ fontSize: 22, letterSpacing: '0.1em', lineHeight: 1.1 }}>
                        编辑画板
                      </h3>
                      <span className="font-pixel-arcade text-y2k-navy" style={{ fontSize: 12, letterSpacing: '0.15em' }}>
                        CANVAS
                      </span>
                    </div>
                    <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
                  </div>
                  <div
                    className="bg-paper-soft overflow-auto max-h-[40vh] sm:max-h-[600px]"
                    style={{
                      boxShadow: 'inset 0 0 0 2px var(--y2k-navy)',
                      touchAction: 'pan-x pan-y pinch-zoom',
                    }}
                  >
                    {(() => {
                      // 智能 boardLayout —— 跟 pegboard 模式同款居中
                      const { boardDim, offsetX, offsetY, cols, rows } = boardLayout;
                      // 同 PEGBOARD.EXE 取整防子像素错位
                      const cellSize = Math.max(4, Math.round(beadSize));
                      return (
                        <div className="inline-block p-2">
                          <div
                            ref={canvasRef}
                            className="grid gap-0"
                            style={{
                              gridTemplateColumns: `repeat(${boardDim}, ${cellSize}px)`,
                              gridTemplateRows: `repeat(${boardDim}, ${cellSize}px)`,
                              width: boardDim * cellSize,
                              height: boardDim * cellSize,
                              backgroundColor: 'var(--bead-paper-bg)',
                              touchAction: 'none',
                              overscrollBehavior: 'contain',
                              userSelect: 'none',
                              boxShadow: 'inset 0 0 0 1px var(--y2k-navy)',
                            }}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                          >
                            {Array.from({ length: boardDim * boardDim }).map((_, i) => {
                              const bx = i % boardDim;
                              const by = Math.floor(i / boardDim);
                              const dx = bx - offsetX;
                              const dy = by - offsetY;
                              const inBounds = dx >= 0 && dx < cols && dy >= 0 && dy < rows;
                              const color = inBounds ? workingGrid[dy][dx] : null;
                              const referenceColor = inBounds ? referenceGrid[dy]?.[dx] : null;
                              const shouldHighlight = lockedColor && referenceColor === lockedColor;
                              const canPlace = inBounds && (!lockedColor || referenceColor === lockedColor);
                              const isEmpty = !color;
                              return (
                                <PegboardCell
                                  key={`edit-${bx}-${by}`}
                                  x={inBounds ? dx : bx}
                                  y={inBounds ? dy : by}
                                  color={color}
                                  beadSize={cellSize}
                                  viewMode={viewMode}
                                  showGrid={showGrid}
                                  shouldHighlight={!!shouldHighlight}
                                  canPlace={canPlace}
                                  isEmpty={isEmpty}
                                  onMouseDown={inBounds ? handleMouseDown : undefined}
                                  onMouseEnter={inBounds ? handleMouseEnter : undefined}
                                  canvasParams={canvasParams}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <CornerPearls />
              </div>
            </div>
          )}
        </div>

        {/* STOCK.EXE 材料清单 — 简洁模式左侧（w-80 / lg:w-96 加宽 + 不再 sticky 防错位） */}
        {viewMode === 'simple' && (
          <div className="relative w-full md:w-80 lg:w-96 shrink-0 self-stretch">
            <div
              className="relative bg-paper-bg p-4 pt-7"
              style={{
                boxShadow: WIN95_SHADOW,
                backgroundImage:
                  'radial-gradient(circle, rgba(44, 58, 94, 0.05) 1px, transparent 1px)',
                backgroundSize: '14px 14px',
              }}
            >
              <TitleBar name="STOCK.EXE" />

              {/* 参考图纸 — 共享 ReferenceGridDisplay，跟拼豆板模式 REF.EXE 同款 */}
              {showReference && (
                <div className="mb-4">
                  <div className="flex items-baseline gap-2 mb-2">
                    <h3 className="font-pixel-cn text-ink-warm" style={{ fontSize: 16, letterSpacing: '0.08em' }}>
                      参考图纸
                    </h3>
                    <span className="font-pixel-arcade text-y2k-navy" style={{ fontSize: 11, letterSpacing: '0.12em' }}>
                      REF
                    </span>
                  </div>
                  <ReferenceGridDisplay
                    referenceGrid={referenceGrid}
                    workingGrid={workingGrid}
                    lockedColor={lockedColor}
                    onColorLock={handleColorLock}
                    maxHeight="30vh"
                    showPlacedIndicator
                  />
                </div>
              )}

              {/* 分隔 */}
              <div className="flex items-baseline gap-3 mb-3 mt-2 pt-2" style={{ borderTop: showReference ? '2px dashed var(--y2k-navy)' : undefined }}>
                <h3 className="font-pixel-cn text-ink-warm" style={{ fontSize: 16, letterSpacing: '0.08em' }}>
                  材料清单
                </h3>
                <span className="font-pixel-arcade text-y2k-navy" style={{ fontSize: 11, letterSpacing: '0.12em' }}>
                  STOCK
                </span>
              </div>
              <p className="font-pixel-cn text-ink-soft mb-3" style={{ fontSize: 12, letterSpacing: '0.03em' }}>
                点击颜色拾取并高亮区域
              </p>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
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
                        className="w-full p-2 text-left bg-paper-soft transition-transform hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] focus-visible:outline-2 focus-visible:outline-y2k-coral focus-visible:outline-offset-2"
                        style={{
                          boxShadow: [
                            '0 -1px 0 var(--y2k-navy)',
                            '0 1px 0 var(--y2k-navy)',
                            '-1px 0 0 var(--y2k-navy)',
                            '1px 0 0 var(--y2k-navy)',
                            isLocked ? '2px 2px 0 var(--y2k-coral)' : '2px 2px 0 var(--y2k-navy-deep)',
                          ].join(', '),
                          opacity: completed && !isLocked ? 0.65 : 1,
                        }}
                        aria-pressed={isLocked}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-8 h-8 flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: colorHex,
                                boxShadow: [
                                  '0 -1px 0 var(--y2k-navy)',
                                  '0 1px 0 var(--y2k-navy)',
                                  '-1px 0 0 var(--y2k-navy)',
                                  '1px 0 0 var(--y2k-navy)',
                                ].join(', '),
                              }}
                              aria-hidden="true"
                            >
                              {completed ? (
                                <Check
                                  className="w-4 h-4"
                                  style={{
                                    color: 'var(--bead-ink)',
                                    filter: 'drop-shadow(0 0 2px var(--bead-paper-bg))',
                                  }}
                                  aria-hidden="true"
                                />
                              ) : (
                                <span
                                  className="font-pixel-arcade"
                                  style={{
                                    fontSize: 12,
                                    color: 'var(--bead-ink)',
                                    textShadow: '0 0 2px var(--bead-paper-bg)',
                                    letterSpacing: 0,
                                  }}
                                >
                                  {code}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-pixel-cn text-ink-warm" style={{ fontSize: 12, letterSpacing: '0.05em' }}>
                                {code}
                              </span>
                              <span className="font-pixel-arcade text-y2k-navy" style={{ fontSize: 12, letterSpacing: '0.05em' }}>
                                {placed}/{total}
                              </span>
                            </div>
                          </div>
                          {isLocked && (
                            <span className="font-pixel-arcade text-y2k-coral shrink-0" style={{ fontSize: 12, letterSpacing: '0.1em' }}>
                              LOCK
                            </span>
                          )}
                        </div>
                        {/* 进度条 — pixel chrome 边 */}
                        <div
                          className="w-full h-2 bg-paper-deep overflow-hidden"
                          style={{
                            boxShadow: [
                              '0 -1px 0 var(--y2k-navy)',
                              '0 1px 0 var(--y2k-navy)',
                              '-1px 0 0 var(--y2k-navy)',
                              '1px 0 0 var(--y2k-navy)',
                            ].join(', '),
                          }}
                        >
                          <div
                            className="h-full transition-all duration-300"
                            style={{
                              width: `${Math.min(progress, 100)}%`,
                              backgroundColor: completed ? 'var(--bead-moss)' : 'var(--y2k-coral)',
                            }}
                          />
                        </div>
                      </button>
                    );
                  })}
              </div>

              {/* 总进度 */}
              <div className="mt-5 pt-4" style={{ borderTop: '2px dashed var(--y2k-navy)' }}>
                <p className="font-pixel-arcade text-y2k-navy mb-2" style={{ fontSize: 12, letterSpacing: '0.15em' }}>
                  TOTAL PROGRESS
                </p>
                <div className="flex items-baseline justify-center gap-2 mb-2 font-pixel-arcade text-ink-warm" style={{ fontSize: 18, letterSpacing: '0.05em' }}>
                  <span>{getTotalPlaced()}</span>
                  <span className="text-y2k-navy">/</span>
                  <span>{getTotalRequired()}</span>
                </div>
                <div
                  className="w-full h-3 bg-paper-deep overflow-hidden"
                  style={{
                    boxShadow: [
                      '0 -1px 0 var(--y2k-navy)',
                      '0 1px 0 var(--y2k-navy)',
                      '-1px 0 0 var(--y2k-navy)',
                      '1px 0 0 var(--y2k-navy)',
                    ].join(', '),
                  }}
                >
                  <div
                    className="h-full bg-y2k-coral transition-all duration-300"
                    style={{
                      width: `${getTotalRequired() > 0 ? (getTotalPlaced() / getTotalRequired()) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* 滑豆模式 tip — pixel ribbon */}
              <div
                className="mt-4 p-3 bg-paper-soft"
                style={{
                  boxShadow: [
                    '0 -1px 0 var(--y2k-navy)',
                    '0 1px 0 var(--y2k-navy)',
                    '-1px 0 0 var(--y2k-navy)',
                    '1px 0 0 var(--y2k-navy)',
                  ].join(', '),
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-y2k-coral shrink-0" aria-hidden="true" />
                  <p className="font-pixel-cn text-ink-warm" style={{ fontSize: 13, letterSpacing: '0.05em' }}>
                    滑豆模式
                  </p>
                </div>
                <ul className="font-pixel-cn text-ink-soft space-y-1" style={{ fontSize: 12, letterSpacing: '0.02em', lineHeight: 1.5 }}>
                  <li>• 点色卡 = 锁色</li>
                  <li>• 工具栏开滑豆开关</li>
                  <li>• 鼠标滑过 = 自动上色</li>
                </ul>
              </div>
            </div>
            <CornerPearls />
          </div>
        )}

      </div>

      {/* 完成 CONGRATS.EXE 模态框 */}
      {showCompletionModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          style={{ backgroundColor: 'rgba(44, 58, 94, 0.6)' }}
        >
          <div className="relative max-w-md w-full text-center max-h-[92vh] sm:max-h-none animate-in slide-in-from-bottom duration-200 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <div
              className="relative bg-paper-bg pt-7 px-6 pb-7 sm:p-10 sm:pt-9 overflow-y-auto max-h-[92vh]"
              style={{
                boxShadow: WIN95_SHADOW,
                backgroundImage:
                  'radial-gradient(circle, rgba(44, 58, 94, 0.05) 1px, transparent 1px)',
                backgroundSize: '14px 14px',
              }}
            >
              <TitleBar name="CONGRATS.EXE" onClose={() => setShowCompletionModal(false)} />

              {/* 庆祝徽章 — pixel chrome 边 + bounce */}
              <div className="mb-5 flex justify-center">
                <div
                  className="w-20 h-20 sm:w-24 sm:h-24 bg-y2k-coral flex items-center justify-center animate-bounce"
                  style={{
                    boxShadow: [
                      '0 -2px 0 var(--y2k-navy)',
                      '0 2px 0 var(--y2k-navy)',
                      '-2px 0 0 var(--y2k-navy)',
                      '2px 0 0 var(--y2k-navy)',
                      '4px 4px 0 var(--y2k-navy-deep)',
                    ].join(', '),
                  }}
                  aria-hidden="true"
                >
                  <PartyPopper className="w-10 h-10 sm:w-12 sm:h-12 text-paper-bg" />
                </div>
              </div>

              <p
                className="font-pixel-arcade text-y2k-coral arcade-blink mb-2"
                style={{ fontSize: 13, letterSpacing: '0.25em' }}
              >
                ★ STAGE CLEAR ★
              </p>
              <h2
                className="font-pixel-cn text-ink-warm mb-3"
                style={{ fontSize: 33, letterSpacing: '0.15em', lineHeight: 1.15 }}
              >
                恭喜完成
              </h2>
              <p className="font-pixel-cn text-ink-warm mb-1" style={{ fontSize: 13, letterSpacing: '0.05em' }}>
                完成全部 <span className="font-pixel-arcade text-y2k-navy" style={{ fontSize: 13 }}>
                  {Array.from(colorCount.values()).reduce((a, b) => a + b, 0)}
                </span> 颗
              </p>
              <p className="font-pixel-arcade text-y2k-navy mb-7" style={{ fontSize: 13, letterSpacing: '0.15em' }}>
                {colorCount.size} COLORS USED
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                {SHOW_HD_RENDER && (
                  <button
                    onClick={renderHighResolution}
                    disabled={isRendering}
                    className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-3 font-pixel-cn transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ ...toolBtnStyle(false), fontSize: 12, letterSpacing: '0.05em' }}
                  >
                    {isRendering ? (
                      <><Sparkles className="w-4 h-4 animate-spin" aria-hidden="true" />渲染中</>
                    ) : (
                      <><Sparkles className="w-4 h-4" aria-hidden="true" />高清</>
                    )}
                  </button>
                )}
                <button
                  onClick={() => handleAddToGallery(generateCanvasDataURL())}
                  disabled={savedToGallery}
                  className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-3 font-pixel-cn transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ ...toolBtnStyle(savedToGallery), fontSize: 12, letterSpacing: '0.05em' }}
                >
                  {savedToGallery ? (
                    <><Check className="w-4 h-4" aria-hidden="true" />已加入</>
                  ) : (
                    <><Library className="w-4 h-4" aria-hidden="true" />作品馆</>
                  )}
                </button>
                <button
                  onClick={downloadCanvas}
                  className="flex-1 arcade-pill font-pixel-cn text-paper-bg cursor-pointer"
                  style={{
                    backgroundColor: 'var(--y2k-navy)',
                    fontSize: 12,
                    letterSpacing: '0.1em',
                    padding: '12px 14px',
                  }}
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  下载
                </button>
              </div>

              <button
                onClick={() => setShowCompletionModal(false)}
                className="font-pixel-arcade text-y2k-navy hover:text-y2k-coral transition-colors"
                style={{ fontSize: 13, letterSpacing: '0.15em' }}
              >
                × CLOSE
              </button>
            </div>
            <CornerPearls />
          </div>
        </div>
      )}

      {/* IRON.EXE 熨烫选择模态框 */}
      {showIroningModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          style={{ backgroundColor: 'rgba(44, 58, 94, 0.6)' }}
        >
          <div className="relative max-w-2xl w-full max-h-[92vh] sm:max-h-[90vh] animate-in slide-in-from-bottom duration-200 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <div
              className="relative bg-paper-bg pt-7 max-h-[92vh] sm:max-h-[90vh] flex flex-col"
              style={{
                boxShadow: WIN95_SHADOW,
                backgroundImage:
                  'radial-gradient(circle, rgba(44, 58, 94, 0.05) 1px, transparent 1px)',
                backgroundSize: '14px 14px',
              }}
            >
              <TitleBar name="IRON.EXE" onClose={() => setShowIroningModal(false)} />

              <div className="overflow-y-auto p-4 sm:p-8">
                <div className="flex items-center justify-center mb-5">
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 bg-y2k-coral flex items-center justify-center"
                    style={{
                      boxShadow: [
                        '0 -2px 0 var(--y2k-navy)',
                        '0 2px 0 var(--y2k-navy)',
                        '-2px 0 0 var(--y2k-navy)',
                        '2px 0 0 var(--y2k-navy)',
                        '3px 3px 0 var(--y2k-navy-deep)',
                      ].join(', '),
                    }}
                    aria-hidden="true"
                  >
                    <Flame className="w-7 h-7 sm:w-8 sm:h-8 text-paper-bg" />
                  </div>
                </div>

                <h2
                  className="font-pixel-cn text-ink-warm text-center mb-2"
                  style={{ fontSize: 22, letterSpacing: '0.15em', lineHeight: 1.2 }}
                >
                  选择熨烫方式
                </h2>
                <p
                  className="font-pixel-arcade text-y2k-navy text-center mb-6"
                  style={{ fontSize: 13, letterSpacing: '0.2em' }}
                >
                  CHOOSE IRONING STYLE
                </p>

                {/* 去除背景选项 — pixel chrome 卡 */}
                <div
                  className="mb-5 p-3 bg-paper-soft flex items-center"
                  style={{ boxShadow: INPUT_SHADOW }}
                >
                  <label className="flex items-center gap-3 cursor-pointer min-h-[40px] w-full">
                    <input
                      type="checkbox"
                      checked={removeBackground}
                      onChange={(e) => setRemoveBackground(e.target.checked)}
                      className="w-5 h-5 accent-y2k-navy shrink-0"
                    />
                    <div>
                      <div className="font-pixel-cn text-ink-warm" style={{ fontSize: 12, letterSpacing: '0.05em' }}>去除背景</div>
                      <div className="font-pixel-arcade text-y2k-navy mt-0.5" style={{ fontSize: 12, letterSpacing: '0.1em' }}>
                        TRANSPARENT BG
                      </div>
                    </div>
                  </label>
                </div>

                {/* 4 种熨烫方式 — pixel chrome 卡，selected = coral 硬阴 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {([
                    { key: 'paper', label: '铜版纸烫', desc: '常见烫法，立体感适中', Icon: FileText },
                    { key: 'towel', label: '毛巾烫', desc: '细微绒面，哑光效果', Icon: Layers },
                    { key: 'direct', label: '直烫', desc: '光滑有光泽，最平整', Icon: Zap },
                    { key: 'glitter', label: '格里特烫', desc: '闪片彩虹光泽，华丽', Icon: Sparkles },
                  ] as const).map(({ key, label, desc, Icon }) => {
                    const selected = ironingMethod === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setIroningMethod(key)}
                        className="text-left p-4 bg-paper-soft transition-transform hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px]"
                        style={{
                          boxShadow: [
                            '0 -2px 0 var(--y2k-navy)',
                            '0 2px 0 var(--y2k-navy)',
                            '-2px 0 0 var(--y2k-navy)',
                            '2px 0 0 var(--y2k-navy)',
                            selected ? '4px 4px 0 var(--y2k-coral)' : '4px 4px 0 var(--y2k-navy-deep)',
                          ].join(', '),
                        }}
                        aria-pressed={selected}
                      >
                        <Icon
                          className={`w-6 h-6 mb-3 ${selected ? 'text-y2k-coral' : 'text-y2k-navy'}`}
                          aria-hidden="true"
                        />
                        <h3 className="font-pixel-cn text-ink-warm mb-1.5" style={{ fontSize: 13, letterSpacing: '0.05em' }}>
                          {label}
                        </h3>
                        <p className="font-pixel-cn text-ink-soft leading-relaxed" style={{ fontSize: 13, letterSpacing: '0.02em' }}>
                          {desc}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* 按钮组 */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowIroningModal(false)}
                    className="flex-1 inline-flex items-center justify-center min-h-[48px] px-6 py-3 font-pixel-cn transition-transform hover:-translate-y-0.5"
                    style={{ ...toolBtnStyle(false), fontSize: 13, letterSpacing: '0.1em' }}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleIroning}
                    className="flex-1 arcade-pill font-pixel-cn text-paper-bg cursor-pointer"
                    style={{
                      backgroundColor: 'var(--y2k-navy)',
                      fontSize: 13,
                      letterSpacing: '0.1em',
                      padding: '12px 18px',
                    }}
                  >
                    <Flame className="w-4 h-4" aria-hidden="true" />
                    <span>开始熨烫</span>
                    <PixelArrow size={12} color="var(--bead-paper-bg)" />
                  </button>
                </div>
              </div>
            </div>
            <CornerPearls />
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

      {/* RESULT.EXE 熨烫预览模态框 */}
      {showIronPreview && ironedResult && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          style={{ backgroundColor: 'rgba(44, 58, 94, 0.7)' }}
        >
          <div className="relative max-w-4xl w-full max-h-[92vh] sm:max-h-[90vh] animate-in slide-in-from-bottom duration-200 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <div
              className="relative bg-paper-bg pt-7 p-4 sm:p-8 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto"
              style={{
                boxShadow: WIN95_SHADOW,
                backgroundImage:
                  'radial-gradient(circle, rgba(44, 58, 94, 0.05) 1px, transparent 1px)',
                backgroundSize: '14px 14px',
              }}
            >
              <TitleBar
                name="RESULT.EXE"
                onClose={() => {
                  setShowIronPreview(false);
                  setIronedResult(null);
                }}
              />
              <div className="mb-5 text-center">
                <h2 className="font-pixel-cn text-ink-warm mb-2" style={{ fontSize: 22, letterSpacing: '0.15em', lineHeight: 1.2 }}>
                  熨烫效果预览
                </h2>
                <p className="font-pixel-arcade text-y2k-navy" style={{ fontSize: 13, letterSpacing: '0.15em' }}>
                  {IRONING_METHODS[ironingMethod].name.toUpperCase()} · {removeBackground ? 'TRANSPARENT' : 'WHITE BG'}
                </p>
              </div>

              <div
                className="relative bg-paper-soft p-4 sm:p-6 mb-5 overflow-auto max-h-[50vh] sm:max-h-[500px] flex items-center justify-center"
                style={{
                  boxShadow: 'inset 0 0 0 2px var(--y2k-navy)',
                  backgroundImage:
                    'radial-gradient(circle, rgba(44, 58, 94, 0.08) 1px, transparent 1px)',
                  backgroundSize: '10px 10px',
                }}
              >
                <img
                  src={ironedResult}
                  alt="熨烫效果"
                  className="max-w-full h-auto pixel-render"
                  style={{
                    backgroundColor: removeBackground ? 'transparent' : 'var(--bead-paper-bg)',
                    opacity: isRefiningIron ? 0.6 : 1,
                    transition: 'opacity 0.15s ease',
                  }}
                />
                {isRefiningIron && (
                  <span
                    className="absolute top-2 right-2 font-pixel-arcade text-y2k-coral arcade-blink"
                    style={{ fontSize: 12, letterSpacing: '0.15em' }}
                  >
                    UPDATING…
                  </span>
                )}
              </div>

              {/* 效果调节面板 — 简化版（光泽 / 质感 / 闪片 3 个滑块） */}
              <div
                className="mb-5 p-4 bg-paper-soft"
                style={{ boxShadow: 'inset 0 0 0 2px var(--y2k-navy)' }}
              >
                <div className="flex items-baseline justify-between mb-3">
                  <span className="font-pixel-cn text-ink-warm" style={{ fontSize: 13, letterSpacing: '0.08em' }}>
                    效果调节
                  </span>
                  <button
                    onClick={() => {
                      setEffectGloss(100);
                      setEffectTexture(100);
                      setEffectSparkle(100);
                    }}
                    className="font-pixel-arcade text-y2k-coral hover:text-y2k-coral/70 transition-colors"
                    style={{ fontSize: 12, letterSpacing: '0.1em' }}
                    aria-label="重置为默认"
                  >
                    × RESET
                  </button>
                </div>

                {[
                  {
                    key: 'gloss',
                    label: '光泽 (反光强度)',
                    desc: '调低 = 哑光 · 调高 = 亮面',
                    value: effectGloss,
                    setter: setEffectGloss,
                    color: 'var(--bead-honey)',
                  },
                  {
                    key: 'texture',
                    label: '质感 (表面纹理)',
                    desc: ironingMethod === 'paper' ? '调低 = 平整 · 调高 = 显孔洞' :
                          ironingMethod === 'towel' ? '调低 = 光滑 · 调高 = 显织纹' :
                          ironingMethod === 'glitter' ? '调低 = 干净 · 调高 = 显闪片纹' :
                          '调低 = 镜面 · 调高 = 微纹理',
                    value: effectTexture,
                    setter: setEffectTexture,
                    color: 'var(--y2k-navy)',
                  },
                  ...(ironingMethod === 'glitter' ? [{
                    key: 'sparkle',
                    label: '闪片 (亮片数量)',
                    desc: '调低 = 稀疏 · 调高 = 密集',
                    value: effectSparkle,
                    setter: setEffectSparkle,
                    color: 'var(--y2k-coral)',
                  }] : []),
                ].map((slider) => (
                  <div key={slider.key} className="mb-3 last:mb-0">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <div className="flex items-baseline gap-2">
                        <span className="font-pixel-cn text-ink-warm" style={{ fontSize: 12, letterSpacing: '0.05em' }}>
                          {slider.label}
                        </span>
                      </div>
                      <span className="font-pixel-arcade text-y2k-navy" style={{ fontSize: 12, letterSpacing: '0.05em' }}>
                        {slider.value}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={200}
                      step={5}
                      value={slider.value}
                      onChange={(e) => slider.setter(Number(e.target.value))}
                      className="w-full h-2 appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${slider.color} 0%, ${slider.color} ${slider.value / 2}%, var(--bead-paper-deep) ${slider.value / 2}%, var(--bead-paper-deep) 100%)`,
                        boxShadow: 'inset 0 0 0 1px var(--y2k-navy)',
                      }}
                      aria-label={slider.label}
                    />
                    <p className="font-pixel-cn text-ink-soft mt-1" style={{ fontSize: 11, letterSpacing: '0.03em' }}>
                      {slider.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setShowIronPreview(false);
                    setIronedResult(null);
                  }}
                  className="flex-1 min-w-[40%] inline-flex items-center justify-center min-h-[48px] px-4 py-3 font-pixel-cn transition-transform hover:-translate-y-0.5"
                  style={{ ...toolBtnStyle(false), fontSize: 12, letterSpacing: '0.05em' }}
                >
                  关闭
                </button>
                <button
                  onClick={() => {
                    setShowIronPreview(false);
                    setShowIroningModal(true);
                  }}
                  className="flex-1 min-w-[40%] inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-3 font-pixel-cn transition-transform hover:-translate-y-0.5"
                  style={{ ...toolBtnStyle(false), fontSize: 12, letterSpacing: '0.05em' }}
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
                  className="flex-1 min-w-[40%] inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-3 font-pixel-cn transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ ...toolBtnStyle(savedToGallery), fontSize: 12, letterSpacing: '0.05em' }}
                >
                  {savedToGallery ? (
                    <><Check className="w-4 h-4" aria-hidden="true" />已加入</>
                  ) : (
                    <><Library className="w-4 h-4" aria-hidden="true" />作品馆</>
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
                  className="flex-1 min-w-[40%] arcade-pill font-pixel-cn text-paper-bg cursor-pointer"
                  style={{
                    backgroundColor: 'var(--y2k-navy)',
                    fontSize: 12,
                    letterSpacing: '0.1em',
                    padding: '12px 14px',
                  }}
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  下载
                </button>
              </div>
            </div>
            <CornerPearls />
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