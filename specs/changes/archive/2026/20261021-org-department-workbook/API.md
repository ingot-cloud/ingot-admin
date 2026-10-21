# 接口：部门表格导入导出

## 来源

- 后端仓库：`ingot/specs/changes/active/20261021-iam-department-workbook/`

## 服务与约定

- **服务**：IAM
- **Base Path**：`/api/iam`
- **鉴权**：当前租户会话
- **响应包装**：统一 `R<T>`，`code = "0"` 为成功
- **文件**：`data` 为 `{ filename, contentType, contentBase64 }`

## 权限码

| 权限码 | 覆盖接口 |
|--------|----------|
| `iam-tenant:department:create` | 空白模板、创建导入、创建类历史 |
| `iam-tenant:department:export` | 登记更新导出 |
| `iam-tenant:department:update` | 更新导入、更新类历史 |

## 接口列表

### 1. `GET` `/v1/tenant/departments/workbook/template`

**权限**：`iam-tenant:department:create`

**说明**：下载创建用空白 xlsx。

### 2. `POST` `/v1/tenant/departments/workbook/export`

**权限**：`iam-tenant:department:export`

**请求参数**：

| 位置 | 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| body | expectedVersion | string | 是 | 组织版本 |
| body | departmentIds | string[] | 否 | 部分部门；空或省略表示可见全部部门。服务端展开下级 |

### 3. `POST` `/v1/tenant/departments/workbook/import`

**权限**：创建导入要 create；更新导入要 update

**请求参数**：

| 位置 | 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| form | file | file | 是 | xlsx |
| form | mode | `CREATE` / `UPDATE` | 是 | 导入模式 |

### 4. `GET` `/v1/tenant/departments/workbook/history`

**说明**：当前操作者最近 10 条导入任务。

### 5. `GET` `/v1/tenant/departments/workbook/{id}/status`

**说明**：轮询。`SUCCEEDED` 后带 `successCount`、`failCount`。

### 6. `GET` `/v1/tenant/departments/workbook/{id}/file`

**请求参数**：

| 位置 | 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| query | artifact | `WORKBOOK` / `ERRORS` | 是 | 产物类型 |

## 前端注意

- 任务 24 小时过期
- 上级路径从根部门名开始，`/` 分层
- 导出提交后引导「我的下载」，页内不轮询导出
- 导入页内轮询 1 秒 × 60 次
