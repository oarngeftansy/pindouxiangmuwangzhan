# Progress Log（会话进度 / 接力日志）

> 这份文件是写给「下一次接力的 Claude」看的。
> 把每次会话的设计决策、修改历史、试错过的死路、未完成事项压缩在这里——新会话读完这一份就能立即上手，不用重新踩坑。

---

## 0. 新会话 / 新设备 onboarding（关键）

如果你是新一轮会话的 Claude，**按顺序读这三份文件**就能完全 onboarding：

1. **`PRODUCT.md`** — 品牌策略上下文（用户、品牌人格、反参考、设计原则）。这份决定了所有后续视觉决策的"为什么"。
2. **`DESIGN.md`** — 视觉系统规范（色彩、字体、组件、Do's & Don'ts）。所有 UI 改动必须以此为准。
3. **`PROGRESS.md`**（本文件）— 会话历史 + 已做决策 + 试错记录 + 未完成事项 + 当前参数速查。

补充工具：
- `git log --oneline -20` — 看 commit 顺序，每个 commit message 都写了"为什么这样做"
- `npm run dev` — 起 dev server（vite 默认 5173，被占用会自动跳到 5174 / 5175 等）
- `npm run build` — 验证 TypeScript / Tailwind 没有编译错误

### Windows / 新设备首次启动

```bash
# 任选一个 remote 克隆
git clone https://github.com/oarngeftansy/pindouxiangmuwangzhan.git
# 或
git clone https://gitee.com/cheng-xin-Joyce-Island/testforgitee.git

cd pindouxiangmuwangzhan   # 或 testforgitee
npm install
npm run dev                # 看终端输出的本地端口（通常 5173）
```

启动后地址：
- **用户端**：`http://localhost:<port>/`
- **开发端（图纸导入）**：`http://localhost:<port>/dev.html`
- **烫珠开发工具**：`http://localhost:<port>/ironing-dev.html`

---

## 1. 项目概览

**拼豆 DIY 网站** — React + Vite + Tailwind v4 + shadcn/ui (radix)。

主要功能模块：
- 用户端首页（`mode='upload'`）：上传图、Trending 图鉴、每日盲盒
- 图纸预览（`mode='pattern'`）：自动转换图片为拼豆图纸
- 创作画布（`mode='canvas'`）：在线试拼
- 熨烫流程：四种烫法（铜版纸 / 毛巾 / 直烫 / 格里特）+ 预览 + 下载 + 加入作品馆
- 作品馆（GalleryView）：localStorage 持久化作品

**Register**：brand 为主（首页是品牌门面，工具入口在内部）。

---

## 2. 修改历史（按 commit 倒序）

### 2026-05-03 移动端适配 阶段 3：GalleryView brand 重做 + 移动适配 + 嵌套 modal 双锚底

完成阶段 2/3 的最后一段——作品馆。整文件 237 行，**所有像素都违 brand**（密度比 BeadPattern 还高）。一次过：全 `Write` 重写而非 surgical Edit，更稳。

**Brand token 大替换**（按违规类型）：

| 违规 | 替换 |
|---|---|
| `bg-black/70` `bg-black/80` overlay | `rgba(58, 52, 42, 0.6/0.7)` 内联（暖色烫纸感，对应 `--bead-ink`）— 不能用 Tailwind alpha 因为没有 `bg-ink-warm/60` 直接类 |
| `bg-white` `bg-[#f3f1ec]` `bg-[#f9f8f5]` `bg-[#e5e0d8]` 老色 | `bg-paper-soft` / `bg-paper-bg` / `bg-paper-deep` 三阶 |
| `border-[#d7d1c3]` `border-[#e5e0d8]` `border-[#1f5c57]` `border-gray-100` | `border-edge-sand` / `border-moss`（输入框 focus） |
| `text-[#1f2937]` `text-[#6b7280]` `text-[#9ca3af]` `text-gray-400/600` | `text-ink-warm` / `text-ink-soft` |
| `bg-[#1f5c57]` 老冷绿按钮 | `bg-moss` (oklch 0.45 0.085 165，暖松绿) |
| 5 种 chip 色（`bg-[#e8f4f1]` 青 / `bg-purple-50` 紫 / `bg-amber-50` 琥珀 / `bg-orange-50` 橙 / `bg-gray-100` 灰） | 3 种语义色：尺寸/颗数 = `paper-deep` 中性；颜色数 = `paper-deep + text-moss` 重音；烫法 = `honey-glow/40 + border-honey/40`（特定工艺记号）；日期 = `paper-bg` 最弱 |
| `hover:bg-red-50 hover:text-red-600` 删除按钮 | `hover:bg-alert-rose/10 hover:border-alert-rose hover:text-alert-rose` — 默认 ghost 形态，**只有 hover 才显警示色**，避免视觉惊慌。注意 token 名是 `alert-rose` 不是 `alert`（globals.css 第 103 行） |
| `bg-gradient-to-r from-green-500 to-emerald-500` 下载 CTA | `bg-terracotta` 实心 + lift-bead 阴影（绿不在调色板，gradient 也禁） |
| `shadow-2xl shadow-sm shadow-md` | 删除（DESIGN：flat by default）；CTA 加 `--shadow-lift-bead` |
| `rounded-3xl` `rounded-2xl` `rounded-xl` `rounded-lg` `rounded-full` 杂用 | `rounded-card` (20) / `rounded-surface` (16) / `rounded-control` (12) / `rounded-chip` (10) / `rounded-bead` (9999) 按语义 |
| `font-medium` 数字 | `style={{ fontFamily: 'var(--font-num)' }}` (Nunito tabular) |

**移动适配**（与阶段 1 ImageUploader 保持一致的"穷人 sheet"模式）：

- **嵌套 modal 双锚底**：列表 modal 和详情 modal 都用 `items-end sm:items-center` + `rounded-t-card sm:rounded-card` + `slide-in-from-bottom`。手机上详情盖在列表上方都从底部滑出，非常顺
- 两个 modal 都加顶部 4px drag handle 视觉提示
- 关闭按钮 `p-2` (~36px) → `min-h-[44px] min-w-[44px]`（44pt 触摸目标）
- 编辑铅笔 icon `p-1.5` → `min-h-[36px] min-w-[36px]`（卡片内空间紧，36 是接受下限）
- 内联编辑输入框 `text-sm py-0.5` → `text-sm py-2`（详情那个改 `text-base sm:text-lg py-2`，防 iOS 自动放大）
- 编辑确认按钮 icon `w-3 h-3` → `w-4 h-4` + `min-h-[36/44]`
- 详情底部按钮组 `flex` → `flex-col-reverse sm:flex-row`：手机上**下载在上、删除在下**，符合"主操作在指尖，破坏性操作离指尖远一点"的拇指可达性原则

**有意保留的细节**：
- 嵌套 modal 结构没改（最简方案）。如果以后觉得"详情盖在列表上"逻辑上重，可以重构为单 modal + 内部状态切换 view
- 删除按钮用 `window.confirm`——原生 confirm 在手机 UX 不好（系统弹窗丑），但替换需要再加一个第三层 modal。这次保留，后续优化项
- 缩略图 `imageRendering: 'pixelated'` 保留——拼豆图本来就是像素风，不要平滑化

**为什么 overlay 用内联 `rgba(58, 52, 42, 0.X)` 而不是 `bg-ink-warm/60`**：
- Tailwind v4 的 alpha 修饰符 `/60` 需要 `--color-ink-warm` 是 oklch，内部要做 `oklch + alpha` 计算。这一套 OKLCH alpha 在某些浏览器（特别是老 Safari）渲染异常
- 内联 rgba 是 100% 兼容的"硬保险"，且数值 (58, 52, 42) 直接对应 `#3a342a` (`--bead-ink`) 的 RGB
- 视觉上 60-70% 不透明度的暖墨色 = 类似看打湿的纸张那种暗下来的感觉，比 `bg-black/70` 冷绝望感好太多

修改文件：`src/components/GalleryView.tsx`（全文重写，从 237 行 → 220 行）、`PROGRESS.md`

### 2026-05-03 移动端适配 阶段 2：BeadPattern brand 重做 + 移动适配 + 修 hover-only bug

承接阶段 1，对图纸预览页（`BeadPattern.tsx`，705 行）做完整改造。这一页之前**完全没碰过**——既没跟 brand 重构，也几乎没移动适配。一次过。

**Brand token 大替换**（按违规类型）：

| 违规 | 替换为 |
|---|---|
| `bg-white` `bg-gray-50/100/200/300` | `bg-paper-soft` / `bg-paper-bg` / `bg-paper-deep` 三阶 |
| `text-gray-500/600/700` | `text-ink-soft` / `text-ink-warm` |
| `border-gray-200/300` | `border-edge-sand` |
| `shadow-xl` `shadow-2xl` `shadow-inner` | 删除（DESIGN：flat by default）；CTA 加 `--shadow-lift-bead` 暖阴影 |
| `text-purple-600` `bg-purple-500/600` `ring-purple-500` | `text-moss` / `bg-moss` / `ring-moss`（**紫色根本不在 DESIGN 调色板**） |
| `bg-blue-500` "自适应原图" | `bg-paper-bg border-edge-sand text-ink-warm`（ghost） |
| `bg-gradient-to-r from-purple-500 to-pink-500` 主 CTA | `bg-terracotta` 实心（gradient fill banned；pink 也不在调色板） |
| `bg-blue-50 border-blue-200 text-blue-800` 提示卡 | `bg-honey-glow/40 border-honey/40 text-ink-warm`（信息性提示用 honey 系暖暗示） |
| `bg-black text-white` tooltip | `bg-ink-warm text-paper-bg` |
| `color: "#000000"` / `color: "#000"` 内联 | `color: var(--bead-ink)` |
| `font-mono` 色号/数字 | `style={{ fontFamily: 'var(--font-num)' }}`（Nunito tabular） |
| `💡` emoji | Lucide `Info` |
| `rounded-2xl` `rounded-xl` `rounded-lg` 杂用 | `rounded-card` (20) / `rounded-surface` (16) / `rounded-control` (12) / `rounded-chip` (10) 按语义分配 |

**修 hover-only tooltip bug**（最重要的功能修复）：

- 之前：色号 tooltip 只用 `:hover` 触发——**手机根本看不到**。代码里有"点击格子可查看色号"提示文案，但**实际没实现 onClick**——之前是个真 bug
- 现在：加 `selectedBead: { x, y } | null` state，`onClick` 切换；tooltip 显示条件 = `isSelected || hover`（桌面 hover 体验保留）
- 加 `aria-label`（屏幕阅读器现在能读出"第 N 行 M 列，色号 XXX"）
- 提示文案随设备分支：触摸 → "轻触任意格子可查看色号，再点一下取消"；桌面 → "鼠标悬停或点击..."

**移动适配**：

- 色号系统选择 `grid-cols-5` → `grid-cols-3 sm:grid-cols-5`（5 列在 320px 屏严重挤）
- 尺寸调整区拆两行：第一行宽×高×颗数；第二行两个按钮 `flex-1 sm:flex-initial`（手机各占半宽）；原图尺寸单独显示
- 网格透明度滑块加 `py-3` 包裹 → 24px 触摸 hitbox（Apple HIG 推荐）
- 数字 input `py-2` → `py-3 text-base`（44pt 触摸 + 防 iOS 自动缩放）
- 设置展开按钮：纯文字 link → 带 chevron + min 44×44 触摸
- 主图区加 `touch-pan-x touch-pan-y`（明确允许触摸滚动）
- Material 列表卡片加 `min-w-0 truncate`（长色号防溢出）
- 主 CTA 加 `min-h-[52px]` + `outline-2 outline-moss outline-offset-2`（focus 可见）

**没动的**：
- `downloadPattern()` 内 canvas 的 `#FFFFFF #333333 #BBBBBB #666666` 颜色——那是输出 PNG 的打印样式，不是 UI（白底打印能用，灰线易识别）
- `maxDisplaySize = window.innerWidth - 64` 模块初始化计算，不响应 resize——修要加 useEffect+ResizeObserver，是单独工作，先 ship

**为什么提示卡用 honey-glow 不用 moss**：
- DESIGN.md 说 honey "稀缺性就是它的意义" ≤5%，但**信息性提示卡**正是它的合法用法（喜悦/友好暗示，区别于 moss 的"功能性强调"）。一屏只一处提示，不破规则
- moss 这里已经用在了"展开/收起"按钮 + 色号系统选中态，再叠会过载

修改文件：`src/components/BeadPattern.tsx`、`PROGRESS.md`

### 2026-05-03 移动端适配 阶段 1：首页 + uploader（手机锚底 modal / 触摸 ≥44px）

按 `/impeccable adapt` 流程，先 shape brief → 用户确认 C 路线（分阶段）→ craft 阶段 1。范围限定在**已完成 brand 重构的表面**（首页 + uploader），产品页（BeadPattern / BeadCanvas / GalleryView）的 brand 跟新留给阶段 2/3 配合做。

**断点策略修正**：用户明确反对"iPad 当大手机"——sub-`sm:`(< 640px) 才是手机重点；iPad 不论横竖屏（`sm:`/`md:`/`lg:`）维持桌面观感。当前 trending 已经是 `2 / sm:3 / md:4 / lg:5` 列阶梯，iPad 自然走 4-5 列，未额外干预。

| 改动 | 说明 |
|---|---|
| `App.tsx` header | 整体 padding `py-4` → `py-3 sm:py-4`；logo+标题用 `min-w-0 truncate` 防止挤压；标题 `text-2xl` → `text-xl sm:text-3xl`（手机字号收一档） |
| `App.tsx` 作品馆/返回首页按钮 | 新增 `min-h-[44px] min-w-[44px]` 触摸目标保底；icon 在 mobile 放大到 `w-5 h-5`（PRD：触摸目标 ≥44pt） |
| `App.tsx` "返回首页" | 加 `ArrowLeft` icon（之前是纯文字按钮），mobile 上变 icon-only（保留 aria-label "返回首页"），与"作品馆"按钮一致的 collapse 模式 |
| `App.tsx` `<main>` | `px-3` → `px-4`（手机标准 16px gutter，3 太挤） |
| `TrendingPatternsPanel.tsx` | 卡片图区 `min-h-[120px]` → `min-h-[96px] sm:min-h-[120px]`；预览图 `max-h-[110px]` → `max-h-[88px] sm:max-h-[110px]`（手机 2 列下卡片宽 ~155px，原高度 120 太重） |
| `ImageUploader.tsx` 主区 | dashed dropzone `p-10 sm:p-12` → `p-6 sm:p-12`（手机省 32px 高度）；圆形上传按钮 `w-16 h-16` → `w-14 h-14 sm:w-16 sm:h-16`，icon 同步缩 |
| `ImageUploader.tsx` 两个 modal | 中央居中 → **手机底部锚定 + slide-up**：`items-center` → `items-end sm:items-center`，圆角 `rounded-2xl` → `rounded-t-2xl sm:rounded-2xl`，高度上限 `max-h-[90vh]` → `max-h-[92vh]`，加 `animate-in slide-in-from-bottom duration-200`（tw-animate-css 已引），顶部 4px drag handle 视觉提示。本质是手撸的"穷人 sheet"——比上 vaul 省了 token 兼容/包体的开销 |
| `ImageUploader.tsx` 数字输入框 | gridWidth/gridHeight 输入 `py-2` → `py-3 text-base`（44px 触摸目标 + 防 iOS 自动放大表单） |

**为什么不引入 vaul Drawer**：brief 原本提议用 vaul，但读了 `ui/drawer.tsx` 后发现它依赖 `bg-background` `bg-muted` `text-foreground` `text-muted-foreground` 这套 shadcn 默认 token——本项目没定义（DESIGN.md 走的是 paper-cream 系），直接用会变透明/错色。手撸 Tailwind 锚底方案在视觉上 95% 等价，且零外部依赖。如果阶段 2 要给产品页做更复杂的 sheet 交互（比如 BeadCanvas 调色板抽屉），那时再考虑给 drawer.tsx 做品牌 token 适配。

**为什么不动产品页**：BeadPattern / GalleryView / ColorPalette 仍是旧 shadcn token（`bg-white shadow-2xl text-blue-500 bg-gray-200 border-[#1f5c57]`...），既不 brand 也不 mobile。但**布局调整 + 颜色改造耦合**——单做布局会浪费功夫，因为颜色改造时布局还要重排。所以这两层留到下个 shape 一起做。

**iOS 输入框自动放大注意点**：iOS Safari 对 `font-size < 16px` 的 input 会自动放大页面（调用键盘时）。我把 modal 内的数字输入设成 `text-base`（16px）规避了这个坑。

修改文件：`src/App.tsx`、`src/components/TrendingPatternsPanel.tsx`、`src/components/ImageUploader.tsx`、`PROGRESS.md`

### 2026-05-03 首页两端对齐 + 移除图鉴卡片标题

承接上一节"隐藏盲盒入口"留下的副作用：uploader 被刻意压在 `max-w-[820px] mx-auto`，与上方撑满 1240 内宽的 TrendingPanel 两端对不齐，视觉上像两段没归位的栏目。同时用户反馈"未命名图纸"占位文字让她要逐张命名才整齐——多余负担。

| 改动 | 说明 |
|---|---|
| `App.tsx` | uploader section 的 `max-w-[820px] mx-auto w-full` → `w-full`，与 TrendingPanel 同宽，左右两端对齐 main 内边 |
| `TrendingPatternsPanel.tsx` | 删除卡片下方的 `<p>{p.name}</p>` 标题；`alt={p.name}` 保留（屏幕阅读器仍能读出语义）；meta 行同步去掉 `mt-1.5`（标题没了不需要再撑开一段间距） |

**为什么不再坚持 820px**：上次留 820 是为了让"BlindBox 隐藏前后 uploader 宽度像素一致"——保护过渡平滑。但这是临时约束，跟新目标"两段对齐"冲突时该让位。Trending 的"色卡墙富足感"是 PRODUCT.md 第 3 条原则核心，不能为对齐让 trending 收窄；让 uploader 拉宽是更便宜的代价（dashed 框变宽，内部内容 `items-center` 居中不变形）。

**为什么删卡片名而不是给个更好的占位**：用户用图鉴的心智是"看图选一份现成的就开拼"，名字不是决策信息——难度色点 + 尺寸/颗数才是。视觉上少一行文字，卡片更接近"画廊瓷砖"而不是"商品标签"，符合 brand 母题。

修改文件：`src/App.tsx`、`src/components/TrendingPatternsPanel.tsx`、`PROGRESS.md`

### 2026-05-03 隐藏每日盲盒入口（暂时关闭，可一键恢复）

用户决定先把首页右侧的「每日盲盒」面板暂时下线，未来某天会重启用。

| 改动 | 说明 |
|---|---|
| `App.tsx` | 模块顶层加 `const SHOW_BLIND_BOX_PANEL = false`——一个开关收口；翻 `true` 即可整段恢复 |
| Hero 副标题 | 用 `SHOW_BLIND_BOX_PANEL ? ... : ...` 三元，flag = false 时去掉「抽个盲盒」，避免文案对不上 |
| 布局 | flag = false 时，原 12 列 grid（uploader 8/4）替换为单 `<section>` + `max-w-[820px] mx-auto w-full`——820 = 1240×8/12，刻意对齐原 col-span-8 的实际宽度，避免视觉错位 |
| 保留物 | `BlindBoxPanel` import、`handleUseBlindBox`（TrendingPatternsPanel 还在用）都保留，未删——以便重启用时 0 改动恢复 |

**为什么不直接删而是 flag**：用户明确说「下次想再启用的时候再放出来」。flag 让重启用从"翻代码 + 找 commit + cherry-pick"降级到"改一行 false 为 true"。CLAUDE.md 通用规则说不喜欢 feature flag，但本场景是用户显式要求的"暂时停用"用例，flag 合理。

**为什么 max-w-[820px] 不用 max-w-3xl/4xl**：3xl=768 比原 col-span-8 实际宽窄了 ~60px，会感觉 uploader 缩水了；4xl=896 又超过原宽。820 是数学对齐——保证用户切换前后看到的 uploader 宽度像素一致，只是"右边那块走了"。

**Polish 自审（impeccable polish）通过**：没引入侧条/渐变文字/glassmorphism/嵌套卡，trending 仍承担富足感主力，居中收束读为"展示台"不是"空屏"。

修改文件：`src/App.tsx`、`PROGRESS.md`

### `3c2c475` — 2026-04-30 熨烫渲染重做（用户提供实物图后的最终方案）

**关键决策**：参考用户提供的真实烫熔实物照片，反推算法。

| 改动 | 说明 |
|---|---|
| 外缘形状 | 删除 goo filter mask，回到方形 fillRect 紧密拼接 → pixel art 锯齿外缘 |
| 按 cell 中心纹理 alpha 大幅削弱 | paper holeAlpha 0.18→0.04, paper shineAlpha 0.22→0.06, direct shineAlpha 0.42→0.10, towel weaveAlpha 0.12→0.05, glitter sparkleAlpha 0.78→0.55 |
| storage version | v2 → v3（让所有用户拿到新默认值，旧 localStorage 缓存失效） |
| 删除局部熨烫 | BeadCanvas.tsx 全部 partial 相关 state、UI、模态、文件名标记一并删除 |

**为什么纹理 alpha 要这么弱**：真实烫熔的同色大区域看不出豆子分隔，是因为按 cell 周期的强对比纹理（孔洞、中心高光）在烫熔时被融化平整了——这是真正让"看不出豆子"的根因，**不是颜色融合**。

修改文件：`BeadCanvas.tsx`、`IroningHelpers.tsx`、`ironingParams.ts`

### `d0ccb7f` — 2026-04-30 用户端品牌重构（Warm Terracotta Studio Wall）

按 PRODUCT.md / DESIGN.md 的"暖陶色卡墙工坊"基调重做用户端首页：

| 改动 | 说明 |
|---|---|
| token 系统 | 重写 globals.css，用 paper-cream / terracotta / moss / honey / ink-warm 体系替换 shadcn 默认中性灰；OKLCH canonical |
| 字体 | 引入 Fredoka + ZCOOL KuaiLe + Nunito + Noto Sans SC；prefers-reduced-motion 全局降级 |
| Logo | 4 颗真豆颗粒 SVG 2×2 方阵替换墨绿小方块图标 |
| 作品馆按钮 | 🏛️ emoji → Lucide `Library`；徽章红 → honey 圆点 |
| Hero | 删 "Bead Studio" eyebrow + 长句标题，换成「**今天想拼点什么？**」松弛口吻 |
| Trending Panel | 卡片 paper-soft + hover 浮起 + honey 角标 `+` |
| BlindBox Panel | 暖色化 + paper-soft + 暖阴影 + 「试试 →」 |
| ImageUploader | 圆形 terracotta 上传按钮 + lift-bead 阴影 + 文案换为「上传你的图」|

**注意**：进入 BeadCanvas / BeadPattern（产品流）后视觉**没改**——这是 brand 首页的 shape brief 范围之内的。下一轮可以做 BeadCanvas 圆格 / 烫珠预览的产品语言。

修改文件：`globals.css`、`index.css`、`App.tsx`、`TrendingPatternsPanel.tsx`、`BlindBoxPanel.tsx`、`ImageUploader.tsx`

### `16f7771` — 2026-04-30 项目首次入 git

第一次 commit，固化"改动前的状态"作为基线。包含 195 个文件（项目代码 + .claude/skills 设计辅助包）。

---

## 3. 关键决策与试错（避免重复踩坑）

### 熨烫渲染：试错过的死路

| 试过 | 为什么不行 |
|---|---|
| 圆形 mask + edgeBlur 0.08 | 模糊吃掉表面纹理，四种方法看起来一样；糊 |
| 方形 mask + 调强 fusion gradient (0.6) | 颜色之间渐变带产生"糊"的视觉，用户明确反对 |
| 圆角矩形 mask + maskInflate | 试图填补菱形空隙，但用户要的是"看不出豆子"不是"圆角" |
| Goo filter 整体外缘大圆角 (squircle) | 用户提供实物图后才发现：真实拼豆外缘**就是 pixel art 方形锯齿**，不是 squircle |
| Per-color goo filter | 同色稀疏分布时，孤立 cell 经 blur 扩散后变成液滴状彩点，毁掉整张图 |

### 用户对"模糊 / blur / 糊"的语义

- 「不要 blur」 = 不要图像视觉上模糊不清
- 「液化」 = 同色区域看起来连续融合，但**不是颜色融合渐变**
- 「看不出豆子」 = 同色大区域里看不见每颗豆子的中心点 / 分隔线 / 孔洞
- 「不要空隙」 = 包括圆角形成的菱形小缝也不要
- 「外缘可以不用圆角」 = 接受 pixel art 锯齿外缘（参考真实烫熔实物）

最终方案的物理对应：真实烫熔的拼豆顶部融化平整，cell 中心特征（孔洞、高光）被烫平 → 同色大区域看起来是连续色面。这是表面纹理 alpha 大幅削弱后的真实再现。

### 用户偏好（来自这次会话）

- 反对 SaaS 默认 shadcn 模板感（中性灰 + uppercase tracking + 圆角小标签）
- 反对二次元重色 / 赛博朋克 / 霓虹激光
- 反对 3D 圆胖插画 / Notion AI 风插画
- 反对廉价女生粉 + Comic Sans + 心心圆圈
- 喜欢 Lego / 宅不拼 这种"承认材料是真实实物"的玩具品牌手法
- 品牌人格三词：可爱 / 治愈 / 富足感
- 用户群：成年女性手作爱好者（小红书系）

---

## 4. 当前参数速查

### 设计 token（globals.css `:root`）

| 角色 | OKLCH | Hex | 用途 |
|---|---|---|---|
| paper-bg | `0.965 0.018 84` | `#f6efe2` | 主背景（70% 屏幕） |
| paper-soft | `0.95 0.022 84` | `#f1e9da` | 卡片表面 |
| paper-deep | `0.92 0.025 84` | `#ebe1cf` | hover / pressed |
| terracotta | `0.62 0.165 38` | `#c8552f` | 主品牌色（30-50% 强调） |
| terracotta-deep | `0.5 0.155 35` | `#a0421e` | hover/active |
| moss | `0.45 0.085 165` | `#2c6b54` | 第二重音色 / 链接 |
| honey | `0.82 0.155 85` | `#e9b347` | 徽章 / 高亮（≤5%） |
| ink-warm | `0.28 0.025 70` | `#3a342a` | 主文字 |
| ink-soft | `0.5 0.018 70` | `#6e6657` | 副文字 |
| edge-sand | `0.86 0.015 70` | `#d9d0bf` | 1px 边线 |

### 字体栈

- Display 中文：`ZCOOL KuaiLe`（圆体可爱）
- Display 西文：`Fredoka`（圆润几何）
- Body：`Noto Sans SC` + `Nunito`
- Numeric tabular：`Nunito 700 tabular`

### 熨烫参数（`ironingParams.ts` v3 默认值）

```ts
cellSize: 80                  // 单豆渲染尺寸
fusionGradientWidth: 0        // 关闭——颜色融合会糊
maskRadiusRatio: 1.45         // 字段保留兼容；现在 mask 是方形 fillRect
edgeBlurRatio: 0              // 关闭——任何 blur 都让画面糊

paper:   { holeAlpha: 0.04, shineAlpha: 0.06 }      // 极弱，避免暴露 cell 中心
towel:   { weaveAlpha: 0.05, crossAlpha: 0.06 }
direct:  { shineAlpha: 0.10, shineMidAlpha: 0.05 }
glitter: { sparkleAlpha: 0.55, baseShineAlpha: 0.06 }
```

### Vite 入口

vite.config.ts 配了三个 HTML 入口：
- `index.html` → 用户端主站（`src/main.tsx` → `App.tsx`）
- `dev.html` → 开发端（`src/dev.tsx`，网红图纸导入工具）
- `ironing-dev.html` → 烫珠参数调试工具（`src/ironing-dev.tsx`，可实时调上述参数并 saveIroningParams 到 localStorage）

---

## 5. 已知问题 / 未完成

- **BeadCanvas / BeadPattern 视觉未重构**：DESIGN.md 说豆子格子应该是圆形（不是方形），烫珠预览的产品语言也应该跟新 token 走。这是下一轮 brand→product surface 的范围。
- **GalleryView 内部样式未改**：作品馆模态内部还是旧的 shadcn 默认风。
- **ImageUploader 设置模态框（gridWidth / colorMerge / detail level 那一段）没改**：那是产品流深处，跟 brand 首页 shape brief 不在同一范围。
- **dev.html / ironing-dev.html 没用新 token**：开发端不是用户面，brand 重构没覆盖。
- **熨烫纹理调弱后可能太"光秃秃"**：用户接受这个状态了（参考实物图同色区域确实平），但如果后续想要更明显的"塑料质感"，可以考虑全图 overlay 纹理（不按 cell 周期），不要回到强 cell-中心纹理。

---

## 6. 下一步建议（如果用户继续做）

按优先级：

1. **BeadCanvas 圆格改造**：DESIGN.md 已经写了 doctrine（"Don't 让 BeadCanvas 的格子是方形"），但代码改动较大，需要单独 shape。
2. **GalleryView 视觉重做**：作品馆是用户回访的核心，目前样式还是旧的 shadcn 默认。
3. **图纸预览（mode='pattern'）跟新 token**：Trending 图鉴点击进入后的预览页面，色卡 / 难度标签等用 brand token。
4. **dev / ironing-dev 工具页跟主题**：低优先，但保持一致性。

每次大改前：跑 `/impeccable shape <feature>` 写 brief，等用户确认才进 craft。

---

## 7. 远程仓库

- **Gitee**（先建的）：`https://gitee.com/cheng-xin-Joyce-Island/testforgitee.git`
- **GitHub**（追加的）：`https://github.com/oarngeftansy/pindouxiangmuwangzhan.git`

每次提交都同步推到两个 remote：
```bash
git push origin main          # 推 gitee（origin 是 gitee）
git push github main          # 推 github
```
（具体 remote 命名以本机 `git remote -v` 输出为准。）

---

## 8. 设计 / 工具系统

`.claude/skills/` 目录里包含两个 UI 设计 skill：
- **impeccable**：frontend craft + critique 工具，提供 `/impeccable shape` / `craft` / `polish` 等子命令
- **ui-ux-pro-max**：UI 设计知识库，可用 `python3 .claude/skills/ui-ux-pro-max/scripts/search.py` 查色彩 / 字体 / 风格

`.claude/settings.local.json` 里有项目级权限白名单（已在 git 里）。

---

> 每次会话结束 / 大改完成后，**记得来这份文件追加一节**说明这次做了什么、试错过什么、参数改到哪。
> 下一个 Claude 会感谢你的。
