# 设计：在线会话与并发策略

接口字段表见 [API.md](./API.md)，此处只写前端怎么做。

## 技术方案

在既有「安全中心 / 在线用户」页（`/platform/security/onlinetoken`）内用 Tab 承载会话列表与并发策略，不新增路由。会话列表改为扁平表格；下线改走 `sid` 与 query 参数。

鉴权：前端不设置 `Authorization`。axios 同源请求带 session cookie，网关换 token 后转发。成功码沿用拦截器 `S0200`，不按文档示例 `"0"` 特判。

按用户下线必须 `request.delete(url, null, { params })`，避免 `Http.delete` 把参数放进 body。

## 对接映射

| 接口（见 API.md） | 前端 | 说明 |
|-------------------|------|------|
| GET/DELETE `/platform/security/sessions` | `api/platform/security/session.ts`：`SessionPageAPI`、`GetSessionAPI`、`RevokeSessionBySidAPI`、`RevokeSessionsByUserAPI`；页面 `pages/platform/security/onlinetoken` | 前缀 `/api/security` |
| CRUD `/platform/security/session/concurrency-policies` | `api/platform/security/concurrencyPolicy.ts`；同页并发策略 Tab | 前缀 `/api/security` |
| GET `/auth/client/page` | 既有 `ClientPageAPI` + `ClientSelect` | 本页 `value-field="clientId"` |

## 数据模型

- `models/session.ts`：`PlatformSessionVO`、`PlatformSessionQueryDTO`、`PlatformUserSessionRevokeDTO`、`SessionConcurrencyPolicy`
- `models/enums/sessionEnums.ts`：页面 Tab、`UserType`、策略 `scope` / `overflow` / `dimension`
- `TokenAuthMethod` 文案改为多会话 / 单会话（客户端管理页共用）
- 删除旧 `models/token.ts` 与 `api/platform/auth/token.ts`

## 组件与页面影响

```text
pages/platform/security/onlinetoken/
├── IndexPage.vue
├── table.ts
├── useOps.ts
├── useConcurrencyPolicy.ts
├── policyTable.ts
└── components/
    ├── SessionListPanel.vue
    ├── SessionDetailDrawer.vue
    ├── ConcurrencyPolicyPanel.vue
    └── ConcurrencyPolicyDrawer.vue
```

- 路由 / 菜单 path 不变
- `ClientSelect` 增加可选 `valueField`；无 `platform:develop:client:query` 且非超级管理员时手填 clientId
- 会话时间：ISO-8601 UTC → 本地 `yyyy-MM-dd HH:mm:ss`；策略时间直接展示

## 与 CONSTITUTION 符合性

| 原则 | 符合 | 说明 |
|------|------|------|
| 页面四件套 | ✅ | IndexPage + table + useOps + components；策略另有 policyTable / useConcurrencyPolicy |
| API 层 XxxAPI + request | ✅ | 新模块 `import request from "@/net"` |
| 类型安全、无 any | ✅ | 新代码禁止 any |
| UnoCSS、无 scss | ✅ | |
| 输入先行、施工门禁 | ✅ | inbox 已生成 change，本计划确认后 implementing |
| 不提前改 current | ✅ | 验收后再归档 |

## 备选方案

- 按 userId 客户端分组保留旧「用户行可展开」视觉：未采纳。接口已扁平化，分组会让 sid 下线入口不直观。
- 并发策略独立菜单：未采纳。API 要求挂在既有在线用户页下。

## 开放问题

- [x] 范围包含 Phase 04 并发策略 Tab（用户确认）
