# 平台能力与页面归属

## 概述

平台治理承载字典等系统设置，安全中心和 App 用户管理各有独立平台应用。字段策略归 org，平台和组织授权审计各有包装页，复用无路由的公共审计组件。

## 相关源码

- [字典管理](../../../../plugins/platform/src/pages/settings/dictionaries)
- [平台授权审计](../../../../plugins/platform/src/pages/iam/authorization-audit)
- [组织授权审计](../../../../plugins/org/src/pages/iam/authorization-audit)
- [组织资源字段策略](../../org/field-policy/README.md)
- [公共授权审计](../../../../packages/admin-common/src/components/authorization-audit)
- [安全中心](../../../../plugins/security/src/pages)
- [App 用户管理](../../../../plugins/member/src/pages)
- [页面注册约定](../../../../docs/menu-view-path.md)

## 对接接口

- [20261012-iam-platform-capability-completion API](../../../changes/archive/2026/20261012-iam-platform-capability-completion/API.md)
- [App 用户管理 API](../../../changes/archive/2026/20261106-member-platform-application/API.md)

## 变更记录

| 日期 | 变更 ID | 说明 |
| --- | --- | --- |
| 2026-10-13 | [20261012-iam-platform-capability-completion](../../../changes/archive/2026/20261012-iam-platform-capability-completion/) | 用户确认验证完成；固化八页入口、插件归属与精确权限并归档 |
| 2026-11-06 | [20261024-org-remove-directory-browse](../../../changes/archive/2026/20261024-org-remove-directory-browse/README.md) · [20261027-org-field-policy](../../../changes/archive/2026/20261027-org-field-policy/README.md) | 普通通讯录退出，组织字段策略按资源配置 |
| 2026-11-06 | [20261106-member-platform-application](../../../changes/archive/2026/20261106-member-platform-application/README.md) | App 用户管理独立入口、精确权限与页面布局 |
