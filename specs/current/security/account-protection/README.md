# 账号保护

## 概述

安全中心 `/security/account-protection` 用 B/C 两个页级 Tab 独立维护登录失败自动锁定策略。默认 B 端，激活才读取，已有配置默认预览，正文居中且窄容器自动收缩。

## 相关源码

- [plugins/security/src/pages/account-protection](../../../../plugins/security/src/pages/account-protection)
- [plugins/security/src/api/security/accountLockoutPolicy.ts](../../../../plugins/security/src/api/security/accountLockoutPolicy.ts)

## 对接接口

- [20260825-security-account-protection API](../../../changes/archive/2026/20260825-security-account-protection/API.md)

- [平台能力与精确权限矩阵](../../../changes/archive/2026/20261012-iam-platform-capability-completion/API.md)
- [安全中心页面交互](../../../changes/archive/2026/20261012-security-page-interactions/API.md)

- [B/C 策略单项读取与独立保存](../../../changes/archive/2026/20261012-common-centered-form-layout/API.md)

## 变更记录

| 日期 | 变更 ID | 说明 |
|------|---------|------|
| 2026-08-25 | [20260825-security-account-protection](../../../changes/archive/2026/20260825-security-account-protection/) | 新增账号保护页与账号锁定 Tab（B / C 两栏策略） |
| 2026-09-02 | [20260902-packages-admin-feature-app-split](../../../changes/archive/2026/20260902-packages-admin-feature-app-split/) | 页面迁入 security 插件；canonical `ingot.security.account.protection`，兼容旧 semantic / 文件键 |
| 2026-09-03 | [20260902-packages-view-path-canonical](../../../changes/archive/2026/20260902-packages-view-path-canonical/) | canonical 改为 `security.account.protection`，去掉 legacy 别名 |
| 2026-09-04 | [20260903-packages-network-query-modernization](../../../changes/archive/2026/20260903-packages-network-query-modernization/) | 锁定策略改为 Query 读取，保存后按 Key 失效 |
| 2026-09-07 | [20260904-common-admin-ui-rollout](../../../changes/archive/2026/20260904-common-admin-ui-rollout/) | Settings 呈现：固定页面头与局部 Tab；B/C 独立保存不变 |
| 2026-10-13 | [20261012-iam-platform-capability-completion](../../../changes/archive/2026/20261012-iam-platform-capability-completion/) | 正式安全应用与入口、精确 read/update 权限 |
| 2026-10-13 | [20261012-security-page-interactions](../../../changes/archive/2026/20261012-security-page-interactions/) | 默认预览、激活请求与独立保存 |
| 2026-10-13 | [20261012-common-centered-form-layout](../../../changes/archive/2026/20261012-common-centered-form-layout/) | B/C 两个页级 Tab、独立草稿和 840px 居中正文；用户验收完成 |
