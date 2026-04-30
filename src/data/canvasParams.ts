// 拼豆创作台实时渲染参数 - 可通过开发者工具调节
// 控制 PegboardCell 组件的视觉效果

export interface CanvasParams {
  // ── 简洁模式 ──
  simple: {
    beadInset: number;          // 豆子内边距 (px)
    beadBorderRadius: number;   // 豆子圆角 (%), 50=圆形, 0=方形
    innerShadowBlur: number;    // 内阴影模糊 (px)
    innerShadowAlpha: number;   // 内阴影透明度
    gridBorderAlpha: number;    // 网格线透明度
  };

  // ── 拼豆板模式 ──
  pegboard: {
    // 钉子
    pegRadiusRatio: number;     // 钉子半径比 (相对 beadSize)
    pegLightColor: string;      // 钉子亮面色
    pegDarkColor: string;       // 钉子暗面色
    pegShadowAlpha: number;     // 钉子阴影透明度

    // 豆子形状
    beadRadiusRatio: number;    // 豆子半径比 (相对 beadSize, 0.5=贴边)
    beadBorderRadius: number;   // 豆子圆角 (%), 50=正圆, 30=圆角方, 0=正方
    beadFlatness: number;       // 豆子扁平度 (0=正圆, 1=完全椭圆), 控制高度/宽度比

    // 内阴影 (立体感)
    beadInnerDarkBlur: number;  // 内阴影(暗面) blur (px)
    beadInnerDarkAlpha: number; // 内阴影(暗面) 透明度
    beadInnerDarkOffsetX: number; // 内阴影(暗面) X偏移 (px, 负=左亮右暗)
    beadInnerDarkOffsetY: number; // 内阴影(暗面) Y偏移 (px, 负=上亮下暗)
    beadInnerLightBlur: number; // 内高光 blur (px)
    beadInnerLightAlpha: number;// 内高光透明度
    beadInnerLightOffsetX: number; // 内高光 X偏移 (px)
    beadInnerLightOffsetY: number; // 内高光 Y偏移 (px)
    beadDropShadowBlur: number; // 投影 blur (px)
    beadDropShadowAlpha: number;// 投影透明度
    beadDropShadowOffsetY: number; // 投影 Y偏移 (px)

    // 高光点 (specular highlight)
    highlightSize: number;      // 高光圆尺寸比 (%)
    highlightTop: number;       // 高光 top 位置 (%)
    highlightLeft: number;      // 高光 left 位置 (%)
    highlightAlpha: number;     // 高光峰值透明度
    highlightSpread: number;    // 高光扩散衰减 (%), 越小越集中
    highlightFocusX: number;    // 高光焦点 X (0~100%, 渐变中心)
    highlightFocusY: number;    // 高光焦点 Y (0~100%, 渐变中心)

    // 边缘反光 (rim light)
    rimLightAlpha: number;      // 边缘反光透明度 (0=关闭)
    rimLightWidth: number;      // 边缘反光宽度比 (相对豆子半径, 0.05~0.3)
    rimLightAngle: number;      // 边缘反光角度 (deg, 0=正上方)

    // 中心孔洞
    holeRatio: number;          // 孔洞大小比 (相对豆子半径)
    holeDarkAlpha: number;      // 孔洞中心暗度
    holeLightAlpha: number;     // 孔洞边缘暗度
    holeRingAlpha: number;      // 孔洞边缘亮环透明度 (模拟孔壁反光)

    // 豆子表面质感
    surfaceSaturation: number;  // 表面饱和度增益 (1=不变, >1更鲜艳)
    surfaceBrightness: number;  // 表面亮度增益 (1=不变)

    // 投影光晕
    glowInnerStop: number;      // 投影内环终止 (%)
    glowOuterStop: number;      // 投影外环终止 (%)
    glowAlpha: number;          // 投影光晕透明度

    // 豆子间距
    beadGap: number;            // 豆子之间的间距 (px, 0=无间距紧贴)

    // 空格子
    emptyBgAlpha: number;       // 空格子背景透明度

    // 高亮提示 (待放豆)
    highlightBorderWidth: number;
    highlightBorderColor: string;
    highlightFillAlpha: number;
    highlightGlowAlpha: number;
  };
}

export const DEFAULT_CANVAS_PARAMS: CanvasParams = {
  simple: {
    beadInset: 4,
    beadBorderRadius: 50,
    innerShadowBlur: 3,
    innerShadowAlpha: 0.2,
    gridBorderAlpha: 0.3,
  },
  pegboard: {
    pegRadiusRatio: 0.15,
    pegLightColor: "#d4d4d4",
    pegDarkColor: "#a3a3a3",
    pegShadowAlpha: 0.25,

    beadRadiusRatio: 0.495,
    beadBorderRadius: 50,
    beadFlatness: 0,

    beadInnerDarkBlur: 3,
    beadInnerDarkAlpha: 0.15,
    beadInnerDarkOffsetX: -1,
    beadInnerDarkOffsetY: -1,
    beadInnerLightBlur: 3,
    beadInnerLightAlpha: 0.25,
    beadInnerLightOffsetX: 1,
    beadInnerLightOffsetY: 1,
    beadDropShadowBlur: 3,
    beadDropShadowAlpha: 0.12,
    beadDropShadowOffsetY: 1,

    highlightSize: 35,
    highlightTop: 12,
    highlightLeft: 15,
    highlightAlpha: 0.45,
    highlightSpread: 70,
    highlightFocusX: 40,
    highlightFocusY: 40,

    rimLightAlpha: 0,
    rimLightWidth: 0.1,
    rimLightAngle: 220,

    holeRatio: 0.28,
    holeDarkAlpha: 0.3,
    holeLightAlpha: 0.12,
    holeRingAlpha: 0,

    surfaceSaturation: 1,
    surfaceBrightness: 1,

    glowInnerStop: 65,
    glowOuterStop: 75,
    glowAlpha: 0.06,

    beadGap: 0,

    emptyBgAlpha: 0.03,

    highlightBorderWidth: 2.5,
    highlightBorderColor: "#F59E0B",
    highlightFillAlpha: 0.25,
    highlightGlowAlpha: 0.4,
  },
};

const STORAGE_KEY = 'canvas_params_v1';

export function loadCanvasParams(): CanvasParams {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return deepMerge(DEFAULT_CANVAS_PARAMS, parsed);
    }
  } catch {}
  return structuredClone(DEFAULT_CANVAS_PARAMS);
}

export function saveCanvasParams(params: CanvasParams): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
}

function deepMerge<T extends Record<string, any>>(defaults: T, overrides: Partial<T>): T {
  const result = { ...defaults };
  for (const key in overrides) {
    if (
      overrides[key] !== undefined &&
      typeof defaults[key] === 'object' &&
      !Array.isArray(defaults[key])
    ) {
      result[key] = deepMerge(defaults[key], overrides[key] as any);
    } else if (overrides[key] !== undefined) {
      result[key] = overrides[key] as any;
    }
  }
  return result;
}
