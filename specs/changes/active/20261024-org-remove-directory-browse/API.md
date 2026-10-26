# 接口

后端变更：`ingot/specs/changes/active/20261024-iam-remove-directory-browse/`。

## 删除

| 方法 | 路径 | 原动作 |
| --- | --- | --- |
| GET | `/v1/directory/members` | `iam-tenant:directory:read` |
| GET | `/v1/directory/members/{id}` | `iam-tenant:directory:read` |
| GET | `/v1/directory/departments` | `iam-tenant:directory:read` |
| GET | `/v1/directory/context` | `iam-tenant:directory:read` |
| GET | `/v1/tenant/policies/directory` | `iam-tenant:directory-policy:read` |
| PUT | `/v1/tenant/policies/directory` | `iam-tenant:directory-policy:update` |
| POST | `/v1/tenant/policies/preview` | `iam-tenant:policy:preview` |

## 保留

| 方法 | 路径 | 动作 |
| --- | --- | --- |
| GET | `/v1/tenant/policies/fields` | `iam-tenant:field-policy:read` |
| PUT | `/v1/tenant/policies/fields` | `iam-tenant:field-policy:update` |

字段规则 `scenario` 只提交 `MANAGEMENT`。不再提交 `DIRECTORY`、通讯录默认策略或预览草稿。
