# Iconify 离线打包

## 概述

`InIcon` 在开发环境可走 Iconify API 预览任意 `prefix:name`；生产只使用构建打进产物的本地数据，内网不请求 `api.iconify.design`。开发预览成功的 SVG 写入 App 的 `iconify-offline.used.json`，该文件须提交。

## 相关源码

- [docs/icons.md](../../../../docs/icons.md)
- [packages/vite-config](../../../../packages/vite-config)
- [packages/admin-core/src/components/InIcon.vue](../../../../packages/admin-core/src/components/InIcon.vue)
- [packages/admin-core/src/layouts/widgets/InFullscreen.vue](../../../../packages/admin-core/src/layouts/widgets/InFullscreen.vue)
- [apps/admin/iconify-offline.used.json](../../../../apps/admin/iconify-offline.used.json)

## 对接接口

本能力不新增后端接口。菜单 `icon` 仍是后端下发的字符串。构建与收集约定见归档 [DESIGN.md](../../../changes/archive/2026/20260909-packages-iconify-offline/DESIGN.md)。

## 变更记录

| 日期 | 变更 ID | 说明 |
|------|---------|------|
| 2026-09-09 | [20260909-packages-iconify-offline](../../../changes/archive/2026/20260909-packages-iconify-offline/) | 开发在线预览、生产离线包、used.json 收集；全屏改用 `bi:fullscreen` |
