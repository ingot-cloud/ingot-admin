# App 插件化与共享包

## 概述

业务页只存在于各 App（如 `ingot-admin`）。App 可独立部署，也可作为官方插件被其他 App 组合进同一 SPA。跨 App 工具合并为 `@ingot/shared`；壳层与菜单混合配置在 `@ingot/admin-core`。本地用 `apps/create-app` 勾选官方插件生成新 App。

## 相关源码

- [apps/admin/src/plugin.ts](../../../../apps/admin/src/plugin.ts)
- [packages/shared](../../../../packages/shared)
- [packages/admin-core](../../../../packages/admin-core)
- [packages/vite-config/src/official-apps.ts](../../../../packages/vite-config/src/official-apps.ts)
- [apps/target-project](../../../../apps/target-project)
- [apps/create-app](../../../../apps/create-app)
- [scripts/lib/scaffold-app.mjs](../../../../scripts/lib/scaffold-app.mjs)
- [docs/composable-admin-runtime.md](../../../../docs/composable-admin-runtime.md)
- [docs/create-app.md](../../../../docs/create-app.md)

## 对接接口

菜单接口仍为 `GET /api/pms/v1/auth/user/menus`，结构不变。插件与静态菜单约定见归档 [API.md](../../../changes/archive/2026/20260831-app-plugins-shared-scaffold/API.md)。

## 变更记录

| 日期 | 变更 ID | 说明 |
|------|---------|------|
| 2026-08-31 | [20260831-app-plugins-shared-scaffold](../../../changes/archive/2026/20260831-app-plugins-shared-scaffold/) | App-as-plugin、`@ingot/shared`、静态+动态菜单、create-app |
