/**
 * Native 桥接层 — 屏蔽 Web 端 vs iOS app 端的差异
 *
 * Web 端：所有 native 调用 no-op，下载走 <a download>
 * iOS 端（Capacitor）：触觉反馈用 Haptics，下载走原生分享菜单
 *
 * 用法：调用 `isNative()` / `tapHaptic()` / `saveOrShareImage()` / `setupNativeUI()`
 * 即可，组件不用关心当前跑在哪儿。
 */

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { ScreenOrientation } from '@capacitor/screen-orientation';

export const isNative = (): boolean => Capacitor.isNativePlatform();
export const getPlatform = (): string => Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

/**
 * 触觉反馈 — 在 iOS 上震一下；Web 端 no-op
 * @param strong true = medium 反馈（成功/重要动作）；false = light 反馈（轻触 / 放豆）
 */
export async function tapHaptic(strong = false): Promise<void> {
  if (!isNative()) return;
  try {
    await Haptics.impact({
      style: strong ? ImpactStyle.Medium : ImpactStyle.Light,
    });
  } catch {
    // 某些设备/系统版本不支持，静默失败
  }
}

/**
 * 保存或分享一张 PNG 图片
 *
 * Web 端：触发浏览器下载（保持原行为）
 * iOS 端：先写入 Cache 目录，再用原生 Share 菜单——用户能选"保存到照片"、
 *         "分享到微信"、"发到 AirDrop" 等
 *
 * @param dataUrl  完整的 data:image/png;base64,... 字符串
 * @param filename 文件名（含 .png 后缀）
 */
export async function saveOrShareImage(
  dataUrl: string,
  filename: string,
): Promise<void> {
  if (!isNative()) {
    // Web: 经典 anchor download
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // iOS: 写到 cache → 分享
  try {
    const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
    const result = await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Cache,
    });
    await Share.share({
      title: '拼豆作品',
      text: filename.replace(/\.png$/, ''),
      url: result.uri,
      dialogTitle: '保存或分享',
    });
  } catch (e) {
    // 用户取消分享 / 文件系统失败时不要让 UI 崩
    console.warn('[native] saveOrShareImage failed:', e);
  }
}

/**
 * 锁定屏幕方向到横屏（Capacitor native 才能真的强制）
 * - iOS / Android app：调 native API 真锁
 * - Web 浏览器：尝试 Screen Orientation API（多数设备失败，需要 fullscreen），失败静默
 *
 * 在 unmount 时记得调 unlockOrientation() 释放。
 */
export async function lockLandscape(): Promise<void> {
  if (isNative()) {
    try {
      await ScreenOrientation.lock({ orientation: 'landscape' });
    } catch (e) {
      console.warn('[native] lockLandscape failed:', e);
    }
    return;
  }
  // Web fallback：Screen Orientation API（实验性，iOS Safari 不支持）
  try {
    const so = screen.orientation as any;
    if (so?.lock) await so.lock('landscape');
  } catch {
    // 没权限/不支持，静默
  }
}

/** 解锁屏幕方向（恢复用户偏好） */
export async function unlockOrientation(): Promise<void> {
  if (isNative()) {
    try {
      await ScreenOrientation.unlock();
    } catch {}
    return;
  }
  try {
    const so = screen.orientation as any;
    if (so?.unlock) so.unlock();
  } catch {}
}

/** 判断当前是否横屏（用于 web fallback：不能 lock 就检测） */
export function isLandscape(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > window.innerHeight;
}

/**
 * App 启动后的一次性 native UI 设置：
 * - 隐藏 splash screen
 * - 配置状态栏样式（DARK 深色文字 + paper-cream 背景）
 *
 * 在 main.tsx 启动后调用一次即可。
 */
export async function setupNativeUI(): Promise<void> {
  if (!isNative()) return;
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#f6efe2' });
  } catch {
    /* Android-only API on some versions, silent failure ok */
  }
  try {
    await SplashScreen.hide();
  } catch {}
}
