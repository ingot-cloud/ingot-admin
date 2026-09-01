# 网关挑战

## 概述

login 与 admin 对经网关请求统一拦截 HTTP 412 `CHALLENGE_REQUIRED`，按响应 `data` 动态拉码 / 验码，并用 Header 携带 PassToken 与 scope 重试原请求。

## 相关源码

- [packages/utils/src/challenge.ts](../../../../packages/utils/src/challenge.ts)
- [apps/admin/src/net/challenge.ts](../../../../apps/admin/src/net/challenge.ts)
- [apps/auth/src/net/challenge.ts](../../../../apps/auth/src/net/challenge.ts)
- [apps/admin/src/components/challenge/ChallengeHost.vue](../../../../apps/admin/src/components/challenge/ChallengeHost.vue)
- [apps/auth/src/components/challenge/ChallengeHost.vue](../../../../apps/auth/src/components/challenge/ChallengeHost.vue)

## 对接接口

- [20260827-security-challenge-verification API](../../../changes/archive/2026/20260827-security-challenge-verification/API.md) §3

## 变更记录

| 日期 | 变更 ID | 说明 |
|------|---------|------|
| 2026-08-29 | [20260827-security-challenge-verification](../../../changes/archive/2026/20260827-security-challenge-verification/) | 全局 412 拦截；PassToken / scope 走 Header |
