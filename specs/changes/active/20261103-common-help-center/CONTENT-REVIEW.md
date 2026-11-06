# 帮助内容源码核对记录

日期：2026-11-03。范围：4篇通用、18篇租户、20篇平台，共42篇；正文约3万字符。每篇包含用途、前置、入口、字段、步骤、结果和常见问题。已有章节ID保留，新增`fields`章节。

本记录只证明按当前源码与已发布基线核对了文案，不能证明在目标部署中实际执行成功。真实业务账号登录、接口联调、权限场景及业务截图均未执行，按用户要求后补。帮助阅读器使用本地认证夹具验证的情况另见验收记录。

## 本轮纠正的主要语义

- 租户角色、组织共享角色使用当前权限，保存后关联人员/组织自动生效；平台自定义角色使用固定版本，发布与版本应用分开。
- 批量任职整体替换，第一部门为主部门，存在两次确认。
- 部门直属在职人数、根部门未移出人数与删除依赖检查口径不同。
- 用户组直接来源与部门来源共同计算；部门负责人不自动获得业务权限。
- 工作簿1000行、部分失败、空值规则、24小时导入产物、一次性密码与7天导出文件分别说明。
- 组织所有权转交验证当前登录密码，旧所有者普通角色保留。
- 应用套餐、组织开通、人群、菜单与业务授权分开；默认开通与套餐应用有受保护限制。

## 逐篇依据

相对路径均以本仓库为根；仅引用已存在的文件。字段及界面文案核对不意味着全部服务端分支已实测。

| 文章 | 主要源码依据 |
| --- | --- |
| `tenant-applications` | `plugins/org/src/pages/iam/applications/components/ApplicationDetailDrawer.vue` |
| `tenant-assignments` | `packages/admin-common/src/components/iam-tenant-authorization/BizIamTenantAssignmentDrawer.vue`；`packages/admin-common/src/components/iam-tenant-authorization/BizIamTenantAssignmentScopeStep.vue` |
| `tenant-authorization-audit` | `packages/admin-common/src/components/authorization-audit/BizIamAuthorizationAudit.vue` |
| `tenant-authorization-diagnostics` | `packages/admin-common/src/components/BizIamDiagnoseDrawer.vue`；`packages/admin-common/src/components/BizIamDiagnoseCandidatePicker.vue` |
| `tenant-delegations` | `packages/admin-common/src/components/iam-tenant-authorization/BizIamTenantDelegationDrawer.vue` |
| `tenant-department-leaders` | `plugins/org/src/pages/iam/members/components/DepartmentLeaderField.vue`；`plugins/org/src/pages/iam/members/components/DeptDetailDrawer.vue` |
| `tenant-department-workbook` | `plugins/org/src/pages/iam/departments/workbook/IndexPage.vue`；`plugins/org/src/pages/iam/departments/workbook/workbookFile.ts` |
| `tenant-departments` | `plugins/org/src/pages/iam/members/deptTable.ts`；`plugins/org/src/pages/iam/members/components/DeptDetailDrawer.vue` |
| `tenant-downloads` | `packages/admin-core/src/pages/common/downloads/IndexPage.vue`；`packages/admin-core/src/pages/common/downloads/useOps.ts`；`packages/admin-core/src/models/download.ts` |
| `tenant-getting-started` | `plugins/org/src/pages/iam/members/components/MemberCreateDialog.vue`；`plugins/org/src/pages/iam/authorization/IndexPage.vue`；`plugins/org/src/pages/iam/applications/IndexPage.vue` |
| `tenant-groups` | `packages/admin-common/src/components/BizIamGroupWizard.vue`；`plugins/org/src/pages/iam/groups/membership.ts` |
| `tenant-member-departments` | `plugins/org/src/pages/iam/members/components/MemberBatchDepartmentDialog.vue`；`plugins/org/src/pages/iam/members/departmentSelection.ts` |
| `tenant-member-policies` | `plugins/org/src/pages/iam/field-policies/IndexPage.vue`；`plugins/org/src/pages/iam/field-policies/components/PolicyRuleDialog.vue` |
| `tenant-member-workbook` | `plugins/org/src/pages/iam/members/workbook/IndexPage.vue`；`plugins/org/src/pages/iam/members/workbook/workbookFile.ts` |
| `tenant-members` | `plugins/org/src/pages/iam/members/components/MemberCreateDialog.vue`；`plugins/org/src/pages/iam/members/memberTable.ts` |
| `tenant-organization-settings` | `plugins/org/src/pages/iam/settings/IndexPage.vue`；`plugins/org/src/pages/iam/settings/components/OrgTransferPasswordDialog.vue` |
| `tenant-roles` | `plugins/org/src/pages/iam/authorization/components/CreateWizard.vue`；`plugins/org/src/pages/iam/authorization/components/RoleDetailDrawer.vue`；`plugins/platform/src/pages/iam/shared-roles/components/GrantEditWizard.vue` |
| `tenant-workbench` | `plugins/org/src/pages/iam/workbench/components/WorkbenchStatistics.vue` |
| `platform-access-protection` | `plugins/security/src/pages/access-protection/components/RateLimitRuleDrawer.vue`；`plugins/security/src/pages/access-protection/components/ChallengePolicyDrawer.vue`；`plugins/security/src/pages/access-protection/components/IpListDrawer.vue` |
| `platform-account-protection` | `plugins/security/src/pages/account-protection/components/LockoutPolicyColumn.vue` |
| `platform-accounts` | `plugins/platform/src/pages/iam/accounts/IndexPage.vue`；`plugins/platform/src/pages/iam/accounts/components/CreateDrawer.vue`；`plugins/platform/src/pages/iam/accounts/components/LockDrawer.vue` |
| `platform-applications` | `plugins/platform/src/pages/iam/applications/components/CreateWizard.vue`；`plugins/platform/src/pages/iam/applications/components/ResourceEditDrawer.vue`；`plugins/platform/src/pages/iam/applications/components/ActionEditDrawer.vue`；`plugins/platform/src/pages/iam/applications/components/MenuEditDrawer.vue`；`plugins/platform/src/pages/iam/applications/components/ApplicationPurgeDialog.vue` |
| `platform-assignments` | `plugins/platform/src/pages/iam/authorization/IndexPage.vue`；`packages/admin-common/src/components/BizIamPlatformAssignmentDrawer.vue`；`packages/admin-common/src/components/BizIamPlatformDelegationDrawer.vue` |
| `platform-authorization-audit` | `packages/admin-common/src/components/authorization-audit/BizIamAuthorizationAudit.vue` |
| `platform-clients` | `plugins/platform/src/pages/develop/client/EditDrawer.vue`；`plugins/platform/src/pages/develop/client/SecretDialog.vue` |
| `platform-credential-policies` | `plugins/security/src/pages/credential-policies/IndexPage.vue`；`plugins/security/src/pages/credential-policies/view/StrengthView.vue`；`plugins/security/src/pages/credential-policies/view/InitialPasswordView.vue` |
| `platform-dictionaries` | `plugins/platform/src/pages/settings/dictionaries/TypeEditDrawer.vue`；`plugins/platform/src/pages/settings/dictionaries/ItemEditDrawer.vue` |
| `platform-entitlements` | `plugins/platform/src/pages/iam/tenants/components/EntitlementDraftPanel.vue`；`plugins/platform/src/pages/iam/tenants/components/EntitlementEditWizard.vue` |
| `platform-getting-started` | `plugins/platform/src/pages/iam/authorization/IndexPage.vue`；`plugins/platform/src/pages/iam/shared-roles/IndexPage.vue` |
| `platform-id-allocation` | `plugins/platform/src/pages/develop/id/components/EditDrawer.vue`；`plugins/platform/src/pages/develop/id/table.ts` |
| `platform-personnel` | `plugins/platform/src/pages/iam/personnel/components/MemberCreateDrawer.vue`；`plugins/platform/src/pages/iam/personnel/components/MemberRoleAssignDialog.vue` |
| `platform-plans` | `plugins/platform/src/pages/iam/plans/components/CreateWizard.vue`；`plugins/platform/src/pages/iam/plans/components/DetailDrawer.vue` |
| `platform-qrcode` | `plugins/platform/src/pages/develop/qrcode/IndexPage.vue` |
| `platform-roles` | `plugins/platform/src/pages/iam/authorization/IndexPage.vue`；`plugins/platform/src/pages/iam/shared-roles/components/SharedRoleDetailDrawer.vue`；`packages/admin-common/src/components/BizIamRoleApplicationDrawer.vue` |
| `platform-sessions` | `plugins/security/src/pages/sessions/components/SessionDetailDrawer.vue`；`plugins/security/src/pages/sessions/components/ConcurrencyPolicyDrawer.vue` |
| `platform-shared-roles` | `plugins/platform/src/pages/iam/shared-roles/IndexPage.vue`；`plugins/platform/src/pages/iam/shared-roles/components/GrantEditWizard.vue` |
| `platform-social` | `plugins/platform/src/pages/develop/social/components/EditDialog.vue`；`plugins/platform/src/pages/develop/social/table.ts` |
| `platform-tenants` | `plugins/platform/src/pages/iam/tenants/components/CreateWizard.vue`；`plugins/platform/src/pages/iam/tenants/components/DetailDrawer.vue` |
| `common-account-access` | `plugins/auth/src/pages/login/password/PasswordView.vue`；`packages/admin-core/src/layouts/widgets/user-dropdown/InUserDropdown.vue` |
| `common-navigation` | `plugins/help/src/pages/article/components/BizHelpMarkdown.vue`；`plugins/help/src/runtime.ts` |
| `common-password` | `packages/admin-core/src/layouts/widgets/user-dropdown/FixPwdDialog.vue`；`packages/admin-core/src/layouts/widgets/header/passwordChangeHeader.ts` |
| `common-personal-settings` | `packages/admin-core/src/layouts/widgets/InGlobalSetting.vue`；`packages/admin-core/src/layouts/widgets/user-dropdown/ProfileDialog.vue` |

## 后端已发布基线依据

- 成员手机号匹配、重新加入清理、成员工作簿列及保留期：[tenant-members/SPEC.md](../../../../../ingot/specs/current/iam/tenant-members/SPEC.md)。
- 部门人数、负责人、部门工作簿路径和逐行规则：[tenant-departments/SPEC.md](../../../../../ingot/specs/current/iam/tenant-departments/SPEC.md)。

## 配图维护

配图随本端前端静态发布。SVG为可编辑源，PNG为原图，`-thumb.png`为缩略图。新增/纠正图原图1280×720、缩略图960×540，字形与边界已作可视检查；保留的2张关系图为1280×360。SVG用标准文本和图形元素，可在常用矢量工具中编辑后重新导出PNG，不新增构建任务或运行时依赖。

全部新图在图内及图注标明“非页面截图”，正文也保留完整操作说明。两端专属图片分别放宿主`src/help/assets`，不经common或public共享。

## 未解决事项

- 2026-11-06 用户确认图文和阅读体验验收通过。真实业务账号实操与业务截图按安排后补，仍单独登记。
- 平台静态资源的服务端访问控制已列入后续设计与验收。见 [剩余任务](./TASKS.md#剩余工作2026-11-06)。
