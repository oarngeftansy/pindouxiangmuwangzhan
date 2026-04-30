# Claude — 接力指令

> 你（Claude）启动时会自动读到这份文件。这是这个项目的入口指南。
> 三句话总结：这是一个**拼豆 DIY 网站**，用户是**成年女性手作爱好者**，正在做**用户端品牌重构 + 熨烫渲染调优**。

---

## 必读文件（按顺序，不要跳过）

1. **`PRODUCT.md`** — 品牌策略：用户、品牌人格、反参考、设计原则。**所有 UI 决策的"为什么"都在这里。**
2. **`DESIGN.md`** — 视觉系统规范：色彩 token、字体栈、组件、Do's & Don'ts。**写 UI 代码必须按这份。**
3. **`PROGRESS.md`** — 会话历史 + 已做决策 + 试错过的死路 + 当前参数速查 + 已知未完成事项。**每次接手前看完这份再动手。**

读完三份你就完全 onboarding。**`PROGRESS.md` 第 3 节列了一堆"试错过的死路"——不要重复踩坑。**

---

## 注意事项（不要做这些）

### 设计 / UI 层

- ❌ **不要**用 `#ffffff` / `#000000`——任何位置都不允许。背景用 `paper-bg`，文字用 `ink-warm`。
- ❌ **不要**用 emoji 作图标（`🏛️ 🚀 ⚙️`）——用 Lucide SVG 替换。
- ❌ **不要**用 `text-transform: uppercase` + `letter-spacing > 0.02em` 的 SaaS eyebrow 小标签。
- ❌ **不要**用渐变文字（`background-clip: text`）。
- ❌ **不要**用 `border-left/right > 1px solid color` 当强调色条（impeccable 绝对禁令）。
- ❌ **不要**嵌套卡片（卡片里再放卡片）。
- ❌ **不要**用 glassmorphism / backdrop-blur 装饰。
- ❌ **不要**加 3D 圆胖 / Notion AI 风插画。
- ❌ **不要**廉价女生粉 + Comic Sans + 心心圆圈装饰。

### 熨烫渲染层（`IroningHelpers.tsx` / `ironingParams.ts`）

历经 7+ 轮迭代，**当前最终方案是 pixel-art 风**。**不要**回退到下面任何一种试过的死路：

- ❌ **不要**加大 `edgeBlurRatio`——任何 blur 都让画面糊
- ❌ **不要**加大 `fusionGradientWidth`——颜色融合渐变会让画面变模糊
- ❌ **不要**做整体 goo filter mask（squircle 大圆角）——真实拼豆外缘**就是 pixel art 锯齿方形**
- ❌ **不要**做 per-color goo filter——同色稀疏分布时会变成液滴状彩点
- ❌ **不要**调强按 cell 中心的 `holeAlpha / shineAlpha`——这会暴露每颗豆子的位置，破坏"看不出豆子"的效果

如果用户说「这里看到豆子分隔」，**根因是 cell 中心纹理 alpha 太强**，不是颜色不融合。继续往下调 `paper.holeAlpha` / `direct.shineAlpha` 等。

### 工作流层

- ❌ **不要**直接写代码——先用 `/impeccable shape <feature>` 写 brief，**等用户确认**再 craft。
- ❌ **不要**自己 `git config user.email/name`——用户 CLAUDE.md 全局规则禁止。
- ❌ **不要** `git push --force` / `git reset --hard` 类破坏性操作 unless 用户明确同意。
- ❌ **不要**用 `--no-verify` 跳过 hook。

---

## 常用命令

```bash
# 启动 dev server（vite 默认 5173，被占用会自动跳到 5174）
npm run dev

# 编译验证
npm run build

# 看 commit 历史
git log --oneline -20

# 推到两个 remote
git push origin main          # gitee
git push github main          # github
```

启动后地址：
- 用户端：`http://localhost:<port>/`
- 网红图纸导入工具：`http://localhost:<port>/dev.html`
- 烫珠参数调试：`http://localhost:<port>/ironing-dev.html`

---

## 远程仓库

- **GitHub**：`https://github.com/oarngeftansy/pindouxiangmuwangzhan.git`
- **Gitee**：`https://gitee.com/cheng-xin-Joyce-Island/testforgitee.git`

两个 remote 都要保持同步。

---

## 当前未完成（按优先级）

1. **BeadCanvas 圆格改造**：DESIGN.md doctrine 说豆子格子应该是圆形（不是方形），代码改动较大，需要单独 shape。
2. **GalleryView 视觉重做**：作品馆样式还是旧 shadcn 默认。
3. **图纸预览页（`mode='pattern'`）跟新 token**：Trending 卡片点进去的预览。
4. **dev / ironing-dev 工具页跟新主题**：低优先。

详见 `PROGRESS.md` 第 5、6 节。

---

## 最后一句

**每次大改完成后，去 `PROGRESS.md` 追加一节**记录这次做了什么 / 试错过什么 / 参数改到哪。下一个接手的 Claude 会感谢你的。
