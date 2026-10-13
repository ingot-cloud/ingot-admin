# 会话管理

## 概述

安全中心 `/security/sessions` 查询/下线在线会话，并维护并发会话策略。Tab 按精确读取权限开放，仅激活面板请求；并发策略详情默认预览。

## 相关源码

- [plugins/security/src/pages/sessions](../../../../plugins/security/src/pages/sessions)
- [plugins/security/src/api/security/session.ts](../../../../plugins/security/src/api/security/session.ts)
- [plugins/security/src/api/security/session.query.ts](../../../../plugins/security/src/api/security/session.query.ts)
- [plugins/security/src/api/security/concurrencyPolicy.ts](../../../../plugins/security/src/api/security/concurrencyPolicy.ts)

## 对接接口

- [20260820-security-session-management API](../../../changes/archive/2026/20260820-security-session-management/API.md)

- [平台能力与精确权限矩阵](../../../changes/archive/2026/20261012-iam-platform-capability-completion/API.md)
- [安全中心页面交互](../../../changes/archive/2026/20261012-security-page-interactions/API.md)

## 变更记录

| 日期 | 变更 ID | 说明 |
|------|---------|------|
| 2026-08-20 | [20260820-security-session-management](../../../changes/archive/2026/20260820-security-session-management/) | 对接会话查询/下线与并发策略，替代旧 `/auth/token/**` |
| 2026-09-02 | [20260902-packages-admin-feature-app-split](../../../changes/archive/2026/20260902-packages-admin-feature-app-split/) | 页面迁入 security 插件；canonical `ingot.security.sessions`，兼容旧 semantic / 文件键 |
| 2026-09-03 | [20260902-packages-view-path-canonical](../../../changes/archive/2026/20260902-packages-view-path-canonical/) | canonical 改为 `security.sessions`，去掉 legacy 别名 |
| 2026-09-04 | [20260903-packages-network-query-modernization](../../../changes/archive/2026/20260903-packages-network-query-modernization/) | 会话列表/详情与并发策略迁 Query；`staleTime: 0`；下线后按 Key 失效 |
| 2026-09-07 | [20260904-common-admin-ui-rollout](../../../changes/archive/2026/20260904-common-admin-ui-rollout/) | Settings 呈现：会话表与并发策略表接入 `InTable`；查询前置与 GLOBAL 约束不变 |
| 2026-10-13 | [20261012-iam-platform-capability-completion](../../../changes/archive/2026/20261012-iam-platform-capability-completion/) | 正式会话入口、精确 session/session-policy 权限 |
| 2026-10-13 | [20261012-security-page-interactions](../../../changes/archive/2026/20261012-security-page-interactions/) | 激活请求、并发策略默认预览与抽屉草稿保护；用户验收完成 |
