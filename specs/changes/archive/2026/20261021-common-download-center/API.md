# API

接口真相见后端 `ingot/specs/changes/archive/2026/20261021-framework-download-center/DESIGN.md`。以下为前端对接副本，均返回 `R<T>` 信封。

## 我的下载

### GET `/v1/tenant/downloads`

查询参数：`page`、`pageSize`（默认 20）。权限：已登录租户身份。返回 `PageResponse<DownloadTask>`，按创建时间倒序，仅当前成员的任务。

`DownloadTask`：

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | 任务 ID |
| source | string | 来源编码，如 `iam.member-workbook` |
| title | string | 展示名称，如「成员导出」 |
| status | `PENDING` \| `RUNNING` \| `SUCCEEDED` \| `FAILED` \| `EXPIRED` | 状态 |
| filename | string \| null | 成功后有值 |
| fileSize | number \| null | 字节 |
| failureReason | string \| null | 失败时可展示原因 |
| createdAt | string | ISO-8601 UTC `Z` |
| completedAt | string \| null | 同上 |
| expiresAt | string | 同上 |

### GET `/v1/tenant/downloads/{id}`

返回单个 `DownloadTask`。非本人 404。

### POST `/v1/tenant/downloads/{id}/link`

返回 `DownloadLink`：

| 字段 | 类型 | 说明 |
|---|---|---|
| url | string | 预签名链接，5 分钟有效 |
| filename | string | 文件名 |
| expiresAt | string | 链接过期时间，UTC `Z` |

错误：进行中返回 503「文件仍在生成，请稍后再试」；失败、过期、非本人 404；来源权限不足 403；签名失败 503「暂时无法生成下载链接，请稍后重试」。

## 成员表格导出（返回语义变化）

### POST `/v1/tenant/members/workbook/export`

请求不变（`expectedVersion`、可选 `memberIds`）。返回 `CreatedResource.id` 为**下载任务 ID**。不再对导出调用 `/workbook/{id}/status` 与 `/file`。
