# Phase 01 试点迁移前基线

试点验收顺序：Dashboard → 租户 → 组织用户 → 账号保护。

| 页面 | 路由 | 原型 | InPageFrame | 滚动所有者 | tableId | 初始请求 | 关键操作 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `platform/dashboard` | 工作台首页 | Overview | `page` + `plain` | PageBody | — | 无列表请求；读取当前登录用户 store | 查看账号、角色、初始化密码和权限摘要 |
| `platform/org/tenant` | 组织管理 | List | `contained` + `workspace` | 表格数据区 | `platform-org-tenant` | `TenantPageQueryOptions`，筛选需点搜索 | 搜索/重置、添加组织、详情、启停、创建/编辑抽屉 |
| `org/contacts/user` | `/org/contacts/user` | Split List | `contained` + `workspace` | 左树 / 右表数据区 | `org-contacts-user` | 部门树 + 成员分页；点树节点后按 `deptId` 查询 | 添加成员、详情、启停、删除、字段设置、左栏折叠 |
| `security/account-protection` | `/platform/security/account-protection` | Settings | `page` + `plain` | PageBody | — | 默认「账号锁定」Tab 拉取策略；未访问 Tab 不请求 | B/C 两栏独立编辑保存；永久锁定仅 B 端 |

组织成员页没有邀请/批量导入导出/变更部门/离职接口，工具栏只映射已有「添加成员」。通讯录各页不使用页内路由 Tab。
