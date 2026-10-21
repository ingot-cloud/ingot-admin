# 接口：组织用户组工作区

## 来源

- 后端仓库：ingot
- 后端 change：`specs/changes/active/20261021-iam-group-effective-members`

## 服务与约定

- **服务**：IAM
- **Base Path**：`/api/iam`
- **鉴权**：租户身份 Bearer
- **响应包装**：统一 `R<T>`，`code = "0"` 为成功

## 权限码

| 权限码 | 覆盖接口 |
|--------|----------|
| `iam-tenant:group:read` | 组列表、详情、直接成员、有效成员 |
| `iam-tenant:group:create` | 创建组 |
| `iam-tenant:group:update` | 替换组（工作区加人/移出、编辑保存） |
| `iam-tenant:group:delete` | 删除组 |
| `iam-tenant:group:preview` | 编辑预览 |
| `iam-tenant:member:read` | 有效成员按成员范围过滤；字段投影 |

## 接口列表

### 1. `GET` `/v1/tenant/groups/{id}/effective-members`

**权限**：`iam-tenant:group:read`

**说明**：有效成员分页。集合 = 直接成员 ∪ 部门来源实时展开，去重。任职变化立即反映。不改 `GET /v1/tenant/groups/{id}/members`（仍只返回直接绑定）。

**请求参数**：

| 位置 | 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| path | id | string | 是 | 组 ID |
| query | page | integer | 否 | 默认 1 |
| query | pageSize | integer | 否 | 默认 20，最大 200 |
| query | name | string | 否 | 显示名包含匹配，受字段策略约束 |

**响应 `data`**：

```json
{
  "items": [
    {
      "member": {
        "id": "101",
        "displayName": "张三",
        "status": "ACTIVE",
        "departments": [{ "id": "11", "name": "研发", "primary": true }]
      },
      "membership": {
        "direct": true,
        "departments": [
          { "id": "11", "name": "研发", "includeDescendants": false }
        ]
      }
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

看不到的部门名省略 `name`。隐藏成员字段按字段策略省略。

### 2. 沿用接口

| 方法 | 路径 | 工作区用途 |
|------|------|------------|
| GET | `/v1/tenant/groups` | 左侧组列表 |
| GET | `/v1/tenant/groups/{id}` | 详情抽屉、PUT 前完整 selection |
| POST | `/v1/tenant/groups` | 创建 |
| PUT | `/v1/tenant/groups/{id}` | 替换完整草稿 |
| DELETE | `/v1/tenant/groups/{id}` | 删除 |
| POST | `/v1/tenant/groups/{id}/preview` | 编辑名称/部门范围 |
| GET | `/v1/tenant/groups/{id}/members` | 选人对话框已选栏 |

工作区加人/移出必须带上详情里的完整 `selection.members` 与原 `selection.departments`，禁止用当前有效成员页重写。

## 前端注意

- 右侧 total 以有效成员分页为准，不要用列表行的 `visibleMemberCount` 代替过滤后结果。
- 移出只处理 `membership.direct === true`。
- 显示名搜索仅在 `member:read` 的 `displayName` 可过滤时展示。
