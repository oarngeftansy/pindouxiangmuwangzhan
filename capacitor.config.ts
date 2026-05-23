import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor 配置 — 把 React/Vite Web app 包成 iOS 原生壳
 *
 * - appId: 反域名格式，App Store 审核要求唯一。先用 com.pindou.simulator，
 *   想换在 Xcode 里直接改 Target → General → Bundle Identifier
 * - webDir: Vite 输出目录（vite.config.ts 设的是 'build' 不是默认的 'dist'）
 * - SplashScreen 用 paper-cream-bg 暖底，跟首页观感一致
 * - StatusBar 用 Dark 风格（深色图标 + 文字），衬 paper-cream 浅底背景
 */
const config: CapacitorConfig = {
  appId: 'com.pindou.simulator',
  appName: '拼豆模拟器',
  webDir: 'build',
  ios: {
    contentInset: 'always',
    // 不强制 'mobile'，让 iPad 走它自己的更宽布局（响应式已覆盖）
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#f6efe2', // paper-cream-bg
      showSpinner: false,
      androidSplashResourceName: 'splash',
    },
    StatusBar: {
      style: 'DARK',           // 深色图标/文字
      backgroundColor: '#f6efe2',
    },
  },
};

export default config;
