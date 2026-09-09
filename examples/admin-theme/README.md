# 自定义管理台主题示例

本目录是**不参与默认构建**的独立主题包示例。它只依赖 `@ingot/admin-core` 公开接口，演示：

- Token 覆盖（主色、圆角），浅色与深色分别声明
- 替换顶栏展示部件
- 把导航重排到内容区右侧
- 附加 CSS 使用 `html[data-in-theme="example-horizon"]` 作用域
- 独立打包后被消费端引入，而不扫描主题源码生成 UnoCSS

不要把本示例加入 `pnpm-workspace.yaml`。仓库内正式主题位于 [`themes/<id>/`](../../themes/README.md)，也可消费外部 npm 主题包。

## 在 admin 中试用

```ts
import { bootstrapAdminApp } from "@ingot/admin-core";
import { exampleHorizonTheme } from "@ingot/example-admin-theme";
import "@ingot/admin-core/style.css";
import "@ingot/example-admin-theme/style.css";
import "uno.css";

await bootstrapAdminApp({
  ...appOptions,
  theme: exampleHorizonTheme,
});
```

`apps/auth` 不接入本协议。回退默认外观只需改回 `theme: defaultAdminTheme` 并移除示例 CSS。

## 独立 layout

项目自定义 layout 不会被主题替换。需要主题外壳时，主动组合公开宿主：

```vue
<template>
  <InAdminThemeLayout />
</template>
<script setup lang="ts">
import { InAdminThemeLayout } from "@ingot/admin-core";
</script>
```

完整约定见 [主题开发](../../docs/theme-development.md)。

## 类型检查与打包验证

```bash
pnpm check:examples
```
