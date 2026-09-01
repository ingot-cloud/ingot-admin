# 访问防护

## 概述

安全中心「访问防护」单页：用 Tab 维护网关策略。本规格记录挑战策略 Tab 的页面行为；其它 Tab（路径分组、限流、名单等）为既有能力。

## 相关源码

- [apps/admin/src/pages/platform/security/access-protection](../../../../apps/admin/src/pages/platform/security/access-protection)
- [apps/admin/src/api/platform/security/policy.ts](../../../../apps/admin/src/api/platform/security/policy.ts)

## 对接接口

- [20260827-security-challenge-verification API](../../../changes/archive/2026/20260827-security-challenge-verification/API.md)

## 变更记录

| 日期 | 变更 ID | 说明 |
|------|---------|------|
| 2026-08-29 | [20260827-security-challenge-verification](../../../changes/archive/2026/20260827-security-challenge-verification/) | 访问防护增加「挑战策略」Tab；策略 id 按字符串传递 |
