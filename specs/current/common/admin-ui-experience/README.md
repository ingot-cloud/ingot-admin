# 管理台 UI 体验

## 概述

四个官方业务插件的列表、双栏、设置、概览和工具页使用同一套页面原型与操作分层。整页配置表单使用居中正文、默认预览与按需请求。当前平台与安全页面入口、权限归属见 [平台能力](../../base/platform-capabilities/spec.md)。

## 相关源码

- [plugins/platform/src/pages](../../../../plugins/platform/src/pages)
- [plugins/org/src/pages](../../../../plugins/org/src/pages)
- [plugins/member/src/pages](../../../../plugins/member/src/pages)
- [plugins/security/src/pages](../../../../plugins/security/src/pages)
- 共享组件契约：[packages/admin-core/src/components/README.md](../../../../packages/admin-core/src/components/README.md)
- 试点标准页：[plugins/org/src/pages/contacts/user](../../../../plugins/org/src/pages/contacts/user)

## 对接接口

本能力不新增后端接口。组织成员列表允许按 `UserQueryDTO.enabled` 筛选（全部不传，正常 `true`，已暂停 `false`）。声明见归档 [API.md](../../../changes/archive/2026/20260904-common-admin-ui-rollout/API.md)。各域原接口仍链到对应 capability 的归档 change。

- [当前入口与精确权限矩阵](../../../changes/archive/2026/20261012-iam-platform-capability-completion/API.md)
- [安全页按需读取与策略维护](../../../changes/archive/2026/20261012-security-page-interactions/API.md)
- [整页表单正文布局](../../../changes/archive/2026/20261012-common-centered-form-layout/API.md)
- [访问防护行操作](../../../changes/archive/2026/20261012-security-access-table-refinement/API.md)
- [登录失败维度选择](../../../changes/archive/2026/20261012-security-login-failure-dimension-selection/API.md)

## 变更记录

| 日期 | 变更 ID | 说明 |
|------|---------|------|
| 2026-09-07 | [20260904-common-admin-ui-rollout](../../../changes/archive/2026/20260904-common-admin-ui-rollout/) | 25 个官方插件页面迁入统一原型；成员管理为列表标准 |
| 2026-10-13 | [20261012-iam-platform-capability-completion](../../../changes/archive/2026/20261012-iam-platform-capability-completion/) | 平台与安全页面正式入口、插件归属和精确权限 |
| 2026-10-13 | [20261012-security-page-interactions](../../../changes/archive/2026/20261012-security-page-interactions/) | 安全四页激活请求、默认预览和容器边界 |
| 2026-10-13 | [20261012-common-centered-form-layout](../../../changes/archive/2026/20261012-common-centered-form-layout/) | 整页配置表单默认 840px 居中，账号 B/C 独立 Tab |
| 2026-10-13 | [20261012-security-access-table-refinement](../../../changes/archive/2026/20261012-security-access-table-refinement/) | 访问防护列表留白、列宽和更多删除 |
| 2026-10-13 | [20261012-security-login-failure-dimension-selection](../../../changes/archive/2026/20261012-security-login-failure-dimension-selection/) | 登录失败保护正文分段选择与草稿确认；用户验收完成 |
