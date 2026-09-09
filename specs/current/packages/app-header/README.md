# 顶栏 APP 配置

## 概述

默认顶栏分为品牌、大类菜单、搜索、功能小部件、用户入口五区。APP 在启动配置中声明内容与动作，`admin-core` 负责布局、默认功能、分组浮层、宽度收纳，以及未替换搜索组件时的本地菜单搜索。

## 相关源码

- [apps/admin/src/header.ts](../../../../apps/admin/src/header.ts)
- [packages/admin-core/src/layouts/widgets](../../../../packages/admin-core/src/layouts/widgets)
- [packages/admin-core/src/layouts/widgets/search](../../../../packages/admin-core/src/layouts/widgets/search)
- [docs/app-header.md](../../../../docs/app-header.md)

## 对接接口

本能力不新增后端接口。前端公开配置见归档：

- [20260908-packages-app-header/DESIGN.md](../../../changes/archive/2026/20260908-packages-app-header/DESIGN.md)
- [20260909-packages-app-header-search/DESIGN.md](../../../changes/archive/2026/20260909-packages-app-header-search/DESIGN.md)

## 变更记录

| 日期 | 变更 ID | 说明 |
|------|---------|------|
| 2026-09-09 | [20260908-packages-app-header](../../../changes/archive/2026/20260908-packages-app-header/) | 五区顶栏、APP `header` 配置、分组折列与宽度收纳 |
| 2026-09-09 | [20260909-packages-app-header-search](../../../changes/archive/2026/20260909-packages-app-header-search/) | 默认搜索按已授权菜单本地过滤、历史与常用入口 |
