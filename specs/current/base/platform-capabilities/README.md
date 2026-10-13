# 平台能力与页面归属

## 概述

平台治理承载字典等系统设置，安全中心作为独立平台应用。成员访问策略归 org，平台和组织授权审计各有包装页，复用无路由的公共审计组件。

## 相关源码

- [字典管理](../../../../plugins/platform/src/pages/settings/dictionaries)
- [平台授权审计](../../../../plugins/platform/src/pages/iam/authorization-audit)
- [组织授权审计](../../../../plugins/org/src/pages/iam/authorization-audit)
- [成员访问策略](../../../../plugins/org/src/pages/iam/member-policies)
- [公共授权审计](../../../../packages/admin-common/src/components/authorization-audit)
- [安全中心](../../../../plugins/security/src/pages)
- [页面注册约定](../../../../docs/menu-view-path.md)

## 对接接口

- [20261012-iam-platform-capability-completion API](../../../changes/archive/2026/20261012-iam-platform-capability-completion/API.md)

## 变更记录

| 日期 | 变更 ID | 说明 |
| --- | --- | --- |
| 2026-10-13 | [20261012-iam-platform-capability-completion](../../../changes/archive/2026/20261012-iam-platform-capability-completion/) | 用户确认验证完成；固化八页入口、插件归属与精确权限并归档 |
