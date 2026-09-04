# @ingot/http-client

无 Vue / Pinia / Element Plus 依赖的 HTTP Client 底座。负责 Axios 实例、响应归一化、错误分类、取消与可组合拦截器。

应用差异（鉴权、提示、进度条、信封加密、412 挑战）由 admin / auth 适配器注入。

## 安装

```bash
pnpm add @ingot/http-client
```

## 使用

```typescript
import { createHttpClient, ApiError } from "@ingot/http-client";

const http = createHttpClient({
  timeout: 10_000,
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
