# 接口：成员表格导入导出

## 来源

- 后端仓库：`ingot/specs/changes/archive/2026/20261020-iam-member-batch/`
- 现有任职：`PUT /v1/tenant/members/{id}/departments`

## 服务与约定

- **服务**：IAM
- **Base Path**：`/api/iam`
- **鉴权**：当前租户会话
- **响应包装**：统一 `R<T>`，`code = "0"` 为成功
- **文件**：`data` 为 `{ filename, contentType, contentBase64 }`，前端转 Blob 下载

## 权限码

| 权限码 | 覆盖接口 |
|--------|----------|
| `iam-tenant:member:create` | 空白模板、创建导入、创建类历史 |
| `iam-tenant:member:export` | 登记更新导出、下载导出工作簿 |
| `iam-tenant:member:update` / `iam-tenant:member:departments` | 更新导入、更新类历史 |
| `iam-tenant:member:departments` | 逐人覆盖任职（批量变更部门） |

## 接口列表

### 1. `GET` `/v1/tenant/members/workbook/template`

**权限**：`iam-tenant:member:create`

**说明**：下载创建用空白 xlsx。

### 2. `POST` `/v1/tenant/members/workbook/export`

**权限**：`iam-tenant:member:export`

**请求参数**：

| 位置 | 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| body | expectedVersion | string | 是 | 组织版本 |
| body | memberIds | string[] | 否 | 部分成员；空或省略表示可见全部未移出成员 |

### 3. `GET` `/v1/tenant/members/workbook/{id}/status`

**说明**：轮询。`SUCCEEDED` 后带 `successCount`、`failCount`、`passwordAvailable`。

### 4. `GET` `/v1/tenant/members/workbook/{id}/file`

**请求参数**：

| 位置 | 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| query | artifact | `WORKBOOK` / `ERRORS` / `PASSWORDS` | 是 | 产物类型 |

### 5. `POST` `/v1/tenant/members/workbook/import`

**权限**：创建导入要 create；更新导入要 update 或 departments

**请求参数**：

| 位置 | 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| form | file | file | 是 | xlsx |
| form | mode | `CREATE` / `UPDATE` | 是 | 导入模式 |

### 6. `GET` `/v1/tenant/members/workbook/history`

**说明**：当前操作者最近 10 条导入任务。

### 7. `PUT` `/v1/tenant/members/{id}/departments`

**说明**：批量变更部门在确认后逐人调用，携带该行 `expectedVersion` 与新部门列表。既有契约。

## 前端注意

- 任务 24 小时过期；密码产物只能下载一次
- 不可见列不会出现在模板或导出中
- 部门路径从根部门名开始，`/` 分层，多个部门英文逗号，第一项为主部门
- JSON `POST/GET /v1/tenant/members/export*` 本页不再调用
