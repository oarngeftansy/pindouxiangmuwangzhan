import { Check } from 'lucide-react';
import { BeadColor, BeadGrid, ColorSystem } from '../App';

interface ColorPaletteProps {
  colors: BeadColor[];
  selectedColor: string;
  onColorSelect: (color: string) => void;
  beadGrid: BeadGrid;
  colorSystem?: ColorSystem;
}

export function ColorPalette({ colors, selectedColor, onColorSelect, beadGrid, colorSystem = 'mard' }: ColorPaletteProps) {
  const getColorUsage = (colorHex: string): number => {
    let count = 0;
    beadGrid.forEach(row => {
      row.forEach(cell => {
        if (cell === colorHex) count++;
      });
    });
    return count;
  };

  const getColorCode = (color: BeadColor): string => {
    return color[colorSystem] || color.mard || '?';
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 h-fit sticky top-8">
      <h3 className="text-xl font-bold mb-4">调色板</h3>
      
      {/* 当前选中颜色 */}
      <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
        <div className="text-sm font-medium text-gray-600 mb-2">当前颜色</div>
        <div className="flex items-center gap-3">
          <div
            className="w-16 h-16 rounded-xl border-4 border-white shadow-lg"
            style={{ backgroundColor: selectedColor }}
          />
          <div className="font-mono text-lg font-bold">
            {getColorCode(colors.find(c => c.hex === selectedColor)!)}
          </div>
        </div>
      </div>

      {/* 颜色网格 */}
      <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
        {colors.map((color) => {
          const usage = getColorUsage(color.hex);
          const isSelected = selectedColor === color.hex;
          const isTransparent = color.hex === '#00000000';

          return (
            <button
              key={color.id}
              onClick={() => onColorSelect(color.hex)}
              className={`w-full p-3 rounded-xl transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg scale-105'
                  : 'bg-gray-50 hover:bg-gray-100 hover:scale-102'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className={`w-12 h-12 rounded-lg border-2 shadow-sm ${
                      isTransparent ? 'bg-transparent border-dashed border-gray-400' : 'border-white'
                    }`}
                    style={{
                      backgroundColor: isTransparent ? 'transparent' : color.hex,
                      backgroundImage: isTransparent
                        ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)'
                        : undefined,
                      backgroundSize: isTransparent ? '8px 8px' : undefined,
                      backgroundPosition: isTransparent ? '0 0, 4px 4px' : undefined,
                    }}
                  />
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-6 h-6 text-white drop-shadow-lg" strokeWidth={3} />
                    </div>
                  )}
                </div>
                
                <div className={`flex-1 text-left ${isSelected ? 'text-white' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold">{getColorCode(color)}</span>
                    {usage > 0 && (
                      <span className={`text-sm ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                        {usage} 颗
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 使用统计 */}
      <div className="mt-6 pt-6 border-t">
        <div className="text-sm text-gray-600">
          <div className="flex justify-between mb-2">
            <span>总共使用：</span>
            <span className="font-semibold">
              {beadGrid.reduce((total, row) => {
                return total + row.filter(cell => cell !== null).length;
              }, 0)} 颗
            </span>
          </div>
          <div className="flex justify-between">
            <span>画布尺寸：</span>
            <span className="font-semibold">
              {beadGrid[0]?.length || 0} × {beadGrid.length}
            </span>
          </div>
        </div>
      </div>

      {/* 快捷键提示 */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-xs text-blue-800">
          <div className="font-semibold mb-1">💡 小提示</div>
          <div>• 点击颜色选择画笔颜色</div>
          <div>• 按住鼠标拖动快速绘制</div>
          <div>• 使用橡皮擦工具清除豆子</div>
        </div>
      </div>
    </div>
  );
}