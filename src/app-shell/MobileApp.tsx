/**
 * MobileApp — App 端的根组件
 *
 * 结构：PhoneFrame（桌面预览框） → 当前 tab 的 screen → BottomTabBar
 * 后续：加 PageStack（slide-in 子屏栈），现在 3 tab 各自独立 root
 */

import { useState } from 'react';
import { PhoneFrame } from './PhoneFrame';
import { BottomTabBar, type TabKey } from './BottomTabBar';
import { HomeScreen } from './screens/HomeScreen';
import { CreateScreen } from './screens/CreateScreen';
import { GalleryScreen } from './screens/GalleryScreen';

export function MobileApp() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  return (
    <PhoneFrame>
      <div className="absolute inset-0 flex flex-col bg-paper-bg">
        {/* 当前 tab 的 screen */}
        <div className="flex-1 min-h-0 relative">
          {/* 用 hidden/display 切换而不是卸载，保留 scroll 位置 */}
          <div className={`absolute inset-0 ${activeTab === 'home' ? '' : 'hidden'}`}>
            <HomeScreen />
          </div>
          <div className={`absolute inset-0 ${activeTab === 'create' ? '' : 'hidden'}`}>
            <CreateScreen />
          </div>
          <div className={`absolute inset-0 ${activeTab === 'gallery' ? '' : 'hidden'}`}>
            <GalleryScreen />
          </div>
        </div>

        {/* 底部 tab bar */}
        <BottomTabBar active={activeTab} onChange={setActiveTab} />
      </div>
    </PhoneFrame>
  );
}
