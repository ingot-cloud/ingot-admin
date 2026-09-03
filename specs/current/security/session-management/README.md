# 会话管理

## 概述

安全中心「在线用户」页：查询/下线在线会话，并维护并发会话策略。路由与菜单不变。

## 相关源码

- [plugins/security/src/pages/sessions](../../../../plugins/security/src/pages/sessions)
- [plugins/security/src/api/security/session.ts](../../../../plugins/security/src/api/security/session.ts)
- [plugins/security/src/api/security/concurrencyPolicy.ts](../../../../plugins/security/src/api/security/concurrencyPolicy.ts)

## 对接接口

- [20260820-security-session-management API](../../../changes/archive/2026/20260820-security-session-management/API.md)

## 变更记录

| 日期 | 变更 ID | 说明 |
|------|---------|------|
| 2026-08-20 | [20260820-security-session-management](../../../changes/archive/2026/20260820-security-session-management/) | 对接会话查询/下线与并发策略，替代旧 `/auth/token/**` |
| 2026-09-02 | [20260902-packages-admin-feature-app-split](../../../changes/archive/2026/20260902-packages-admin-feature-app-split/) | 页面迁入 security 插件；canonical `ingot.security.sessions`，兼容旧 semantic / 文件键 |
| 2026-09-03 | [20260902-packages-view-path-canonical](../../../changes/archive/2026/20260902-packages-view-path-canonical/) | canonical 改为 `security.sessions`，去掉 legacy 别名 |
