# 如何将 GeminiBot 转换为安卓 APK 或 Windows EXE

您已经成功配置了 PWA，可以在浏览器中直接安装。如果您需要真正的 **.apk** 或 **.exe** 安装包，请按照以下步骤操作：

## 第一步：导出代码
点击应用右上角设置图标（齿轮），选择 **“Export to ZIP”**（导出为 ZIP），并将文件解压到您的电脑上。

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
```bash
# 安装必要工具
npm install electron electron-builder --save-dev

# 运行打包命令
npm run build:windows
```
打包完成后，您会在 `dist` 文件夹中找到您的 Windows 程序。

### 生成安卓安装包 (.apk)
```bash
# 安装 Capacitor 工具
npm install @capacitor/core @capacitor/cli @capacitor/android

# 初始化配置
npx cap init GeminiBot com.geminibot.app --web-dir=dist

# 添加安卓平台支持
npx cap add android

# 编译并生成 APK
npm run build:android
npx cap open android
```
这会打开 Android Studio，您只需在其中点击 **Build > Build Bundle(s) / APK(s) > Build APK(s)** 即可。

---

## 提示：为什么不直接在云端生成？
由于真正的 APK 和 EXE 编译过程非常重（需要数 GB 的 Android SDK 或 Windows 虚拟机环境），目前市面上所有的在线开发工具（包括 AI Studio）都无法直接提供一键生成的二进制文件。PWA 模式是目前在云端能提供给您的最接近原生的方案。
