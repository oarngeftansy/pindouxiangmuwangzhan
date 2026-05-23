# Android APK 构建

## 一键 build（前提：JDK + Android SDK 已装好）

```bash
npm run android:apk
```

输出在 `android/app/build/outputs/apk/debug/app-debug.apk`。

把这个 .apk 文件拷到 Android 手机上点击安装（需要先在系统设置打开"允许未知来源"）。

---

## 第一次环境准备（如果还没装）

### 路径 A：装 Android Studio（简单粗暴，~4 GB）

1. 下载 https://developer.android.com/studio
2. 装上一路 Next 默认
3. 启动一次让它下载 SDK
4. 之后什么也不用配，`npm run android:apk` 直接能跑

### 路径 B：只装 JDK + 命令行 SDK（轻量，~600 MB）

```powershell
# 1. JDK 17
winget install Microsoft.OpenJDK.17

# 2. Android command-line tools（手动下载）
# 去 https://developer.android.com/studio#command-line-tools-only
# 下载 "Command line tools only" Windows zip
# 解压到 C:\Android\sdk\cmdline-tools\latest\

# 3. 设环境变量
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Android\sdk", "User")
[Environment]::SetEnvironmentVariable("Path",
  [Environment]::GetEnvironmentVariable("Path","User") + ";C:\Android\sdk\cmdline-tools\latest\bin;C:\Android\sdk\platform-tools",
  "User")

# 4. 重启 PowerShell，然后下载 SDK 组件
sdkmanager --install "platforms;android-34" "build-tools;34.0.0" "platform-tools"

# 5. 接受所有 license
sdkmanager --licenses
# （一路按 y）
```

---

## 跑到真机 / 模拟器

```bash
# 真机：USB 连上 + 开启 USB 调试模式
npm run android:run
# Capacitor 自动检测连接的设备，build + 安装 + 启动

# 模拟器：需要先在 Android Studio 里创建一个
npm run android:open  # 打开 Android Studio，里面 ▶️
```

---

## 改了 React 代码之后

```bash
npm run android:sync  # build + 复制到 android/
# 然后重新 build APK 或在 Android Studio 里 ▶️
```

---

## 上 Google Play（暂时不做但留个路径）

1. 注册 Google Play Developer 账号（**一次性 $25**，比 Apple 便宜很多）
2. 生成签名 keystore：
   ```bash
   keytool -genkey -v -keystore pindou.keystore -alias pindou -keyalg RSA -keysize 2048 -validity 10000
   ```
3. 在 `android/gradle.properties` 加签名配置
4. `./gradlew bundleRelease` 生成 .aab 文件
5. 上传到 Play Console

详细签名流程：https://capacitorjs.com/docs/android/deploying-to-google-play

---

## 故障速查

| 症状 | 解决 |
|---|---|
| `JAVA_HOME not set` | 装 JDK 17 后设环境变量：`[Environment]::SetEnvironmentVariable("JAVA_HOME","C:\Program Files\Microsoft\jdk-17","User")` |
| `SDK location not found` | 在 `android/local.properties` 加：`sdk.dir=C:\\Android\\sdk` |
| `Gradle build failed: license not accepted` | 跑 `sdkmanager --licenses` 一路 y |
| 真机不识别 | 装 OEM USB driver（华为/小米官网下）+ 手机开发者选项里勾"USB 调试" |
| APK 装到手机后启动闪退 | 看 `adb logcat` 输出，通常是 webDir 配错或 native 插件没 sync |
