# iOS App 构建与上架指南

> 这份文档是写给「在 Mac 上接手 iOS 工程」的人看的。Windows 端已经做完了所有
> Capacitor 配置和 native 桥接代码，Mac 上只需要照下面 12 步把 iOS 工程创建出来、
> 跑起来、提交审核。

---

## 0. 一次性环境准备（Mac，5–10 分钟）

```bash
# 1. Xcode：去 App Store 搜 "Xcode" 安装（约 8 GB，需要 Apple ID）
xcode-select --install            # 装 command line tools

# 2. CocoaPods：iOS 原生依赖管理器
sudo gem install cocoapods

# 3. Node 18+（如果没装）
brew install node

# 4. Claude Code（如果想接着用 AI 改代码）
npm install -g @anthropic-ai/claude-code
```

---

## 1. 拉项目 + 装依赖

```bash
git clone https://github.com/oarngeftansy/pindouxiangmuwangzhan.git
cd pindouxiangmuwangzhan
npm install
```

确认 Capacitor 已经在 `package.json` 里：

```bash
grep '"@capacitor' package.json
# 应该看到 @capacitor/core, @capacitor/ios, @capacitor/cli,
# @capacitor/haptics, @capacitor/share, @capacitor/filesystem,
# @capacitor/status-bar, @capacitor/splash-screen
```

---

## 2. 第一次创建 iOS 工程

```bash
npm run ios:add
# 等价于 npx cap add ios
```

这会生成 `ios/` 目录（包含 Xcode 工程 + CocoaPods 配置）。**第一次跑会下载所有 native pods，约 2–5 分钟**。

> ⚠️ `ios/` 目录会进 git。Pods 已经在 .gitignore 里排除，每次 clone 后需要 `cd ios/App && pod install` 重新装一次。

---

## 3. 构建 Web 资产 + 同步到 iOS

```bash
npm run ios:sync
# 等价于 npm run build && npx cap sync ios
# 把 build/ 目录的 React 产物拷进 ios/App/App/public/，并刷新 native plugin 链接
```

**以后每次改了 React 代码都要跑这条**才能在 iOS 看到新版本。

---

## 4. 打开 Xcode

```bash
npm run ios:open
# 自动跑 sync 后再 `npx cap open ios`
```

Xcode 启动，工程是 `App.xcworkspace`。

---

## 5. Xcode 里的一次性配置

### 5.1 选择团队（签名）

- Target `App` → `Signing & Capabilities`
- `Team`: 选你的 Apple ID（个人开发账号免费，但只能装真机 7 天）
  - 想上 App Store：需要 [Apple Developer Program](https://developer.apple.com/programs/) **$99/年**

### 5.2 改 Display Name（可选）

- Target `App` → `General` → `Display Name`: `拼豆模拟器`（已经在 capacitor.config.ts 设了，Xcode 会读取）
- Bundle Identifier: `com.pindou.simulator` ← 默认值。如果要换，**记得也改 `capacitor.config.ts` 保持一致**

### 5.3 加权限说明（Info.plist）

Capacitor Share / Filesystem 插件会读写相册。Xcode 自动加了，但**保险起见手动检查** `ios/App/App/Info.plist`：

```xml
<key>NSPhotoLibraryAddUsageDescription</key>
<string>保存你的拼豆作品到相册</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>分享你的拼豆作品需要访问相册</string>
```

---

## 6. 跑模拟器（最快验证）

- Xcode 顶部选 `iPhone 15 Pro` 等模拟器 → 按 ▶️ 运行
- 第一次约 30–60 秒，之后 5–15 秒
- 验证：
  - 启动后**不再有浏览器地址栏**
  - 完成一颗豆子时手机有触感反馈（模拟器没震动硬件但 Haptics API 不会报错）
  - 点"下载"应该弹出 iOS 原生分享菜单（不是浏览器下载）

## 7. 跑真机（重要：触感反馈只有真机才有）

- iPhone 用数据线连 Mac，按提示信任电脑
- Xcode 顶部 device selector 选你的 iPhone → ▶️
- 第一次要**在 iPhone 设置里信任 developer 证书**：
  - 设置 → 通用 → VPN与设备管理 → 找到你的 Apple ID → 信任

---

## 8. App 图标（上架前必做）

- 准备一张 **1024×1024 PNG**（**不要透明背景**，App Store 拒绝）
- 在线工具一键生成所有尺寸：https://www.appicon.co
- 把生成的 `AppIcon.appiconset` 整个替换 `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

设计建议（跟 Web 一致）：
- 用 4 颗豆子 2×2 方阵（terracotta + moss + honey + ink）
- 圆角 iOS 自动加，**素材本身不要圆角**
- 背景纯色（paper-cream-bg `#f6efe2`）或纯白

---

## 9. App 启动画面（Splash）

`capacitor.config.ts` 已经配了 paper-cream-bg + 1.2 秒显示。**不需要单独 logo**。

如果想要 logo，丢一张 PNG 到 `ios/App/App/Assets.xcassets/Splash.imageset/`。

---

## 10. 截图（上架要 5–10 张）

App Store Connect 要这些尺寸：

- **6.7"** (iPhone 14 Pro Max, 1290×2796): **必传**
- **6.5"** (iPhone 11 Pro Max, 1242×2688): 必传
- **5.5"** (iPhone 8 Plus, 1242×2208): 必传
- iPad 12.9": 如果支持 iPad 就传

最快路径：模拟器跑起来 → 选对应机型 → `Cmd+S` 截屏 → 自动是正确尺寸

---

## 11. App Store Connect 准备

去 https://appstoreconnect.apple.com（需要 Developer Program）：

1. My Apps → 新建 App
2. 填：
   - **名字**: 拼豆模拟器
   - **副标题**: 在线拼豆工坊（可选）
   - **Bundle ID**: 选你刚创建的（`com.pindou.simulator`）
   - **SKU**: 任意，建议 `PINDOU-SIM-001`
   - **类别**: Lifestyle 或 Games → Casual
   - **年龄**: 4+
3. 上传：图标、截图、描述、关键词、隐私政策 URL
4. 价格：免费

**隐私政策 URL** ← 没的话写一份很简单的（"我们不收集任何个人信息，所有数据存在你设备本地"），放到 GitHub Pages 或类似免费托管。

---

## 12. Archive + 提交审核

Xcode：
- 顶部 device selector 选 `Any iOS Device (arm64)`
- 菜单 `Product → Archive`
- 5–10 分钟后 Organizer 窗口弹出
- 选 archive → `Distribute App` → `App Store Connect` → `Upload`
- 等几分钟，App Store Connect 会收到这个 build
- 回 App Store Connect → 选这个 build → 提交审核

**审核时间**：通常 **1–3 天**。可能被拒原因：
- "App 只是网站包装"（Apple 2.5.6 条款）→ 解释你加了触感反馈、原生分享、原生状态栏等
- 隐私政策不全
- 截图不符合实际界面

被拒了在 App Store Connect 里看具体理由，按要求改完再提交，每次审核 1–2 天。

---

## 13. 改 React 代码后的循环

```bash
npm run ios:sync   # 重新打包 + 同步
# Xcode 里按 ▶️ 重新运行
```

或者一步到位：

```bash
npm run ios:run    # sync 后直接在连接的设备/模拟器上跑
```

---

## 故障速查

| 症状 | 解决 |
|---|---|
| `pod install` 报错 | `sudo gem uninstall cocoapods && sudo gem install cocoapods` |
| Xcode 显示 "No Provisioning Profile" | Signing 里勾上 "Automatically manage signing" |
| 模拟器白屏 | 看 Xcode console 是否有 JS error；可能 Vite build 失败 |
| Haptics 不响 | 模拟器没震动硬件，必须真机测 |
| Share 菜单不弹 | 看 Info.plist 是否有 NSPhotoLibraryAddUsageDescription |
| 真机装好打不开 | 设置 → 通用 → VPN与设备管理 → 信任 |

---

## 14. 持续开发的建议

- **代码改在 React 那边**（src/），iOS 工程只配 signing/icon/splash
- 想加 native 特性（推送通知、相机等），找 Capacitor 插件：https://capacitorjs.com/docs/plugins/official
- Web 和 iOS 同步发版：每次 `npm run build` → 推 GitHub Pages（CI 自动）+ `npm run ios:sync` 在 Xcode 重新 archive

---

## 名词速查

- **Capacitor**: 把 Web 应用包成原生 iOS/Android app 的框架，由 Ionic 团队维护
- **CocoaPods**: iOS 的 npm，管 native 依赖（Pods）
- **Bundle ID**: App 的全球唯一 ID，反域名格式（`com.pindou.simulator`）
- **Archive**: Xcode 把 app 编译并打包成可分发文件的过程
- **TestFlight**: Apple 官方的 beta 测试平台（上架前用这个测）
- **Provisioning Profile**: 苹果发给开发者的"允许这个 app 在这台设备运行"凭证

---

每次发现新坑就回来补到 14 节后面。
