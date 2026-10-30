# 接口：字段策略按资源接入

## 来源

- 原始文件：本变更随后端设计编写
- 后端仓库：`ingot/specs/changes/active/20261027-iam-resource-field-policy/`

## 服务与约定

- **服务**：IAM
- **Base Path**：`/api/iam`
- **鉴权**：租户访问令牌；平台资源更新沿用应用目录权限
- **响应包装**：统一 `R<T>`，`code = "0"` 为成功

## 权限码

| 权限码 | 覆盖接口 |
|--------|----------|
| `iam-tenant:field-policy:read` | 列出已接入资源、读取一份策略 |
| `iam-tenant:field-policy:update` | 保存一份策略 |
| 应用目录原有资源更新权限 | 更新资源时提交 `fieldPolicy` |

## 接口列表

### 1. `GET` `/v1/tenant/policies/field-resources`

**权限**：`iam-tenant:field-policy:read`

**说明**：返回当前租户已接入字段策略的资源。未接入资源不出现。

**响应 `data`**：

```json
[
  {
    "resourceId": "1",
    "resource": { "domain": "TENANT", "applicationCode": "iam-tenant", "resourceCode": "member" },
    "name": "成员",
    "fields": [],
    "actions": [{ "code": "iam-tenant:member:read", "name": "查询成员" }]
  }
]
```

`fields` 元素沿用资源字段能力：`key`、`label`、`visibilities`、`editable`、`filterable`、`mask`。`actions` 只含该资源上已绑定字段读写或筛选的动作。

### 2. `GET` `/v1/tenant/policies/fields/{resourceId}`

**权限**：`iam-tenant:field-policy:read`

**说明**：读取该资源的策略草稿。资源未接入时失败。尚无策略行时服务端补行。

**响应 `data`**：`ResourceDetail`，`detail` 为策略草稿。

```json
{
  "defaultRevisionId": "150002",
  "rules": [],
  "operationRules": []
}
```

可见性规则包含 `fieldKey`、`viewerSelection`、`targetScope`、`scopeBindings`、`visibility`，不再包含 `scenario`。操作规则包含 `actionCode`、`fieldKey`、`viewerSelection`、`operations`，不再包含 `resource` 与 `scenario`。

### 3. `PUT` `/v1/tenant/policies/fields/{resourceId}`

**权限**：`iam-tenant:field-policy:update`

**请求体**：

```json
{
  "expectedVersion": "0",
  "policy": {
    "defaultRevisionId": "150002",
    "rules": [],
    "operationRules": []
  }
}
```

字段、可见性、编辑、筛选或动作不属于该资源时请求失败，不部分保存。

### 4. 平台资源更新

资源更新请求增加 `fieldPolicy` 布尔值。服务器未声明运行能力、资源不是租户域或没有字段时，不能设为 `true`。响应中的资源详情带回该开关，以及服务器是否允许接入。

## 前端注意

- 原 `GET/PUT /v1/tenant/policies/fields` 不再使用。
- 页面不再提交 `PolicyScenario`。
- 动作码不变。菜单编码改为 `org.iam.field.policies`，路径 `/org/field-policies`。
