# Design

## 方案摘要

`MemberCreateDrawer` 改为 `MemberCreateDialog`。一次性密码对话框下沉为 `BizIamAccountSecretDialog`，供平台账号页和租户成员页共用。

## 页面与组件

- `plugins/org/.../members/components/MemberCreateDialog.vue`：820px 对话框，基础信息两列
- `packages/admin-common/.../BizIamAccountSecretDialog.vue`：一次性密码
- `MemberTab.vue` 打开时传入当前部门

## 对接映射

`TenantMemberCreateAPI` 提交 `TenantMemberCreateInput`，读取 `TenantMemberCreated`。响应解密与平台创建账号相同。

## 测试

源码断言覆盖标题、字段、完成按钮、密码弹窗和 API 类型。
