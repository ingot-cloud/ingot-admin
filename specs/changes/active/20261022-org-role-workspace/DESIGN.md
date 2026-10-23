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
| 既有当前角色、分配、委派接口 | `authorization.ts` 与 `createCurrentRoleApis("tenant")` | 创建、详情、角色分配、授权管理员 |
| GET `/v1/tenant/authorization/diagnose/candidates` | `TenantDiagnoseCandidatesAPI` | 诊断成员、应用、操作、目标对象 |

## 组件与页面影响

- `plugins/org/src/pages/iam/authorization/IndexPage.vue`
- `table.ts`、`useOps.ts`、`useRoleWorkspace.ts`、`grants.ts`
- `components/RoleWorkspace.vue`、`RoleDetailDrawer.vue`、`CreateWizard.vue`
- `components/GrantEditWizard.vue`、`GrantPicker.vue`、`ScopeStep.vue`、`GrantPreview.vue`
- `groups/components/GroupDetailDrawer.vue` 增加 `viewOnly`，来源里查看用户组不出现编辑和删除
- 右侧名称用 `BizIamRecordLink`。成员打开 `MemberDetailDrawer` 的 `viewOnly`（隐藏编辑和更多操作）；用户组打开已有只读 `GroupDetailDrawer`。成员列是名称、可见部门、操作；用户组列只有名称。成员操作是「查看来源」，点击打开有效分配来源。来源行的「查看分配」与更多操作放在同一行并垂直居中，不放诊断。「创建角色」固定在左栏底部，搜索和列表在它上方滚动；没有创建权限时按钮禁用。权限诊断留在角色分配 Tab。

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

## 角色分配向导

`BizIamTenantAssignmentDrawer` 改为与 `BizIamPlatformAssignmentDrawer` 同构的全屏向导（`size="100%"`、`layout="pinned"`、`BizIamWizardNav`），props 仍为 `apis: TenantAssignmentApis`，插件侧无需新接口。

- 复用：`BizIamWizardNav`、`BizIamDurationFields`、`BizIamPreviewAlert`、`BizIamDelegationCandidatePicker`、`useIamDraftPreview`。
- 不复用：平台 `BizIamAuthorizationRecipients` 不走组织成员弹窗；平台 `BizIamDelegationRolePicker`、`BizIamAssignmentScopeStep` 以 `roleRevisionRef` 为键且拒绝部门范围，租户另起 `BizIamTenantAssignmentScopeStep`。
- 模型：`models/iam/tenantAssignment.ts` 提供 `TenantAssignmentRoleDraft`（角色、`roleAPI` 返回的目录与定义、参数绑定、已选对象名）、`tenantAssignmentScopeItems`、`tenantAssignmentScopeIssues`、`tenantAssignmentBatch`。有效期校验抽出平台与租户共用的 `assignmentWindowIssue`，租户来源用 `TenantDelegationMine` 的期限与最长时长。
- 第一步的接收对象为成员、用户组两个多选 `BizIamDelegationCandidatePicker`；成员走组织成员弹窗（`loadMemberBrowse`，场景 ASSIGNMENT）。候选把 `optionsAPI` 适配成 `AuthorizationCandidatesApi`（MEMBER、GROUP 带 `delegationGrantId`）。切换授权依据清空接收对象和角色，旧来源的角色定义响应丢弃。
- 第二步用多选角色选择器，确认后对每个角色调用 `roleAPI(roleId, delegationGrantId)`，参数按 key 保留已填绑定。
- 第三步每个参数一张卡片：标题为「角色 / 资源 · 管理部门或指定对象」，用 `BizIamDelegationCandidatePicker`（`kind: OBJECT`、`parameterKey`，多选）调用 `scopeAPI`。
- 修改：锁定接收对象与角色，按记录的 `delegationGrantId` 加载角色定义；预览、保存仍走 `previewAPI({items:[x]})` 与 `updateAPI`。
- 请求回写以打开序号防串，`contextEpoch` 变化关闭抽屉。

## 授权管理员向导

`BizIamTenantDelegationDrawer` 改为与 `BizIamPlatformDelegationDrawer` 同构的全屏向导。不复用平台 `BizIamDelegationRolePicker`（它展开角色版本）和按操作配置的 `BizIamDelegationCeilingStep`。角色用 `BizIamDelegationCandidatePicker`（`kind: ROLE`），定义来自 `assignmentApis.roleAPI(roleId)`。上限仍是 `resourceScopeCeilings`，同一资源一张卡片。

- 打开已有记录先 `detailAPI`。列表只保留「详情」：记录仍有效且具备调整权限时向导可编辑，预览走 `previewAPI`，保存走 `updateAPI`；已撤销或没有调整权限时同一入口只读。
- 列表展示创建时间，以及一列有效期。生效时间为空显示「立即生效」，失效时间为空显示「长期有效」。状态和单次最长时间仍单独成列。
- 新建走 `createAPI`。租户没有创建预览接口，最后一步核对摘要后保存。
- 支持 ALL 的新资源默认「全部」。编辑保留已保存上限。请求以打开序号丢弃迟到响应。
- 「指定对象」「管理部门」必须出现范围选择框，并选中具体对象后才能进入下一步。参数键优先用角色目录里该资源、该种类的参数；目录没有时使用稳定键 `resource-{资源 ID}-objects` 或 `resource-{资源 ID}-departments`。角色定义未声明该参数时，选择框仍然出现。

## 权限诊断

`BizIamDiagnoseDrawer` 改为候选驱动的通用抽屉：props 为 `candidatesApi`、`diagnoseApi`，可选 `assignmentReadAction` 控制「查看分配」。平台原 `BizIamPlatformDiagnoseDrawer` 并入它，平台传 `PLATFORM_ASSIGNMENT_READ`。租户没有按 ID 读取分配的接口，不传该项。

账号身份入口去掉：租户管理员拿不到账号 ID，后端仍接受 `accountId`。

## 备选方案

把整个平台向导抽到 `admin-common`：目录和版本差异仍然留在各插件。本次只共享字段步骤。
