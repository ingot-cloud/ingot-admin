# App 插件化与共享包

## 概述

仓库按 apps / plugins / packages 三层组织。官方业务能力是 `plugins/` 下的源码插件（platform、security、org、member），不可独立运行。`apps/admin` 是默认通用后台 composition root，在 `src/plugins.ts` 构建期静态注册所选插件。跨插件工具在 `@ingot/shared`；HTTP 传输在 `@ingot/http-client`；壳层、菜单混合、Query 与通用组件在 `@ingot/admin-core`；跨域只读租户/Client 选择器在 `@ingot/admin-common`。需要独立 appCode、品牌或部署流水线时，用 `apps/create-app` 生成新 App。

## 相关源码

- [apps/admin](../../../../apps/admin)
- [apps/admin/src/plugins.ts](../../../../apps/admin/src/plugins.ts)
- [plugins/platform](../../../../plugins/platform)
- [plugins/security](../../../../plugins/security)
- [plugins/org](../../../../plugins/org)
- [plugins/member](../../../../plugins/member)
- [packages/admin-common](../../../../packages/admin-common)
- [packages/admin-core](../../../../packages/admin-core)
- [packages/http-client](../../../../packages/http-client)
- [packages/shared](../../../../packages/shared)
- [packages/vite-config/src/official-plugins.ts](../../../../packages/vite-config/src/official-plugins.ts)
- [apps/create-app](../../../../apps/create-app)
- [scripts/lib/scaffold-app.mjs](../../../../scripts/lib/scaffold-app.mjs)
- [examples/admin-plugin](../../../../examples/admin-plugin)
- [docs/development-model.md](../../../../docs/development-model.md)
- [docs/plugin-development.md](../../../../docs/plugin-development.md)
- [docs/app-development.md](../../../../docs/app-development.md)
- [docs/composable-admin-runtime.md](../../../../docs/composable-admin-runtime.md)
- [docs/create-app.md](../../../../docs/create-app.md)
- [docs/menu-view-path.md](../../../../docs/menu-view-path.md)

## 对接接口

菜单接口仍为 `GET /api/pms/v1/auth/user/menus`，结构不变。插件与静态菜单约定见归档 [20260831 API.md](../../../changes/archive/2026/20260831-app-plugins-shared-scaffold/API.md)。本能力无新增后端接口。

拆分设计见 [20260902-packages-admin-feature-app-split DESIGN.md](../../../changes/archive/2026/20260902-packages-admin-feature-app-split/DESIGN.md)。三层架构见 [20260902-packages-admin-plugin-layering DESIGN.md](../../../changes/archive/2026/20260902-packages-admin-plugin-layering/DESIGN.md)。viewPath 编码与迁库见 [20260902-packages-view-path-canonical](../../../changes/archive/2026/20260902-packages-view-path-canonical/) 与 [docs/menu-view-path.md](../../../../docs/menu-view-path.md)。

## 变更记录

| 日期 | 变更 ID | 说明 |
|------|---------|------|
| 2026-08-31 | [20260831-app-plugins-shared-scaffold](../../../changes/archive/2026/20260831-app-plugins-shared-scaffold/) | App-as-plugin、`@ingot/shared`、静态+动态菜单、create-app |
| 2026-09-02 | [20260902-packages-admin-feature-app-split](../../../changes/archive/2026/20260902-packages-admin-feature-app-split/) | 拆成 platform/security/org/member 四个官方插件；`admin-common`；canonical 页面键与 legacy 别名 |
| 2026-09-02 | [20260902-packages-admin-plugin-layering](../../../changes/archive/2026/20260902-packages-admin-plugin-layering/) | apps/plugins/packages 三层；官方能力改为源码插件；admin 为唯一默认后台；删除 target-project |
| 2026-09-03 | [20260902-packages-view-path-canonical](../../../changes/archive/2026/20260902-packages-view-path-canonical/) | 去掉 `@/` 与 `ingot.` 前缀；布局扫描 `layout.*`；菜单编辑下拉选视图；create-app 与 appCode 同源 |
| 2026-09-03 | [20260903-packages-app-convention-local-plugin](../../../changes/archive/2026/20260903-packages-app-convention-local-plugin/) | App 约定目录本地插件；组件/hook 自动注入；重名失败 |
| 2026-09-04 | [20260903-packages-network-query-modernization](../../../changes/archive/2026/20260903-packages-network-query-modernization/) | `@ingot/http-client` 与 TanStack Query；服务端状态见 [network-query](../network-query/) |
