# 接口：组织角色工作区

后端实现见 `ingot` change `20261022-iam-tenant-role-workspace`。响应包在 `R<T>` 中。分页默认 20。

## 角色有效成员

`GET /v1/tenant/roles/{id}/members`

- 权限：可见角色，且具备租户分配读取
- 查询：`keyword`、`page`、`pageSize`
- 响应：`RoleSubjectPage`
- `revisionNumbers` 为空。`sourceTypes` 为 `MEMBER` 或 `GROUP`。`inheritedSourcesRestricted` 为真表示组继承受组读取范围限制。

## 角色有效用户组

`GET /v1/tenant/roles/{id}/groups`

参数和响应与成员接口相同。不展开组成员。

## 成员有效来源

`GET /v1/tenant/roles/{id}/members/{memberId}/assignments`

- 响应：`PageResponse<ResourceDetail<TenantAssignmentRecord>>`
- 修改和撤销仍使用分配 ID。无 `revisionId`。

## 沿用的当前角色接口

- `POST /v1/tenant/roles`：`code` 仍必填，由前端生成，最长 128
- 详情、资料、状态、权限读取与保存、目录、预览、删除沿用租户当前角色接口
- `CurrentRoleDefinition` 增加 `resourceFieldPermissions`。目录操作增加 `fieldCapabilities` 与 `fieldDefaults`。通讯录资源的字段能力为空
- 创建、预览和保存权限都会固化字段快照并立即生效，不产生业务版本
- `GET /v1/tenant/roles/grant-catalog` 在选定应用后一次返回该应用全部可编辑操作，不再分页。左侧应用列表仍分页
- 授权记录和授权管理员沿用既有分配、委派接口。授权记录列表不支持按有效状态筛选
