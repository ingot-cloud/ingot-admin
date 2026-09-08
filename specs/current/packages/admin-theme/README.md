# 管理台主题

## 概述

`@ingot/admin-core` 提供可安装的管理台主题协议。应用在启动时选择一套主题，统一配色、字体、间距、圆角和主布局编排；主题不是业务插件，不注册菜单、路由或权限。

## 相关源码

- [packages/admin-core/src/theme](../../../../packages/admin-core/src/theme)
- [packages/admin-core/src/layouts/main/IndexPage.vue](../../../../packages/admin-core/src/layouts/main/IndexPage.vue)
- [apps/admin/src/main.ts](../../../../apps/admin/src/main.ts)
- [scripts/lib/scaffold-app.mjs](../../../../scripts/lib/scaffold-app.mjs)
- [examples/admin-theme](../../../../examples/admin-theme)
- [docs/theme-development.md](../../../../docs/theme-development.md)

## 对接接口

本能力不新增后端接口。前端公开协议见归档 [DESIGN.md](../../../changes/archive/2026/20260908-packages-admin-theme/DESIGN.md)。

## 变更记录

| 日期 | 变更 ID | 说明 |
|------|---------|------|
| 2026-09-08 | [20260908-packages-remove-global-route-tabs](../../../changes/archive/2026/20260908-packages-remove-global-route-tabs/) | 移除全局路由 Tabs：配置开关、环境变量、`InTabs` 与主题 `parts.tabs` |
| 2026-09-08 | [20260908-packages-admin-theme](../../../changes/archive/2026/20260908-packages-admin-theme/) | 主题协议、默认主题、布局宿主、create-app 接入与独立主题示例 |
