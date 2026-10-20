# 成员与部门

组织管理下「成员与部门」包含两个独立子页面。部门页显示人数及主负责人摘要，详情以无 Tab 抽屉统一维护基本信息与负责人；负责人身份不默认授予权限。部门人数读后端 `memberCount`。

## 概述

租户管理员在独立路由维护成员与部门，不再把部门操作堆在成员页左树。无部门读权限时侧栏不出现部门菜单。

## 相关源码

- [plugins/org/src/pages/iam/members](../../../../plugins/org/src/pages/iam/members)
- [plugins/org/src/pages/iam/departments](../../../../plugins/org/src/pages/iam/departments)
- [packages/admin-common/src/models/iam](../../../../packages/admin-common/src/models/iam)

## 对接接口

- [20261017-org-members-dept-tabs API](../../../changes/archive/2026/20261017-org-members-dept-tabs/API.md)
- [20261018-org-tenant-member-create-dialog API](../../../changes/archive/2026/20261018-org-tenant-member-create-dialog/API.md)
- [20261019-org-department-leaders API](../../../changes/archive/2026/20261019-org-department-leaders/API.md)
- 后端基线：`ingot/specs/current/iam/tenant-departments/`、`ingot/specs/current/iam/tenant-members/`
- 共享交互：[租户组织成员选择](../../packages/tenant-member-picker/README.md)、[详情查看/编辑](../../packages/detail-edit-pattern/README.md)。

## 变更记录

| 日期 | 变更 ID | 说明 |
|------|---------|------|
| 2026-10-20 | [20261019-org-department-leaders](../../../changes/archive/2026/20261019-org-department-leaders/) | 用户确认验收完成；负责人独立维护、详情统一编辑及组织选人流程 |
| 2026-10-19 | [20261018-org-tenant-member-create-dialog](../../../changes/archive/2026/20261018-org-tenant-member-create-dialog/) | 用户要求归档；添加成员改为按手机号的对话框 |
| 2026-10-17 | [20261017-org-members-dept-tabs](../../../changes/archive/2026/20261017-org-members-dept-tabs/) | 用户要求归档；成员与部门拆为两个子页面，并固化目录菜单 |
