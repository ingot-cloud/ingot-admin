# 角色版本信息与批量应用

管理台统一展示角色可读版本、备注、历史版本编辑和元数据修改；平台自定义角色提供受控批量应用向导和持久任务进度。

2026-10-11，负责人 jy 确认人工测试完成。公共模型和交互放在 admin-common，platform 和 org 插件接入各域 API；系统角色只读，租户首轮不开放批量版本应用。

- [当前页面行为](./spec.md)
- [接口副本](../../../changes/archive/2026/20261010-base-role-version-application/API.md)
- [变更与验收记录](../../../changes/archive/2026/20261010-base-role-version-application/README.md)
- 公共实现：`packages/admin-common/src/models/iam/roleVersions.ts`、`BizIamRoleDetailDrawer.vue`、`BizIamRoleApplicationDrawer.vue`、`BizIamRoleVersionMetadataDialog.vue`。
- 后端规则基线：`ingot/specs/current/iam/role-version-application/`。
