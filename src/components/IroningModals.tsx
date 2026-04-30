// 熨烫相关的模态框组件
// 这些模态框需要添加到BeadCanvas.tsx中

import { Flame, Download, Maximize2, Square } from "lucide-react";
import { BeadGrid } from "../App";
import { IRONING_METHODS, IroningMethod } from "./IroningHelpers";

// 1. 熨烫选择模态框 - 替换原有的熨烫模态框
export const IroningSelectionModal = `
      {/* 熨烫选择模态框 */}
      {showIroningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-3xl w-full relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 opacity-50" />

            <div className="relative z-10">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <Flame className="w-8 h-8 text-white" />
                </div>
              </div>

              <h2 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                选择熨烫方式
              </h2>
              <p className="text-center text-gray-600 mb-6">
                不同的熨烫方式会产生不同的视觉效果
              </p>

              {/* 熨烫模式选择 */}
              <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h3 className="font-bold mb-3 text-gray-800">熨烫范围</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIroningMode('full')}
                    className={\`flex-1 p-4 rounded-xl border-2 transition-all \${
                      ironingMode === 'full'
                        ? 'border-blue-500 bg-blue-100 shadow-md'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }\`}
                  >
                    <Maximize2 className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-bold">全部熨烫</div>
                    <div className="text-xs text-gray-600 mt-1">熨烫整个作品</div>
                  </button>
                  <button
                    onClick={() => setIroningMode('partial')}
                    className={\`flex-1 p-4 rounded-xl border-2 transition-all \${
                      ironingMode === 'partial'
                        ? 'border-blue-500 bg-blue-100 shadow-md'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }\`}
                  >
                    <Square className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-bold">局部熨烫</div>
                    <div className="text-xs text-gray-600 mt-1">框选区域熨烫</div>
                  </button>
                </div>
              </div>

              {/* 去除背景选项 */}
              <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={removeBackground}
                    onChange={(e) => setRemoveBackground(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <div>
                    <div className="font-bold text-gray-800">去除背景</div>
                    <div className="text-xs text-gray-600">导出透明背景图片，只保留主体图案</div>
                  </div>
                </label>
              </div>

              {/* 熨烫方式选择 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setIroningMethod('paper')}
                  className={\`p-6 rounded-2xl border-2 transition-all \${
                    ironingMethod === 'paper'
                      ? 'border-orange-500 bg-orange-50 shadow-lg'
                      : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                  }\`}
                >
                  <div className="text-4xl mb-3">📄</div>
                  <h3 className="font-bold text-lg mb-2">铜版纸烫</h3>
                  <p className="text-sm text-gray-600">
                    最常见烫法，表面平整光滑，保留轻微孔洞，立体感适中
                  </p>
                </button>

                <button
                  onClick={() => setIroningMethod('towel')}
                  className={\`p-6 rounded-2xl border-2 transition-all \${
                    ironingMethod === 'towel'
                      ? 'border-orange-500 bg-orange-50 shadow-lg'
                      : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                  }\`}
                >
                  <div className="text-4xl mb-3">🧺</div>
                  <h3 className="font-bold text-lg mb-2">毛巾烫</h3>
                  <p className="text-sm text-gray-600">
                    表面非常平滑，细微绒面质感，孔洞几乎不可见，哑光效果
                  </p>
                </button>

                <button
                  onClick={() => setIroningMethod('direct')}
                  className={\`p-6 rounded-2xl border-2 transition-all \${
                    ironingMethod === 'direct'
                      ? 'border-orange-500 bg-orange-50 shadow-lg'
                      : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                  }\`}
                >
                  <div className="text-4xl mb-3">✨</div>
                  <h3 className="font-bold text-lg mb-2">直烫</h3>
                  <p className="text-sm text-gray-600">
                    无烫纸直接熨烫，表面光滑有光泽，孔洞基本消失，最平整
                  </p>
                </button>

                <button
                  onClick={() => setIroningMethod('fuzzy')}
                  className={\`p-6 rounded-2xl border-2 transition-all \${
                    ironingMethod === 'fuzzy'
                      ? 'border-orange-500 bg-orange-50 shadow-lg'
                      : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                  }\`}
                >
                  <div className="text-4xl mb-3">🧦</div>
                  <h3 className="font-bold text-lg mb-2">毛绒袜烫</h3>
                  <p className="text-sm text-gray-600">
                    营造毛茸茸质感，表面蓬松柔软，适合可爱风格作品
                  </p>
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowIroningModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                >
                  取消
                </button>
                <button
                  onClick={ironingMode === 'partial' ? () => {
                    setShowIroningModal(false);
                    setShowPartialIronSetup(true);
                  } : handleIroning}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-opacity font-semibold flex items-center justify-center gap-2"
                >
                  <Flame className="w-5 h-5" />
                  {ironingMode === 'partial' ? '选择区域' : '开始熨烫'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
`;

// 2. 局部熨烫区域选择模态框 - 在熨烫模态框之后添加
export const PartialIronSetupModal = `
      {/* 局部熨烫区域选择模态框 */}
      {showPartialIronSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl w-full relative">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-center mb-2">选择局部熨烫区域</h2>
              <p className="text-center text-gray-600">在画布上拖动鼠标框选需要熨烫的区域</p>
            </div>

            <div className="bg-gray-100 rounded-2xl p-6 mb-6 overflow-auto max-h-[500px]">
              <div className="inline-block">
                <div
                  className="grid gap-0 bg-white rounded-lg overflow-hidden shadow-inner border-2 border-blue-400 relative"
                  style={{
                    gridTemplateColumns: \`repeat(\${workingGrid[0].length}, 20px)\`,
                    cursor: isSelectingArea ? 'crosshair' : 'default',
                  }}
                  onMouseDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.floor((e.clientX - rect.left) / 20);
                    const y = Math.floor((e.clientY - rect.top) / 20);
                    setSelectionStart({ x, y });
                    setIsSelectingArea(true);
                  }}
                  onMouseMove={(e) => {
                    if (!isSelectingArea || !selectionStart) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.floor((e.clientX - rect.left) / 20);
                    const y = Math.floor((e.clientY - rect.top) / 20);
                    setPartialIronArea({ start: selectionStart, end: { x, y } });
                  }}
                  onMouseUp={() => {
                    setIsSelectingArea(false);
                  }}
                >
                  {workingGrid.map((row, y) =>
                    row.map((color, x) => {
                      const inSelection = partialIronArea && (
                        x >= Math.min(partialIronArea.start.x, partialIronArea.end.x) &&
                        x <= Math.max(partialIronArea.start.x, partialIronArea.end.x) &&
                        y >= Math.min(partialIronArea.start.y, partialIronArea.end.y) &&
                        y <= Math.max(partialIronArea.start.y, partialIronArea.end.y)
                      );

                      return (
                        <div
                          key={\`select-\${x}-\${y}\`}
                          className={\`border border-gray-300 transition-all \${
                            inSelection ? 'ring-2 ring-orange-500 ring-inset bg-orange-100' : ''
                          }\`}
                          style={{
                            width: 20,
                            height: 20,
                            backgroundColor: color || '#FAFAFA',
                          }}
                        >
                          {color && (
                            <div
                              className="w-full h-full rounded-full m-0.5"
                              style={{
                                backgroundColor: color,
                                opacity: inSelection ? 0.8 : 1,
                              }}
                            />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPartialIronSetup(false);
                  setPartialIronArea(null);
                  setSelectionStart(null);
                  setShowIroningModal(true);
                }}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
              >
                返回
              </button>
              <button
                onClick={() => {
                  if (!partialIronArea) {
                    alert('请先框选区域');
                    return;
                  }
                  setShowPartialIronSetup(false);
                  handleIroning();
                }}
                disabled={!partialIronArea}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-opacity font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Flame className="w-5 h-5" />
                确认并开始熨烫
              </button>
            </div>
          </div>
        </div>
      )}
`;

// 3. 熨烫预览模态框 - 在进度动画之后添加
export const IronPreviewModal = `
      {/* 熨烫预览模态框 */}
      {showIronPreview && ironedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl w-full relative max-h-[90vh] overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-center mb-2">熨烫效果预览</h2>
              <p className="text-center text-gray-600">
                {IRONING_METHODS[ironingMethod].name} · {removeBackground ? '透明背景' : '白色背景'} · {ironingMode === 'partial' ? '局部熨烫' : '全部熨烫'}
              </p>
            </div>

            <div className="bg-gray-100 rounded-2xl p-6 mb-6 overflow-auto max-h-[500px]">
              <div className="inline-block">
                <img
                  src={ironedResult}
                  alt="熨烫效果"
                  className="max-w-full h-auto rounded-lg shadow-lg"
                  style={{
                    imageRendering: 'pixelated',
                    backgroundColor: removeBackground ? 'transparent' : 'white',
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowIronPreview(false);
                  setIronedResult(null);
                  setPartialIronArea(null);
                }}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  setShowIronPreview(false);
                  setShowIroningModal(true);
                }}
                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-semibold"
              >
                重新熨烫
              </button>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  const methodNames = {
                    paper: '铜版纸烫',
                    towel: '毛巾烫',
                    direct: '直烫',
                    fuzzy: '毛绒袜烫',
                  };
                  link.download = \`拼豆作品-\${methodNames[ironingMethod]}\${removeBackground ? '-透明' : ''}\${ironingMode === 'partial' ? '-局部' : ''}.png\`;
                  link.href = ironedResult;
                  link.click();
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:opacity-90 transition-opacity font-semibold flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                下载图片
              </button>
            </div>
          </div>
        </div>
      )}
`;

export default {
  IroningSelectionModal,
  PartialIronSetupModal,
  IronPreviewModal,
};
