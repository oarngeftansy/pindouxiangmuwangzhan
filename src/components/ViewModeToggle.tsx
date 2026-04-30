// 视图模式切换组件
import { Square, Grid } from 'lucide-react';

interface ViewModeToggleProps {
  viewMode: 'simple' | 'pegboard';
  onChange: (mode: 'simple' | 'pegboard') => void;
}

export function ViewModeToggle({ viewMode, onChange }: ViewModeToggleProps) {
  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1" title="视图模式">
      <button
        onClick={() => onChange('simple')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
          viewMode === 'simple'
            ? 'bg-white text-purple-700 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        title="简洁模式"
      >
        <Square className="w-4 h-4" />
        <span className="hidden sm:inline text-xs">简洁</span>
      </button>
      <button
        onClick={() => onChange('pegboard')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
          viewMode === 'pegboard'
            ? 'bg-white text-purple-700 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        title="拼豆板模式"
      >
        <Grid className="w-4 h-4" />
        <span className="hidden sm:inline text-xs">拼豆板</span>
      </button>
    </div>
  );
}
