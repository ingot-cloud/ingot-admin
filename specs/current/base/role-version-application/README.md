# 角色版本信息与批量应用

管理台为平台自有角色展示可读版本、备注、历史版本编辑和元数据修改，平台自定义角色提供受控批量应用。共享与租户私有角色采用 [当前权限模型](../../org/tenant-live-authorization/spec.md)。

2026-10-11，负责人 jy 确认人工测试完成。公共模型和交互放在 admin-common，平台插件接入固定版本 API，系统角色保持只读。

- [当前页面行为](./spec.md)
- [接口副本](../../../changes/archive/2026/20261010-base-role-version-application/API.md)
- [变更与验收记录](../../../changes/archive/2026/20261010-base-role-version-application/README.md)
- 公共实现：`packages/admin-common/src/models/iam/roleVersions.ts`、`BizIamRoleDetailDrawer.vue`、`BizIamRoleApplicationDrawer.vue`、`BizIamRoleVersionMetadataDialog.vue`。
- 后端规则基线：`ingot/specs/current/iam/role-version-application/`。

2026-10-12，负责人 jy 确认平台与共享角色详情加载优化人工测试通过。权限摘要、历史及任务按各自使用时机读取，分布统计独立加载。

- [加载优化与验收记录](../../../changes/archive/2026/20261012-base-role-detail-loading/README.md)
- [本次接口副本](../../../changes/archive/2026/20261012-base-role-detail-loading/API.md)
- 实现：`plugins/platform/src/pages/iam/shared-roles/components/SharedRoleDetailDrawer.vue` 与 `useRoleDetailData.ts`。
