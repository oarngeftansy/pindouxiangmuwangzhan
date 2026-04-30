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

export const DEFAULT_IRONING_PARAMS: IroningParams = {
  cellSize: 80,
  fusionGradientWidth: 0.4,
  maskRadiusRatio: 1.08,
  edgeBlurRatio: 0.08,

  paper: {
    holeRadius: 0.05,
    holeAlpha: 0.08,
    shineAlpha: 0.15,
    shineRadius: 0.4,
    shineOffset: 0.2,
  },

  towel: {
    weaveSpacing: 3,
    weaveWidth: 1.5,
    weaveAlpha: 0.04,
    crossSpacing: 6,
    crossAlpha: 0.06,
    matteAlpha: 0.03,
    edgeAlpha: 0.03,
  },

  direct: {
    shineAlpha: 0.35,
    shineMidAlpha: 0.12,
    shineEdgeAlpha: 0.02,
    shadowAlpha: 0.02,
    shineOffset: 0.25,
  },

  glitter: {
    sparkleCount: 25,
    sparkleMinSize: 1,
    sparkleMaxSize: 3,
    sparkleAlpha: 0.7,
    baseShineAlpha: 0.12,
    rainbowIntensity: 0.3,
    highlightAlpha: 0.2,
    crossSparkleCount: 5,
    crossSparkleSize: 6,
  },
};

const STORAGE_KEY = 'ironing_params_v1';

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
