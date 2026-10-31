# 网关挑战

## 概述

平台/租户管理宿主内的登录与业务请求 对经网关请求统一拦截 HTTP 412 `CHALLENGE_REQUIRED`，按响应 `data` 动态拉码 / 验码，并用 Header 携带 PassToken 与 scope 重试原请求。

## 相关源码

- [packages/shared/src/challenge.ts](../../../../packages/shared/src/challenge.ts)
- [packages/admin-core/src/net/challenge.ts](../../../../packages/admin-core/src/net/challenge.ts)
- [packages/admin-core/src/components/challenge/ChallengeHost.vue](../../../../packages/admin-core/src/components/challenge/ChallengeHost.vue)

## 对接接口

- [20260827-security-challenge-verification API](../../../changes/archive/2026/20260827-security-challenge-verification/API.md) §3

## 变更记录

| 日期 | 变更 ID | 说明 |
|------|---------|------|
| 2026-08-29 | [20260827-security-challenge-verification](../../../changes/archive/2026/20260827-security-challenge-verification/) | 全局 412 拦截；PassToken / scope 走 Header |

- [同源登录](../../ingot-login/password-login/spec.md)：两个管理宿主各只挂载一个全局挑战宿主，独立登录App已退役。
