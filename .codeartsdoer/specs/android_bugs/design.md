# **1. 实现模型**

## **1.1 上下文视图**

三个缺陷均发生在 Android Capacitor WebView 环境中，修复范围集中在 Web 层代码（React/TypeScript），不涉及 Android 原生层修改。

```plantuml
left to right direction
rectangle "GeminiBot Web 层" as Web {
  rectangle "App.tsx\n(主题控制)" as Theme
  rectangle "ChatField.tsx\n(复制功能)" as Copy
  rectangle "gemini.ts\n(API 调用)" as API
  rectangle "main.tsx\n(Polyfill/初始化)" as Main
  rectangle "index.css\n(全局样式)" as CSS
}
cloud "Gemini API\n(HTTPS)" as GeminiAPI
rectangle "Capacitor WebView\n(Android 运行环境)" as WebView
rectangle "Android 剪贴板" as Clipboard

WebView --> Web : 加载运行
Theme --> CSS : 切换 dark 类名
Copy --> Clipboard : 写入文本
API --> GeminiAPI : fetch 请求
```

## **1.2 服务/组件总体架构**

修复方案不引入新组件，仅修改现有文件：

| 文件 | 修改内容 | 涉及缺陷 |
|------|----------|----------|
| `src/index.css` | 修复深色模式 CSS 选择器优先级 | Bug #1 深色外观 |
| `src/App.tsx` | 增强深色模式切换逻辑，确保 color-scheme 生效 | Bug #1 深色外观 |
| `src/lib/gemini.ts` | 为 Android WebView 添加 CORS 代理方案 | Bug #2 API 请求 |
| `capacitor.config.json` | 配置 Capacitor HTTP 插件或 server 设置 | Bug #2 API 请求 |
| `src/components/ChatField.tsx` | 添加剪贴板写入 fallback 机制 | Bug #3 复制功能 |

## **1.3 实现设计文档**

### Bug #1：深色外观无效

**根因分析**：

1. **CSS 选择器优先级问题**：`index.css` 中 `.dark body` 选择器的优先级低于 Tailwind 生成的 `@apply` 规则。`@layer base` 中的 `body { @apply bg-[#F8FAFC] text-slate-800 }` 会被 Tailwind 编译为高优先级的 utility 规则，而 `.dark body` 在 `@layer base` 之外但优先级不足以覆盖 Tailwind 的 utility class。在 Android WebView 中，CSS 优先级计算可能更严格，导致深色样式被浅色覆盖。

2. **缺少 `color-scheme` 声明**：未设置 `color-scheme: dark`，导致 Android WebView 的原生 UI 元素（如 select 下拉框、scrollbar、表单控件）不跟随深色模式。

3. **`<html>` 元素 dark 类可能未正确传播**：Capacitor WebView 的 `<html>` 元素可能在初始化时被重置，导致 `classList.add('dark')` 不持久。

**修复方案**：

- **方案 A（CSS 优先级修复）**：将 `.dark body` 样式从 `@layer base` 外移入，并使用 `!important` 或更高优先级选择器（如 `html.dark body`）确保覆盖。同时将浅色默认样式也改为在 `html:not(.dark) body` 下声明，避免冲突。
- **方案 B（color-scheme 声明）**：在深色模式时设置 `document.documentElement.style.colorScheme = 'dark'`，浅色时设为 `'light'`，使 WebView 原生控件适配深色。
- **方案 C（data 属性双保险）**：同时使用 `class="dark"` 和 `data-theme="dark"` 双重机制，在 CSS 中用 `html.dark` 和 `html[data-theme="dark"]` 并列选择器，确保至少一种机制生效。

**最终选择**：方案 A + B 组合。方案 C 过度工程化，方案 A 和 B 已足够覆盖 Android WebView 场景。

### Bug #2：API 请求 "Failed to fetch"

**根因分析**：

1. **CORS 跨域拦截（最可能的原因）**：Capacitor WebView 的页面源为 `capacitor://localhost` 或 `http://localhost`，而 Gemini API 的端点为 `https://generativelanguage.googleapis.com`。浏览器/WebView 的同源策略会拦截跨域请求。在 Windows Electron 中，Electron 的 `BrowserWindow` 默认不强制 CORS（Chromium 的 `--disable-web-security` 在 file:// 协议下隐式生效），而 Capacitor WebView 严格遵守 CORS 策略。

2. **`@google/genai` SDK 内部使用 fetch**：SDK 内部通过 `fetch()` 发起请求，在 Capacitor WebView 中受 CORS 限制。

**修复方案**：

- **方案 A（Capacitor HTTP 插件）**：安装 `@capacitor-community/http` 或使用 Capacitor 6 内置的 HTTP 功能，通过原生层发起请求绕过 CORS。但这需要修改 `gemini.ts` 的调用方式，侵入性大。

- **方案 B（Capacitor server 配置 + allowNavigation）**：在 `capacitor.config.json` 中配置 `server.allowNavigation` 和 `server.hostname`，但这不能解决 CORS 问题。

- **方案 C（Capacitor 原生 HTTP 插件 polyfill）**：使用 `@capacitor/core` 的 `CapacitorHttp` API 作为 `fetch` 的 polyfill。Capacitor 6 提供了 `CapacitorHttp` 接口，可以在 WebView 层面将 `window.fetch` 替换为原生 HTTP 实现，从而绕过 CORS。这是官方推荐的方式。

**最终选择**：方案 C。在 `main.tsx` 中添加 Capacitor HTTP polyfill，将 `window.fetch` 替换为 `Capacitor.convertFileSrc` 配合 `CapacitorHttp` 的原生请求。具体做法是使用 `@capacitor/core` 的 `CapacitorHttp` 进行请求，在 Android 环境下覆盖全局 `fetch`。

### Bug #3：复制功能不工作

**根因分析**：

1. **`navigator.clipboard.writeText()` 在 Capacitor WebView 中不可用**：该 API 要求页面处于安全上下文（HTTPS 或 localhost）且需要用户授权。Capacitor WebView 的 `capacitor://` 协议可能不被浏览器识别为安全上下文，导致 `navigator.clipboard` 为 `undefined` 或调用时抛出 `DOMException`。

2. **无 fallback 机制**：当前 `handleCopy` 函数直接调用 `navigator.clipboard.writeText(text)`，没有 try-catch，也没有 fallback 方案。如果 API 不可用，操作静默失败，但 UI 仍显示勾选图标（因为 `setCopiedId(index)` 无条件执行）。

**修复方案**：

- **方案 A（Capacitor Clipboard 插件）**：安装 `@capacitor/clipboard` 插件，通过原生层写入剪贴板。这是最可靠的方案，但需要添加新依赖。

- **方案 B（document.execCommand fallback）**：当 `navigator.clipboard` 不可用时，创建临时 `<textarea>` 元素，设置其值为待复制文本，调用 `document.execCommand('copy')`。这是传统 Web 方案，在大多数 WebView 中可用。

- **方案 C（混合方案）**：优先使用 `navigator.clipboard`，失败时 fallback 到 `execCommand('copy')`，再失败时使用 Capacitor Clipboard 插件。添加 try-catch 和错误反馈。

**最终选择**：方案 C（混合方案），但优先使用 Capacitor Clipboard 插件（如果可用），其次 `navigator.clipboard`，最后 `execCommand` fallback。这样在 Android 原生环境中使用最可靠的原生剪贴板，在 Web/Electron 中使用标准 API。同时修复 UI 反馈：仅在复制成功时才切换为勾选图标。

# **2. 接口设计**

## **2.1 总体设计**

本次修复不新增对外接口，仅修改内部实现。所有修改对组件外部接口（props、events）无影响。

## **2.2 接口清单**

| 修改点 | 接口变化 | 说明 |
|--------|----------|------|
| `handleCopy` 函数 | 内部实现变更，签名不变 | 添加 fallback 和错误处理 |
| `sendMessageStream` 函数 | 内部实现不变 | 通过全局 fetch polyfill 间接影响 |
| 主题切换 useEffect | 内部实现增强 | 添加 color-scheme 设置 |

# **4. 数据模型**

## **4.1 设计目标**

本次修复不涉及数据模型变更。`AppSettings` 的 `theme` 字段取值和语义不变。

## **4.2 模型实现**

无变更。现有数据模型完全满足修复需求。
