# Member 平台管理接口

来源为后端 `ingot-service/ingot-member/ingot-member-provider/src/main/java/com/ingot/cloud/member/web/v1/platform/` 下的 `MemberUserAPI`、`MemberRoleAPI`、`MemberPermissionAPI`。前端沿用 `plugins/member/src/api/member/` 的封装与 `R<T>` 响应。本期拟接入 IAM 授权，沿用现有 HTTP 路径、方法与操作码。

浏览器请求基址为 `/api/member/v1/platform/member`。下表操作码均加前缀 `platform:member:`。

| 资源 | 方法与相对路径 | 操作码后缀 |
| --- | --- | --- |
| 用户列表 | GET `/user/page` | `user:query` |
| 用户详情 | GET `/user/detail/{id}` | `user:detail` |
| 新增用户 | POST `/user` | `user:create` |
| 更新资料 | PUT `/user`、`/user/{id}/base-info` | `user:update` |
| 删除用户 | DELETE `/user/{id}` | `user:delete` |
| 启停账号 | PUT `/user/{id}/enable`、`/user/{id}/disable` | `user:update` |
| 锁定与解锁 | PUT `/user/{id}/lock`、`/user/{id}/unlock` | `user:lock` |
| 重置密码 | PUT `/user/{id}/reset-password` | `user:reset-pwd` |
| 读取用户角色 | GET `/user/{id}/roles` | `user:roles:query` |
| 保存用户角色 | PUT `/user/{id}/roles` | `user:roles:set` |
| 角色树与选项 | GET `/role/tree`、`/role/options` | `role:query` |
| 新增角色 | POST `/role` | `role:create` |
| 更新角色 | PUT `/role` | `role:update` |
| 删除角色 | DELETE `/role/{id}` | `role:delete` |
| 设置角色用户 | PUT `/role/{id}/users` | `role:user:assign` |
| 读取角色权限 | GET `/role/{id}/permissions` | `role:permissions:query` |
| 保存角色权限 | PUT `/role/{id}/permissions` | `role:permissions:set` |
| 权限树 | GET `/permission/tree` | `permission:query` |
| 新增权限 | POST `/permission` | `permission:create` |
| 更新权限 | PUT `/permission` | `permission:update` |
| 删除权限 | DELETE `/permission/{id}` | `permission:delete` |

用户列表支持 `nickname`、`phone` 和现有服务端分页。角色树、权限树支持 `name` 筛选。用户详情包含现有的角色摘要。用户角色和角色权限通过各自的 GET 读取绑定集合，通过 PUT 提交 `setIds`。设置角色用户是现有 API，本期页面继续从用户侧分配角色。
