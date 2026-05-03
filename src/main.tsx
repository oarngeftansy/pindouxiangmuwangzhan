
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";

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

  seedDefaults().then(() => {
    createRoot(document.getElementById("root")!).render(<App />);
  });
