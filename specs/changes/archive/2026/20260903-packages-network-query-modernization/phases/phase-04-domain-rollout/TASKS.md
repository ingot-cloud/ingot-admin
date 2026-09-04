# Phase 4：admin 逐域迁移

## 批次 1：共享引用数据

- [x] 迁移 admin-common 的租户、客户端等选择数据，采用引用数据缓存策略
- [x] 排查并合并跨页面重复的选项/树查询：选择器走共享 Query；树按 orgId / snapshot 隔离，未发现仍命令式重复拉取同一选项源

## 批次 2：member 与 org

- [x] 迁移 member 角色与权限 CRUD；用户列表含 phone 保持命令式 `usePaging`
- [x] 迁移 org 用户列表、部门树与角色成员分页 Query
- [x] 移除 org 部门、platform 租户仅转发 API Promise 的 Pinia 包装
- [x] 移除 org 角色、platform 部门/角色树 Store 转发，客户端 expandedKeys 等状态留在页面

## 批次 3：platform

- [x] 迁移字典、租户、开发工具与角色树查询/Mutation
- [x] 平台用户列表含 phone 保持命令式；应用内菜单/权限树已迁 Query；独立菜单/权限管理页也已迁 Query
- [x] 保持手机号搜索等敏感即时查询为不缓存的命令式请求
- [x] 复核跨应用、租户和资源 ID 的 Key 隔离：跨组织树用 `detail(orgId)`，列表用 `snapshotQueryParams`

## 批次 4：security

- [x] 迁移并发策略列表与路径分组列表
- [x] 迁移访问保护其余面板、登录失败、锁定和凭据策略
- [x] 保持网关挑战执行链路为命令式安全基础设施；封禁审计列表已迁 Query，不改请求形状

## 兼容收敛

- [x] 全仓确认页面不再手工维护可由 Query 提供的 loading/cache/refetch（用户列表 phone 除外）
- [x] 全仓确认 `usePaging/transformPageAPI/useConfirm*` 业务调用：仅 member/platform 用户列表保留 `usePaging`（phone）；`useConfirm*` 已清零
- [x] 将旧 Hooks 标记 deprecated 并记录后续版本化删除计划，本 change 不直接删除公共导出
- [x] 仓库内 type-check / unit / build 已完成；关键页面回归待用户验收
