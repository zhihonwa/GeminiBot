# Android 版本缺陷修复 - 编码任务

## 任务 1：修复深色外观 CSS 选择器优先级

**文件**：`src/index.css`

**操作**：
1. 将 `@layer base` 中的 `body { @apply bg-[#F8FAFC] text-slate-800 }` 移出 `@layer base`，改为在 `@layer base` 外使用 `html:not(.dark) body` 选择器声明浅色默认样式
2. 将 `.dark body` 选择器改为 `html.dark body`，提高优先级确保覆盖 Tailwind utility class
3. 在 `html.dark body` 中同时设置 `background-color` 和 `color`，并添加 `color-scheme: dark` 声明
4. 在 `html:not(.dark) body` 中添加 `color-scheme: light` 声明

**验收标准**：
- 深色模式下 `html.dark body` 样式能覆盖所有 Tailwind utility 的浅色默认
- 浅色模式下 `html:not(.dark) body` 样式正常
- `color-scheme` 声明使 WebView 原生控件（select、scrollbar）跟随主题

---

## 任务 2：增强 App.tsx 深色模式切换逻辑

**文件**：`src/App.tsx`

**操作**：
1. 在主题切换 `useEffect` 中，除了添加/移除 `dark` 类名和设置 `body.style.backgroundColor` 外，增加设置 `document.documentElement.style.colorScheme`：深色时设为 `'dark'`，浅色时设为 `'light'`
2. 同时设置 `document.body.style.colorScheme` 与 `document.documentElement.style.colorScheme` 一致，确保 Android WebView 双重生效

**验收标准**：
- 切换深色时，`<html>` 元素同时具有 `dark` 类名、`style.colorScheme = 'dark'`
- 切换浅色时，`<html>` 元素移除 `dark` 类名、`style.colorScheme = 'light'`
- 不影响 Windows Electron 环境的现有行为

---

## 任务 3：添加 Capacitor HTTP polyfill 解决 CORS 问题

**文件**：`src/main.tsx`、`capacitor.config.json`

**操作**：
1. 在 `src/main.tsx` 中，在 React 初始化之前，检测是否运行在 Capacitor 原生环境（通过 `window.Capacitor` 是否存在判断）
2. 如果在 Capacitor 环境中，使用 `@capacitor/core` 的 `CapacitorHttp` API 创建一个兼容 `fetch` 签名的函数，覆盖 `window.fetch`
3. polyfill 实现要点：
   - 接收与原生 `fetch` 相同的参数 `(input, init)`
   - 将 `input` 转为字符串 URL
   - 将 `init.headers` 转为 `Record<string, string>` 格式
   - 调用 `CapacitorHttp.request()` 发起请求，传入 `{ url, method, headers, data, responseType: 'text' }`
   - 将返回结果包装为 `Response` 对象（包含 `ok`、`status`、`statusText`、`headers`、`text()`、`json()` 方法）
   - 对于流式请求（`ReadableStream`），需要特殊处理：检测请求头中是否包含流式相关标识，如果是流式请求则回退到原生 fetch（因为 CapacitorHttp 不支持流式响应）
4. 在 `capacitor.config.json` 中添加 `plugins.CapacitorHttp` 配置（如需要）

**验收标准**：
- Android 环境下非流式 API 请求通过原生 HTTP 层发出，绕过 CORS
- 流式请求仍使用原生 fetch（Gemini API 的流式端点已配置 CORS 允许，或通过其他方式处理）
- Windows Electron 环境不受影响（`window.Capacitor` 不存在，polyfill 不生效）
- 如果 `CapacitorHttp` 不可用，优雅降级到原生 fetch

---

## 任务 4：修复复制功能 - 添加多级 fallback 和错误处理

**文件**：`src/components/ChatField.tsx`

**操作**：
1. 重写 `handleCopy` 函数，改为 `async` 函数
2. 实现三级 fallback 复制策略：
   - **第一级**：尝试 `navigator.clipboard.writeText(text)`，如果可用且成功则返回 true
   - **第二级**：如果 `navigator.clipboard` 不可用或调用失败，使用 `document.execCommand('copy')` fallback：创建临时 `<textarea>` 元素，设置 value 为待复制文本，添加到 DOM，选中，执行 `document.execCommand('copy')`，移除临时元素
   - **第三级**：如果前两级都失败，返回 false
3. 修改 UI 反馈逻辑：仅在复制成功时（返回 true）才设置 `setCopiedId(index)` 并启动 2 秒定时器恢复；复制失败时不切换图标
4. 所有复制操作包裹在 try-catch 中，防止未处理异常

**验收标准**：
- Android WebView 中点击复制图标，文本成功写入系统剪贴板
- 复制成功时图标切换为勾选，2 秒后恢复
- 复制失败时图标保持复制图标状态，不误导用户
- Windows Electron 中复制行为不受影响

---

## 任务 5：安装 Capacitor Clipboard 依赖（可选增强）

**文件**：`package.json`

**操作**：
1. 安装 `@capacitor/clipboard` 插件：`npm install @capacitor/clipboard`
2. 在 `ChatField.tsx` 的 `handleCopy` 中，在第一级 fallback 之前增加 Capacitor Clipboard 尝试：检测 `window.Capacitor` 是否存在，如果存在则使用 `Clipboard.write({ string: text })` 
3. 调整 fallback 优先级为：Capacitor Clipboard → `navigator.clipboard` → `execCommand('copy')`

**验收标准**：
- Android 原生环境中优先使用 Capacitor Clipboard 插件
- 非 Capacitor 环境中自动跳过，使用标准 API
- 不影响 Windows 版本

---

## 任务 6：验证修复不影响 Windows 版本

**操作**：
1. 确认所有修改在非 Capacitor 环境（`window.Capacitor` 不存在）下不生效
2. 确认 CSS 修改在 Electron/浏览器中表现与修改前一致
3. 确认 `handleCopy` 在标准浏览器环境中仍优先使用 `navigator.clipboard`

**验收标准**：
- Windows 版本深色模式正常
- Windows 版本 API 请求正常
- Windows 版本复制功能正常
