# 接口：已移出成员重新加入

## 来源

- 后端仓库：`ingot/specs/changes/archive/2026/20261020-iam-tenant-member-rejoin/`

## 服务与约定

- **服务**：IAM
- **Base Path**：`/v1/tenant/members`
- **鉴权**：租户会话
- **响应包装**：统一 `R<T>`

## 权限码

| 权限码 | 覆盖接口 |
|--------|----------|
| `iam-tenant:member:create` | `POST /v1/tenant/members`、`POST /v1/tenant/members/{id}/rejoin` |

## 接口列表

### 1. `POST` `/v1/tenant/members`

沿用 `TenantMemberCreateInput`。手机号命中已移出成员时复用原行，响应 `rejoined=true`、`accountCreated=false`。

### 2. `POST` `/v1/tenant/members/{id}/rejoin`

**权限**：`iam-tenant:member:create`

**请求体** `TenantMemberRejoinInput`：`expectedVersion`、`displayName`、`phone`、可选 `email`、`departments`。

**响应** `TenantMemberCreated`：`id`、`version`、`accountCreated=false`、`rejoined=true`。
