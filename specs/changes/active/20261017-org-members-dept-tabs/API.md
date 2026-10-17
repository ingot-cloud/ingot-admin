# 接口：成员与部门两个子页面

## 来源

- 后端仓库：ingot
- 后端 change：`specs/changes/active/20261017-iam-department-member-count/API.md`

本变更不新增路径。`GET /v1/tenant/departments` 改为树响应。成员列表补齐左树所需的 `departmentId` / `status` 公开筛选。

## 服务与约定

- 服务：IAM
- Base Path：`/v1`
- 鉴权与权限码不变：`iam-tenant:department:read`
- 响应包装：`R<T>`

## `DepartmentRecord`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 部门 ID |
| parentId | string | 否 | 父部门 ID，根节点为空 |
| name | string | 是 | 可见部门名称 |
| sortOrder | integer | 是 | 展示顺序 |
| navigationOnly | boolean | 是 | 是否仅作为必要祖先导航骨架 |
| memberCount | integer | 否 | 本部门直属 ACTIVE 成员数。仅租户管理部门列表填充；详情、通讯录、策略骨架省略 |

## 受影响接口

### `GET /v1/tenant/departments`

权限：`iam-tenant:department:read`

查询：`purpose=MANAGED_DEPARTMENT`（强制）。不分页。

`data` 为树节点数组：根部门与直属一级部门平级，`record.memberCount` 必有（含 0）。

### `GET /v1/tenant/departments/{id}`

`record` 不含 `memberCount`。

### `GET /v1/directory/departments`

行为不变，`record` 不含 `memberCount`。

### `GET /v1/tenant/members`

权限：`iam-tenant:member:read`

查询：`page`、`pageSize`、可选精确 `phone`/`email`、可选直属 `departmentId`、可选 `status=ACTIVE|SUSPENDED|REMOVED`。

`departmentId` 与 `status` 是公开筛选，不是字段策略键。未登记键会被 FieldControl 以 `InvalidArgument` 拒绝。不传 `status` 时排除已移出；`departmentId` 只匹配本部门直属任职，不含下级。

`phone` 仍是组织联系手机，不是账号登录手机。`loginPhone`、`joinedAt`、`updatedAt` 当前租户列表尚未投影，前端列空值显示 `-`。

根部门 logo 读 `GET /v1/tenant/settings` 的 `record.avatar`，无权限或无头像时前端回退首字。

## 前端注意

- 部门页人数列：有 `memberCount` 显示数字，缺失显示 `-`
- 成员筛选与导出、部门 CRUD 仍走既有 `directory.ts` API
- 左树与部门页消费 `TenantDepartmentTreeAPI`，禁止分页拼树
- 菜单：目录 `org.iam.members.root`（成员与部门）下挂 `org.iam.members`（`iam-tenant:member:read`）与 `org.iam.departments`（`iam-tenant:department:read`）。新库走 006 / `ingot_iam.sql`，已有库走 `023_tenant_members_departments_menus.sql`
- 成员表时间列本地格式化 `joinedAt`/`updatedAt`；缺省显示 `-`
