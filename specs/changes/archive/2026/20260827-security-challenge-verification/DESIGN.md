# 设计：挑战验证

接口字段表见 [API.md](./API.md)，此处只写前端怎么做。

## 技术方案

两块：

1. **管理台**：访问防护「挑战策略」Tab，CRUD 对齐限流规则。写成功提示「规则将在数秒内生效」。
2. **全局 412**：`ingot-login` 与 `ingot-admin` 的 axios **统一拦截** HTTP 412 + `CHALLENGE_REQUIRED`。拉码 / 验码 / 重试 Header **全部使用本次 412 的 `data` 字段**，禁止写死 `/vc/image`、`In-Vc-Scope`、`In-Vc-Pass-Token`。

解析、队列、路径拼接放 `@ingot/utils`（跨 app 不复制）。滑块 UI 仍用各 app 已有 `verifition`，由根组件 `ChallengeHost` 承接拦截器。

鉴权：管理台不设置 `Authorization`。412 体可能用 `msg`，拦截器兼容 `message` / `msg`。不要把 412 当普通失败 toast。

菜单不改。

## 对接映射

| 接口（见 API.md） | 前端 | 说明 |
|-------------------|------|------|
| GET/POST/PUT `/challenges`，DELETE `/challenges/{id}` | `api/platform/security/policy.ts`；访问防护 Tab | 前缀 `/api/security` |
| GET `/groups` | 既有 `GetEndpointGroupsAPI` | 抽屉选分组 |
| POST `.../broadcast-invalidation` | 既有 `BroadcastPolicyInvalidationAPI` | 页头强制刷新 |
| 任意经网关业务请求 | 两端 axios 响应拦截器 | 412 时暂停、弹滑块、按 `data` 验码、原样重试 |
| `GET /vc/{vcType}` | `verifition` `reqGet(url)`，url = `/api/vc/{data.vcType}` | `skipChallenge`，不套 412 |
| `POST {checkPath}` | `reqCheck(url)`，url = `/api` + `data.checkPath` | Header `{scopeParam}: {scope}`；token 读 `data[passTokenParam]` |

不要请求 `/inner/**`、`/vc/slider/**`。PassToken / scope **只放 Header**，不写 query、不写 JSON body。

## 数据模型

- 管理台：`GatewayChallengePolicy`、`ChallengeTriggerEnum`、`ChallengeTypeEnum`、`AccessProtectionTabEnum.CHALLENGE`（不变）
- 共享：`@ingot/utils` 的 `ChallengeRequiredData`（`vcType` / `checkPath` / `scope` / `scopeParam` / `passTokenParam` 全部必填；缺任一字段不当作挑战）
- 不再在登录 models 里维护默认 `In-Vc-*` 常量

## 组件与页面影响

### 管理台访问防护

路径与抽屉交互与上一版相同（表格 + 抽屉 + 分组/路径二选一 + `/vc` 校验）。

### 全局 412

```text
packages/utils/src/challenge.ts     # 解析、/vc 判定、Header 拼接、同 scope 队列、重试上限 2
apps/{login,admin}/src/
├── net/interceptor/...             # 捕获 412，restore 明文后重试
├── components/challenge/ChallengeHost.vue
└── components/verifition/          # 拉码/验码 URL 与 Header 名来自 412
```

`App.vue` 挂载 `ChallengeHost`。`bindChallengeSolver` 在 Host `onMounted` 注册。

处理规则：

1. HTTP 412 **且** `code === CHALLENGE_REQUIRED` **且** `data` 五字段齐全 → 进入挑战；否则当普通错误
2. URL 匹配 `/vc` 或 `skipChallenge` → 不拦截
3. 同一时刻只弹一个滑块；相同 `scope` 共用一次验码 token；不同 scope 串行，禁止混用 token
4. 重试：原 method / path / body 不变；Header 增加 `{passTokenParam}`、`{scopeParam}`（头名来自本次 `data`）；信封加密先恢复 `__cryptoPlainData` / `__cryptoPlainParams` 再走请求拦截器，挑战头不进加密 query
5. 验码失败不重试业务请求；用户关闭滑块则原请求失败
6. 仍 412 则再挑战，最多 2 次

登录页：只提交账号密码，**不再**自己处理 412。`LoginAPI` 去掉 PassToken 参数与 `manualProcessingFailure`。

## 与 CONSTITUTION 符合性

| 原则 | 符合 | 说明 |
|------|------|------|
| 页面四件套 | ✅ | 访问防护沿用 |
| API 层 XxxAPI + request | ✅ | |
| 类型安全、无 any | ✅ | |
| UnoCSS、无 scss | ✅ | |
| 跨 app 不复制 | ✅ | 412 契约与队列在 `@ingot/utils`；verifition 仍各 app 一份（历史遗留，本期不抽 SDK） |
| 输入先行 | ✅ | 按用户更新后的 API.md |

## 备选方案

- 只在登录页处理 412：未采纳。API 要求所有经网关请求统一拦截。
- 写死 `/vc/image` 与 `In-Vc-*`：未采纳。必须以 412 `data` 为准。
- 把 anji 滑块抽到 packages：未采纳。改动面过大。

## 开放问题

- [x] 全局拦截，字段全部动态
- [ ] 若 check 成功信封仍混用 anji `repCode`，实现按 `data[passTokenParam]` 优先，并兼容
