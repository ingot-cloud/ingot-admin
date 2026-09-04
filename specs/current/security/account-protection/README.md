# 账号保护

## 概述

安全中心「账号保护」单页：用 Tab 维护账号相关安全策略。当前仅「账号锁定」Tab，分别配置 B 端管理员与 C 端会员的登录失败自动锁定策略。

## 相关源码

- [plugins/security/src/pages/account-protection](../../../../plugins/security/src/pages/account-protection)
- [plugins/security/src/api/security/accountLockoutPolicy.ts](../../../../plugins/security/src/api/security/accountLockoutPolicy.ts)

## 对接接口

- [20260825-security-account-protection API](../../../changes/archive/2026/20260825-security-account-protection/API.md)

## 变更记录

| 日期 | 变更 ID | 说明 |
|------|---------|------|
| 2026-08-25 | [20260825-security-account-protection](../../../changes/archive/2026/20260825-security-account-protection/) | 新增账号保护页与账号锁定 Tab（B / C 两栏策略） |
| 2026-09-02 | [20260902-packages-admin-feature-app-split](../../../changes/archive/2026/20260902-packages-admin-feature-app-split/) | 页面迁入 security 插件；canonical `ingot.security.account.protection`，兼容旧 semantic / 文件键 |
| 2026-09-03 | [20260902-packages-view-path-canonical](../../../changes/archive/2026/20260902-packages-view-path-canonical/) | canonical 改为 `security.account.protection`，去掉 legacy 别名 |
| 2026-09-04 | [20260903-packages-network-query-modernization](../../../changes/archive/2026/20260903-packages-network-query-modernization/) | 锁定策略改为 Query 读取，保存后按 Key 失效 |
