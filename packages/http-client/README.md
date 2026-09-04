# @ingot/http-client

无 Vue / Pinia / Element Plus 依赖的 HTTP 传输底座。负责 Axios 实例、`R<T>` 归一化、`ApiError`、取消与可组合拦截器。

管理台业务请使用 `@ingot/admin-core` 的 `request`，不要在插件里直接 `createHttpClient`。完整说明见 [docs/network.md](../../docs/network.md)。

## 安装

```bash
pnpm add @ingot/http-client
```

## 使用

```typescript
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
    onStart: () => {
      /* 前台进度开始 */
    },
    onEnd: () => {
      /* 前台进度结束 */
    },
  },
});

const result = await http.get<{ id: string }>("/api/example");
```

单次请求选项：`signal`、`feedback: "silent"`、`progress: "silent"`。
