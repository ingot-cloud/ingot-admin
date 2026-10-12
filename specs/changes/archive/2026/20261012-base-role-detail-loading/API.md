# 当前角色授权的版本摘要（后端契约副本）

来源：`ingot/specs/changes/archive/2026/20261012-iam-role-detail-loading/REFINEMENT.md`；完整 Java/OpenAPI 契约仍由后端生成。

平台、共享和租户当前授权入口分别为 `GET /v1/platform/roles/{id}/grants`、`GET /v1/platform/shared-roles/{id}/grants` 与 `GET /v1/tenant/roles/{id}/grants`；管理台使用 `/api/iam` 前缀。响应 `R<RoleGrantList>` 的 data 保留完整 `items`，增加可选 `revision: { id, revision, versionName? }`，其中 id 与发布序号均为字符串，并与 items 来自同一次固定版本选择。

无发布版本时省略摘要，空授权版本仍返回摘要；固定版本授权保持 items，可省略摘要。请求参数、权限、乐观锁与错误码保持，无 DDL。旧前端可忽略新增字段，先后端再前端部署；回退后端时一并回退新前端。

历史与任务列表保留既有分页契约；前端在激活标签时加载，默认每页20条。可治理分布统计仍使用独立 distribution 接口及既有治理边界。
