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
- [资源目录与授权 API](../../../changes/archive/2026/20261106-base-resource-catalog/API.md)
- [授权审计游标 API](../../../changes/archive/2026/20261024-base-authorization-audit-readable/API.md)
- [平台全局账号选择 API](../../../changes/archive/2026/20261106-base-account-picker/API.md)
- [20261109 用户组摘要接口与实现验收](../../../changes/archive/2026/20261109-iam-post-login-read-performance/API.md)
- [平台用户组首屏现场对照](../../../../../ingot/specs/changes/archive/2026/20261110-iam-post-login-release-acceptance/VALIDATION.md#页面-p95-正式对照)

## 变更记录

| 日期 | 变更 ID | 说明 |
| --- | --- | --- |
| 2026-10-13 | [20261012-iam-platform-capability-completion](../../../changes/archive/2026/20261012-iam-platform-capability-completion/) | 用户确认验证完成；固化八页入口、插件归属与精确权限并归档 |
| 2026-11-06 | [20261024-org-remove-directory-browse](../../../changes/archive/2026/20261024-org-remove-directory-browse/README.md) · [20261027-org-field-policy](../../../changes/archive/2026/20261027-org-field-policy/README.md) | 普通通讯录退出，组织字段策略按资源配置 |
| 2026-11-06 | [20261106-member-platform-application](../../../changes/archive/2026/20261106-member-platform-application/README.md) | App 用户管理独立入口、精确权限与页面布局 |
| 2026-11-07 | [20261106-base-resource-catalog](../../../changes/archive/2026/20261106-base-resource-catalog/README.md) | 更新资源编码、平台用户组、权限诊断、图片上传及工作台门禁 |
| 2026-11-07 | [20261024-base-authorization-audit-readable](../../../changes/archive/2026/20261024-base-authorization-audit-readable/README.md) | 两域审计按游标翻页，按可见性展示名称与差异 |
| 2026-11-07 | [20261106-base-account-picker](../../../changes/archive/2026/20261106-base-account-picker/README.md) | 平台创建流程复用全局账号选择器，按用途过滤候选 |
