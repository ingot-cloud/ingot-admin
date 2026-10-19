# 接口：租户添加成员

## 来源

- 后端仓库：ingot
- 后端 change：`specs/changes/archive/2026/20261018-iam-tenant-member-onboarding/`

## 服务与约定

- **服务**：IAM
- **Base Path**：`/api/iam/v1/tenant/members`
- **鉴权**：当前租户会话
- **响应包装**：统一 `R<T>`

## 权限码

| 权限码 | 覆盖接口 |
|--------|----------|
| `iam-tenant:member:create` | `POST /v1/tenant/members` |

## 接口列表

### 1. `POST` `/v1/tenant/members`

**权限**：`iam-tenant:member:create`

**说明**：按手机号匹配或新建全局账号，并加入当前组织。新建账号时响应含一次性初始密码，客户端按 data_only 解密。

**请求参数**：

| 位置 | 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| body | displayName | string | 是 | 姓名 |
| body | phone | string | 是 | 11 位大陆手机号，不含 +86 |
| body | email | string | 否 | 工作邮箱 |
| body | departments | `{id, primary}[]` | 是 | 可空数组；第一个为主部门 |

**响应 `data`**：

```json
{
  "id": "1001201",
  "version": "0",
  "accountCreated": true,
  "initialPassword": "一次性明文"
}
```

`accountCreated` 为 false 时省略 `initialPassword`。

## 前端注意

- 对话框展示 `+86`，提交时去掉国家码。
- 新建账号弹出已有一次性密码对话框；复用账号只 toast。
