# 设计：移除全局路由 Tabs

## 技术方案

删除「已打开页面」标签栏整条链路，而不是把开关默认关掉。页内局部 Tab 与全局路由 Tab 本来就是两套实现，只拆后者。

拆除顺序：配置 UI → 启动契约 → 布局宿主与 Shell 槽位 → `InTabs` / tabs store → 专用 Token → 文档。

## 对接映射

无后端接口。

| 前端 | 说明 |
|------|------|
| `InGlobalSetting.vue` | 去掉 Tabs 开关 |
| `runtime.ts` / `plugin/types.ts` / `stores/modules/app.ts` | 去掉 `showTabs` |
| `apps/admin`、`scripts/templates/admin-app`、`scaffold-app.mjs` | 去掉 env 与 settings 映射 |
| `InAdminThemeLayout.vue`、`DefaultAdminShell.vue`、`HorizonShell.vue`、`theme/types.ts`、`useAdminShell.ts` | 去掉 tabs 区域 |
| `components/InTabs.vue`、`stores/modules/tabs.ts` | 删除 |
| `defaultTokens.ts` / `tokens.ts` / `styles/tokens.css` | 删除 `--in-tabs-*` 三项 |

## 数据模型

- 删除 `InSettingsConfig.showTabs`、`InResolvedSettingsConfig.showTabs`
- 删除路由 Tab 用的 `stores/types.TabItem`（保留 `components/tabs/types.TabItem` 给 `InBizTabs`）
- 删除 `RouteMeta.isAffix`（仅全局 Tab 钉住不可关使用）

本地持久化 `__ingot__app.state.showTabs` 与 `__ingot__tabs` 停止读写，不做迁移。

## 组件与页面影响

- 公开导出不再包含 `InTabs`、`useTabsStore`
- 主题 `parts` 仅 header / navigation / breadcrumb / footer
- `useRefreshPage`、KeepAlive、`InBizTabs` 不动

## 与 CONSTITUTION 符合性

| 原则 | 符合 | 说明 |
|------|------|------|
| Monorepo 边界 | ✅ | 改动集中在 `packages/admin-core`，App/脚手架同步启动契约 |
| 三层目录 | ✅ | 不把业务页写回 admin 宿主 |
| 类型安全 | ✅ | 删除死字段，不引入 any |
| 清洁代码 | ✅ | 直接删除，不注释保留 |
| UnoCSS | ✅ | 随 `InTabs` 样式一并删除 |

## 备选方案

- 仅默认关闭开关：仍要维护组件、store、主题槽位，拒绝。
- 保留空的 Shell `#tabs` 给自定义主题：会留下死协议，拒绝。
