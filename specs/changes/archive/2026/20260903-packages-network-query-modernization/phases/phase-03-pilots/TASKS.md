# Phase 3：双场景试点

## 平台应用管理

- [x] 定义应用列表、详情、菜单和权限的层级 Query Keys
- [x] 定义列表/详情 Query Options，并透传 AbortSignal
- [x] 将应用列表分页迁移到 `useServerPaging()`
- [x] 将创建、修改、状态、删除、菜单和权限操作迁移为 Mutation
- [x] 为每个 Mutation 明确列表、详情和嵌套资源的精确失效范围
- [x] 验证返回页面缓存复用、翻页稳定和权限错误的现有特殊处理

## 在线会话管理

- [x] 定义包含租户、客户端、用户、IP 和分页的会话 Query Keys
- [x] 使用 enabled/skipToken 保持当前查询条件约束
- [x] 条件快速切换时取消旧请求，保持高实时数据 `staleTime: 0`
- [x] 将按 sid/用户下线迁移为 Mutation，并精确失效会话列表
- [x] 保持“已不在线”和下线数量等业务提示语义

## 试点门禁

- [x] 相同 Key 并发只产生一个网络请求
- [x] Mutation 不自动重试，错误只提示一次
- [x] 不出现旧响应覆盖新筛选结果
- [x] 平台与安全插件 type-check、unit test 通过
- [ ] Query Devtools 中 Key 层级、状态与失效范围符合 DESIGN.md（需登录后人工核对）
- [ ] 应用管理 / 在线会话页浏览器人工回归
- [x] 记录试点结论；自动化门禁通过后开始 Phase 4 共享引用数据

## 试点结论（2026-09-03）

- 自动化：`@ingot/admin-core` / `@ingot/platform-plugin` / `@ingot/security-plugin` type-check 与 unit test 通过。
- Query Key 层级：`[platform, app, list|detail, ...]`、`[security, session, list|detail, params]`。
- 应用删除在系统管理员遇到 `ILLEGAL_OPERATION` 时仍走强制删除确认。
- 会话查询在缺少 clientId/userId 时不发请求；下线成功/已不在线提示保留。
- 仍待人工：登录后用 Query Devtools 核对失效范围，以及应用管理/会话页浏览器回归。
