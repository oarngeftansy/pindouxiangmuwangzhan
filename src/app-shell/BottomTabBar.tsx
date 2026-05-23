/**
 * BottomTabBar — 永远固定在 app 底部的 3-tab 切换条
 *
 * Tabs: 首页 / 创作 / 作品馆
 * 视觉：paper-cream 背景 + 1px 顶边 + active tab 用 terracotta 强调
 */

import { Home, Sparkles, Library } from 'lucide-react';

export type TabKey = 'home' | 'create' | 'gallery';

interface BottomTabBarProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

const TABS: Array<{ key: TabKey; label: string; Icon: typeof Home }> = [
  { key: 'home', label: '首页', Icon: Home },
  { key: 'create', label: '创作', Icon: Sparkles },
  { key: 'gallery', label: '作品馆', Icon: Library },
];

export function BottomTabBar({ active, onChange }: BottomTabBarProps) {
  return (
    <nav
      className="absolute bottom-0 left-0 right-0 bg-paper-bg border-t border-edge-sand z-40"
      style={{
        // 适配 iOS 底部 home indicator 安全区
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      aria-label="主导航"
    >
      <div className="flex">
        {TABS.map(({ key, label, Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] py-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-[-4px] ${
                isActive
                  ? 'text-terracotta'
                  : 'text-ink-soft hover:text-ink-warm active:bg-paper-deep'
              }`}
              aria-pressed={isActive}
              aria-label={label}
            >
              <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
              <span className={`text-[11px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
