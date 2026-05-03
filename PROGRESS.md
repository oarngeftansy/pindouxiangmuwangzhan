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
