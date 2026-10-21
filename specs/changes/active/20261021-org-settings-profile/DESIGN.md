# 设计：组织设置页

页面仍用 `InFormContent`。小节标题用主题色竖条。每个小节的内容放在圆角边框里。转交所有者是危险操作，按钮用危险色。

- 基础信息横幅点击编辑，对话框内用 `InCommonUploadAvatar` 和名称，保存走现有 `PUT /v1/tenant/settings`。
- 更多信息两列只读。创建时间用共享的本地时区格式化。
- 转交按钮打开 `BizIamMemberPickerDialog`，`multiple` 为 false，浏览走租户成员选择。确认人选后才打开密码对话框。
- `TenantOwnerTransferAPI` 固定带上字段加密 `secret`。密码对话框提交 `expectedVersion`、`newOwnerMemberId` 和 `confirmation`。页面本身不调用转交接口。
