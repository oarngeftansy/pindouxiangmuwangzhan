/**
 * MobileApp — App 端根组件
 *
 * 流程：
 * 1. 启动 → SplashScreen 自动播 1.5s → fade 出
 * 2. PhoneFrame 包裹 → 3 tab 主界面
 * 3. Overlay 子屏（CanvasScreen 等）盖在 PhoneFrame 之外，全屏横屏
 *
 * 路由模型：
 * - tabs：永久挂载（hidden 切换）
 * - overlayScreen：临时叠加屏（创作页、详情屏等），back 时卸载
 */

import { useState } from 'react';
import { PhoneFrame } from './PhoneFrame';
import { BottomTabBar, type TabKey } from './BottomTabBar';
import { SplashScreen } from './SplashScreen';
import { HomeScreen } from './screens/HomeScreen';
import { CreateScreen } from './screens/CreateScreen';
import { GalleryScreen } from './screens/GalleryScreen';
import { CanvasScreen } from './screens/CanvasScreen';
import type { BeadGrid } from '../App';
import type { TrendingPattern } from '../data/trendingPatterns';

type OverlayScreen =
  | { type: 'canvas'; workingGrid: BeadGrid; referenceGrid: BeadGrid; title: string }
  | null;

// 创建空白 grid 工具
const blankGrid = (w: number, h: number): BeadGrid =>
  Array(h)
    .fill(null)
    .map(() => Array(w).fill(null));

export function MobileApp() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [splashDone, setSplashDone] = useState(false);
  const [overlay, setOverlay] = useState<OverlayScreen>(null);

  const openBlankCanvas = (size = 30) => {
    setOverlay({
      type: 'canvas',
      workingGrid: blankGrid(size, size),
      referenceGrid: blankGrid(size, size),
      title: `空白 ${size}×${size}`,
    });
  };

  const openPatternCanvas = (pattern: TrendingPattern) => {
    setOverlay({
      type: 'canvas',
      workingGrid: blankGrid(pattern.gridWidth, pattern.gridHeight),
      referenceGrid: pattern.grid.map((row) => [...row]),
      title: pattern.name || `图鉴 ${pattern.gridWidth}×${pattern.gridHeight}`,
    });
  };

  return (
    <>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}

      <PhoneFrame>
        <div className="absolute inset-0 flex flex-col bg-paper-bg">
          <div className="flex-1 min-h-0 relative">
            <div className={`absolute inset-0 ${activeTab === 'home' ? '' : 'hidden'}`}>
              <HomeScreen
                onAction={(action) => {
                  if (action === 'blank') openBlankCanvas(30);
                  // TODO 下阶段：upload / blindbox 流程
                  else console.log('[app] home action TODO:', action);
                }}
                onOpenGallery={() => setActiveTab('gallery')}
              />
            </div>
            <div className={`absolute inset-0 ${activeTab === 'create' ? '' : 'hidden'}`}>
              <CreateScreen onOpenPattern={openPatternCanvas} />
            </div>
            <div className={`absolute inset-0 ${activeTab === 'gallery' ? '' : 'hidden'}`}>
              <GalleryScreen />
            </div>
          </div>

          <BottomTabBar active={activeTab} onChange={setActiveTab} />
        </div>
      </PhoneFrame>

      {/* Overlay 子屏 — 跳出 PhoneFrame，强制横屏 */}
      {overlay?.type === 'canvas' && (
        <CanvasScreen
          initialWorkingGrid={overlay.workingGrid}
          referenceGrid={overlay.referenceGrid}
          title={overlay.title}
          onBack={() => setOverlay(null)}
        />
      )}
    </>
  );
}
