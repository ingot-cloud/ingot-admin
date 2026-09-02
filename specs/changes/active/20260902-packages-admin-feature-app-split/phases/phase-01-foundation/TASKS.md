# Phase 01：共享基础设施

## Admin Core

- [x] 新增 `definePluginPages` 及类型、canonical/legacy key 单测
- [x] 将通用 tag、状态和账号状态组件迁入 coreGlobalComponents
- [x] 更新 admin-core exports、类型声明和组件测试

## Admin Common

- [x] 创建 `@ingot/admin-common` package、构建配置和公开 exports
- [x] 抽取租户只读分页查询、option 模型与 `TenantSelect`
- [x] 抽取 OAuth Client 只读分页查询、option 模型与 `ClientSelect`
- [x] 抽取实际跨 App 使用的管理枚举/契约，禁止承载页面和写操作
- [x] 为查询转换、选择器加载和 package build 增加测试

## Vite 与边界

- [x] 扩展官方 App 解析清单与 importer-aware `@/` 解析测试
- [x] 新增 App 源码/package dependency 边界检查脚本
- [x] 将新 package 纳入 build、type-check 和必要的 pack consumer 验证
