# GeminiBot - 专业级 AI 智能助手

GeminiBot 是一款基于 Google Gemini 系列模型构建的现代化、全能型 AI 对话助手。它不仅提供了极致的网页端体验，还通过 Capacitor 和 Electron 实现了 **Android (APK)** 与 **Windows (EXE)** 的跨平台支持。

## 📥 下载与安装

您可以前往 [Releases 页面](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/releases) 下载最新版本的安装包：

- **Windows 用户**: 下载 `.exe` 便携版，直接运行即可。
- **Android 用户**: 下载 `.apk` 文件并在手机上安装。
- **Web/浏览器**: 访问 [在线地址](https://YOUR_APP_URL) 并通过浏览器菜单“安装应用”使用 PWA 版。

---

## ✨ 核心特性

- **🚀 深度集成 Gemini**: 支持 `gemini-1.5-pro`、`gemini-2.0-flash` 等最新模型，提供精准、详尽的回答。
- **🌐 实时联网搜索**: 借助 Gemini 的 Google Search Grounding 能力，实时获取互联网最新资讯，拒绝“幻觉”。
- **🎙️ 智能语音输入**: 集成浏览器原生语音识别技术，解放双手，像聊天一样与 AI 沟通。
- **📱 全平台覆盖**:
  - **Web 端**: 支持 PWA，可直接安装至手机桌面或任务栏。
  - **Android**: 支持打包为原生 APK 安装包。
  - **Windows**: 支持打包为便携式绿色 EXE 程序。
- **🎨 极致细节设计**:
  - 基于 **Tailwind CSS v4** 的现代化 UI。
  - 完美支持 **深色模式 (Dark Mode)**，包含系统级颜色同步。
  - 可自定义的字体大小、模型参数（Temperature, Top P, Top K）。
- **💾 本地持久化**: 聊天记录和设置项均保存在本地浏览器缓存中，保护隐私且加载迅速。

---

## 🛠️ 技术仓库

- **框架**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **构建工具**: [Vite 6](https://vitejs.dev/)
- **样式**: [Tailwind CSS v4](https://tailwindcss.com/)
- **动画**: [Motion](https://motion.dev/)
- **图标**: [Lucide React](https://lucide.dev/)
- **原生支持**: [Capacitor](https://capacitorjs.com/) (Android) & [Electron](https://www.electronjs.org/) (Windows)

---

## 🚀 快速开始

### 1. 克隆与安装

```bash
# 克隆仓库（假设您已同步至 GitHub）
git clone <your-repo-url>
cd GeminiBot

# 安装依赖
npm install
```

### 2. 本地开发

```bash
npm run dev
```
打开浏览器访问 `http://localhost:3000` 即可开始开发。

---

## 📦 打包与发布

### Web 端 (PWA)
```bash
npm run build
```
编译后的静态文件位于 `dist` 目录。

### Windows 桌面端 (.exe)
```bash
# 生成便携版 EXE
npm run build:windows
```
打包结果位于 `dist-electron` 目录。我们已修复了 Electron 下的路径加载及深色模式适配问题。

### Android 安卓端 (.apk)
1. 确保安装了 [Android Studio](https://developer.android.com/studio)。
2. 运行同步命令：
```bash
npm run build:android
```
3. 使用 Android Studio 打开 `android` 目录并进行编译打包。

---

## 💡 配置说明

- **API Key**: 应用默认使用环境变量中的 Gemini Key。您也可以在应用内的“设置”面板中输入自己的 API Key。
- **深色模式**: 在设置中切换后，应用会自动调整 `color-scheme`，确保滚动条等系统元素也同步变色。

---

## 🤖 自动化发布 (GitHub Actions)

我已经为您配置好了 GitHub Actions。现在您不需要在本地编译，只需通过推送到标签即可触发云端自动构建：

1.  **提交代码**: 确保本地代码已全部提交并推送到 GitHub。
2.  **创建标签并推送**:
    ```bash
    git tag v1.0.0
    git push origin v1.0.0
    ```
3.  **查看结果**: 前往 GitHub 仓库的 **Actions** 选项卡。您会看到两个正在运行的任务：
    - `build-windows`: 会在 Windows 虚拟机中编译 `.exe`。
    - `build-android`: 会在 Ubuntu 虚拟机中配置 Java 环境并编译 `.apk`。
4.  **自动发布**: 任务完成后，GitHub 会自动创建一个名为 `v1.0.0` 的 Release，并将生成的安装包附件关联上去。

---

## 📄 开源协议

本项目采用 MIT 协议开源。

*注意：本应用仅供学习与研究使用，使用 Gemini API 请遵守 Google 的相关政策。*