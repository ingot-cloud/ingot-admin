# 密码登录

## 概述

登录应用密码预授权：用户只提交账号密码。若网关要求滑块挑战，由全局 412 拦截处理，页面不再预弹验证码。

## 相关源码

- [apps/ingot-login/src/pages/oauth2/challenge/password](../../../../apps/ingot-login/src/pages/oauth2/challenge/password)
- [apps/ingot-login/src/api/challenge.ts](../../../../apps/ingot-login/src/api/challenge.ts)
- [apps/ingot-login/src/components/challenge/ChallengeHost.vue](../../../../apps/ingot-login/src/components/challenge/ChallengeHost.vue)

## 对接接口

- [20260827-security-challenge-verification API](../../../changes/archive/2026/20260827-security-challenge-verification/API.md) §3

## 变更记录

| 日期 | 变更 ID | 说明 |
|------|---------|------|
| 2026-08-29 | [20260827-security-challenge-verification](../../../changes/archive/2026/20260827-security-challenge-verification/) | 登录不再预弹滑块；412 交全局拦截 |
