# 详情查看/编辑标准

## 概述

`@ingot/admin-core` 提供实体详情的查看/编辑壳层：默认只读、底部进入编辑、编辑中离开需确认。通讯录成员详情为试点；添加成员仍走独立创建表单。

## 相关源码

- [packages/admin-core/src/components/drawer/InDetailDrawer.vue](../../../../packages/admin-core/src/components/drawer/InDetailDrawer.vue)
- [packages/admin-core/src/components/detail/InDetailIdentity.vue](../../../../packages/admin-core/src/components/detail/InDetailIdentity.vue)
- [packages/admin-core/src/components/description](../../../../packages/admin-core/src/components/description)
- [packages/admin-core/src/hooks/components/useDetailEditSession.ts](../../../../packages/admin-core/src/hooks/components/useDetailEditSession.ts)
- [packages/admin-core/src/utils/confirm-dialog.ts](../../../../packages/admin-core/src/utils/confirm-dialog.ts)
- [packages/admin-core/src/components/InDialog.vue](../../../../packages/admin-core/src/components/InDialog.vue)
- [packages/admin-core/src/styles/dropdown.css](../../../../packages/admin-core/src/styles/dropdown.css)
- [plugins/org/src/pages/contacts/user](../../../../plugins/org/src/pages/contacts/user)
- [packages/admin-core/src/components/README.md](../../../../packages/admin-core/src/components/README.md)
- 壳层与列表基础设施见 [admin-ui-foundation](../admin-ui-foundation/)

## 对接接口

本能力不新增后端接口。成员试点复用组织用户 CRUD，副本见归档 [API.md](../../../changes/archive/2026/20260907-packages-detail-edit-pattern/API.md)。

## 变更记录

| 日期 | 变更 ID | 说明 |
|------|---------|------|
| 2026-09-07 | [20260907-packages-detail-edit-pattern](../../../changes/archive/2026/20260907-packages-detail-edit-pattern/) | 详情查看/编辑壳层、公共确认框与操作下拉；通讯录成员试点 |
