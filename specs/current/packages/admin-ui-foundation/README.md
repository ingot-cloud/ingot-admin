# 管理台 UI 基础设施

## 概述

`@ingot/admin-core` 提供管理台设计 Token、主布局壳层，以及列表/双栏/表格工具等共享组件。业务页面只组合这些能力，不复制顶栏、侧栏或同义基础控件。

## 相关源码

- [packages/admin-core/src/styles](../../../../packages/admin-core/src/styles)
- [packages/admin-core/src/layouts](../../../../packages/admin-core/src/layouts)
- [packages/admin-core/src/layouts/widgets/InMenu.vue](../../../../packages/admin-core/src/layouts/widgets/InMenu.vue)
- [packages/admin-core/src/components/InPageFrame.vue](../../../../packages/admin-core/src/components/InPageFrame.vue)
- [packages/admin-core/src/components/InPageHeader.vue](../../../../packages/admin-core/src/components/InPageHeader.vue)
- [packages/admin-core/src/components/container/InSplitLayout.vue](../../../../packages/admin-core/src/components/container/InSplitLayout.vue)
- [packages/admin-core/src/components/table](../../../../packages/admin-core/src/components/table)
- [packages/admin-core/src/components/select/InPicker.vue](../../../../packages/admin-core/src/components/select/InPicker.vue)
- [packages/admin-core/src/components/table/InFilterPanel.vue](../../../../packages/admin-core/src/components/table/InFilterPanel.vue)
- [packages/admin-core/src/components/README.md](../../../../packages/admin-core/src/components/README.md)
- [packages/admin-core/src/theme](../../../../packages/admin-core/src/theme)
- [docs/theme-development.md](../../../../docs/theme-development.md)

## 对接接口

本能力不新增后端接口。字段显示设置使用前端 `user + tableId` 持久化。声明见归档 [API.md](../../../changes/archive/2026/20260904-packages-admin-ui-foundation/API.md)。

## 变更记录

| 日期 | 变更 ID | 说明 |
|------|---------|------|
| 2026-09-07 | [20260904-packages-admin-ui-foundation](../../../changes/archive/2026/20260904-packages-admin-ui-foundation/) | Token、白色顶栏、画布侧栏、contained 滚动、可折叠双栏、表格工具与操作收纳、固定底部「收起导航」 |
| 2026-09-08 | [20260908-packages-admin-theme](../../../changes/archive/2026/20260908-packages-admin-theme/) | 固定视觉值与顶栏/侧栏排布成为默认主题基线；`layout.main` 改为主题宿主 |
