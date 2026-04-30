import { useState, useEffect, useCallback, useRef } from "react";
import {
  IroningParams,
  DEFAULT_IRONING_PARAMS,
  loadIroningParams,
  saveIroningParams,
} from "../data/ironingParams";
import {
  CanvasParams,
  DEFAULT_CANVAS_PARAMS,
  loadCanvasParams,
  saveCanvasParams,
} from "../data/canvasParams";
import {
  generateIronedImage,
  IRONING_METHODS,
  IroningMethod,
} from "./IroningHelpers";
import { PegboardCell } from "./PegboardCell";
import type { BeadGrid } from "../App";

// ── 示例数据 ──────────────────────────────────────────────

const SAMPLE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#F1948A',
  '#85C1E9', '#82E0AA', '#F8C471', '#D7BDE2',
  '#A3E4D7', '#FAD7A0', '#AED6F1', '#F5B7B1',
];

function makeSampleGrid(): BeadGrid {
  const size = 8;
  const grid: BeadGrid = [];
  for (let y = 0; y < size; y++) {
    const row: (string | null)[] = [];
    for (let x = 0; x < size; x++) {
      if ((x === 0 && y === 0) || (x === 7 && y === 0) || (x === 0 && y === 7) || (x === 7 && y === 7)) {
        row.push(null);
      } else {
        row.push(SAMPLE_COLORS[(y * size + x) % SAMPLE_COLORS.length]);
      }
    }
    grid.push(row);
  }
  return grid;
}

function renderBeforeImage(grid: BeadGrid, cellSize: number): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = grid[0].length * cellSize;
  canvas.height = grid.length * cellSize;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  grid.forEach((row, y) => {
    row.forEach((color, x) => {
      if (!color) return;
      const cx = x * cellSize + cellSize / 2;
      const cy = y * cellSize + cellSize / 2;
      const r = cellSize / 2 - 2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath();
      ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(200,200,200,0.5)";
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.15, 0, Math.PI * 2);
      ctx.fill();
    });
  });
  return canvas.toDataURL("image/png");
}

// ── 通用工具 ──────────────────────────────────────────────

type ParamPath = string;

interface SliderDef {
  path: ParamPath;
  label: string;
  min: number;
  max: number;
  step: number;
}

function getNestedValue(obj: any, path: string): number {
  const parts = path.split(".");
  let v = obj;
  for (const p of parts) v = v[p];
  return v as number;
}

function setNestedValue(obj: any, path: string, value: number): any {
  const parts = path.split(".");
  const result = structuredClone(obj);
  let cur = result;
  for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
  cur[parts[parts.length - 1]] = value;
  return result;
}

function setNestedString(obj: any, path: string, value: string): any {
  const parts = path.split(".");
  const result = structuredClone(obj);
  let cur = result;
  for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
  cur[parts[parts.length - 1]] = value;
  return result;
}

function getNestedString(obj: any, path: string): string {
  const parts = path.split(".");
  let v = obj;
  for (const p of parts) v = v[p];
  return v as string;
}

// ── Slider 定义 ───────────────────────────────────────────

const COMMON_SLIDERS: SliderDef[] = [
  { path: "fusionGradientWidth", label: "融合渐变宽度", min: 0, max: 1, step: 0.02 },
  { path: "maskRadiusRatio", label: "边缘遮罩半径比", min: 0.9, max: 1.3, step: 0.01 },
  { path: "edgeBlurRatio", label: "边缘模糊比", min: 0, max: 0.2, step: 0.005 },
];

const METHOD_SLIDERS: Record<IroningMethod, SliderDef[]> = {
  paper: [
    { path: "paper.holeRadius", label: "孔洞半径", min: 0, max: 0.15, step: 0.005 },
    { path: "paper.holeAlpha", label: "孔洞透明度", min: 0, max: 0.3, step: 0.01 },
    { path: "paper.shineAlpha", label: "高光强度", min: 0, max: 0.5, step: 0.01 },
    { path: "paper.shineRadius", label: "高光范围", min: 0.1, max: 0.8, step: 0.02 },
    { path: "paper.shineOffset", label: "高光偏移", min: 0, max: 0.5, step: 0.02 },
  ],
  towel: [
    { path: "towel.weaveSpacing", label: "纱线间距 (px)", min: 1, max: 10, step: 0.5 },
    { path: "towel.weaveWidth", label: "纱线宽度 (px)", min: 0.5, max: 4, step: 0.25 },
    { path: "towel.weaveAlpha", label: "纱线透明度", min: 0, max: 0.15, step: 0.005 },
    { path: "towel.crossSpacing", label: "交叉点间距", min: 2, max: 16, step: 1 },
    { path: "towel.crossAlpha", label: "交叉点透明度", min: 0, max: 0.15, step: 0.005 },
    { path: "towel.matteAlpha", label: "哑光强度", min: 0, max: 0.1, step: 0.005 },
    { path: "towel.edgeAlpha", label: "边缘质感", min: 0, max: 0.1, step: 0.005 },
  ],
  direct: [
    { path: "direct.shineAlpha", label: "高光强度", min: 0, max: 0.8, step: 0.01 },
    { path: "direct.shineMidAlpha", label: "中间光泽", min: 0, max: 0.4, step: 0.01 },
    { path: "direct.shineEdgeAlpha", label: "边缘光泽", min: 0, max: 0.1, step: 0.005 },
    { path: "direct.shadowAlpha", label: "边缘阴影", min: 0, max: 0.1, step: 0.005 },
    { path: "direct.shineOffset", label: "高光偏移", min: 0, max: 0.5, step: 0.02 },
  ],
  glitter: [
    { path: "glitter.sparkleCount", label: "闪光点数量", min: 0, max: 80, step: 1 },
    { path: "glitter.sparkleMinSize", label: "闪光点最小尺寸", min: 0.5, max: 5, step: 0.25 },
    { path: "glitter.sparkleMaxSize", label: "闪光点最大尺寸", min: 1, max: 10, step: 0.25 },
    { path: "glitter.sparkleAlpha", label: "闪光亮度", min: 0, max: 1, step: 0.05 },
    { path: "glitter.baseShineAlpha", label: "底层光泽", min: 0, max: 0.5, step: 0.01 },
    { path: "glitter.rainbowIntensity", label: "彩虹色散强度", min: 0, max: 1, step: 0.05 },
    { path: "glitter.highlightAlpha", label: "高亮区域强度", min: 0, max: 0.6, step: 0.02 },
    { path: "glitter.crossSparkleCount", label: "十字星光数量", min: 0, max: 20, step: 1 },
    { path: "glitter.crossSparkleSize", label: "十字星光尺寸", min: 2, max: 16, step: 0.5 },
  ],
};

// ── Canvas params slider 定义 ─────────────────────────────

const CANVAS_SIMPLE_SLIDERS: SliderDef[] = [
  { path: "simple.beadInset", label: "豆子内边距 (px)", min: 0, max: 10, step: 0.5 },
  { path: "simple.beadBorderRadius", label: "豆子圆角 (%)", min: 0, max: 50, step: 1 },
  { path: "simple.innerShadowBlur", label: "内阴影模糊 (px)", min: 0, max: 10, step: 0.5 },
  { path: "simple.innerShadowAlpha", label: "内阴影透明度", min: 0, max: 0.5, step: 0.01 },
  { path: "simple.gridBorderAlpha", label: "网格线透明度", min: 0, max: 1, step: 0.05 },
];

// 拼豆板模式 - 按逻辑分组
const PEGBOARD_SHAPE_SLIDERS: SliderDef[] = [
  { path: "pegboard.beadRadiusRatio", label: "豆子半径比", min: 0.3, max: 0.5, step: 0.005 },
  { path: "pegboard.beadBorderRadius", label: "豆子圆角 (%)", min: 0, max: 50, step: 1 },
  { path: "pegboard.beadFlatness", label: "豆子扁平度", min: 0, max: 1, step: 0.02 },
  { path: "pegboard.beadGap", label: "豆子间距 (px)", min: 0, max: 8, step: 0.5 },
];

const PEGBOARD_PEG_SLIDERS: SliderDef[] = [
  { path: "pegboard.pegRadiusRatio", label: "钉子半径比", min: 0.05, max: 0.3, step: 0.005 },
  { path: "pegboard.pegShadowAlpha", label: "钉子阴影透明度", min: 0, max: 0.5, step: 0.02 },
];

const PEGBOARD_SHADOW_SLIDERS: SliderDef[] = [
  { path: "pegboard.beadInnerDarkBlur", label: "内阴影(暗面) blur", min: 0, max: 10, step: 0.5 },
  { path: "pegboard.beadInnerDarkAlpha", label: "内阴影(暗面) 透明度", min: 0, max: 0.5, step: 0.01 },
  { path: "pegboard.beadInnerDarkOffsetX", label: "内阴影 X偏移 (px)", min: -5, max: 5, step: 0.5 },
  { path: "pegboard.beadInnerDarkOffsetY", label: "内阴影 Y偏移 (px)", min: -5, max: 5, step: 0.5 },
  { path: "pegboard.beadInnerLightBlur", label: "内高光 blur", min: 0, max: 10, step: 0.5 },
  { path: "pegboard.beadInnerLightAlpha", label: "内高光透明度", min: 0, max: 0.6, step: 0.01 },
  { path: "pegboard.beadInnerLightOffsetX", label: "内高光 X偏移 (px)", min: -5, max: 5, step: 0.5 },
  { path: "pegboard.beadInnerLightOffsetY", label: "内高光 Y偏移 (px)", min: -5, max: 5, step: 0.5 },
  { path: "pegboard.beadDropShadowBlur", label: "投影 blur", min: 0, max: 10, step: 0.5 },
  { path: "pegboard.beadDropShadowAlpha", label: "投影透明度", min: 0, max: 0.4, step: 0.01 },
  { path: "pegboard.beadDropShadowOffsetY", label: "投影 Y偏移 (px)", min: -3, max: 5, step: 0.5 },
];

const PEGBOARD_HIGHLIGHT_SLIDERS: SliderDef[] = [
  { path: "pegboard.highlightSize", label: "高光点尺寸 (%)", min: 5, max: 80, step: 1 },
  { path: "pegboard.highlightTop", label: "高光点 top (%)", min: 0, max: 50, step: 1 },
  { path: "pegboard.highlightLeft", label: "高光点 left (%)", min: 0, max: 50, step: 1 },
  { path: "pegboard.highlightAlpha", label: "高光峰值透明度", min: 0, max: 1, step: 0.02 },
  { path: "pegboard.highlightSpread", label: "高光扩散衰减 (%)", min: 20, max: 100, step: 1 },
  { path: "pegboard.highlightFocusX", label: "高光焦点 X (%)", min: 0, max: 100, step: 1 },
  { path: "pegboard.highlightFocusY", label: "高光焦点 Y (%)", min: 0, max: 100, step: 1 },
];

const PEGBOARD_RIM_SLIDERS: SliderDef[] = [
  { path: "pegboard.rimLightAlpha", label: "边缘反光透明度", min: 0, max: 0.8, step: 0.02 },
  { path: "pegboard.rimLightWidth", label: "边缘反光宽度", min: 0.02, max: 0.4, step: 0.01 },
  { path: "pegboard.rimLightAngle", label: "边缘反光角度 (deg)", min: 0, max: 360, step: 5 },
];

const PEGBOARD_HOLE_SLIDERS: SliderDef[] = [
  { path: "pegboard.holeRatio", label: "孔洞大小比", min: 0, max: 0.5, step: 0.01 },
  { path: "pegboard.holeDarkAlpha", label: "孔洞中心暗度", min: 0, max: 0.6, step: 0.02 },
  { path: "pegboard.holeLightAlpha", label: "孔洞边缘暗度", min: 0, max: 0.4, step: 0.01 },
  { path: "pegboard.holeRingAlpha", label: "孔洞亮环 (孔壁反光)", min: 0, max: 0.5, step: 0.02 },
];

const PEGBOARD_SURFACE_SLIDERS: SliderDef[] = [
  { path: "pegboard.surfaceSaturation", label: "表面饱和度", min: 0.5, max: 1.5, step: 0.02 },
  { path: "pegboard.surfaceBrightness", label: "表面亮度", min: 0.5, max: 1.5, step: 0.02 },
];

const PEGBOARD_GLOW_SLIDERS: SliderDef[] = [
  { path: "pegboard.glowInnerStop", label: "投影内环 (%)", min: 40, max: 85, step: 1 },
  { path: "pegboard.glowOuterStop", label: "投影外环 (%)", min: 50, max: 95, step: 1 },
  { path: "pegboard.glowAlpha", label: "投影光晕透明度", min: 0, max: 0.2, step: 0.005 },
  { path: "pegboard.emptyBgAlpha", label: "空格子背景透明度", min: 0, max: 0.1, step: 0.005 },
];

const PEGBOARD_HINT_SLIDERS: SliderDef[] = [
  { path: "pegboard.highlightBorderWidth", label: "待放豆边框宽度 (px)", min: 0.5, max: 5, step: 0.25 },
  { path: "pegboard.highlightFillAlpha", label: "待放豆填充透明度", min: 0, max: 0.6, step: 0.02 },
  { path: "pegboard.highlightGlowAlpha", label: "待放豆光晕透明度", min: 0, max: 0.8, step: 0.02 },
];

// ── 主组件 ────────────────────────────────────────────────

type DevTab = "ironing" | "canvas";

export function IroningDevTool() {
  const [tab, setTab] = useState<DevTab>("ironing");

  // ironing state
  const [method, setMethod] = useState<IroningMethod>("paper");
  const [ironingParams, setIroningParams] = useState<IroningParams>(loadIroningParams);
  const [beforeImg, setBeforeImg] = useState<string>("");
  const [afterImg, setAfterImg] = useState<string>("");
  const [rendering, setRendering] = useState(false);
  const [ironingSaved, setIroningSaved] = useState(false);
  const sampleGrid = useRef(makeSampleGrid());
  const renderTimer = useRef<ReturnType<typeof setTimeout>>();

  // canvas state
  const [canvasParams, setCanvasParams] = useState<CanvasParams>(loadCanvasParams);
  const [canvasSaved, setCanvasSaved] = useState(false);
  const [canvasViewMode, setCanvasViewMode] = useState<'simple' | 'pegboard'>('pegboard');

  // ── Ironing rendering ─────────────────────────────────
  useEffect(() => {
    setBeforeImg(renderBeforeImage(sampleGrid.current, ironingParams.cellSize));
  }, [ironingParams.cellSize]);

  const renderAfter = useCallback(
    (p: IroningParams, m: IroningMethod) => {
      clearTimeout(renderTimer.current);
      setRendering(true);
      renderTimer.current = setTimeout(async () => {
        const url = await generateIronedImage(sampleGrid.current, {
          method: m,
          removeBackground: false,
          params: p,
        });
        setAfterImg(url);
        setRendering(false);
      }, 120);
    },
    []
  );

  useEffect(() => {
    renderAfter(ironingParams, method);
  }, [ironingParams, method, renderAfter]);

  // ── Handlers ──────────────────────────────────────────

  const handleIroningSlider = (path: string, value: number) => {
    setIroningParams(setNestedValue(ironingParams, path, value));
    setIroningSaved(false);
  };

  const handleSaveIroning = () => {
    saveIroningParams(ironingParams);
    setIroningSaved(true);
    setTimeout(() => setIroningSaved(false), 2000);
  };

  const handleResetIroning = () => {
    setIroningParams(structuredClone(DEFAULT_IRONING_PARAMS));
    setIroningSaved(false);
  };

  const handleResetMethod = () => {
    setIroningParams({ ...ironingParams, [method]: (DEFAULT_IRONING_PARAMS as any)[method] });
    setIroningSaved(false);
  };

  const handleCanvasSlider = (path: string, value: number) => {
    setCanvasParams(setNestedValue(canvasParams, path, value));
    setCanvasSaved(false);
  };

  const handleCanvasColorInput = (path: string, value: string) => {
    setCanvasParams(setNestedString(canvasParams, path, value));
    setCanvasSaved(false);
  };

  const handleSaveCanvas = () => {
    saveCanvasParams(canvasParams);
    setCanvasSaved(true);
    setTimeout(() => setCanvasSaved(false), 2000);
  };

  const handleResetCanvas = () => {
    setCanvasParams(structuredClone(DEFAULT_CANVAS_PARAMS));
    setCanvasSaved(false);
  };

  const handleResetCanvasMode = (mode: 'simple' | 'pegboard') => {
    setCanvasParams({ ...canvasParams, [mode]: structuredClone(DEFAULT_CANVAS_PARAMS[mode]) });
    setCanvasSaved(false);
  };

  // ── Render ────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-gray-100">
      {/* Header */}
      <header className="bg-[#16213e] border-b border-[#0f3460] px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-md flex items-center justify-center text-sm font-bold">
              DEV
            </div>
            <h1 className="text-lg font-semibold">
              {tab === 'ironing' ? '烫豆效果调参' : '创作台渲染调参'}
            </h1>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
              /ironing-dev.html
            </span>
          </div>
          <div className="flex items-center gap-3">
            {tab === 'ironing' ? (
              <>
                <button onClick={handleResetIroning} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-sm">
                  全部重置为默认
                </button>
                <button
                  onClick={handleSaveIroning}
                  className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all ${
                    ironingSaved ? "bg-green-600 text-white" : "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90"
                  }`}
                >
                  {ironingSaved ? "已保存!" : "保存烫豆参数"}
                </button>
              </>
            ) : (
              <>
                <button onClick={handleResetCanvas} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-sm">
                  全部重置为默认
                </button>
                <button
                  onClick={handleSaveCanvas}
                  className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all ${
                    canvasSaved ? "bg-green-600 text-white" : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90"
                  }`}
                >
                  {canvasSaved ? "已保存!" : "保存创作台参数"}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-[#16213e] border-b border-[#0f3460]">
        <div className="max-w-[1400px] mx-auto px-6 flex gap-1 py-2">
          <button
            onClick={() => setTab("ironing")}
            className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              tab === "ironing"
                ? "bg-orange-500/20 text-orange-300 border border-orange-500/50"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            烫豆效果
          </button>
          <button
            onClick={() => setTab("canvas")}
            className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              tab === "canvas"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/50"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            创作台渲染
          </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {tab === "ironing" ? (
          <IroningTab
            method={method}
            setMethod={setMethod}
            params={ironingParams}
            beforeImg={beforeImg}
            afterImg={afterImg}
            rendering={rendering}
            onSlider={handleIroningSlider}
            onResetMethod={handleResetMethod}
          />
        ) : (
          <CanvasTab
            params={canvasParams}
            viewMode={canvasViewMode}
            setViewMode={setCanvasViewMode}
            onSlider={handleCanvasSlider}
            onColorInput={handleCanvasColorInput}
            onResetMode={handleResetCanvasMode}
            sampleGrid={sampleGrid.current}
          />
        )}
      </div>
    </div>
  );
}

// ── 烫豆效果 Tab ──────────────────────────────────────────

function IroningTab({
  method, setMethod, params, beforeImg, afterImg, rendering, onSlider, onResetMethod,
}: {
  method: IroningMethod;
  setMethod: (m: IroningMethod) => void;
  params: IroningParams;
  beforeImg: string;
  afterImg: string;
  rendering: boolean;
  onSlider: (path: string, value: number) => void;
  onResetMethod: () => void;
}) {
  return (
    <>
      {/* 烫法切换 */}
      <div className="flex gap-2 mb-6">
        {(Object.keys(IRONING_METHODS) as IroningMethod[]).map((m) => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            className={`px-5 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              method === m
                ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 border-2 border-orange-500 text-orange-300"
                : "bg-[#16213e] border-2 border-transparent hover:border-gray-600 text-gray-400"
            }`}
          >
            <span>{IRONING_METHODS[m].icon}</span>
            <span>{IRONING_METHODS[m].name}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_420px] gap-6">
        <div className="space-y-4">
          <Section title="通用参数">
            {COMMON_SLIDERS.map((s) => (
              <SliderRow key={s.path} def={s} value={getNestedValue(params, s.path)} defaultValue={getNestedValue(DEFAULT_IRONING_PARAMS, s.path)} onChange={(v) => onSlider(s.path, v)} />
            ))}
          </Section>

          <Section title={`${IRONING_METHODS[method].icon} ${IRONING_METHODS[method].name} 参数`} onReset={onResetMethod}>
            {METHOD_SLIDERS[method].map((s) => (
              <SliderRow key={s.path} def={s} value={getNestedValue(params, s.path)} defaultValue={getNestedValue(DEFAULT_IRONING_PARAMS, s.path)} onChange={(v) => onSlider(s.path, v)} />
            ))}
          </Section>

          <Section title="当前参数 JSON">
            <pre className="bg-[#0d1117] text-xs text-green-400 p-4 rounded-lg overflow-auto max-h-48 font-mono">
              {JSON.stringify(params, null, 2)}
            </pre>
          </Section>
        </div>

        {/* 右侧预览 */}
        <div className="space-y-4">
          <div className="bg-[#16213e] rounded-xl p-5 border border-[#0f3460] sticky top-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">实时预览</h2>

            <PreviewBlock label="熨烫前" color="bg-blue-400" img={beforeImg} alt="熨烫前" />
            <PreviewBlock
              label={`${IRONING_METHODS[method].name} 效果`}
              color="bg-orange-400"
              img={afterImg}
              alt="熨烫后"
              loading={rendering}
            />

            <p className="text-xs text-gray-600 leading-relaxed">{IRONING_METHODS[method].desc}</p>
            <p className="text-xs text-gray-600 mt-2">调整左侧滑块后预览会自动更新。点击「保存」后用户端会使用新参数。</p>
          </div>
        </div>
      </div>
    </>
  );
}

// ── 创作台渲染 Tab ────────────────────────────────────────

function CanvasTab({
  params, viewMode, setViewMode, onSlider, onColorInput, onResetMode, sampleGrid,
}: {
  params: CanvasParams;
  viewMode: 'simple' | 'pegboard';
  setViewMode: (m: 'simple' | 'pegboard') => void;
  onSlider: (path: string, value: number) => void;
  onColorInput: (path: string, value: string) => void;
  onResetMode: (mode: 'simple' | 'pegboard') => void;
  sampleGrid: BeadGrid;
}) {
  const previewSize = 48; // 预览每个格子的px大小

  return (
    <>
      {/* 视图模式切换 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewMode('pegboard')}
          className={`px-5 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
            viewMode === 'pegboard'
              ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-2 border-blue-500 text-blue-300"
              : "bg-[#16213e] border-2 border-transparent hover:border-gray-600 text-gray-400"
          }`}
        >
          拼豆板模式
        </button>
        <button
          onClick={() => setViewMode('simple')}
          className={`px-5 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
            viewMode === 'simple'
              ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-2 border-blue-500 text-blue-300"
              : "bg-[#16213e] border-2 border-transparent hover:border-gray-600 text-gray-400"
          }`}
        >
          简洁模式
        </button>
      </div>

      <div className="grid grid-cols-[1fr_420px] gap-6">
        <div className="space-y-4">
          {viewMode === 'simple' ? (
            <Section title="简洁模式参数" onReset={() => onResetMode('simple')}>
              {CANVAS_SIMPLE_SLIDERS.map((s) => (
                <SliderRow key={s.path} def={s} value={getNestedValue(params, s.path)} defaultValue={getNestedValue(DEFAULT_CANVAS_PARAMS, s.path)} onChange={(v) => onSlider(s.path, v)} />
              ))}
            </Section>
          ) : (
            <>
              <Section title="豆子形状与间距" onReset={() => onResetMode('pegboard')}>
                {PEGBOARD_SHAPE_SLIDERS.map((s) => (
                  <SliderRow key={s.path} def={s} value={getNestedValue(params, s.path)} defaultValue={getNestedValue(DEFAULT_CANVAS_PARAMS, s.path)} onChange={(v) => onSlider(s.path, v)} />
                ))}
              </Section>

              <Section title="钉子">
                {PEGBOARD_PEG_SLIDERS.map((s) => (
                  <SliderRow key={s.path} def={s} value={getNestedValue(params, s.path)} defaultValue={getNestedValue(DEFAULT_CANVAS_PARAMS, s.path)} onChange={(v) => onSlider(s.path, v)} />
                ))}
                <ColorInput label="钉子亮面色" path="pegboard.pegLightColor" value={getNestedString(params, "pegboard.pegLightColor")} defaultValue={DEFAULT_CANVAS_PARAMS.pegboard.pegLightColor} onChange={onColorInput} />
                <ColorInput label="钉子暗面色" path="pegboard.pegDarkColor" value={getNestedString(params, "pegboard.pegDarkColor")} defaultValue={DEFAULT_CANVAS_PARAMS.pegboard.pegDarkColor} onChange={onColorInput} />
              </Section>

              <Section title="内阴影与投影 (立体感)">
                {PEGBOARD_SHADOW_SLIDERS.map((s) => (
                  <SliderRow key={s.path} def={s} value={getNestedValue(params, s.path)} defaultValue={getNestedValue(DEFAULT_CANVAS_PARAMS, s.path)} onChange={(v) => onSlider(s.path, v)} />
                ))}
              </Section>

              <Section title="高光点 (specular)">
                {PEGBOARD_HIGHLIGHT_SLIDERS.map((s) => (
                  <SliderRow key={s.path} def={s} value={getNestedValue(params, s.path)} defaultValue={getNestedValue(DEFAULT_CANVAS_PARAMS, s.path)} onChange={(v) => onSlider(s.path, v)} />
                ))}
              </Section>

              <Section title="边缘反光 (rim light)">
                {PEGBOARD_RIM_SLIDERS.map((s) => (
                  <SliderRow key={s.path} def={s} value={getNestedValue(params, s.path)} defaultValue={getNestedValue(DEFAULT_CANVAS_PARAMS, s.path)} onChange={(v) => onSlider(s.path, v)} />
                ))}
              </Section>

              <Section title="中心孔洞">
                {PEGBOARD_HOLE_SLIDERS.map((s) => (
                  <SliderRow key={s.path} def={s} value={getNestedValue(params, s.path)} defaultValue={getNestedValue(DEFAULT_CANVAS_PARAMS, s.path)} onChange={(v) => onSlider(s.path, v)} />
                ))}
              </Section>

              <Section title="表面质感">
                {PEGBOARD_SURFACE_SLIDERS.map((s) => (
                  <SliderRow key={s.path} def={s} value={getNestedValue(params, s.path)} defaultValue={getNestedValue(DEFAULT_CANVAS_PARAMS, s.path)} onChange={(v) => onSlider(s.path, v)} />
                ))}
              </Section>

              <Section title="投影光晕与空格子">
                {PEGBOARD_GLOW_SLIDERS.map((s) => (
                  <SliderRow key={s.path} def={s} value={getNestedValue(params, s.path)} defaultValue={getNestedValue(DEFAULT_CANVAS_PARAMS, s.path)} onChange={(v) => onSlider(s.path, v)} />
                ))}
              </Section>

              <Section title="高亮提示 (待放豆)">
                {PEGBOARD_HINT_SLIDERS.map((s) => (
                  <SliderRow key={s.path} def={s} value={getNestedValue(params, s.path)} defaultValue={getNestedValue(DEFAULT_CANVAS_PARAMS, s.path)} onChange={(v) => onSlider(s.path, v)} />
                ))}
                <ColorInput label="高亮边框颜色" path="pegboard.highlightBorderColor" value={getNestedString(params, "pegboard.highlightBorderColor")} defaultValue={DEFAULT_CANVAS_PARAMS.pegboard.highlightBorderColor} onChange={onColorInput} />
              </Section>
            </>
          )}

          <Section title="当前参数 JSON">
            <pre className="bg-[#0d1117] text-xs text-green-400 p-4 rounded-lg overflow-auto max-h-48 font-mono">
              {JSON.stringify(params, null, 2)}
            </pre>
          </Section>
        </div>

        {/* 右侧预览 */}
        <div className="space-y-4">
          <div className="bg-[#16213e] rounded-xl p-5 border border-[#0f3460] sticky top-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
              实时预览 - {viewMode === 'pegboard' ? '拼豆板' : '简洁'}模式
            </h2>

            {/* 有豆子的预览 */}
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                已放置豆子
              </div>
              <div
                className="rounded-lg p-3 flex items-center justify-center overflow-auto"
                style={{ backgroundColor: viewMode === 'pegboard' ? '#e8e4dc' : '#fff' }}
              >
                <div
                  className="grid gap-0"
                  style={{ gridTemplateColumns: `repeat(${sampleGrid[0].length}, ${previewSize}px)` }}
                >
                  {sampleGrid.map((row, y) =>
                    row.map((color, x) => (
                      <PegboardCell
                        key={`prev-${x}-${y}`}
                        x={x}
                        y={y}
                        color={color}
                        beadSize={previewSize}
                        viewMode={viewMode}
                        showGrid={viewMode === 'simple'}
                        isEmpty={!color}
                        canvasParams={params}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* 空格子+高亮预览 */}
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                空格子 / 高亮提示
              </div>
              <div
                className="rounded-lg p-3 flex items-center justify-center"
                style={{ backgroundColor: viewMode === 'pegboard' ? '#e8e4dc' : '#fff' }}
              >
                <div
                  className="grid gap-0"
                  style={{ gridTemplateColumns: `repeat(4, ${previewSize}px)` }}
                >
                  {[
                    // row 0: colored, empty, highlight-empty, colored
                    { color: '#FF6B6B', highlight: false, empty: false },
                    { color: null, highlight: false, empty: true },
                    { color: null, highlight: true, empty: true },
                    { color: '#4ECDC4', highlight: false, empty: false },
                    // row 1: empty, colored, colored, highlight-empty
                    { color: null, highlight: false, empty: true },
                    { color: '#F7DC6F', highlight: false, empty: false },
                    { color: '#BB8FCE', highlight: false, empty: false },
                    { color: null, highlight: true, empty: true },
                  ].map((cell, i) => (
                    <PegboardCell
                      key={`demo-${i}`}
                      x={i % 4}
                      y={Math.floor(i / 4)}
                      color={cell.color}
                      beadSize={previewSize}
                      viewMode={viewMode}
                      showGrid={viewMode === 'simple'}
                      isEmpty={cell.empty}
                      shouldHighlight={cell.highlight}
                      canvasParams={params}
                    />
                  ))}
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              调整左侧滑块后预览会即时更新。保存后刷新用户端即可生效。
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ── 通用 UI 组件 ──────────────────────────────────────────

function Section({ title, onReset, children }: { title: string; onReset?: () => void; children: React.ReactNode }) {
  return (
    <section className="bg-[#16213e] rounded-xl p-5 border border-[#0f3460]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{title}</h2>
        {onReset && (
          <button onClick={onReset} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            重置
          </button>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function PreviewBlock({ label, color, img, alt, loading }: { label: string; color: string; img: string; alt: string; loading?: boolean }) {
  return (
    <div className="mb-4">
      <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${color}`} />
        {label}
        {loading && <span className="text-orange-400 animate-pulse ml-1">渲染中...</span>}
      </div>
      <div className="bg-white rounded-lg p-2 flex items-center justify-center">
        {img && <img src={img} alt={alt} className="w-full h-auto" style={{ imageRendering: "pixelated" }} />}
      </div>
    </div>
  );
}

function SliderRow({ def, value, defaultValue, onChange }: { def: SliderDef; value: number; defaultValue: number; onChange: (v: number) => void }) {
  const isModified = Math.abs(value - defaultValue) > def.step * 0.1;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm text-gray-300 flex items-center gap-2">
          {def.label}
          {isModified && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" title="已修改" />}
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-mono">{value.toFixed(3)}</span>
          {isModified && (
            <button onClick={() => onChange(defaultValue)} className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors" title={`默认: ${defaultValue}`}>
              复位
            </button>
          )}
        </div>
      </div>
      <input type="range" min={def.min} max={def.max} step={def.step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500" />
      <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
        <span>{def.min}</span>
        <span>{def.max}</span>
      </div>
    </div>
  );
}

function ColorInput({ label, path, value, defaultValue, onChange }: { label: string; path: string; value: string; defaultValue: string; onChange: (path: string, value: string) => void }) {
  const isModified = value !== defaultValue;
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-gray-300 flex items-center gap-2">
        {label}
        {isModified && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" title="已修改" />}
      </label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(path, e.target.value)} className="w-8 h-8 rounded border border-gray-600 cursor-pointer bg-transparent" />
        <span className="text-xs text-gray-500 font-mono w-16">{value}</span>
        {isModified && (
          <button onClick={() => onChange(path, defaultValue)} className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors">
            复位
          </button>
        )}
      </div>
    </div>
  );
}
