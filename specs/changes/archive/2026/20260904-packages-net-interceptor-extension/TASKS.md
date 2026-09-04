# 任务：网络拦截器扩展与废弃清理

> `[P]` 表示可与其他 `[P]` 任务并行执行。

## 准备

- [x] 确认本 change README 状态为 `approved`（开工后改为 `implementing`）
- [x] 阅读本 change 的 [REQUIREMENTS.md](./REQUIREMENTS.md) 与 [DESIGN.md](./DESIGN.md)
- [x] 阅读 [CONSTITUTION.md](../../../CONSTITUTION.md) 与 [ingot-coding-standards](../../../../.agents/skills/ingot-coding-standards/SKILL.md)

## 实现

- [x] http-client：`order: number`、可选 `rejected`、`define*Interceptor`；删除旧请求选项
- [x] admin-core / auth 拦截器改用工厂；删除死聚合器
- [x] `InNetConfig.interceptors` + `Http.configure` 重建 client；导出工厂与类型
- [x] `snapshotQueryParams` 敏感指纹
- [x] member / platform 用户列表迁 `useServerPaging`；删除 `usePaging.ts` 与 AutoImport
- [x] 编写 `docs/network.md` 并同步工程/编码文档
- [x] 导出 `InterceptorOrder` / `AdminNetInterceptorOrder`，官方拦截器改用常量

## 验证

- [x] 满足 REQUIREMENTS.md 验收标准
- [x] http-client / admin-core 相关单测通过
- [x] 本地构建通过（http-client / admin-core 测试与相关 type-check）

## 收尾

- [x] 验收通过后再更新 `current/packages/network-query`（实施期间不改）
