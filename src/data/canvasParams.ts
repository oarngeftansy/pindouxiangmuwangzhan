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

    // 所有"改色"层归 0，让豆子色 = 参考图色，无色差
    // 旧版叠 5 层（内阴/高光/孔洞/外影/glow）混合后 alpha 偏移大于 20%，
    // 亮色豆子被拉灰跟参考图明显色差。本版只保留 1 条极轻内阴做圆形感
    beadInnerDarkBlur: 2,
    beadInnerDarkAlpha: 0.06, // 仅保留这一条做"球面感"，已减到 6%
    beadInnerDarkOffsetX: -0.5,
    beadInnerDarkOffsetY: -0.5,
    beadInnerLightBlur: 0,
    beadInnerLightAlpha: 0, // 关闭白色高光层（变色元凶）
    beadInnerLightOffsetX: 0,
    beadInnerLightOffsetY: 0,
    beadDropShadowBlur: 0,
    beadDropShadowAlpha: 0, // 关闭外投影（给周围豆子加灰晕）
    beadDropShadowOffsetY: 0,

    highlightSize: 0,
    highlightTop: 0,
    highlightLeft: 0,
    highlightAlpha: 0, // 关闭白色高光点（拉亮颜色元凶）
    highlightSpread: 0,
    highlightFocusX: 0,
    highlightFocusY: 0,

    rimLightAlpha: 0,
    rimLightWidth: 0,
    rimLightAngle: 0,

    holeRatio: 0,
    holeDarkAlpha: 0, // 关闭中心孔洞暗斑（亮色豆子拉灰元凶）
    holeLightAlpha: 0,
    holeRingAlpha: 0,

    surfaceSaturation: 1,
    surfaceBrightness: 1,

    glowInnerStop: 0,
    glowOuterStop: 0,
    glowAlpha: 0, // 关闭周围 glow halo

    beadGap: 0,

    emptyBgAlpha: 0.03,

    highlightBorderWidth: 2.5,
    highlightBorderColor: "#F59E0B",
    highlightFillAlpha: 0.25,
    highlightGlowAlpha: 0.4,
  },
};

// v2: 立体感参数下调，旧缓存自动失效避免用户保留老色差
const STORAGE_KEY = 'canvas_params_v2';

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
