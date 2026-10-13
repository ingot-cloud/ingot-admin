# 接口契约

沿用 [安全中心接口](../20261012-security-page-interactions/API.md)。删除为现有 DELETE /api/security/platform/security/policy/groups/{id}、rules/{id}、ip-list/{id}、challenges/{id}，各自使用精确 iam-platform:security-policy:delete，成功仅失效相应列表。

InTable 公共 props/slots 不变。四个页面内部 row action factory 增加 onDelete 回调；框架 confirm 承担一次确认，不在 handler 重复弹框。
