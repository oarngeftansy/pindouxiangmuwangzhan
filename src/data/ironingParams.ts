// 熨烫渲染参数配置 - 可通过开发者工具实时调节
// 用户端从 localStorage 读取，开发者工具写入

export interface IroningParams {
  // 通用参数
  cellSize: number;
  fusionGradientWidth: number; // 豆子间融合渐变宽度 (0~1 of cellSize)
  maskRadiusRatio: number;     // 边缘遮罩半径比 (相对 cellSize/2)
  edgeBlurRatio: number;       // 边缘模糊比 (相对 cellSize)

  // 铜版纸烫 paper
  paper: {
    holeRadius: number;        // 中心孔洞半径比
    holeAlpha: number;         // 孔洞透明度
    shineAlpha: number;        // 高光强度
    shineRadius: number;       // 高光范围比
    shineOffset: number;       // 高光偏移比
  };

  // 毛巾烫 towel
  towel: {
    weaveSpacing: number;      // 编织纱线间距 (px)
    weaveWidth: number;        // 纱线宽度 (px)
    weaveAlpha: number;        // 纱线透明度
    crossSpacing: number;      // 交叉点间距
    crossAlpha: number;        // 交叉点透明度
    matteAlpha: number;        // 哑光效果强度
    edgeAlpha: number;         // 边缘织物强度
  };

  // 直烫 direct
  direct: {
    shineAlpha: number;        // 高光强度
    shineMidAlpha: number;     // 中间光泽
    shineEdgeAlpha: number;    // 边缘光泽
    shadowAlpha: number;       // 边缘阴影
    shineOffset: number;       // 高光偏移比
  };

  // 格里特烫 glitter
  glitter: {
    sparkleCount: number;      // 每个豆子上的闪光点数量
    sparkleMinSize: number;    // 闪光点最小尺寸
    sparkleMaxSize: number;    // 闪光点最大尺寸
    sparkleAlpha: number;      // 闪光点亮度
    baseShineAlpha: number;    // 底层光泽强度
    rainbowIntensity: number;  // 彩虹色散强度 (0~1)
    highlightAlpha: number;    // 高亮区域强度
    crossSparkleCount: number; // 十字星光数量
    crossSparkleSize: number;  // 十字星光尺寸
  };
}

// 这组数值由用户在 ironing-dev.html 调出后通过「📋 复制为默认值」按钮回写。
// 主要变化（vs v3）：direct 整体光泽提亮 + glitter 闪片大幅增强（更大、更稀但更显眼）。
// paper / towel 几乎保持 v3 极弱状态。
export const DEFAULT_IRONING_PARAMS: IroningParams = {
  cellSize: 80,
  fusionGradientWidth: 0,
  maskRadiusRatio: 1.45,
  edgeBlurRatio: 0,

  paper: {
    holeRadius: 0.05,
    holeAlpha: 0.04,
    shineAlpha: 0.06,
    shineRadius: 0.42,
    shineOffset: 0.22,
  },

  towel: {
    weaveSpacing: 3,
    weaveWidth: 1.5,
    weaveAlpha: 0.05,
    crossSpacing: 6,
    crossAlpha: 0.06,
    matteAlpha: 0.04,
    edgeAlpha: 0,
  },

  direct: {
    shineAlpha: 0.21,
    shineMidAlpha: 0.09,
    shineEdgeAlpha: 0.04,
    shadowAlpha: 0.005,
    shineOffset: 0.3,
  },

  glitter: {
    sparkleCount: 15,
    sparkleMinSize: 0.75,
    sparkleMaxSize: 3.5,
    sparkleAlpha: 0.75,
    baseShineAlpha: 0.21,
    rainbowIntensity: 0.35,
    highlightAlpha: 0.34,
    crossSparkleCount: 17,
    crossSparkleSize: 14.5,
  },
};

// v4: 用户从 dev tool 调出的新默认（direct 提亮 + glitter 增强）；旧 v3 缓存自动失效
const STORAGE_KEY = 'ironing_params_v4';

export function loadIroningParams(): IroningParams {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // 深度合并，确保新增字段有默认值
      return deepMerge(DEFAULT_IRONING_PARAMS, parsed);
    }
  } catch {}
  return { ...DEFAULT_IRONING_PARAMS };
}

export function saveIroningParams(params: IroningParams): void {
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
