# 设计：App 约定本地插件与自动注入

## 技术方案

App 增加一份冻结的 `src/app-plugin.ts`，只用 `import.meta.glob` 把约定目录交给 `defineAppLocalPlugin`。加文件不必改该文件。

两条注入通道保持分离：

- 运行时：`pages` / `layouts` / `components` / `directives` → `AdminPluginRegistry` → `app.component` / `app.directive`
- 构建期：`hooks` / `stores` → `unplugin-auto-import`；管理台 App（`enforceAppConventions: true`）另加约定守卫，禁止 `In*` / `El*` 与保留导出名。`apps/auth` 不开此守卫。

组件文件名必须 `Biz*`。`In*` 仍只来自 admin-core。冲突策略为失败，不提供覆盖。

Store 不进插件 registry。`createAdminPinia` 已安装 `pinia-plugin-persistedstate` 并加上 `storePrefix`；App store 与 core 共用该实例。未写 `persist` 不落盘。

## 对接映射

无新后端接口。菜单仍走现有 `UserMenuAPI` 或可选 `staticMenus`。

| 前端 | 说明 |
|------|------|
| `packages/admin-core/src/plugin/assets.ts` | `definePluginComponents` / `definePluginDirectives` |
| `packages/admin-core/src/plugin/local.ts` | glob 输入 |
| `packages/vite-config/src/app-conventions.ts` | 构建期约定守卫 |
| `apps/admin/src/app-plugin.ts` | admin 约定插件 |
| `scripts/templates/admin-app/src/app-plugin.ts` | 脚手架约定插件 |

## 数据模型

无新增业务模型。页面键规则不变：App 本地 prefix 为 appCode `-` 转 `.`，布局再拼 `.layout`。

## 组件与页面影响

约定目录：

```text
apps/{app}/src/
  app-plugin.ts
  plugins.ts
  pages/**/IndexPage.vue
  layouts/**/IndexPage.vue
  components/**/*.vue
  hooks/**/*.ts
  directives/**/*.ts
  stores/**/*.ts
```

`pages/**/components/` 仍是页面私有，不进全局组件表。

`apps/admin` 只放空目录，不放 Demo。create-app 始终生成约定插件；`withLocalPlugin` 只决定是否保留 Demo 页、示例组件/指令/store 与 `staticMenus`。

## 与 CONSTITUTION 符合性

| 原则 | 符合 | 说明 |
|------|------|------|
| Monorepo 边界 | ✅ | 跨 App 复用仍进 packages / plugins |
| 三层目录 | ✅ | App 只放本部署扩展；官方插件不依赖 App |
| 页面结构 | ✅ | 本地页仍用 IndexPage 四件套 |
| 设计系统 In* | ✅ | App 组件必须 Biz*，In* 冲突失败 |
| 变更流程 | ✅ | 先有 change spec |

## 备选方案

- 仅用 unplugin-vue-components、不走 registry：插件页动态解析与 In* 通道不一致，放弃
- App 同名覆盖 core：已否决，静默换皮会破坏官方插件页面
- App store 默认 persist：已否决，避免敏感字段落入 localStorage
