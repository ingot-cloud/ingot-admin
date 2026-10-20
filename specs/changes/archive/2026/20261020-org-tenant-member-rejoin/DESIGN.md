# 设计：已移出成员重新加入

## 方案

不新增权限码。创建对话框继续 `POST /v1/tenant/members`；已移出行走 `POST /{id}/rejoin`。通讯录手机号若被脱敏则不预填，避免把掩码提交回去。

## 页面

- `MemberCreateDialog`：`rejoined` → `MEMBER_REJOINED`
- `memberTable.createRowActions`：`REMOVED` 增加「重新加入」
- `MemberRejoinDialog`：预填、可改、带 `expectedVersion`
- `MemberDetailDrawer`：已移出状态提供同一入口
