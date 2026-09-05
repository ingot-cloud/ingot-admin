# 25 页迁移前行为与权限回归清单

迁移时逐页勾选：入口、canonical viewPath、权限显隐、初始请求、查询条件、分页、写操作、确认文案、成功提示、刷新范围必须与迁移前一致。

| 插件 | 页面 | 原型 | 入口/权限要点 | 初始请求 | 写操作与刷新 |
| --- | --- | --- | --- | --- | --- |
| platform | dashboard | Overview | 工作台；无独立权限码 | 无业务列表请求 | 无写操作 |
| platform | admin/user | List | 平台用户管理权限 | 用户分页 | 创建/编辑/绑定/重置后失效用户列表 |
| platform | config/app/home | List | 应用配置权限 | 应用列表 | 创建后失效列表 |
| platform | config/app/detail | Detail | 应用详情；返回列表 | 应用详情及子面板 | 菜单/权限保存按原子范围刷新 |
| platform | config/dict | Split List | 字典权限 | 类型树 + 条目 | 双抽屉成功后刷新对应栏 |
| platform | config/menu | List | 菜单权限 | 菜单树表 | 详情跳转；写操作后刷新树 |
| platform | config/permission | List | 权限列表权限 | 权限分页 | 编辑抽屉成功后刷新列表 |
| platform | config/role | List | 角色权限 | 角色分页 | 授权弹窗/抽屉成功后刷新 |
| platform | develop/client | List | 开发 Client 权限 | Client 分页 | 密钥浮层不改变列表查询 |
| platform | develop/id | List | ID 配置权限 | ID 列表 | 编辑抽屉成功后刷新 |
| platform | develop/qrcode | Tool | 二维码工具权限 | 无列表 | 单次生成，不改路由 |
| platform | develop/social | List | 社交配置权限 | 社交列表 | 编辑弹窗成功后刷新 |
| platform | org/tenant | List | 组织管理权限 | 组织分页，搜索才提交名称 | 创建/编辑/启停后失效租户列表 |
| org | contacts/user | Split List | 组织成员权限 | 部门树 + 成员分页 | 添加/详情/启停/删除后刷新成员列表 |
| org | contacts/dept | Split List | 部门权限 | 部门树/列表 | 编辑抽屉成功后刷新 |
| org | contacts/role | Split List | 组织角色权限 | 角色组 + 成员 | 绑定/删除后刷新当前组 |
| org | contacts/auth | Split List | 组织授权权限 | 范围树 + 授权列表 | 添加抽屉成功后刷新 |
| org | contacts/structure | Split List | 组织架构权限 | 组织树 | 浏览为主 |
| member | user | List | 会员用户权限 | 用户分页 | 创建/编辑/绑定/重置后刷新 |
| member | role | List | 会员角色权限 | 角色分页 | 授权弹窗成功后刷新 |
| member | permission | List | 会员权限 | 权限分页 | 编辑抽屉成功后刷新 |
| security | access-protection | Settings | 访问防护查询/更新权限 | 仅访问中的 Tab | 策略 CRUD；热更新提示保留 |
| security | account-protection | Settings | `platform:security:account:lockout:query/update` | 默认账号锁定 Tab | B/C 独立 PUT；数秒内生效提示 |
| security | credential | Settings | 凭证策略权限 | 仅访问中的 Tab | 分组表单独立保存 |
| security | sessions | Settings | 会话查询/下线权限 | 未满足 clientId/userId 不请求 | 下线绑定 sid；GLOBAL 策略不可删 |
