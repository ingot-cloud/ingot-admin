# API

GET /api/iam/v1/platform/groups 和 GET /api/iam/v1/tenant/groups 新增可选 view=SUMMARY。分页项为 ResourceDetail<GroupSummary>，record 含 id、name 和可空 description，外层包含 capabilities、fieldAccess 和 version。默认完整列表沿用原契约。已选成员继续走独立关联分页。查看和编辑读取 GET /groups/{id} 完整详情，更新携带该详情版本。
