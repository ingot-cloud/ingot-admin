# Phase 02：四个业务 App 迁移

## Platform

- [x] 创建 `@ingot/platform-app` 独立入口和 `platformPlugin`
- [x] 迁移 platform/admin、config、develop、org/tenant 的 pages 与纵向依赖
- [x] 拆分 platform 用户/角色/权限/租户/Client models 和 stores
- [x] 使用 admin-common 的租户只读查询；Client/租户写操作留在 platform

## Security

- [x] 创建 `@ingot/security-app` 独立入口和 `securityPlugin`
- [x] 迁移访问保护、账号保护、凭证策略、会话管理及纵向依赖
- [x] 改为局部使用 admin-common 的 TenantSelect/ClientSelect
- [x] 验证 security 源码和 manifest 不依赖 platform App

## Org

- [x] 创建 `@ingot/org-app` 独立入口和 `orgPlugin`
- [x] 迁移 contacts、org API、组织 models/stores 和 BizDeptSelect
- [x] 重命名组织 Store 导出和 Pinia ID，消除同名 store

## Member

- [x] 创建 `@ingot/member-app` 独立入口和 `memberPlugin`
- [x] 迁移会员用户、角色、权限及纵向依赖
- [x] 使用 admin-core 的账号状态和通用状态组件

## 共同约束

- [x] 四个 App 使用 `definePluginPages` 注册 canonical 与 legacy key
- [x] 清除迁移后业务源码中的 `@base` 和跨 App 源码导入
- [x] 保持现有接口路径和页面行为，修复触碰的类型/API 命名违规
- [x] 分别完成四个 App 的 type-check、unit test 和独立 build
