# 设计：网络拦截器扩展与废弃清理

## 技术方案

### 拦截器

`@ingot/http-client` 将 `order()` 改为 `order: number`，`rejected` 可选，提供 `defineRequestInterceptor` / `defineResponseInterceptor`。未提供 `rejected` 时默认 `Promise.reject(error)`。

排序保持：请求与响应都是 order 越小越先执行（请求降序注册抵消 Axios LIFO；响应升序注册配合 FIFO）。内置槽位导出为 `InterceptorOrder` / `AdminNetInterceptorOrder`，官方拦截器引用常量，App 用 `header + 2` 这类相对值插队。

admin-core / auth 现有拦截器改为工厂对象。删除 admin-core 中无人调用的 `interceptor/*/index.ts` 聚合器。

### App 追加

`InNetConfig.interceptors` 仅叠加。`Http.configure` 重建 `createHttpClient`（core + App concat，稳定排序，同 order 时 core 在前），然后重新 `bindChallengeRetry`。

App 不能替换 Header / Envelope / Challenge，不能覆盖 failure hooks。插件不注册全局拦截器。

预留 order 见 `InterceptorOrder`：请求 header / envelope，响应 envelope / normalize / challenge。

### 旧请求选项

调用点改为 `feedback: "silent"`。删除 `manualProcessingFailure` / `manualProcessingAbort` 类型与映射。CancelManager 仅在已有 `signal` 时跳过托管取消。

### 分页

`snapshotQueryParams` 对剥掉的敏感值做稳定序列化后的短 hash，写入 `_sensitive`。`queryFn` 仍带完整 condition。

member / platform 用户列表改为 `useServerPaging` + `*PageQueryOptions`。然后删除 `hooks/biz/usePaging.ts` 及 AutoImport / 约定保留名。

## 对接映射

本次无后端接口变更，无 `API.md`。

| 能力 | 前端 | 说明 |
|------|------|------|
| HTTP 传输 | `packages/http-client` | 拦截器工厂、RequestOptions |
| 管理台 net | `packages/admin-core/src/net` | 适配器 + App 追加 |
| 用户列表 | `plugins/member` / `plugins/platform` 用户 `useOps` | 迁 Query 分页 |

## 数据模型

无新业务模型。`InNetConfig` 增加 `interceptors`。Query 快照可含 `_sensitive?: string`。

## 组件与页面影响

- 会员用户列表、平台管理员用户列表：`useOps.ts` 改为 `useServerPaging`
- 无新页面、无路由变更

## 与 CONSTITUTION 符合性

| 原则 | 符合 | 说明 |
|------|------|------|
| Monorepo 边界 | ✅ | 传输在 http-client，业务适配在 admin-core |
| 三层目录与依赖方向 | ✅ | App 扩展只在 bootstrap；插件不改全局 net |
| API 层 | ✅ | 仍是具名 `XxxAPI` 与 `Promise<R<T>>` |
| 类型安全 | ✅ | 删除旧字段，新接口无 any |
| 施工门禁 | ✅ | 计划确认后 implementing |
| 真相单一 | ✅ | 实施期间不提前改 current；验收后再更新 network-query |

## 备选方案

### Koa 式 next() 中间件

未采用。与 Axios、信封重试、412 挑战冲突。

### 敏感字段用 searchNonce 每次搜索换 Key

未采用。无法复用同一手机号的短缓存；hash 指纹更稳。

## 开放问题

无。
