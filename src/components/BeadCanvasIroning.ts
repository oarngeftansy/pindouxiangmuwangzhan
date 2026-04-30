// 熨烫函数的替换代码
// 请将此代码替换 BeadCanvas.tsx 中的 handleIroning 函数

import { generateIronedImage, IRONING_METHODS } from "./IroningHelpers";

export const createIroningHandler = (
  workingGrid: any,
  ironingMethod: any,
  removeBackground: boolean,
  partialIronArea: any,
  ironingMode: string,
  setIsIroning: any,
  setIronProgress: any,
  setIronPosition: any,
  setIronedResult: any,
  setShowIronPreview: any,
  setShowPartialIronSetup: any
) => {
  return async () => {
    setIsIroning(true);
    setIronProgress(0);
    setIronPosition({ x: 0, y: 0 });
    setShowPartialIronSetup(false);

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
          // 计算熨斗位置
          const row = Math.floor((progress / 100) * totalRows);
          const col = Math.floor(((progress % 10) / 10) * totalCols);
          setIronPosition({ x: col, y: row });
        }
      }, 25);
    };

    animateIron();

    // 等待动画完成
    await new Promise((resolve) => setTimeout(resolve, 1700));

    // 使用新的辅助函数生成熨烫效果
    const ironedImageUrl = await generateIronedImage(workingGrid, {
      method: ironingMethod,
      removeBackground,
      partialArea: ironingMode === "partial" ? partialIronArea : undefined,
    });

    // 显示预览而不是直接下载
    setIronedResult(ironedImageUrl);
    setIronProgress(0);
    setIsIroning(false);
    setShowIronPreview(true);
  };
};
