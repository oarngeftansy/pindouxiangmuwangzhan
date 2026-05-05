// 视图模式切换组件
import { Square, Grid } from 'lucide-react';

interface ViewModeToggleProps {
  viewMode: 'simple' | 'pegboard';
  onChange: (mode: 'simple' | 'pegboard') => void;
}

export function ViewModeToggle({ viewMode, onChange }: ViewModeToggleProps) {
  return (
    <div
      className="inline-flex gap-1 bg-paper-deep border border-edge-sand rounded-control p-1"
      title="视图模式"
      role="group"
      aria-label="视图模式"
    >
      <button
        onClick={() => onChange('simple')}
        className={`inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-chip text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2 ${
          viewMode === 'simple'
            ? 'bg-paper-bg text-moss border border-moss'
            : 'text-ink-soft hover:text-ink-warm'
        }`}
        title="简洁模式"
        aria-pressed={viewMode === 'simple'}
      >
        <Square className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline text-xs">简洁</span>
      </button>
      <button
        onClick={() => onChange('pegboard')}
        className={`inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-chip text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2 ${
          viewMode === 'pegboard'
            ? 'bg-paper-bg text-moss border border-moss'
            : 'text-ink-soft hover:text-ink-warm'
        }`}
        title="拼豆板模式"
        aria-pressed={viewMode === 'pegboard'}
      >
        <Grid className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline text-xs">拼豆板</span>
      </button>
    </div>
  );
}
