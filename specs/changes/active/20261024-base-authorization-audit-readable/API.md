# 接口：授权审计游标分页与对象名称

## 来源

- 原始文件：无，依据后端 change 的 DESIGN 编写
- 后端仓库：`ingot/specs/changes/active/20261024-iam-authorization-audit-readable/DESIGN.md`

## 服务与约定

- **服务**：IAM（`IAM_API_PREFIX`）
- **Base Path**：`/v1/platform/authorization`、`/v1/tenant/authorization`
- **鉴权**：`platform:audit:read` / `tenant:audit:read`（沿用 `IamAction.PLATFORM_AUDIT_READ` / `TENANT_AUDIT_READ`）
- **响应包装**：统一 `R<T>`

## 接口列表

### 1. `GET` `/audits`（两个域相同）

**请求参数（query）**：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| limit | number | 否 | 1–100，默认 20 |
| cursor | string | 否 | 上一次响应的 `nextCursor`；不传表示第一页 |
| actorMemberId | string | 否 | 操作者成员 ID，精确匹配 |
| targetType | string | 否 | 对象类型编码，精确匹配 |
| targetId | string | 否 | 对象 ID，精确匹配，仅在路由限定对象时传 |
| changeType | AuditChangeType | 否 | 变更类型 |
| from / until | string | 否 | 带时区的 ISO-8601 时间，`[from, until)` |

`page`、`pageSize` 已移除。

**响应 `data`**：

```json
{
  "items": [
    {
      "record": {
        "id": "...", "actor": { "accountId": "...", "memberId": "101", "displayName": "张三" },
        "context": {}, "target": { "resource": "role", "id": "88" },
        "changeType": "UPDATE",
        "before": { "NAME": "旧名", "STATUS": "ENABLED" },
        "after": { "NAME": "新名", "STATUS": "DISABLED" },
        "revisions": { "role": "4" }, "assignmentId": "9", "delegationId": null,
        "timestamp": "2026-10-24T02:00:00Z", "traceId": "..."
      },
      "capabilities": {}
    }
  ],
  "nextCursor": "opaque",
  "hasMore": true,
  "references": {
    "member:101": { "type": "member", "id": "101", "state": "VISIBLE", "name": "张三" },
    "role:88": { "type": "role", "id": "88", "state": "DELETED", "name": "旧名" },
    "department:7": { "type": "department", "id": "7", "state": "HIDDEN" }
  }
}
```

| 字段 | 说明 |
|---|---|
| nextCursor | 只在 `hasMore = true` 时返回 |
| references | 键为 `{type}:{id}`；`state` 取值为 `VISIBLE`、`HIDDEN`、`DELETED`；`name` 仅在 `VISIBLE` 或 `DELETED`（有快照名称时）返回 |
| references 的 type | `member`、`department`、`group`、`role`、`role-revision`、`assignment`、`delegation`、`tenant`、`account`、`application`、`role-application-task` |

**错误**：非法游标或 `limit` 越界返回 400 `InvalidArgument`；无权限返回 403 `ActionDenied`。

## 前端注意

- 引用的查找规则：
  - 操作者：`member:{actor.memberId}`。
  - 目标：`{target.resource}:{target.id}`。其中 `entitlement` 用 `tenant:{id}`，`audience` 用 `application:{id}`，`ROLE_VERSION_APPLICATION` 用 `role-application-task:{id}`。
  - 关联对象：`assignment:{assignmentId}`、`delegation:{delegationId}`。
  - 变更值中的 ID：见 DESIGN 的格式化规则。
- `directory-policy`、`field-policy`、`member-export`、`member-workbook`、`department-workbook` 没有引用，直接按类型显示固定文案。
- 找不到引用时，按 `HIDDEN` 处理，不回退为显示 ID。
- `before`、`after` 仍是字符串值；结构化字段是紧凑 JSON 文本。
