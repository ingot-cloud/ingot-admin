# 设计：组织角色与授权工作区

## 技术方案

角色 Tab 使用与平台相同的 `in-split-layout` 工作区，组件放在 `plugins/org`，不引用 platform。租户没有业务版本，因此去掉版本按钮、固定版本列和升级。

权限编辑不复用平台 `SharedRoleDetailDrawer`。目录是扁平的 `CurrentRoleCatalogAction`，前端按资源归并成树。应用候选走租户分配选项 `APPLICATION`。

创建时用 `crypto.getRandomValues` 生成 `org-role-` 加 24 位十六进制编码，只放进创建请求。详情、列表和预览都不读取该字段做展示。

## 对接映射

| 接口（见 API.md） | 前端 | 说明 |
|---|---|---|
| GET `/v1/tenant/roles/{id}/members\|groups` | `TenantRoleSubjectPageAPI` | 右侧成员或用户组 |
| GET `/v1/tenant/roles/{id}/members/{memberId}/assignments` | `TenantRoleSourcePageAPI` | 来源对话框 |
| 既有当前角色、分配、委派接口 | `authorization.ts` 与 `createCurrentRoleApis("tenant")` | 创建、详情、授权记录、授权管理员 |

## 组件与页面影响

- `plugins/org/src/pages/iam/authorization/IndexPage.vue`
- `table.ts`、`useOps.ts`、`useRoleWorkspace.ts`、`grants.ts`
- `components/RoleWorkspace.vue`、`RoleDetailDrawer.vue`、`CreateWizard.vue`
- `components/GrantEditWizard.vue`、`GrantPicker.vue`、`ScopeStep.vue`、`GrantPreview.vue`
- `groups/components/GroupDetailDrawer.vue` 增加 `viewOnly`，来源里查看用户组不出现编辑和删除

## 与 CONSTITUTION 符合性

| 原则 | 符合 | 说明 |
|---|---|---|
| 插件不互依 | 是 | 交互对齐平台，组件不跨插件引用 |
| 页面四件套 | 是 | IndexPage、table、useOps、components |
| 关联列表不 ids 回查 | 是 | 成员、用户组和来源各走独立分页 |
| 不展示编码 | 是 | 编码只在创建请求中生成 |
| 实施不改 current | 是 | 验收后再归档 |

## 字段权限

字段步骤放在 `admin-common` 的 `BizIamRoleFieldStep`，平台自有角色、平台共享角色和租户角色共用。官方插件仍不互相引用。

租户目录使用带 `fieldCapabilities` 和 `fieldDefaults` 的当前角色目录。选中操作时带上资源默认字段。当前角色定义提交 `resourceFieldPermissions`。空快照的旧角色在再次打开时按资源默认值展示，保存后写入明确快照。

平台共享角色创建和编辑去掉「仅平台自有角色显示字段步骤」。提交走当前角色定义，字段快照随保存立即生效，不出现版本名。

## 备选方案

把整个平台向导抽到 `admin-common`：目录和版本差异仍然留在各插件。本次只共享字段步骤。
