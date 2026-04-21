# 如何将 GeminiBot 转换为安卓 APK 或 Windows EXE

## 🚀 关键：本地环境初始化
导出代码并解压后，请务必先运行：
```bash
npm install
```
这会安装所有必要的构建工具（包括 `vite`, `capacitor`, `electron` 等）。

---

## 第二步：在您的电脑上准备环境
确保您的电脑已安装：
1. [Node.js](https://nodejs.org/) (推荐 LTS 版本)
2. **对于安卓 (APK)**: 安装 [Android Studio](https://developer.android.com/studio)
3. **对于 Windows (EXE)**: 无需额外大型软件

---

## 第三步：运行生成命令

在解压后的代码根目录下打开终端（命令行），运行以下命令：

### 生成 Windows 安装包 (.exe)
我已为您配置好了 Electron 入口环境，并修复了路径加载问题（Base Path Fix）。

```bash
# 运行打包命令
npm run build:windows
```
打包完成后，您会在 **`dist-electron`** 文件夹中找到您的 Windows 便携式程序（Portable EXE）。

**💡 提示：如果运行后仍然是空白内容？**
1. 请确保您在本地运行过 `npm run build`。
2. 检查 `vite.config.ts` 中的 `base: './'` 配置是否生效（我已为您添加）。
3. 您可以尝试在 `electron-main.cjs` 中取消注释 `win.webContents.openDevTools();` 行，然后重新打包，运行程序后在开发者工具中查看 Console 错误。

### 生成安卓安装包 (.apk)
```bash
# 初始化配置（仅需运行一次）
npx cap init GeminiBot com.geminibot.app --web-dir=dist
npx cap add android

# 编译并生成 APK
npm run build:android
npx cap open android
```
这会打开 Android Studio，您只需在其中点击 **Build > Build Bundle(s) / APK(s) > Build APK(s)** 即可。

---

## 提示：为什么不直接在云端生成？
由于真正的 APK 和 EXE 编译过程非常重（需要数 GB 的 Android SDK 或 Windows 虚拟机环境），目前市面上所有的在线开发工具（包括 AI Studio）都无法直接提供一键生成的二进制文件。PWA 模式是目前在云端能提供给您的最接近原生的方案。
