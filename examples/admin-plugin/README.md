# 管理台插件示例

本目录是**不参与默认构建**的完整源码插件示例，演示如何声明页面、Store、全局组件、指令和静态菜单，再注册到 `apps/admin`。

不要把本示例加入 `pnpm-workspace.yaml`。日常开发请把正式业务插件放在 `plugins/`。

## 关键文件

| 文件 | 作用 |
|------|------|
| [package.json](./package.json) | 源码 exports，指向 `src/plugin.ts` |
| [src/plugin.ts](./src/plugin.ts) | 插件 manifest：pages、components、directives、staticMenus、dependsOn |
| [src/pages/demo/overview/IndexPage.vue](./src/pages/demo/overview/IndexPage.vue) | 概览页 |
| [src/pages/demo/shared-state/IndexPage.vue](./src/pages/demo/shared-state/IndexPage.vue) | 共享 Pinia 示例 |
| [src/pages/demo/components/IndexPage.vue](./src/pages/demo/components/IndexPage.vue) | 全局组件与指令示例 |
| [src/stores/shared.ts](./src/stores/shared.ts) | 插件 Store |
| [src/components/BizExampleDemoBadge.vue](./src/components/BizExampleDemoBadge.vue) | 插件全局组件 |
| [src/directives/demoHighlight.ts](./src/directives/demoHighlight.ts) | 插件指令 |

## 在 admin 中试用

1. 将本目录复制为 `plugins/example`（或直接开发正式插件）。
2. 把复制后的目录加入 workspace：确认 `pnpm-workspace.yaml` 已包含 `plugins/*`。
3. 在 `apps/admin/package.json` 添加依赖，例如 `"@ingot/example-admin-plugin": "workspace:*"`。
4. 在 [`apps/admin/src/plugins.ts`](../../apps/admin/src/plugins.ts) 导入并注册 `exampleAdminPlugin`。
5. 运行 `pnpm install` 与 `pnpm dev:admin`。
6. 试用完成后从清单和 dependencies 同时删除，避免未使用插件进入构建。

完整约定见 [插件开发](../../docs/plugin-development.md) 与 [开发模式](../../docs/development-model.md)。

## 类型检查

仓库根目录：

```bash
pnpm check:examples
```
