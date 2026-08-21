# 会话管理

## 概述

安全中心「在线用户」页：查询/下线在线会话，并维护并发会话策略。路由与菜单不变。

## 相关源码

- [apps/ingot-admin/src/pages/platform/security/onlinetoken](../../../../apps/ingot-admin/src/pages/platform/security/onlinetoken)
- [apps/ingot-admin/src/api/platform/security/session.ts](../../../../apps/ingot-admin/src/api/platform/security/session.ts)
- [apps/ingot-admin/src/api/platform/security/concurrencyPolicy.ts](../../../../apps/ingot-admin/src/api/platform/security/concurrencyPolicy.ts)

## 对接接口

- [20260820-security-session-management API](../../../changes/archive/2026/20260820-security-session-management/API.md)

## 变更记录

| 日期 | 变更 ID | 说明 |
|------|---------|------|
| 2026-08-20 | [20260820-security-session-management](../../../changes/archive/2026/20260820-security-session-management/) | 对接会话查询/下线与并发策略，替代旧 `/auth/token/**` |
