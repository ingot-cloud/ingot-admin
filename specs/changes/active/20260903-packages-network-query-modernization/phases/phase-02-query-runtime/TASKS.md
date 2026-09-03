# Phase 2：TanStack Query Runtime

## 实现

- [ ] 在 catalog 精确锁定 `@tanstack/vue-query@5.102.2` 和匹配的 ESLint plugin
- [ ] 为 admin-core、迁移插件与消费 App 声明正确 dependency/peer dependency，并更新打包 external
- [ ] 实现 `InQueryConfig`、`createAdminQueryClient()` 与 `getAdminQueryClient()`
- [ ] 在 `bootstrapAdminApp()` 安装唯一 QueryClient，加入 runtime/plugin context
- [ ] 配置 staleTime、gcTime、聚焦/重连和 retry 默认策略
- [ ] 配置 QueryCache/MutationCache，保证最终错误只提示一次
- [ ] Query 请求默认使用 silent feedback/local progress，401/签退/挑战仍走请求适配器
- [ ] 登出时取消全部 Query 并清空内存缓存
- [ ] 注册全局 ApiError、Query Key 和 Meta 类型
- [ ] 启用 Query ESLint 规则与仅开发环境调试集成
- [ ] 实现非破坏性参数归一化 helper，并更新 API 编码规范
- [ ] 实现通用 Query Key、Options 与 Mutation Options 示例和测试工具
- [ ] 实现 `useServerPaging()` 与现有表格事件适配

## 测试与门禁

- [ ] QueryClient 默认策略、retry predicate、错误提示和登出清理单测通过
- [ ] Query Key 稳定性、完整依赖、敏感字段排除测试通过
- [ ] `useServerPaging()` 搜索、分页、keepPreviousData、取消和禁用查询测试通过
- [ ] create-app 模板、pack consumer 与边界检查通过
