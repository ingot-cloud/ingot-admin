# 接口使用

契约沿用 [平台能力补齐接口矩阵](../20261012-iam-platform-capability-completion/API.md)，不新增后端 API。

- 凭证：`GET /api/security/platform/security/credential/policy-config/list` 为后端唯一读取契约，页面共享一次列表查询、仅挂载激活类型的表单；空配置允许有 create 权限者新建。POST/PUT 保持原契约。
- 登录失败：`GET /api/security/platform/security/access/login-failure-policies/{dimension}` 替代页面整组读取；PUT 保持原契约。
- 账号锁定、访问防护各列表/全局配置、并发策略与会话接口继续使用现有端点。
- 读取使用现有精确 read 操作，写入使用 create/update/delete/revoke 精确操作。目录选择器保留独立读取权限。
- Query 请求携带 AbortSignal，隐藏面板 enabled=false；变更失败保留编辑内容并使用统一请求错误反馈。
