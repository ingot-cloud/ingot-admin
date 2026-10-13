# 框架标签统一

> 状态：completed

## 完成与归档（2026-10-13）

用户明确确认前端 active 中除 `20260913-base-iam-admin` 外的规格均已验证完成，并要求归档及提交。本变更验收完成，任务已闭环，页面行为已写入 current，完整工件归档至 `specs/changes/archive/2026/20261010-packages-unified-tags/`。

此前的 validating、待部署或待人工验收描述为历史阶段记录，以本完成记录为准；本次未重新执行业务验收，也未归档后端仓库的关联变更。

当前基线：

- [packages/admin-ui-foundation](../../../../current/packages/admin-ui-foundation/README.md)
- [packages/admin-theme](../../../../current/packages/admin-theme/README.md)

## 历史阶段记录


## 背景与范围

InTag / InTagEnum 直接使用 Element Plus 默认外观，StatusTag 独立维护状态样式，导致标签风格不同。本次统一通用标签基础外观、主题变量和组件组合；不改变业务状态、后端接口或权限行为。

## 输入与批准

- 来源：本对话中用户要求以 StatusTag 为视觉标准，随后确认“好的，优化一下这部分内容”。
- 已确认方案：InTag 保留 ElTag 内部实现；StatusTag 与 InTagEnum 复用 InTag；普通 info 为中性色，既有状态 info 保持蓝色及成功图标；关闭、点击、尺寸与效果保持兼容。
- 基线检查：权限面板背景已存在于 CSS，却未登记到主题协议，本次补齐登记及默认值。

## 工件

- [需求](REQUIREMENTS.md)
- [设计](DESIGN.md)
- [任务](TASKS.md)
- [验证证据](EVIDENCE.md)
- [现有视觉基线](../../../../current/packages/admin-ui-foundation/spec.md)
- [主题协议](../../../../current/packages/admin-theme/spec.md)

## 验收与归档

自动化与浏览器证据已记录；字段控制的人工验收确认不代替本独立 change 的验收，继续保持 validating，不提前更新 current 或归档。2026-10-10 用户要求提交代码，相关实现已独立提交为 `9a1262e`；本次无发布或数据迁移。
