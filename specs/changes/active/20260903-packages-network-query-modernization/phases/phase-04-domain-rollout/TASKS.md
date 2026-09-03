# Phase 4：admin 逐域迁移

## 批次 1：共享引用数据

- [ ] 迁移 admin-common 的租户、客户端等选择数据，采用引用数据缓存策略
- [ ] 排查并合并跨页面重复的选项/树查询

## 批次 2：member 与 org

- [ ] 迁移 member 列表、详情、角色与权限 CRUD
- [ ] 迁移 org 用户、部门、角色与权限 CRUD
- [ ] 移除仅转发 API Promise 的 server-state Pinia 包装，保留客户端状态 Store

## 批次 3：platform

- [ ] 迁移用户、角色、菜单、字典、租户与开发工具查询/Mutation
- [ ] 保持手机号搜索等敏感即时查询为不缓存的命令式请求
- [ ] 复核跨应用、租户和资源 ID 的 Key 隔离

## 批次 4：security

- [ ] 迁移访问保护、并发策略、登录失败、锁定和凭据策略
- [ ] 保持网关挑战执行链路为命令式安全基础设施

## 兼容收敛

- [ ] 全仓确认页面不再手工维护可由 Query 提供的 loading/cache/refetch
- [ ] 全仓确认 `usePaging/transformPageAPI/useConfirm*` 业务调用清零
- [ ] 将旧 Hooks 标记 deprecated 并记录后续版本化删除计划，本 change 不直接删除公共导出
- [ ] 每个批次独立完成 type-check、unit、build 和关键页面回归
