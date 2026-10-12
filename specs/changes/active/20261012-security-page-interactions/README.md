# 安全中心页面交互与布局

> 状态：validating

2026-10-12 用户要求开始优化历史页面，并明确范围为安全中心四个页面。按其三项要求及现有框架规范实施：激活 Tab 才查询、默认预览且显式编辑、布局不超出容器。

范围：`plugins/security` 的凭证策略、账号保护、访问防护、会话管理及策略抽屉。沿用已批准的 [平台能力补齐](../20261012-iam-platform-capability-completion/README.md) 的路径与精确操作权限。无需后端改动。

输入来自本次对话；不消费 inbox。用户已授权实施，本变更记录执行方案与验收证据。自动化通过后进入 validating，人工验收后更新 current 并归档。

实现及自动化已完成，见 [验证记录](./VALIDATION.md)。真实页面人工验收后完成 T6。

正文居中与限宽、账号 B/C 独立 Tab 及后续框架规范，由用户另行批准的 [整页配置表单布局](../20261012-common-centered-form-layout/README.md) 继续优化。

访问防护列表留白、列宽与行内更多删除由 [列表整理](../20261012-security-access-table-refinement/README.md) 按新的验收反馈继续实施。

登录失败保护的正文内分段选择器及草稿切换由 [维度选择交互](../20261012-security-login-failure-dimension-selection/README.md) 按用户批准的分析继续实施。
