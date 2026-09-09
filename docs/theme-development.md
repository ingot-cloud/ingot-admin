# 管理台主题开发

管理台主题是无业务页面的视觉与壳层扩展，不是 `InAdminPlugin`。它不注册菜单、路由、权限或服务。每个 App 在启动时选择一套主题，不提供运行时切换主题 ID 的接口。使用者仍可切换浅色 / 深色。

## 接入

```ts
import { bootstrapAdminApp, defaultAdminTheme } from "@ingot/admin-core";
import "@ingot/admin-core/style.css";
import { projectTheme } from "@company/admin-theme";
import "@company/admin-theme/style.css";
import "uno.css";

await bootstrapAdminApp({
  ...appOptions,
  theme: projectTheme,
});
```

- `apps/admin` 与 create-app 生成应用显式传入 `defaultAdminTheme`
- 未配置 `theme` 的应用回退到同一套默认主题
- 协议版本不匹配时，在挂载前抛出包含主题标识的中文错误
- `apps/auth` 不使用本协议

回退默认外观：改回 `theme: defaultAdminTheme`，并移除自定义主题 CSS。

## 协议

使用 `defineAdminTheme` 声明主题：

| 字段         | 约定                                                             |
| ------------ | ---------------------------------------------------------------- |
| `id`         | 必填，小写 kebab-case，写入 `html[data-in-theme]`                |
| `apiVersion` | 必填，首版为 `1`                                                 |
| `name`       | 必填，展示名，不据此生成选择 UI                                  |
| `tokens`     | 可选，`light` / `dark` 两组对 `InThemeTokens` 的部分覆盖         |
| `shell`      | 可选，布局编排组件；缺省使用默认 Shell                           |
| `parts`      | 可选，`header` / `navigation` / `breadcrumb` / `footer` |

浅色覆盖不会复制到深色。某一模式省略时沿用该模式的默认值。未知 Token 键会被拒绝。主题私有变量写在附加 CSS 里，使用自己的前缀，不要占用 `--in-*`。

## Token 与明暗

- 核心 `style.css` 仍提供默认变量、结构样式和 `--in-* → --el-*` 单向映射
- 解析后的主题通过 `#in-admin-theme-vars` 输出，选择器为 `html[data-in-theme="id"]` 与 `html.dark[data-in-theme="id"]`
- 附加 CSS 用同样的 `data-in-theme` 限定作用域，不要重定义公共 Token，也不要反向覆盖 Element Plus 映射
- body 内 Teleport 弹层继承根 Token
- 明暗使用 `useAdminTheme()`，存储键仍是 `vueuse-color-scheme`，支持跟随系统与显式偏好
- 初始化不依赖暗色开关先挂载

公开 Token 名见 `IN_THEME_TOKEN_NAMES` 与 [设计 Token](../packages/admin-core/src/styles/README.md)。

## 布局宿主与 Shell

`layout.main` 渲染公开组件 `InAdminThemeLayout`。主题不参与 layout registry，也不能用同名覆盖 `layout.main`。

```text
layout.main → InAdminThemeLayout → 主题 Shell → 插槽区域与页面内容
项目自定义 layout → 自己的结构，或主动组合 InAdminThemeLayout
```

`simple` / `iframe` / `external` 第一版没有替换入口。

Shell 接收 `header`、`navigation`、`breadcrumb`、`content`、`footer`。核心按设置决定是否提供区域内容；Shell 只负责排列。必须把 `content` 恰好渲染一次，并给出有界、可收缩的空间。内容内部滚动、KeepAlive 和滚动恢复由核心内容组件负责。

`useAdminShell()` 提供只读导航模式、展开状态、可见性、已授权菜单、品牌信息、顶栏 `header` 配置，以及切换 / 关闭导航。不要另建菜单数据源，也不要绕过设置开关重新显示被隐藏的区域。自定义顶栏可用 `resolveHeaderConfig` 解析响应式配置。详细字段与示例见 [顶栏 APP 配置](./app-header.md)。

窄屏（默认 1024px）必须消费 overlay 状态，提供收起 / 展开入口，并处理遮罩与 Escape。

App `shellSlots`：

- `header-start` / `header-end` → 顶栏部件
- `sidebar-top` / `sidebar-bottom` → 导航部件

自定义 parts 必须转交这些插槽；未配置时为空。

可复用的公开部件：`InAppBar`、`InMenu`、`InLogo`、`InBreadcrumb`、`InCopyright`、`InSwitchDark`、`InUserDropdown`、`DefaultAdminShell`、`InAdminThemeLayout`。

独立 layout 只继承全局 Token。需要主题外壳时：

```vue
<template>
  <InAdminThemeLayout />
</template>
<script setup lang="ts">
import { InAdminThemeLayout } from "@ingot/admin-core";
</script>
```

## 发布主题包

主题包必须交付编译后的 JS、类型声明、CSS 和资源：

- `exports` 提供 `.` 与 `./style.css`
- `sideEffects` 包含 CSS
- `vue` 与 `@ingot/admin-core` 放 `peerDependencies`，避免打进第二份运行时
- 消费端不扫描主题源码生成 UnoCSS
- 禁止依赖 `@/`、`@ingot/admin-core/src` 或其它内部路径

完整示例见 [examples/admin-theme](../examples/admin-theme/README.md)。
