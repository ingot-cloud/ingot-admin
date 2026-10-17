# 成员与部门

组织管理下「成员与部门」目录再拆「成员」「部门」两个子页面：成员对齐通讯录人员页，部门对齐通讯录部门页。部门人数读后端 `memberCount`。

## 概述

租户管理员在独立路由维护成员与部门，不再把部门操作堆在成员页左树。无部门读权限时侧栏不出现部门菜单。

## 相关源码

- [plugins/org/src/pages/iam/members](../../../../plugins/org/src/pages/iam/members)
- [plugins/org/src/pages/iam/departments](../../../../plugins/org/src/pages/iam/departments)
- [packages/admin-common/src/models/iam](../../../../packages/admin-common/src/models/iam)

## 对接接口

- [20261017-org-members-dept-tabs API](../../../changes/archive/2026/20261017-org-members-dept-tabs/API.md)
- 后端基线：`ingot/specs/current/iam/tenant-departments/`

## 变更记录

| 日期 | 变更 ID | 说明 |
|------|---------|------|
| 2026-10-17 | [20261017-org-members-dept-tabs](../../../changes/archive/2026/20261017-org-members-dept-tabs/) | 用户要求归档；成员与部门拆为两个子页面，并固化目录菜单 |
