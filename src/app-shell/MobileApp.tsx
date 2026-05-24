/**
 * MobileApp — App 端根组件
 *
 * 流程：
 * 1. 启动 → SplashScreen 自动播 1.5s → fade 出
 * 2. PhoneFrame 包裹 → 3 tab 主界面
 * 3. Tab 切换不卸载，scroll 位置保留
 * 4. Home action / Create pattern 的 callback 暂时 console.log
 *    （下个阶段接真实流程：上传/盲盒/空白画布/详情屏）
 */

import { useState } from 'react';
import { PhoneFrame } from './PhoneFrame';
import { BottomTabBar, type TabKey } from './BottomTabBar';
import { SplashScreen } from './SplashScreen';
import { HomeScreen } from './screens/HomeScreen';
import { CreateScreen } from './screens/CreateScreen';
import { GalleryScreen } from './screens/GalleryScreen';

export function MobileApp() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [splashDone, setSplashDone] = useState(false);

  return (
    <>
      {/* Splash 在 PhoneFrame 外 — fixed inset-0 自动覆盖整个视口
          splash 内部用 CSS 动画自管 fade-out，结束时回调 setSplashDone */}
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}

      <PhoneFrame>
        <div className="absolute inset-0 flex flex-col bg-paper-bg">
          <div className="flex-1 min-h-0 relative">
            <div className={`absolute inset-0 ${activeTab === 'home' ? '' : 'hidden'}`}>
              <HomeScreen
                onAction={(action) => {
                  // TODO 下阶段：根据 action 推入对应屏（upload sheet / blindbox / blank size sheet）
                  console.log('[app] home action:', action);
                }}
                onOpenGallery={() => setActiveTab('gallery')}
              />
            </div>
            <div className={`absolute inset-0 ${activeTab === 'create' ? '' : 'hidden'}`}>
              <CreateScreen
                onOpenPattern={(p) => {
                  // TODO 下阶段：推入图纸详情屏 (slide-in-from-right)
                  console.log('[app] open pattern:', p.id);
                }}
              />
            </div>
            <div className={`absolute inset-0 ${activeTab === 'gallery' ? '' : 'hidden'}`}>
              <GalleryScreen />
            </div>
          </div>

          <BottomTabBar active={activeTab} onChange={setActiveTab} />
        </div>
      </PhoneFrame>
    </>
  );
}
