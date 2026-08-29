# 网关挑战规格

本文写已上线的客户端行为；接口细节见归档 [API.md](../../../changes/archive/2026/20260827-security-challenge-verification/API.md) §3。

## 概述

凡经网关的前端请求（登录、管理台业务 API）遇到 HTTP 412 且 `code === "CHALLENGE_REQUIRED"` 时，由 axios 全局拦截：暂停原请求、弹滑块、按本次 `data` 拉码验码，再原样重试。不要只在登录页处理，也不要把 412 当普通失败 toast。

## 范围

### In Scope

- `ingot-login` 与 `ingot-admin` 的 axios 412 拦截
- 根组件 `ChallengeHost` + 既有 verifition 滑块
- `@ingot/utils` 契约解析、同 scope 队列、重试上限 2

### Out of Scope

- 把 anji 滑块 SDK 抽到 `packages/`
- SMS / EMAIL 挑战、`/vc/slider/**`
- 把 PassToken 写入 JSON body 或 query

## 用户场景

### 场景 1：任意请求遇到 412

- **角色**：登录用户或未登录用户
- **前置条件**：网关挑战开关开启，请求匹配策略且无有效 PassToken
- **步骤**：原请求发出 → 412 → 全局弹一次滑块 → `GET /api/vc/{vcType}` → `POST /api{checkPath}` 带 Header `{scopeParam}: {scope}` → 从验码 `data[passTokenParam]` 取值 → 原请求 Header 追加 token 与 scope 后重试
- **预期结果**：业务 JSON 不变；URL 与 Header 名以后端本次 `data` 为准。滑块失败不重试业务请求。403 / 429 不当成验证码

### 场景 2：挑战关闭或字段不完整

- **角色**：任意用户
- **前置条件**：开关关闭，或 412 `data` 五字段缺一
- **步骤**：发起请求
- **预期结果**：不弹滑块；按原成功/失败处理。不要预发验证码

## 功能需求

### REQ-001：统一拦截判定

系统 SHALL 仅在 HTTP 412 且 `code === "CHALLENGE_REQUIRED"` 且 `data` 含 `vcType` / `checkPath` / `scope` / `scopeParam` / `passTokenParam` 时进入挑战。

**验收标准：**

- [x] 缺字段不当作挑战
- [x] `/vc/**` 与 `skipChallenge` 不套 412 拦截

### REQ-002：动态契约与 Header 重试

系统 SHALL 用本次 412 `data` 组装拉码/验码 URL 与 Header 名，禁止写死 `/vc/image`、`In-Vc-Scope`、`In-Vc-Pass-Token`。PassToken 与 scope 只放 Header。

**验收标准：**

- [x] 拉码 `GET /api/vc/{vcType}`
- [x] 验码 Header `{scopeParam}: {scope}`；token 读 `data[passTokenParam]`
- [x] 重试原 method / path / body，Header 增加 token 与 scope
- [x] 信封加密重试前恢复明文 body/query，挑战头不进加密 query

### REQ-003：并发与重试上限

系统 SHALL 同一时刻只弹一个滑块；相同 `scope` 共用一次 token；不同 scope 串行且禁止混用。仍 412 则再挑战，最多 2 次。

**验收标准：**

- [x] 同 scope 共用；不同 scope 不混用
- [x] 验码失败 / 用户关闭不重试原请求

## 非功能需求

- 412 体兼容 `message` / `msg`
- 管理台不传 Bearer Token

## 依赖与约束

- 接口 §3 见归档 [API.md](../../../changes/archive/2026/20260827-security-challenge-verification/API.md)
- 登录页不再单独处理 412，见 [密码登录](../../ingot-login/password-login/spec.md)
- 挑战策略配置见 [访问防护](../../security/access-protection/spec.md)

## 验收标准

- [x] login 与 admin 均拦截 412 + `CHALLENGE_REQUIRED`
- [x] PassToken / scope 只出现在 Header；`/vc/**` 不套拦截
