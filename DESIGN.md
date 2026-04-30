---
name: 拼豆模拟器
description: 走进一面温暖的拼豆色卡墙——线上拼豆工坊
colors:
  paper-cream-bg: "#f6efe2"
  paper-cream-soft: "#f1e9da"
  paper-cream-deep: "#ebe1cf"
  terracotta-clay: "#c8552f"
  terracotta-deep: "#a0421e"
  moss-pine: "#2c6b54"
  moss-deep: "#1f4f3e"
  honey-bead: "#e9b347"
  honey-glow: "#f6cb6e"
  ink-warm: "#3a342a"
  ink-soft: "#6e6657"
  edge-sand: "#d9d0bf"
  bead-shadow: "#c5bcae"
  alert-rose: "#c43d4f"
typography:
  display:
    fontFamily: "'ZCOOL KuaiLe', 'Fredoka', 'Noto Sans SC', sans-serif"
    fontSize: "clamp(2rem, 5.5vw, 3.5rem)"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "-0.005em"
  headline:
    fontFamily: "'Fredoka', 'Noto Sans SC', sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2rem)"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "normal"
  title:
    fontFamily: "'Noto Sans SC', 'Nunito', sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "'Noto Sans SC', 'Nunito', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
  label:
    fontFamily: "'Nunito', 'Noto Sans SC', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.01em"
  bead-num:
    fontFamily: "'Nunito', ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.02em"
    fontFeature: "'tnum'"
rounded:
  bead: "999px"
  pill: "9999px"
  card: "20px"
  surface: "16px"
  control: "12px"
  chip: "10px"
spacing:
  hairline: "2px"
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  section: "64px"
components:
  button-primary:
    backgroundColor: "{colors.terracotta-clay}"
    textColor: "{colors.paper-cream-bg}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "14px 24px"
  button-primary-hover:
    backgroundColor: "{colors.terracotta-deep}"
    textColor: "{colors.paper-cream-bg}"
  button-ghost:
    backgroundColor: "{colors.paper-cream-soft}"
    textColor: "{colors.ink-warm}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  button-ghost-hover:
    backgroundColor: "{colors.paper-cream-deep}"
    textColor: "{colors.ink-warm}"
  card-surface:
    backgroundColor: "{colors.paper-cream-soft}"
    textColor: "{colors.ink-warm}"
    rounded: "{rounded.card}"
    padding: "24px"
  chip-bead:
    backgroundColor: "{colors.paper-cream-bg}"
    textColor: "{colors.ink-warm}"
    typography: "{typography.bead-num}"
    rounded: "{rounded.chip}"
    padding: "6px 10px"
  input-field:
    backgroundColor: "{colors.paper-cream-bg}"
    textColor: "{colors.ink-warm}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
---

# Design System: 拼豆模拟器

## 1. Overview

**Creative North Star: "走进一面温暖的拼豆色卡墙（A Warm Wall of Bead Cards）"**

这是一个手作工坊，不是 SaaS 工具。整套视觉的母题是**真实的拼豆颗粒、整齐的色卡墙、纸张的温度**。用户走进来的第一感觉应该是「哦，这里东西真多，看起来很好玩」——不是「请登录后选择您要进行的操作」。

我们用**Committed 色彩策略**：温暖陶土红（terracotta-clay）作主品牌色，覆盖 30-50% 的强调表面；奶油纸色（paper-cream）做整体底材，绝不是纯白；其余颜色（苔藓松绿、蜂蜜黄）作为色卡上的"另一颗豆子"出现，密度由场景决定——色卡墙、Trending 图鉴可以富足堆叠，工具区可以克制干净。

这套系统**明确拒绝**：默认 shadcn/ui SaaS 模板（中性灰 + uppercase tracking）、霓虹/玻璃毛态、3D 圆胖插画包、廉价女生粉（粉狂 + Comic Sans + 心心圆圈）、二次元重色撞色。手作不等于 lo-fi——Lego 也很温暖，但每个倒角都精确。

**Key Characteristics:**
- 暖陶 + 奶油纸做主体，富足色卡作辅；从不出现 #fff 或 #000
- 圆角偏大（控件 12px / 卡片 20px），呼应颗粒的圆润
- 默认 flat，状态变化才浮起来
- 真实拼豆颗粒（圆点阵列）作为装饰母题反复出现
- 中文用 ZCOOL KuaiLe（display）+ 思源黑（body），西文 Fredoka 配 Nunito
- 文案像主理人：松弛、有温度、不发号施令

## 2. Colors: The Studio Wall Palette

整体调性：纸张的温度 + 烧制陶土的暖意 + 一抹苔藓和蜂蜜的生机。所有色值都偏暖（hue 38-85），降低纯白纯黑带来的冰冷数字感。

### Primary
- **Terracotta Clay** (`#c8552f` / `oklch(0.62 0.165 38)`)：主品牌色。用在 hero 标题字、主 CTA、Trending 角标、收藏印章。它是「这家店的招牌色」——必须看起来像烧制的陶土，不是 SaaS 红。
- **Terracotta Deep** (`#a0421e` / `oklch(0.5 0.155 35)`)：Primary 的 hover/active 态；也用作 Primary 大色块上的描述性图标对比。

### Secondary
- **Moss Pine** (`#2c6b54` / `oklch(0.45 0.085 165)`)：第二重音色。用在次级 CTA、链接、成功状态、"完成的拼豆数"等正向数据。**这不是当前那个 #1f5c57**——那个偏冷蓝绿，没有生机；moss-pine 是户外苔藓、松针的暖绿。
- **Moss Deep** (`#1f4f3e` / `oklch(0.32 0.075 165)`)：Secondary 的 hover/active 态。

### Tertiary
- **Honey Bead** (`#e9b347` / `oklch(0.82 0.155 85)`)：用在徽章（galleryCount）、收藏星标、"今日新增"高亮、空状态插画。出现频率严格 ≤5%，**它的稀缺性就是它的意义**。
- **Honey Glow** (`#f6cb6e` / `oklch(0.88 0.135 85)`)：浅版，用在 hover 背景、高亮区轻微染色。

### Neutral
- **Paper Cream Bg** (`#f6efe2` / `oklch(0.965 0.018 84)`)：主背景。**取代当前的 #f3f1ec**——把它再暖一点、再"纸张"一点。70% 屏幕被它覆盖。
- **Paper Cream Soft** (`#f1e9da` / `oklch(0.95 0.022 84)`)：卡片/面板表面，比背景沉 1 个色阶。
- **Paper Cream Deep** (`#ebe1cf` / `oklch(0.92 0.025 84)`)：hover 态、按下态、微凹陷感。
- **Edge Sand** (`#d9d0bf` / `oklch(0.86 0.015 70)`)：1px 边线、分隔线。
- **Bead Shadow** (`#c5bcae` / `oklch(0.78 0.012 70)`)：颗粒投影、禁用态字色。
- **Ink Warm** (`#3a342a` / `oklch(0.28 0.025 70)`)：主文字色。**取代当前的 #1f2937**（冷青灰）——暖墨色更贴合纸张语境。
- **Ink Soft** (`#6e6657` / `oklch(0.5 0.018 70)`)：副文字、说明文字、placeholder。

### Alert
- **Alert Rose** (`#c43d4f` / `oklch(0.55 0.18 18)`)：错误、警告、删除确认。比硬红更柔和、不破坏整体暖色调。

### Named Rules

**The No-True-White-Or-Black Rule.**
任何位置都不允许 `#ffffff` 或 `#000000`。背景统一用 paper-cream 系，文字统一用 ink-warm/ink-soft。屏幕上每一个像素都微微偏暖。

**The Honey Rarity Rule.**
Honey Bead 在任何一屏的占比 ≤5%。它是「色卡墙里最让人心动的那颗豆子」——多了就廉价。

**The Color Card Doctrine.**
颜色出现的方式应该像「色卡墙上的一颗颗豆子」——可以密、可以多、但每颗都有自己的格子。永远不用渐变 fill 大色块（除非是颗粒高光）。永远不用 `background-clip: text` 渐变文字。

## 3. Typography

**Display Font (西文):** Fredoka（圆润几何无衬线，Lego 字体精神近邻）
**Display Font (中文):** ZCOOL KuaiLe（圆体可爱中文，与 Fredoka 几何感对位）
**Body Font:** Noto Sans SC + Nunito（已有 + 圆润互补）
**Numeric Font:** Nunito tabular（色号、数量、坐标）

**Character:** display 字体是「积木上的字」——圆润、敦实、有触感；body 字体是「价签和说明卡」——清晰、温和、不抢戏。中文 display 必须用 ZCOOL KuaiLe，因为它的圆头方块字本身就像一颗一颗豆子拼出来的。

### Hierarchy
- **Display** (`ZCOOL KuaiLe / Fredoka 400`, `clamp(2rem, 5.5vw, 3.5rem)`, `1.15`)：仅用于 hero 主标题、空状态主文案。每页 ≤1 处。
- **Headline** (`Fredoka 600`, `clamp(1.5rem, 3vw, 2rem)`, `1.25`)：板块大标题（"今日趋势"、"作品馆"）。
- **Title** (`Noto Sans SC 600`, `1.125rem`, `1.4`)：卡片标题、模态框标题。
- **Body** (`Noto Sans SC 400`, `1rem`, `1.65`)：所有正文。中文行高 1.65（中文密度高需要更多呼吸）。最大行宽 35-50 中文字 / 65-75ch。
- **Label** (`Nunito 600`, `0.875rem`, `1.3`, letter-spacing `0.01em`)：按钮文字、tab 标签、徽章。**不要 uppercase**，不要 tracking 大于 `0.02em`。
- **Bead-Num** (`Nunito 700 tabular`, `0.75rem`, `1`)：色号、坐标、数量。

### Named Rules

**The No-Uppercase-Eyebrow Rule.**
绝对禁止 `text-transform: uppercase` + `letter-spacing: 0.14em` 这种 SaaS landing page eyebrow 小标签（当前 "Bead Studio" 就是反面教材）。需要分类标签时，用色块 chip + 句子大小写，不用全大写。

**The Mixed-Script Rule.**
中英文混排时，西文用 Fredoka/Nunito 包裹（用 `font-family: 'Fredoka', 'ZCOOL KuaiLe', ...` 让浏览器自动按字符选字体），中西文混排时不要刻意调整字间距来"对齐"。

## 4. Elevation

**Flat by default + tonal layering for depth + shadow only on lifted state.**

平面的纸面世界。深度通过色层（paper-cream 三阶）表达，不通过阴影。只有当一个元素「被拿起」或「悬浮在主层之上」时，才出现阴影——而且阴影必须暖（带 hue 38），不是中性灰。

### Shadow Vocabulary
- **lift-bead** (`box-shadow: 0 2px 0 #c5bcae, 0 6px 16px -4px rgba(168, 130, 90, 0.18)`)：颗粒/卡片的"被拿起"态。第一层是硬投影模拟颗粒底面，第二层是柔晕染。
- **lift-card** (`box-shadow: 0 8px 24px -8px rgba(168, 130, 90, 0.22), 0 2px 6px -2px rgba(168, 130, 90, 0.12)`)：模态、悬浮卡片、Trending 图鉴选中态。
- **inset-paper** (`box-shadow: inset 0 1px 2px rgba(168, 130, 90, 0.10)`)：输入框、按下态——纸张被压陷的微凹感。

### Named Rules

**The Lift-On-Touch Rule.**
卡片、按钮、颗粒在 rest 态都是 flat。只有 hover/focus/active 时才浮起或下沉。这是"手把它拿起来"的物理对应。

**The Warm-Shadow Rule.**
所有阴影使用 `rgba(168, 130, 90, X)` 暖色调，禁止 `rgba(0,0,0,X)`。冷阴影会让纸面瞬间变成"屏幕"。

## 5. Components

### Buttons

- **Shape:** 圆角 12px（control radius）。**不要胶囊（999px）也不要直角（4px 以下）**——12px 是颗粒被切片的曲率。
- **Primary:** terracotta-clay 实心 + paper-cream-bg 文字 + 14px×24px padding + Label typography。
- **Hover/Focus:** 切到 terracotta-deep + 微微 `translateY(-1px)` + lift-bead 阴影。Focus 用 `outline: 2px solid moss-pine; outline-offset: 3px`。
- **Ghost:** paper-cream-soft 背景 + ink-warm 文字 + 1px edge-sand 边线。Hover 切到 paper-cream-deep。用于次级动作（"返回首页"、"作品馆"）。
- **Tertiary:** 仅 ink-soft 文字 + 下划线 hover 出现。用于不强调的链接。

### Chips（色卡 / 色号 / 标签）

- **Style:** paper-cream-bg 背景 + ink-warm 文字 + 1px edge-sand 边 + 10px 圆角 + bead-num 字。
- **Bead Color Chip（色卡专用）:** 左侧是一个 12px 圆形真实色块（来自 beadColors），右侧是色号。整个 chip 像一张迷你色卡。
- **State:** 选中态——边线变 terracotta-clay 2px + 内含一个小角标 ✓（SVG，不是 emoji）。

### Cards / Containers

- **Corner:** 20px (`rounded.card`)。比当前的 `rounded-lg` (8px) 显著更圆润。
- **Background:** paper-cream-soft（不是 white）。
- **Shadow:** rest 态 flat，没有阴影。**hover 才出现 lift-card**，配合 `transform: translateY(-2px)` 200ms ease-out。
- **Border:** 1px edge-sand。
- **Padding:** 24px（lg spacing），密集卡片可降到 16px。
- **No Nested Cards.** 卡片内不允许再放卡片——这是 impeccable 绝对禁令之一。

### Inputs / Fields

- **Style:** paper-cream-bg 凹陷 + inset-paper shadow + 12px 圆角 + 1px edge-sand 边。
- **Focus:** 边线切到 moss-pine 2px + outline-offset 0。inset 阴影保留。
- **Placeholder:** ink-soft，但 opacity 0.7，避免和真值混淆。
- **Error:** 边线 alert-rose + 错误说明在字段下方（不是顶部汇总）。

### Navigation (Header)

- **Style:** paper-cream-bg 背景 + 1px edge-sand 底边线。**不要全宽 sticky white header**。
- **Logo:** 一组 4 个真实拼豆颗粒（terracotta + moss + honey + ink-warm）拼成 2×2 方阵 + ZCOOL KuaiLe "拼豆模拟器"。**取代当前的圆角小绿方块图标**。
- **Actions:** Ghost 按钮，icon 必须是 SVG（Lucide 即可）；徽章用 honey-bead 圆点，不用红点。
- **Mobile:** 主标题保留全字，actions 收缩为 icon-only 但保留 aria-label。

### Bead Canvas Grid（签名组件）

这是产品的灵魂区域。即使是 brand 首页，也要 above-the-fold 出现一小块作为"窥看预览"。
- **Cell:** 圆形（不是方形！）+ bead-shadow 1px 描边 + 微微的 inner highlight 模拟塑料反光。
- **Empty Cell:** paper-cream-deep 圆形空槽，边缘 inset-paper 阴影模拟"插孔"。
- **Coordinate Labels:** bead-num 字号在外圈整数刻度位置。

### Trending Pattern Card（首页核心展示）

- **Container:** 16px 圆角 + paper-cream-soft 背景 + 1px edge-sand。
- **Image:** 占满顶部 4:3 区域 + 3px paper-cream-bg 内边框（像照片白边）。
- **Title:** Title typography + 1 行 ink-warm。
- **Meta:** Bead-num 字 + ink-soft，例："32×32 · 86 色"。
- **Hover:** 整张卡 lift-card + Image 区有一个小 honey-bead 角标 "看图纸 →"。

## 6. Do's and Don'ts

### Do:
- **Do** 用 `paper-cream-bg #f6efe2` 作为页面主背景；卡片用 `paper-cream-soft #f1e9da`。背景三阶让深度自然。
- **Do** 用 `terracotta-clay #c8552f` 作主品牌色，覆盖 30-50% 强调表面（CTA、徽章、hero 字色）。
- **Do** 用 ZCOOL KuaiLe 做中文 display 字体——它本身就是圆头方块字，像一颗颗豆子拼出来。
- **Do** 把作品馆图标换成 SVG（Lucide 的 `LayoutGrid` 或 `Library`），徽章用 honey-bead `#e9b347` 圆点。
- **Do** 把 logo 换成 4 颗真实拼豆颗粒拼成 2×2 方阵（terracotta + moss + honey + ink-warm 各一颗）。
- **Do** 卡片圆角统一 20px，按钮 12px，色卡 chip 10px。
- **Do** Hero 区放一段松弛欢迎文案（"今天想拼点什么？" 而不是 "上传图片或抽取盲盒，开始今天的拼豆作品"）。
- **Do** Trending 图鉴允许密集瀑布流——富足是品牌人格之一。
- **Do** 阴影用 `rgba(168, 130, 90, X)` 暖调，不用纯黑。
- **Do** 让 BeadCanvas 的格子是**圆形**（不是方形），呼应真实拼豆。
- **Do** 中文行高 ≥1.65，正文最大行宽 35-50 中文字。

### Don't:
- **Don't** 用 `#ffffff` 或 `#000000`。**任何**位置都不允许。
- **Don't** 用 shadcn/ui 默认的中性灰 token（`oklch(0.95 0.0058 264.53)` 系）——清空 globals.css 里的默认 token，全部用 paper-cream + ink-warm 系替换。
- **Don't** 用 `text-transform: uppercase` + `letter-spacing > 0.02em` 的 eyebrow 小标签（当前的 "Bead Studio" 是反面教材，删掉）。
- **Don't** 用 emoji 作图标（🏛️ 🚀 ⚙️）。Lucide SVG 替换全部。
- **Don't** 用 `background-clip: text` 渐变文字。强调用色或字号，不用渐变。
- **Don't** 用 `border-left: 4px solid color` 这种侧边色条作为强调（impeccable 绝对禁令）。
- **Don't** 嵌套卡片（卡片里再放卡片）。已经是绝对禁令。
- **Don't** 用 glassmorphism / backdrop-blur 装饰。这里是纸张工坊不是玻璃展厅。
- **Don't** 加任何 Notion AI 风的 3D 圆胖插画 / 透明卷起人物 / 渐变色彩斑斓万能贴画。空状态用真实拼豆颗粒阵列，不用插画。
- **Don't** 用霓虹粉、Comic Sans、心心圆圈装饰。"女生向"靠暖色和圆角达成，不靠廉价符号。
- **Don't** 在首页用 SaaS 三段式（hero + features grid + footer CTA）。这是手作工坊不是产品官网。
- **Don't** 让 BeadCanvas 的格子是方形——拼豆是圆的，UI 必须承认这个物质事实。
