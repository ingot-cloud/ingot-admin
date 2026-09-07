# 管理台 UI 体验

## 概述

四个官方业务插件的列表、双栏、设置、概览和工具页使用同一套页面原型与操作分层。迁移只改呈现，不改接口、权限、路由或菜单。

## 相关源码

- [plugins/platform/src/pages](../../../../plugins/platform/src/pages)
- [plugins/org/src/pages](../../../../plugins/org/src/pages)
- [plugins/member/src/pages](../../../../plugins/member/src/pages)
- [plugins/security/src/pages](../../../../plugins/security/src/pages)
- 共享组件契约：[packages/admin-core/src/components/README.md](../../../../packages/admin-core/src/components/README.md)
- 试点标准页：[plugins/org/src/pages/contacts/user](../../../../plugins/org/src/pages/contacts/user)

## 对接接口

本能力不新增后端接口。组织成员列表允许按 `UserQueryDTO.enabled` 筛选（全部不传，正常 `true`，已暂停 `false`）。声明见归档 [API.md](../../../changes/archive/2026/20260904-common-admin-ui-rollout/API.md)。各域原接口仍链到对应 capability 的归档 change。

## 变更记录

| 日期 | 变更 ID | 说明 |
|------|---------|------|
| 2026-09-07 | [20260904-common-admin-ui-rollout](../../../changes/archive/2026/20260904-common-admin-ui-rollout/) | 25 个官方插件页面迁入统一原型；成员管理为列表标准 |
