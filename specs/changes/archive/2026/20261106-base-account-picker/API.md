# 既有接口

分页使用 `GET /v1/platform/accounts?page=1&pageSize=20` 和 `iam-platform:account:read`。候选展示仅使用账号 ID 与登录名，按服务端总数翻页。

添加平台成员时附加 `excludePlatformMembers=true`。服务端在账号读取与查找范围内排除已有平台成员资格的账号，按过滤后的结果分页和计数，并校验平台成员创建权限。创建组织时省略该参数。

复用 `POST /v1/platform/accounts/lookup` 及 `iam-platform:account:lookup`。两个入口均传 `purpose=MEMBER_CREATE` 和去首尾空白的 `username`。添加平台成员另传 `domain=PLATFORM`，接收成员创建字段权限和受限联系方式，服务端会拒绝已有平台成员资格的账号。

创建组织的预览和提交仍使用 `ownerAccountId`。平台成员创建仍使用 `accountId`。先发布支持过滤参数的后端，再发布前端以启用过滤。
