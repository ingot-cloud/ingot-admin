# 整页配置表单正文布局

> 状态：completed

## 完成与归档（2026-10-13）

用户明确确认前端 active 中除 `20260913-base-iam-admin` 外的规格均已验证完成，并要求归档及提交。本变更验收完成，任务已闭环，页面行为已写入 current，完整工件归档至 `specs/changes/archive/2026/20261012-common-centered-form-layout/`。

此前的 validating、待部署或待人工验收描述为历史阶段记录，以本完成记录为准；本次未重新执行业务验收，也未归档后端仓库的关联变更。

当前基线：

- [common/admin-ui-experience](../../../../current/common/admin-ui-experience/README.md)
- [packages/admin-ui-foundation](../../../../current/packages/admin-ui-foundation/README.md)
- [packages/admin-theme](../../../../current/packages/admin-theme/README.md)
- [security/account-protection](../../../../current/security/account-protection/README.md)
- [security/credential-policies](../../../../current/security/credential-policies/README.md)
- [security/access-protection](../../../../current/security/access-protection/README.md)

## 历史阶段记录


2026-10-12 用户提供飞书表单截图并确认开始实施已讨论的方案：正文默认最大宽度 840px、在工作区内居中、空间不足时收缩；统一字段布局和操作区，并作为后续整页配置表单的框架规范。

输入来自对话，不消费 inbox。范围为 admin-core 正文容器与主题 Token、开发规范，以及安全中心的凭证四个 Tab、账号保护、登录失败保护和违规升级。保留页头/Tab 宽度、既有路由、权限与 API；列表、抽屉和局部表单沿用自身布局。本变更关联 [安全中心交互](../20261012-security-page-interactions/README.md)。

用户的「开始优化这部分内容」批准此前分析方案，本目录记录实施决策与验收任务。自动化完成后进入 validating，真实页面验收后更新 current 并归档。

2026-10-12 用户验收反馈要求将账号保护的 B/C 锁定策略拆为两个 Tab，明确批准替代原纵向分组设计。先更新本目录需求、设计与接口，继续实施账号页验收修正；不修改 current。
