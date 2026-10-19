# 租户添加成员对话框

> 状态：completed（已验收，已更新 current，已归档）

## 完成与归档（2026-10-19）

- 验收依据：用户明确要求归档 `20261018-org-tenant-member-create-dialog` 并提交。
- 完成与归档日期：2026-10-19。此前 implementing、待浏览器验收为历史阶段记录，以本次确认结项。
- 关联实现提交：`3319f7f`；关联后端 `5865e4cf`。验收、基线及归档由独立 docs 提交记录。
- 当前能力：[org/members-departments](../../../../current/org/members-departments/README.md)，有效规则见 [spec.md](../../../../current/org/members-departments/spec.md)。
- 另一仓库对应归档：`ingot/specs/changes/archive/2026/20261018-iam-tenant-member-onboarding/`。
- 最终实现与设计差异：无。本地管理端浏览器验收未在本次归档时重跑。

本归档只关闭租户添加成员对话框。平台创建账号流程保持按账号资料创建，只共用一次性密码对话框。

## 协作模式

一人全栈

## 背景与动机

现有「添加组织成员」抽屉要求查找或粘贴账号 ID，租户管理员无法按通讯录方式加人。需要改成飞书式对话框：按手机号创建或加入。

## 目标

点击「添加成员」打开对话框，标题为「添加成员」。提交后若新建账号则弹出一次性密码；若已有账号则提示已加入组织。

## 范围

### In Scope

- 对话框字段：姓名、部门、手机号、工作邮箱
- 一次性密码对话框下沉到 admin-common
- 创建 API 对接新契约

### Out of Scope

- 飞书「工作信息」与更多人事字段
- 平台人员创建流程

## 输入来源

- 后端来源：`ingot/specs/changes/archive/2026/20261018-iam-tenant-member-onboarding/`

## 工件

- [接口](./API.md)
- [需求](./REQUIREMENTS.md)
- [设计](./DESIGN.md)
- [任务](./TASKS.md)

## 风险与依赖

依赖 IAM 重启后新创建契约才可用。本地管理端需登录后才能浏览器验收。

## 相关链接

-

## 完成记录

- 完成日期：2026-10-19
- 关联提交或 PR：实现 `3319f7f`；无 PR
- 更新的 current capability：`specs/current/org/members-departments`
- 与原设计的差异：无
- 取消原因：
