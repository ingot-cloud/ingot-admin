# 设计：网络请求与服务端状态现代化

## 技术方案

### 总体分层

```text
页面 / useOps
    ↓
TanStack Vue Query：server state、缓存、去重、取消、失效、重试
    ↓
资源 Query Options / Mutation Options
    ↓
具名 XxxAPI 函数：URL、参数、DTO/VO 映射，Promise<R<T>>
    ↓
admin/auth 请求适配器：鉴权、租户、提示、进度、安全协议
    ↓
@ingot/http-client：Axios client、响应归一化、ApiError、signal
```

TanStack Query 不替代 Axios。Query 只消费 Promise 并缓存 `R<T>.data`；Axios 继续承载业务码、
HTTP headers、412 挑战和 HYBRID 信封加密。

### HTTP Client package

新增 `packages/http-client`（包名 `@ingot/http-client`），公开：

```typescript
export interface RequestOptions {
  signal?: AbortSignal;
  feedback?: "global" | "silent";
  progress?: "global" | "silent";
}

export type ApiErrorKind = "business" | "http" | "network" | "timeout" | "cancelled";

export class ApiError<T = unknown> extends Error {
  readonly kind: ApiErrorKind;
  readonly code?: string;
  readonly status?: number;
  readonly retriable: boolean;
  readonly cancelled: boolean;
  readonly response?: R<T>;
}

export interface HttpClient {
  rawRequest<T = unknown>(config: HttpRequestConfig): Promise<R<T>>;
  get<T = unknown>(url: string, params?: unknown, config?: HttpRequestConfig): Promise<R<T>>;
  post<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<R<T>>;
  // put/delete/patch/form 等现有方法保持
}

export function createHttpClient(options: HttpClientOptions): HttpClient;
```

- package 不直接展示消息或访问 Store；通过 adapters/hooks 注入开始、结束、业务失败和未授权行为。
- admin-core 和 auth 保留各自上层 net 入口，现有调用方不直接依赖新 package。
- `manualProcessingFailure/manualProcessingAbort` 先映射到新选项并标记 deprecated，调用迁移完成后再移除。
- Query 传入 signal 时不再由 CancelManager 覆盖；未迁移调用仍由 CancelManager 管理。
- NProgress 由 admin adapter 维护前台请求计数，计数归零才调用 `done()`。
- 响应顺序保持：基础响应处理 → 信封解密/kid 轮换 → 业务码 → 412 挑战恢复。

### Query runtime

admin-core 新增下列公共能力：

```typescript
export interface InQueryConfig {
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
}

export function createAdminQueryClient(config?: InQueryConfig): QueryClient;
export function getAdminQueryClient(): QueryClient;

export interface InAdminRuntime {
  app: App;
  pinia: Pinia;
  router: Router;
  queryClient: QueryClient;
}
```

`InAdminPluginContext` 同样增加 `queryClient`。`bootstrapAdminApp()` 每次启动创建一个稳定实例并安装
`VueQueryPlugin`。

默认配置：

| 项目 | 默认值 |
|------|--------|
| 普通查询 staleTime | 30 秒 |
| 引用数据 staleTime | 5 分钟（资源级覆盖） |
| 高实时数据 staleTime | 0（资源级覆盖） |
| gcTime | 10 分钟 |
| refetchOnWindowFocus | false |
| refetchOnReconnect | true |
| query retry | 仅网络、超时、502/503/504，最多 1 次 |
| mutation retry | false |
| persistence | 不启用 |

QueryCache/MutationCache 负责未被页面接管的最终错误提示；Query 请求使用 `feedback: "silent"`，
避免 Axios 每次尝试和 Query 最终失败重复提示。401、签退和挑战仍由请求适配器处理。

### API 与 Query 组织

API 层继续具名导出，不创建 `appAPI.page()` 风格的无状态对象：

```typescript
export function AppPageAPI(
  page: Page,
  condition?: PlatformAppFilterDTO,
  options?: RequestOptions,
): Promise<R<Page<PlatformApp>>>;
```

每个需要服务端状态管理的资源增加相邻 Query 模块：

```typescript
export const appQueryKeys = {
  all: ["platform", "app"] as const,
  lists: () => [...appQueryKeys.all, "list"] as const,
  list: (input: AppPageInput) => [...appQueryKeys.lists(), input] as const,
  details: () => [...appQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...appQueryKeys.details(), id] as const,
};

export function AppPageQueryOptions(input: MaybeRefOrGetter<AppPageInput>) {
  return queryOptions({
    queryKey: computed(() => appQueryKeys.list(toValue(input))),
    queryFn: ({ signal }) => AppPageAPI(/* ... */, { signal }).then(({ data }) => data),
  });
}
```

- Key 使用 `[domain, resource, operation, scope, params]` 层级。
- Key 参数由非破坏性参数清理函数生成不可变、可序列化快照；不得把 reactive proxy 放入 Key。
- Token、密码、手机号等敏感数据不进入 Key；对应操作维持命令式请求。
- Query Options 与 Key/QueryFn 共置，Mutation Options 明确失效列表、详情或资源根 Key。
- 默认不乐观更新；只有收益明确且回滚可靠的操作单独设计。

### 服务端分页

新增 `useServerPaging()`，替代手工 `loading/pageInfo/exec`：

- 维护编辑中 condition 与已提交 condition，输入变化不立即请求。
- `search()` 提交条件快照并回到第一页；页码和页大小进入 Query Key。
- 使用 `placeholderData: keepPreviousData` 保持翻页过程中的表格数据。
- 分别暴露首次加载和后台刷新状态，并适配现有表格分页事件。
- 条件不足时使用 `enabled` 或 `skipToken`。
- 写操作成功后通过 Key 失效，不直接调用旧 `paging.exec()`。

### Pinia 边界

- 继续使用 Pinia：会话身份、权限、菜单路由、应用设置、组件设置。
- 迁移到 Query：列表、详情、树、选项、策略配置以及只转发 API Promise 的 Store。
- 登录、登出、PKCE、412 挑战、密码提交、上传下载保持命令式流程。

## HTTP/2 与代理设计

```text
Browser -- HTTPS/h2 --> External TLS Proxy
                              |
                         HTTP/1.1
                              v
                    App Nginx :3000
                              |
                   HTTP/1.1 keepalive
                              v
                    ingot-gateway:7980
```

- HTTP/2 必须配置在浏览器直接连接的外层 TLS 终止代理，并通过 ALPN 验证。
- 应用 `proxy.conf` 不启用明文 h2c，不内置证书，继续 `listen 3000`。
- 增加 `upstream ingot_gateway { server ingot-gateway:7980; keepalive 32; }`。
- `/api/` 保留 `proxy_http_version 1.1`、空 `Connection` header 与当前尾斜杠路径语义。
- Dockerfile 移除未监听的 `EXPOSE 443`；admin/auth/create-app 模板同步。
- HTTP/2 不代表无限并发；先保留 Nginx 默认并发 Stream 配置，再依据 gateway 容量调整。

## HTTP/1.1 兼容策略

- 不在全局 net 中探测 HTTP 版本或维护 6 请求信号量；浏览器负责 HTTP/1.1 排队。
- 使用 Query 去重、缓存、过期请求取消、条件查询和页面懒加载减少无效 fan-out。
- N+1 场景优先通过批量接口/BFF 聚合解决。
- 只有明确的批处理业务可在自己的 Hook 中使用 `runWithConcurrency(tasks, 4)`；该能力不影响普通请求。

## 迁移顺序

1. 共享 HTTP Client 与 admin/auth 兼容适配。
2. Query runtime、类型、错误和开发工具。
3. 平台应用管理与在线会话管理双试点。
4. admin-common → member/org → platform → security 逐批迁移。
5. HTTP/2 外层验证、容器 keepalive、旧 Hook 废弃与文档收尾。

旧 `usePaging/transformPageAPI/useConfirm*` 在本次迁移中保留并标记 deprecated；全仓调用清零后，
通过后续版本化 change 删除。

## 与 CONSTITUTION 符合性

| 原则 | 符合 | 说明 |
|------|------|------|
| Monorepo 边界 | ✅ | 跨 admin/auth 的无页面 HTTP 能力放入独立 package。 |
| 三层目录与依赖方向 | ✅ | apps/plugins 依赖 packages；共享 package 不反向依赖应用。 |
| API 层 | ✅ | 保持具名 `XxxAPI` 与显式 `Promise<R<T>>`。 |
| 类型安全 | ✅ | 新公共接口使用 `unknown` 和具体泛型，禁止 `any/as any`。 |
| 安全协议 | ✅ | 412 挑战、鉴权与 HYBRID 信封语义保持不变并增加测试。 |
| 施工门禁 | ✅ | 用户确认开工后由 `approved` 转为 `implementing`。 |
| 真相单一 | ✅ | 本 change 不维护后端 API 副本；完成后只更新已上线行为规格。 |

## 备选方案

### 所有 API 改成单例对象

未采用。对象没有独立实例状态或依赖注入价值，会降低按需导入、检索和渐进迁移清晰度。

### 用 TanStack Query 替换 Axios

未采用。Query 是服务端状态协调器，不负责 HTTP、安全协议和业务响应处理。

### 在全局请求层限制 6 并发

未采用。该数字是常见浏览器 HTTP/1.1 同源连接策略，不是业务容量契约；全局限制会损害 HTTP/2，
并可能造成优先级反转和长请求阻塞。

### 在应用容器直接启用 HTTP/2

未采用。当前容器不是公网 TLS 终止点，浏览器不会与它直接协商 ALPN；重复 TLS 会增加证书和运维复杂度。

## 开放问题

无。外层代理配置不在仓库内，但其配置获取与协议验证已作为实施依赖和验收项明确记录。
