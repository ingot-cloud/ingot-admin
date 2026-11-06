# 20261027-org-field-policy

> 状态：completed

## 协作模式

一人全栈

## 背景与动机

租户字段策略只服务成员页，字段键和动作写死。平台资源配置已经声明字段能力，策略页应改由已接入资源驱动。

## 目标

平台可在允许的资源上打开字段策略接入。租户字段策略按资源展示可配置字段和动作，成员仍是当前唯一资源。

## 范围

### In Scope

- 平台资源编辑增加接入开关
- 租户菜单改为「字段策略」，路由 `org.iam.field.policies`
- 策略页按已接入资源渲染字段和动作，去掉场景和手填字段键
- 策略接口改为按资源列出和读写

### Out of Scope

- 新增第二份业务资源
- 角色向导的字段权限步骤
- 成员、部门等业务页的投影逻辑
- 提前更新 `specs/current` 或归档通讯录移除变更

## 输入来源

- 接口文档：后端 [后端归档](../../../../../../ingot/specs/changes/archive/2026/20261027-iam-resource-field-policy/README.md)
- 需求文档：同上
- 后端来源：[后端归档](../../../../../../ingot/specs/changes/archive/2026/20261027-iam-resource-field-policy/README.md)

## 工件

- [接口](./API.md)
- [需求](./REQUIREMENTS.md)
- [设计](./DESIGN.md)
- [任务](./TASKS.md)

## 风险与依赖

依赖后端资源接入开关和按资源读写的策略接口。动作码不变，菜单编码会变。

## 相关链接

- 后端变更：`20261027-iam-resource-field-policy`

## 完成记录

- 完成日期：2026-11-06（用户确认产品验收通过并要求归档）。
- 关联实现提交：7ee9acd。
- 更新的 current：[org/field-policy](../../../../current/org/field-policy/README.md)、[base/platform-capabilities](../../../../current/base/platform-capabilities/README.md)。
- 最终交付：左侧资源、右侧规则，确认增删改即保存；平台资源编辑显示接入开关。
