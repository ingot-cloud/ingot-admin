# 网络请求

管理台业务代码通过 `@ingot/admin-core` 的 `request` / `Http` 发请求。`@ingot/http-client` 只做传输、归一化、错误分类和可组合拦截器，不含 Vue / Pinia / Element Plus。

详细 API 写法见 [api-conventions.md](../.agents/skills/ingot-coding-standards/api-conventions.md)。信封协议见 [envelope-crypto.md](./envelope-crypto.md)。

## 分层

```text
页面 XxxAPI / useServerPaging
    ↓
admin-core net（默认入口）：鉴权头、信封、412、全局提示、进度条
    ↓
@ingot/http-client：Axios、R<T>、ApiError、取消、拦截器排序
```

| 层 | 谁用 | 职责 |
|----|------|------|
| `@ingot/http-client` | admin-core、auth 适配器 | `createHttpClient`、拦截器工厂、`RequestOptions`、`ApiError` |
| `@ingot/admin-core` 的 net | 管理台 App、官方插件、业务页面 | 单例 `request`，内置 Header / Envelope / Challenge |
| `apps/auth` 的 net | 登录应用 | 自己组 `createHttpClient`，不是 `bootstrapAdminApp` |

插件和页面不要直接 `createHttpClient`。统一：

```ts
import request from "@/net";
// 或
import { request } from "@ingot/admin-core";
```

## @ingot/http-client

```ts
import {
  createHttpClient,
  defineRequestInterceptor,
  InterceptorOrder,
  ApiError,
} from "@ingot/http-client";

const http = createHttpClient({
  timeout: 10_000,
  interceptors: {
    request: [
      defineRequestInterceptor({
        name: "trace",
        order: InterceptorOrder.request.header + 2,
        resolved(config) {
          return config;
        },
      }),
    ],
  },
  hooks: {
    onBusinessFailure: (error) => {
      /* 适配器提示，package 本身不弹 UI */
    },
  },
});

const result = await http.get<{ id: string }>("/api/example");
```

### RequestOptions

| 选项 | 含义 |
|------|------|
| `signal` | 外部 AbortSignal，优先于 CancelManager |
| `feedback: "silent"` | 不走全局失败提示 |
| `progress: "silent"` | 不计入前台进度 |

没有 `manualProcessingFailure` / `manualProcessingAbort`。

### 拦截器

`defineRequestInterceptor` / `defineResponseInterceptor`：`order` 为数字，`rejected` 可省略（默认 `Promise.reject`）。

- 请求与响应都是 **order 越小越先执行**（不是洋葱反向，响应也不是越大越先）
- 请求：小 → 大 → 网络
- 响应：网络 → 小 → 大 → 调用方
- 同 order 时保持传入顺序（先 core 后 App）

内置槽位见 `InterceptorOrder`（http-client）/ `AdminNetInterceptorOrder`（admin-core 再导出）。`shouldBypassError` 为 true 时（如 412）不转成 `ApiError`，交给后续拦截器。

失败归一化为 `ApiError`，`kind` 为 `business` / `http` / `network` / `timeout` / `cancelled`。

## admin-core net

`bootstrapAdminApp` 调用 `Http.configure(net)`：写入 `baseURL` / 超时，并**重建** client，合并 App 追加的拦截器。412 重试会重新绑定到新实例。

内置拦截器：

| 方向 | name | 常量 | 作用 |
|------|------|------|------|
| 请求 | header | `AdminNetInterceptorOrder.request.header` | 可选设备指纹 `In-Ca-Sig` |
| 请求 | envelope | `AdminNetInterceptorOrder.request.envelope` | HYBRID 握手与加密 |
| 响应 | envelope | `AdminNetInterceptorOrder.response.envelope` | 解密（必须早于 normalize） |
| 响应 | challenge | `AdminNetInterceptorOrder.response.challenge` | 网关 412 |

failure hooks 由 core 处理：未授权登出、签退确认、其它业务/HTTP 失败 `Message.warning`。App 不能覆盖这些 hooks。

页面 API：

```ts
export function UserPageAPI(
  page: Page,
  condition?: UserFilterDTO,
  options?: RequestOptions,
): Promise<R<Page<SysUser>>> {
  return request.get<Page<SysUser>>(`${PATH}/page`, { ...page, ...condition }, options);
}
```

Query 请求用 `silentQueryRequest(signal)`（`feedback` / `progress` 均为 `silent`）。命令式写操作保持默认全局提示。

## App 只能追加拦截器

扩展点在 composition root，不在官方插件。

```ts
import {
  bootstrapAdminApp,
  defineRequestInterceptor,
  AdminNetInterceptorOrder,
} from "@ingot/admin-core";

await bootstrapAdminApp({
  appCode,
  plugins: createAdminPlugins(appCode),
  net: {
    baseURL: import.meta.env.VITE_APP_NET_BASE_URL || undefined,
    interceptors: {
      request: [
        defineRequestInterceptor({
          name: "tenant-trace",
          order: AdminNetInterceptorOrder.request.header + 2,
          resolved(config) {
            config.headers["X-Tenant-Trace"] = "…";
            return config;
          },
        }),
      ],
    },
  },
  // branding / login / …
});
```

| 允许 | 不允许 |
|------|--------|
| 按 order 追加请求/响应拦截器 | 替换、关闭、重排 Header / Envelope / Challenge |
| 单次请求 `feedback: "silent"` | 覆盖 `onUnauthorized` 等 hooks |
| 从 `@ingot/admin-core` 导入工厂 | 插件注册全局拦截器 |

预留 order（相对 `AdminNetInterceptorOrder` 插队，不要写死魔法数字）：

| 方向 | 常量 | 数值 | 用途 |
|------|------|------|------|
| 请求 | `request.lifecycle` | 1 | 进度 / 取消 |
| 请求 | `request.header` | 10 | Header |
| 请求 | `request.header + 1` … `request.envelope - 1` | 11–24 | App：加密前 |
| 请求 | `request.envelope` | 25 | Envelope 加密 |
| 请求 | `request.envelope + 1` 起 | 26+ | App：加密后 |
| 响应 | `response.lifecycle` | 1 | 进度 / 取消 |
| 响应 | `response.envelope` | 5 | Envelope 解密 |
| 响应 | `response.envelope + 1` … `response.normalize - 1` | 6–9 | App：业务码展开前 |
| 响应 | `response.normalize` | 10 | 业务码展开 |
| 响应 | `response.normalize + 1` … `response.challenge - 1` | 11–14 | App |
| 响应 | `response.challenge` | 15 | 412 Challenge |
| 响应 | `response.challenge + 1` 起 | 16+ | App：最外层 |

## 列表分页

列表只用 `useServerPaging` + 相邻 `*.query.ts`。输入变化不立刻请求；无参 `fetchData()` / `search()` 提交条件并回第一页。写成功后 `invalidateQueries`。

含手机号搜索同样走 Query。`snapshotQueryParams` 会剥掉明文 `phone` / `password` / `token` 等，并对剥掉的值写入 `_sensitive` 指纹，避免不同手机号命中同一缓存。`queryFn` 仍使用完整 condition。

登录、PKCE、412 执行、密码提交、上传下载保持命令式请求。
