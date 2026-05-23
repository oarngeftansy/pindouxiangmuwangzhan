
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { setupNativeUI, isNative } from "./utils/native";

  // 关键：在 Capacitor native（iOS/Android）里运行时，立即跳到 /app/ 入口
  // —— web 端访问 / 还是渲染响应式 web 版，native 端 (APK/IPA) 访问 / 自动转到 mobile app shell。
  // 用早返回避免渲染 web 版闪一下再跳。
  const isNativeRedirect = isNative() && !window.location.pathname.endsWith('/app/index.html');

  // 首次访问时，从静态 JSON 加载默认图纸数据到 localStorage
  async function seedDefaults() {
    const trendingKey = 'trending_patterns_v1';
    const blindboxKey = 'custom_blindbox_patterns_v1';
    const existing = localStorage.getItem(trendingKey);
    if (existing && JSON.parse(existing).length > 0) return; // 已有数据，跳过

    try {
      // 用 Vite 注入的 BASE_URL 适配子路径部署（github.io 在 /pindouxiangmuwangzhan/ 下）
      const res = await fetch(`${import.meta.env.BASE_URL}data/default-patterns.json`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.trending?.length) {
        localStorage.setItem(trendingKey, JSON.stringify(data.trending));
      }
      if (data.blindbox?.length) {
        localStorage.setItem(blindboxKey, JSON.stringify(data.blindbox));
      }
    } catch {}
  }

  if (isNativeRedirect) {
    // 立即重定向到 /app/ 入口，不要挂载 web 版
    window.location.replace(`${import.meta.env.BASE_URL}app/index.html`);
  } else {
    seedDefaults().then(() => {
      createRoot(document.getElementById("root")!).render(<App />);
      // iOS 上隐藏 splash + 配置状态栏；Web 端 no-op
      setupNativeUI();
    });
  }
