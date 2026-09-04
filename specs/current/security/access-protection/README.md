# 访问防护

## 概述

安全中心「访问防护」单页：用 Tab 维护网关策略。本规格记录挑战策略 Tab 的页面行为；其它 Tab（路径分组、限流、名单等）为既有能力。

## 相关源码

- [plugins/security/src/pages/access-protection](../../../../plugins/security/src/pages/access-protection)
- [plugins/security/src/api/security/policy.ts](../../../../plugins/security/src/api/security/policy.ts)

## 对接接口

- [20260827-security-challenge-verification API](../../../changes/archive/2026/20260827-security-challenge-verification/API.md)

## 变更记录

| 日期 | 变更 ID | 说明 |
|------|---------|------|
| 2026-08-29 | [20260827-security-challenge-verification](../../../changes/archive/2026/20260827-security-challenge-verification/) | 访问防护增加「挑战策略」Tab；策略 id 按字符串传递 |
| 2026-09-02 | [20260902-packages-admin-feature-app-split](../../../changes/archive/2026/20260902-packages-admin-feature-app-split/) | 页面迁入 security 插件；canonical `ingot.security.access.protection`，兼容旧 semantic / 文件键 |
| 2026-09-03 | [20260902-packages-view-path-canonical](../../../changes/archive/2026/20260902-packages-view-path-canonical/) | canonical 改为 `security.access.protection`，去掉 legacy 别名 |
| 2026-09-04 | [20260903-packages-network-query-modernization](../../../changes/archive/2026/20260903-packages-network-query-modernization/) | 策略面板改为 Query 管理服务端状态；挑战执行链路仍命令式 |
