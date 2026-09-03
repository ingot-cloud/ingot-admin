# 插件开发

官方业务插件位于 `plugins/`，由 App 在构建期直接编译源码。插件没有 `dev`、`preview`、独立 HTML 或 production build。

## 官方插件

| 目录 | 包名 | 导出 | plugin id |
|------|------|------|-----------|
| `plugins/platform` | `@ingot/platform-plugin` | `platformPlugin` | `ingot-platform` |
| `plugins/security` | `@ingot/security-plugin` | `securityPlugin` | `ingot-security` |
| `plugins/org` | `@ingot/org-plugin` | `orgPlugin` | `ingot-org` |
| `plugins/member` | `@ingot/member-plugin` | `memberPlugin` | `ingot-member` |

Dashboard 属于 platform 插件，canonical key 为 `platform.dashboard`。

菜单 `view_path` 编码、迁库与落库约定见 [菜单 view_path](./menu-view-path.md)。

## 包清单

```json
{
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/plugin.ts",
      "import": "./src/plugin.ts"
    },
    "./package.json": "./package.json"
  }
}
```

- workspace 公共包放 `dependencies`
- Vue、Vue Router、Pinia、Element Plus 等 framework 放 `peerDependencies`，并由宿主去重
- scripts 只保留 `type-check`、`test:unit`、`lint`

Vite 使用 `defineInSourcePluginConfig`。`@/` 指向插件自身 `src`，由宿主 Vite 按 importer 解析，不与其它插件冲突。

## 目录与四件套

业务页面放在插件 `src/pages/`，保持 `IndexPage.vue` + `table.ts` + `useOps.ts` + `components/`。

API、models、stores、业务组件跟随所属插件，不要跨插件复制。只有稳定的无页面能力才提升到 `packages/admin-common` 或更底层 package。

## 页面注册

```ts
pages: definePluginPages({
  modules: import.meta.glob("./pages/**/*.vue"),
  sourceRoot: "./pages",
  canonicalPrefix: "org",
})
```

只为 `IndexPage.vue` 生成 semantic key。动态菜单的 `view_path` 必须使用 canonical key。布局用插件的 `layouts` 字段同样扫描 `layouts/**/IndexPage.vue`。

## 可选能力

`InAdminPlugin` 还可以声明：

- `layouts`：布局 `IndexPage` 扫描结果，与 pages 共用查找表
- `components`：全局业务组件
- `directives`：指令
- `staticMenus`：前端静态菜单（示例或无后端菜单的页面）
- `dependsOn`：插件依赖，官方插件依赖 `ingot-admin-core`
- `install`：额外 Vue 安装逻辑

完整示例见 [examples/admin-plugin](../examples/admin-plugin/README.md)。

## 注册到 admin

1. 确认插件在 `plugins/` 且 workspace 包含 `plugins/*`
2. `apps/admin/package.json` 添加 `"@ingot/<name>-plugin": "workspace:*"`
3. 在 `apps/admin/src/plugins.ts` 导入并加入 `adminPlugins`
4. `pnpm install`
5. 后端按 appCode / OAuth Client 返回对应菜单

移除时按相反顺序操作，并运行 `pnpm check:boundaries`。可用 Vite 模块图或 production build 确认未选择插件未进入产物。

## 测试与边界

```bash
pnpm --filter @ingot/org-plugin type-check
pnpm --filter @ingot/org-plugin test:unit
pnpm type-check:plugins
pnpm check:plugins
pnpm check:boundaries
```

禁止：

- 官方插件互相 import 或互相声明 dependency
- 插件 import App
- 使用遗留 `@base`
- 在 package 中注册业务页面或 `InAdminPlugin`

需要复用时进入有明确职责的 package，而不是让插件直接依赖另一个官方插件。
