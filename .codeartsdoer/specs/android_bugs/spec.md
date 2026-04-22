# **1. 组件定位**

## **1.1 核心职责**

本组件负责修复 GeminiBot Android 版本中存在的三个缺陷，实现深色外观生效、API 请求正常发送、复制功能正常工作。

## **1.2 核心输入**

1. 用户在设置界面选择"深色"外观的操作指令
2. 用户输入的 Gemini API Key 及对话消息
3. 用户点击消息复制图标的操作指令

## **1.3 核心输出**

1. 深色外观下界面正确呈现深色主题样式
2. Android 端成功调用 Gemini API 并返回流式对话内容
3. 消息文本成功复制到系统剪贴板

## **1.4 职责边界**

1. 不负责修改 Windows 版本的任何行为（Windows 版本当前一切正常）
2. 不负责新增功能特性，仅修复已有缺陷
3. 不负责修改 Gemini API SDK 的内部实现
4. 不负责修改 Capacitor 或 Android 原生层的构建配置

# **2. 领域术语**

**深色外观**
: 用户在设置界面选择的一种界面主题模式，要求界面背景为深色、文字为浅色，所有 UI 元素均适配深色风格。

**Failed to fetch**
: 浏览器/WebView 中 fetch API 请求失败时抛出的错误类型，通常由网络策略限制、CORS 问题或请求被拦截导致。

**剪贴板**
: 操作系统提供的跨应用文本共享机制，用户可将文本写入剪贴板供其他应用粘贴使用。

**Capacitor WebView**
: Capacitor 框架在 Android 端使用的嵌入式浏览器组件，用于承载 React Web 应用，其行为受 Android 系统安全策略约束。

# **3. 角色与边界**

## **3.1 核心角色**

- Android 用户：在 Android 设备上使用 GeminiBot 应用的终端用户，可切换主题、发送对话、复制消息

## **3.2 外部系统**

- Gemini API：Google 提供的生成式 AI 接口，Android 端需通过 HTTPS 请求访问
- Android 系统：提供 WebView 运行环境、剪贴板服务、网络安全策略

## **3.3 交互上下文**

```plantuml
left to right direction
actor "Android 用户" as User
rectangle "GeminiBot Android" as App {
}
cloud "Gemini API" as API
rectangle "Android 系统" as OS

User --> App : 切换主题 / 发送对话 / 复制消息
App --> API : HTTPS 流式请求
API --> App : 流式响应
App --> OS : 读写剪贴板
OS --> App : WebView 环境 / 网络策略
```

# **4. DFX约束**

## **4.1 性能**

1. 主题切换必须在用户操作后 100ms 内生效
2. API 请求不得因客户端配置问题额外增加延迟

## **4.2 可靠性**

1. 深色外观下所有页面元素必须正确呈现深色样式，无浅色残留
2. API 请求在相同 API Key 和网络条件下，Android 端与 Windows 端行为必须一致
3. 复制操作必须可靠地将文本写入系统剪贴板，成功率 100%

## **4.3 安全性**

1. 不得为解决 API 请求问题而降低安全标准（如禁用所有 CORS 检查）
2. 剪贴板写入不得泄露非用户预期的内容

## **4.4 可维护性**

1. 修复方案应尽量复用现有代码结构，避免引入新的架构复杂度
2. 平台差异处理代码应有清晰注释说明原因

## **4.5 兼容性**

1. 修复必须兼容 Android 10+ 的 WebView 环境
2. 不得影响 Windows 版本的现有正常行为

# **5. 核心能力**

## **5.1 深色外观修复**

### **5.1.1 业务规则**

1. **深色类名生效规则**：When 用户选择深色外观，the GeminiBot Android shall 在文档根元素上正确添加 `dark` 类名，并确保所有 Tailwind `dark:` 变体样式生效

   a. 验收条件：[用户在设置中选择深色] → [所有界面元素背景变深色、文字变浅色，无浅色残留]

2. **深色样式完整覆盖规则**：While 深色外观处于激活状态，the GeminiBot Android shall 确保所有组件（侧边栏、聊天区域、设置弹窗、输入框）均呈现深色样式

   a. 验收条件：[深色模式下浏览所有界面区域] → [每个区域均无浅色背景或深色文字的视觉异常]

3. **禁止项**：禁止仅修改部分组件的深色样式而遗漏其他组件

   a. 验收条件：[深色模式下检查所有组件] → [无任何组件存在浅色残留]

### **5.1.2 交互流程**

```plantuml
actor "Android 用户" as User
participant "GeminiBot Android" as App
participant "Android WebView" as WebView

User -> App : 点击"深色"按钮
App -> WebView : 设置 document.documentElement.classList.add('dark')
App -> WebView : 设置 body.style.backgroundColor = '#0f172a'
WebView -> App : CSS dark: 变体样式生效
App -> User : 界面呈现深色外观
```

### **5.1.3 异常场景**

1. **WebView 不响应类名变化**

   a. 触发条件：旧版 Android WebView 忽略动态 class 变更

   b. 系统行为：通过 JS 直接设置 body 背景色作为兜底

   c. 用户感知：界面背景仍能变为深色，但部分元素可能未完全适配

2. **Tailwind dark 变体未编译**

   a. 触发条件：构建配置遗漏 darkMode 设置或 CSS 未正确打包

   b. 系统行为：dark 类名添加后无对应 CSS 规则匹配

   c. 用户感知：仅背景色变化，文字和组件颜色未切换

## **5.2 API 请求修复**

### **5.2.1 业务规则**

1. **API 请求可达规则**：When 用户在 Android 端发送对话消息，the GeminiBot Android shall 成功向 Gemini API 发起 HTTPS 请求并接收流式响应

   a. 验收条件：[使用有效 API Key 在 Android 端发送消息] → [正常收到 AI 回复，无 "Failed to fetch" 错误]

2. **跨平台一致性规则**：While 使用相同的 API Key 和网络环境，the GeminiBot Android shall 与 Windows 版本产生相同的 API 请求结果

   a. 验收条件：[相同 Key + 相同消息在两端发送] → [两端均成功返回相同内容]

3. **禁止项**：禁止通过硬编码 API Key 或绕过安全检查来解决问题

   a. 验收条件：[代码审查] → [无硬编码 Key，无安全策略降级]

### **5.2.2 交互流程**

```plantuml
actor "Android 用户" as User
participant "GeminiBot Android" as App
participant "Capacitor WebView" as WebView
cloud "Gemini API" as API

User -> App : 输入消息并发送
App -> WebView : 调用 @google/genai SDK
WebView -> API : HTTPS 流式请求
API -> WebView : 流式响应
WebView -> App : 返回文本块
App -> User : 实时显示 AI 回复
```

### **5.2.3 异常场景**

1. **CORS 策略拦截**

   a. 触发条件：Capacitor WebView 的源地址（capacitor://localhost）与 Gemini API 服务器不同源，且 API 未返回允许的 CORS 头

   b. 系统行为：WebView 拦截跨域请求，抛出 "Failed to fetch"

   c. 用户感知：显示 "Failed to fetch" 错误提示

2. **网络权限缺失**

   a. 触发条件：Android 应用未声明 INTERNET 权限或网络安全配置不允许明文/HTTPS 请求

   b. 系统行为：请求被系统拒绝

   c. 用户感知：显示网络错误提示

3. **API Key 未正确传递**

   a. 触发条件：Android 端 localStorage 或环境变量读取异常导致 API Key 为空

   b. 系统行为：SDK 使用空 Key 发起请求

   c. 用户感知：显示认证错误

## **5.3 复制功能修复**

### **5.3.1 业务规则**

1. **剪贴板写入规则**：When 用户点击消息的复制图标，the GeminiBot Android shall 将该消息的完整文本内容写入系统剪贴板

   a. 验收条件：[点击复制图标] → [系统剪贴板包含该消息的完整文本，可在其他应用中粘贴验证]

2. **复制反馈规则**：While 复制操作完成后，the GeminiBot Android shall 将复制图标切换为勾选图标并持续 2 秒

   a. 验收条件：[复制成功后] → [图标变为勾选，2 秒后恢复为复制图标]

3. **禁止项**：禁止在复制失败时仍显示勾选图标误导用户

   a. 验收条件：[复制操作失败] → [图标保持复制图标状态，不切换为勾选]

### **5.3.2 交互流程**

```plantuml
actor "Android 用户" as User
participant "GeminiBot Android" as App
participant "Android 系统" as OS

User -> App : 点击消息复制图标
App -> OS : 调用剪贴板 API 写入文本
OS -> App : 返回写入结果
App -> User : 图标切换为勾选（2秒）
```

### **5.3.3 异常场景**

1. **Clipboard API 不可用**

   a. 触发条件：Android WebView 不支持 navigator.clipboard API 或权限被拒绝

   b. 系统行为：使用 fallback 机制（如 Capacitor Clipboard 插件或 execCommand）完成复制

   c. 用户感知：复制仍然成功，无异常提示

2. **Clipboard API 权限被拒**

   a. 触发条件：WebView 安全策略禁止当前上下文访问剪贴板

   b. 系统行为：捕获权限错误，尝试 fallback 方案

   c. 用户感知：复制成功或显示"复制失败"提示

# **6. 数据约束**

## **6.1 主题设置**

1. **theme**：取值必须为 `'light'` 或 `'dark'`，持久化存储于 localStorage

2. **fontSize**：取值必须为 `'sm'`、`'md'` 或 `'lg'`

## **6.2 API 配置**

1. **apiKey**：非空字符串，长度大于 0，由用户在设置界面输入

2. **baseUrl**：可选字符串，为空时使用 Gemini API 默认地址

## **6.3 剪贴板内容**

1. **content**：非空字符串，为用户点击复制时对应消息的完整文本内容
