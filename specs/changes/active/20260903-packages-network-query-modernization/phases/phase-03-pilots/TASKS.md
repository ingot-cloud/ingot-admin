# Phase 3：双场景试点

## 平台应用管理

- [ ] 定义应用列表、详情、菜单和权限的层级 Query Keys
- [ ] 定义列表/详情 Query Options，并透传 AbortSignal
- [ ] 将应用列表分页迁移到 `useServerPaging()`
- [ ] 将创建、修改、状态、删除、菜单和权限操作迁移为 Mutation
- [ ] 为每个 Mutation 明确列表、详情和嵌套资源的精确失效范围
- [ ] 验证返回页面缓存复用、翻页稳定和权限错误的现有特殊处理

## 在线会话管理

- [ ] 定义包含租户、客户端、用户、IP 和分页的会话 Query Keys
- [ ] 使用 enabled/skipToken 保持当前查询条件约束
- [ ] 条件快速切换时取消旧请求，保持高实时数据 `staleTime: 0`
- [ ] 将按 sid/用户下线迁移为 Mutation，并精确失效会话列表
- [ ] 保持“已不在线”和下线数量等业务提示语义

## 试点门禁

- [ ] 相同 Key 并发只产生一个网络请求
- [ ] Mutation 不自动重试，错误只提示一次
- [ ] 不出现旧响应覆盖新筛选结果
- [ ] Query Devtools 中 Key 层级、状态与失效范围符合 DESIGN.md
- [ ] 平台与安全插件 type-check、unit test、build 和人工回归通过
- [ ] 记录试点结论；未通过不得开始 Phase 4
