# RBAC 与数据授权

## 概述

登录后并行拉取用户资料、可见菜单和有效权限；侧栏只认菜单树，页内按钮只认已展开的具体权限码。平台配置应用资源目录、菜单可见性与权限树；平台 / 组织角色分别维护各自来源层的数据范围规则。

## 相关源码

- [packages/admin-core/src/stores/modules/auth.ts](../../../../packages/admin-core/src/stores/modules/auth.ts)
- [packages/admin-core/src/api/common/user.ts](../../../../packages/admin-core/src/api/common/user.ts)
- [packages/admin-core/src/router/guard/userGuard.ts](../../../../packages/admin-core/src/router/guard/userGuard.ts)
- [packages/admin-core/src/directive/authDirective.ts](../../../../packages/admin-core/src/directive/authDirective.ts)
- [packages/admin-core/src/net/failure.ts](../../../../packages/admin-core/src/net/failure.ts)
- [plugins/platform/src/pages/config/app](../../../../plugins/platform/src/pages/config/app)
- [plugins/platform/src/pages/config/menu](../../../../plugins/platform/src/pages/config/menu)
- [plugins/platform/src/pages/config/permission](../../../../plugins/platform/src/pages/config/permission)
- [plugins/platform/src/pages/config/role](../../../../plugins/platform/src/pages/config/role)
- [plugins/org/src/pages/contacts/role](../../../../plugins/org/src/pages/contacts/role)
- [plugins/org/src/pages/contacts/auth](../../../../plugins/org/src/pages/contacts/auth)

## 对接接口

- [20260911-base-rbac-data-authorization API](../../../changes/archive/2026/20260911-base-rbac-data-authorization/API.md)

## 变更记录

| 日期 | 变更 ID | 说明 |
|------|---------|------|
| 2026-09-12 | [20260911-base-rbac-data-authorization](../../../changes/archive/2026/20260911-base-rbac-data-authorization/) | 权限与菜单解耦；应用资源目录；角色按来源层维护 data-rules |
