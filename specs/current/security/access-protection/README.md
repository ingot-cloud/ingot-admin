# 访问防护

## 概述

安全中心 `/security/access-protection` 按授权 Tab 维护网关策略与登录失败保护。当前基线包含五种列表、策略预览/编辑、行内更多删除及正文内四维度分段选择。

## 相关源码

- [plugins/security/src/pages/access-protection](../../../../plugins/security/src/pages/access-protection)
- [plugins/security/src/api/security/policy.ts](../../../../plugins/security/src/api/security/policy.ts)

## 对接接口

- [20260827-security-challenge-verification API](../../../changes/archive/2026/20260827-security-challenge-verification/API.md)

- [平台能力与精确权限矩阵](../../../changes/archive/2026/20261012-iam-platform-capability-completion/API.md)
- [安全中心页面交互](../../../changes/archive/2026/20261012-security-page-interactions/API.md)

- [配置正文布局](../../../changes/archive/2026/20261012-common-centered-form-layout/API.md)
- [列表更多删除](../../../changes/archive/2026/20261012-security-access-table-refinement/API.md)
- [四维度读取与独立保存](../../../changes/archive/2026/20261012-security-login-failure-dimension-selection/API.md)

## 变更记录

| 日期 | 变更 ID | 说明 |
|------|---------|------|
| 2026-08-29 | [20260827-security-challenge-verification](../../../changes/archive/2026/20260827-security-challenge-verification/) | 访问防护增加「挑战策略」Tab；策略 id 按字符串传递 |
| 2026-09-02 | [20260902-packages-admin-feature-app-split](../../../changes/archive/2026/20260902-packages-admin-feature-app-split/) | 页面迁入 security 插件；canonical `ingot.security.access.protection`，兼容旧 semantic / 文件键 |
| 2026-09-03 | [20260902-packages-view-path-canonical](../../../changes/archive/2026/20260902-packages-view-path-canonical/) | canonical 改为 `security.access.protection`，去掉 legacy 别名 |
| 2026-09-04 | [20260903-packages-network-query-modernization](../../../changes/archive/2026/20260903-packages-network-query-modernization/) | 策略面板改为 Query 管理服务端状态；挑战执行链路仍命令式 |
| 2026-09-07 | [20260904-common-admin-ui-rollout](../../../changes/archive/2026/20260904-common-admin-ui-rollout/) | Settings 呈现：`InPageFrame` + 局部 Tab + `InTable`；策略语义不变 |
| 2026-10-13 | [20261012-iam-platform-capability-completion](../../../changes/archive/2026/20261012-iam-platform-capability-completion/) | 正式安全应用、入口及授权 Tab |
| 2026-10-13 | [20261012-security-page-interactions](../../../changes/archive/2026/20261012-security-page-interactions/) | 策略详情默认预览、按需请求与响应式布局 |
| 2026-10-13 | [20261012-common-centered-form-layout](../../../changes/archive/2026/20261012-common-centered-form-layout/) | 登录失败和违规升级配置采用居中正文 |
| 2026-10-13 | [20261012-security-access-table-refinement](../../../changes/archive/2026/20261012-security-access-table-refinement/) | 五列表留白和列宽整理、更多删除与取消闭环 |
| 2026-10-13 | [20261012-security-login-failure-dimension-selection](../../../changes/archive/2026/20261012-security-login-failure-dimension-selection/) | 四维度正文分段选择、草稿切换与保存中禁用；用户验收完成 |
