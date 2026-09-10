# 开发者中心

## 概述

`apps/dev-portal`（`@ingot/dev-portal`）是「Ingot 开发者中心」：VitePress 文档站、组件/模块参考、隔离演示，以及本地 App／插件／主题创建向导。静态部署只读；写入仓库仅本地 `pnpm dev:portal` 可用。

## 相关源码

- [apps/dev-portal](../../../../apps/dev-portal)
- [scripts/lib/scaffold](../../../../scripts/lib/scaffold)
- [scripts/create-app.mjs](../../../../scripts/create-app.mjs)
- [scripts/create-plugin.mjs](../../../../scripts/create-plugin.mjs)
- [scripts/create-theme.mjs](../../../../scripts/create-theme.mjs)
- [docs/create-app.md](../../../../docs/create-app.md)
- [docs/getting-started.md](../../../../docs/getting-started.md)

## 对接接口

无后端业务接口。本地开发工具契约见归档 [API.md](../../../changes/archive/2026/20260909-packages-dev-portal/API.md)。配置覆盖见同目录 [CONFIGURATION.md](../../../changes/archive/2026/20260909-packages-dev-portal/CONFIGURATION.md)。

## 变更记录

| 日期 | 变更 ID | 说明 |
|------|---------|------|
| 2026-09-10 | [20260909-packages-dev-portal](../../../changes/archive/2026/20260909-packages-dev-portal/) | 门户更名、VitePress 文档与演示、三类创建向导、从源码生成组件/模块参考 |
