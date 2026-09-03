# 设计：canonical viewPath 与菜单视图选择器

## 技术方案

1. `definePluginPages` 只为 `IndexPage.vue` 生成 `{canonicalPrefix}.{suffix}`。
2. `InAdminPlugin.layouts` 与 `pages` 一并注册到 `resolvePage`；registry 记录 `kind`。core 扫描 `layouts/{slot}/IndexPage.vue` → `layout.{slot}`。宿主须 `optimizeDeps.exclude` `@ingot/admin-core`，避免预构建改写 glob 键。
3. `appCode` 与本地插件工厂共用：`toViewPrefix(appCode) = appCode.replaceAll("-", ".")`。
4. 菜单编辑调用 `listRegisteredViews()`，按 kind / pluginId 分组。
5. 提交 `customViewPath: true` 与所选 `viewPath`。

无新增 API 模块。菜单仍走既有 `CreateAppMenuAPI` / `UpdateAppMenuAPI` / `UserMenuAPI`。

## 对接映射

| 接口 | 前端 | 说明 |
|------|------|------|
| 既有菜单 CRUD | `MenuEditDrawer.vue` 提交 `viewPath` | wire shape 不变 |
| `GET .../auth/user/menus` | `transformMenu` → `resolvePage(viewPath)` | 只认 canonical |

## 数据模型

- `RegisteredView`：`key`、`kind: "page" | "layout"`、`pluginId`
- `PageLayoutViewPath` 值改为 `layout.main` 等
- `PLUGIN_UNAVAILABLE_PAGE_KEY = "common.plugin.unavailable"`（目录 `plugin-unavailable` 按公式把 `-` 编成 `.`）

## 组件与页面影响

- [`packages/admin-core/src/plugin/pages.ts`](../../../../../packages/admin-core/src/plugin/pages.ts)
- [`packages/admin-core/src/plugin/registry.ts`](../../../../../packages/admin-core/src/plugin/registry.ts)
- [`packages/admin-core/src/corePlugin.ts`](../../../../../packages/admin-core/src/corePlugin.ts)
- [`plugins/platform/src/pages/config/app/detail/components/MenuEditDrawer.vue`](../../../../../plugins/platform/src/pages/config/app/detail/components/MenuEditDrawer.vue)
- 四官方 `plugin.ts`；create-app 模板

## 与 CONSTITUTION 符合性

| 原则 | 符合 | 说明 |
|------|------|------|
| 三层目录与单向依赖 | ✅ | 选择器 API 放 admin-core；platform 只依赖 packages |
| 页面四件套 | ✅ | 布局改为 IndexPage 入口，不改业务页结构 |
| 类型安全 | ✅ | 无 any |
| 不提前改 current | ✅ | 归档时写入 current |

## 备选方案

- 在 `InAdminAppOptions` 直接挂 pages：与 plugin 契约重复，不采用。
- 保留 `@/` 别名：用户明确要求删除。
