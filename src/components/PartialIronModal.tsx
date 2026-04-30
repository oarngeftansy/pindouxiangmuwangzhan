// 按颜色选择的局部熨烫模态框
// 用这个文件替换 BeadCanvas.tsx 中的局部熨烫区域选择模态框

export const PartialIronModalByColor = `
      {/* 局部熨烫区域选择模态框 - 按颜色选择 */}
      {showPartialIronSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-6xl w-full relative max-h-[90vh] overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-center mb-2">选择局部熨烫区域</h2>
              <p className="text-center text-gray-600">按颜色选择或在画布上手动编辑</p>
            </div>

            <div className="grid grid-cols-[300px_1fr] gap-6">
              {/* 左侧：颜色选择列表 */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <h3 className="font-bold mb-3 text-gray-800">按颜色选择</h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {Array.from(colorCount.entries())
                    .sort((a, b) => b[1] - a[1])
                    .map(([colorHex, total]) => {
                      const isSelected = selectedIronColors.has(colorHex);
                      const code = getColorCode(colorHex);

                      return (
                        <button
                          key={colorHex}
                          onClick={() => {
                            const newSelected = new Set(selectedIronColors);
                            if (isSelected) {
                              newSelected.delete(colorHex);
                            } else {
                              newSelected.add(colorHex);
                            }
                            setSelectedIronColors(newSelected);
                            
                            // 同步更新豆子选择
                            const newBeads = new Set(selectedIronBeads);
                            workingGrid.forEach((row, y) => {
                              row.forEach((color, x) => {
                                if (color === colorHex) {
                                  const beadKey = \`\${x},\${y}\`;
                                  if (isSelected) {
                                    newBeads.delete(beadKey);
                                  } else {
                                    newBeads.add(beadKey);
                                  }
                                }
                              });
                            });
                            setSelectedIronBeads(newBeads);
                          }}
                          className={\`w-full p-3 rounded-xl border-2 transition-all text-left \${
                            isSelected
                              ? 'border-orange-500 bg-orange-50 shadow-md'
                              : 'border-gray-200 bg-white hover:border-orange-300'
                          }\`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                              style={{ backgroundColor: colorHex }}
                            >
                              {isSelected && (
                                <span className="text-white text-sm">✓</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-mono font-bold text-sm">{code}</div>
                              <div className="text-xs text-gray-600">{total} 颗</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>

                <div className="mt-4 pt-4 border-t space-y-2">
                  <button
                    onClick={() => {
                      // 全选所有颜色
                      const allColors = new Set(Array.from(colorCount.keys()));
                      setSelectedIronColors(allColors);
                      
                      // 选择所有豆子
                      const allBeads = new Set<string>();
                      workingGrid.forEach((row, y) => {
                        row.forEach((color, x) => {
                          if (color) {
                            allBeads.add(\`\${x},\${y}\`);
                          }
                        });
                      });
                      setSelectedIronBeads(allBeads);
                    }}
                    className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-semibold"
                  >
                    全选
                  </button>
                  <button
                    onClick={() => {
                      setSelectedIronColors(new Set());
                      setSelectedIronBeads(new Set());
                    }}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-semibold"
                  >
                    清空
                  </button>
                </div>
              </div>

              {/* 右侧：画布编辑 */}
              <div className="bg-gray-100 rounded-2xl p-6 overflow-auto max-h-[600px]">
                <div className="inline-block">
                  <div
                    className="grid gap-0 bg-white rounded-lg overflow-hidden shadow-inner border-2 border-blue-400 relative"
                    style={{
                      gridTemplateColumns: \`repeat(\${workingGrid[0].length}, 24px)\`,
                    }}
                  >
                    {workingGrid.map((row, y) =>
                      row.map((color, x) => {
                        const beadKey = \`\${x},\${y}\`;
                        const isSelected = selectedIronBeads.has(beadKey);

                        return (
                          <div
                            key={\`select-\${x}-\${y}\`}
                            className={\`border border-gray-300 transition-all cursor-pointer hover:ring-2 hover:ring-blue-400 \${
                              isSelected ? 'ring-2 ring-orange-500 ring-inset bg-orange-100' : ''
                            }\`}
                            style={{
                              width: 24,
                              height: 24,
                              backgroundColor: color || '#FAFAFA',
                            }}
                            onClick={() => {
                              if (!color) return;
                              
                              const newBeads = new Set(selectedIronBeads);
                              if (isSelected) {
                                newBeads.delete(beadKey);
                              } else {
                                newBeads.add(beadKey);
                              }
                              setSelectedIronBeads(newBeads);
                            }}
                          >
                            {color && (
                              <>
                                <div
                                  className="w-full h-full rounded-full m-0.5"
                                  style={{
                                    backgroundColor: color,
                                    opacity: isSelected ? 0.9 : 0.7,
                                  }}
                                />
                                {isSelected && (
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-600 text-center">
                  💡 左侧按颜色选择，右侧可单击豆子手动微调
                  <br />
                  已选择 <span className="font-bold text-orange-600">{selectedIronBeads.size}</span> 颗豆子熨烫
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPartialIronSetup(false);
                  setSelectedIronBeads(new Set());
                  setSelectedIronColors(new Set());
                  setShowIroningModal(true);
                }}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
              >
                返回
              </button>
              <button
                onClick={() => {
                  if (selectedIronBeads.size === 0) {
                    alert('请先选择要熨烫的区域');
                    return;
                  }
                  setShowPartialIronSetup(false);
                  handleIroning();
                }}
                disabled={selectedIronBeads.size === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-opacity font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Flame className="w-5 h-5" />
                确认并开始熨烫（{selectedIronBeads.size} 颗）
              </button>
            </div>
          </div>
        </div>
      )}
`;

export default PartialIronModalByColor;
