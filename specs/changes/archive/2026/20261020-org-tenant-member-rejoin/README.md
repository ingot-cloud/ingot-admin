# 已移出成员重新加入

> 状态：completed（已更新 current，已归档）

## 完成与归档（2026-10-20）

- 完成日期：2026-10-20。自动化测试通过后更新 current 并归档。
- 当前能力：[org/members-departments](../../../../current/org/members-departments/README.md)
- 另一仓库对应归档：`ingot/specs/changes/archive/2026/20261020-iam-tenant-member-rejoin/`
- 与原设计的差异：已移出详情以列表行打开，不调用排除 REMOVED 的 GET

## 协作模式

一人全栈

## 背景与动机

租户端移出成员后无法再添加同一手机号。需要支持已移出成员重新加入，并明确旧角色和用户组会被清除。

## 目标

成员页可通过「添加成员」自动重新加入，也可在已移出列表/详情中点「重新加入」提交资料。

## 范围

### In Scope

- 添加成员对话框处理 `rejoined`
- 已移出行与详情「重新加入」
- `TenantMemberRejoinAPI` 与 `TenantMemberCreated.rejoined`

### Out of Scope

- 平台成员
- 勾选保留旧角色/用户组
- 改动暂停/恢复

## 输入来源

- 后端来源：`ingot/specs/changes/archive/2026/20261020-iam-tenant-member-rejoin/`

## 工件

- [接口](./API.md)
- [需求](./REQUIREMENTS.md)
- [设计](./DESIGN.md)
- [任务](./TASKS.md)

## 完成记录

- 完成日期：2026-10-20
- 关联提交或 PR：未提交
- 更新的 current capability：`specs/current/org/members-departments`
- 与原设计的差异：已移出详情 `GET` 仍排除 REMOVED，详情入口用列表行打开抽屉
- 取消原因：
