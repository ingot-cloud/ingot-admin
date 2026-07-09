# @ingot/crypto

信封加密（HYBRID）通用加解密与密钥管理，实现前端对接说明中的协议：

- 每次请求随机生成一次性内容密钥 CEK（AES-256-GCM，32 字节）；
- 用服务端公钥 `RSA-OAEP-256` 包裹 CEK 放入协议头；
- 请求体与响应体使用同一 CEK + AAD 加解密；
- 公钥缓存与轮换由 `KeyStore` 管理，支持 sessionStorage 持久化（各子域独立），公钥拉取由使用方注入。

本包只依赖 WebCrypto（`crypto.subtle`），不含任何 HTTP 依赖。

支持 6 种加密粒度：请求 `whole` / `query` / `field`，响应 `data_only` / `full` / `field`，请求与响应方向相互独立。

## 使用

```typescript
import {
  KeyStore,
  createEnvelopeSession,
  encryptRequestContent,
  applyEncryptedRequest,
  decryptResponseBody,
} from "@ingot/crypto";

// 1. 注入公钥拉取函数，并启用 sessionStorage 持久化（刷新页面可复用）
const keyStore = new KeyStore({
  fetcher: async () => {
    const res = await Http.get("/crypto/public-keys", null, { permit: true });
    return res.data;
  },
  storageKey: "__ingot__:crypto:public-key",
});

// 2. 发送请求前握手（生成 CEK/AAD、协议头）
const { headers, context } = await createEnvelopeSession(keyStore);

// 3. POST：整体加密请求体
const encryptedBody = await encryptRequestContent(body, { mode: "whole" }, context);

// 3b. GET：加密 query 参数
const encryptedParams = await encryptRequestContent(params, { mode: "query" }, context);
// 或拦截器内统一：applyEncryptedRequest({ data, params }, option.request, context)

// 4. 收到响应后按响应方向模式解密（context 复用握手上下文）
const decrypted = await decryptResponseBody(response.data, { mode: "data_only" }, context);
```

完整对接说明见仓库 `docs/envelope-crypto.md`。

## 开发

```bash
# 构建
pnpm build

# 监听模式
pnpm dev

# 清理
pnpm clean
```
