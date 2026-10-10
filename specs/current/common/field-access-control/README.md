# 公共字段访问控制

平台与组织管理台共用字段上下文、脱敏编辑和筛选工具；资源目录、角色字段权限及租户字段策略使用同一字段契约。

2026-10-10，负责人 jy 确认本次全栈字段访问控制人工验收完成。

- [当前页面与交互规则](./spec.md)
- [接口副本](../../../changes/archive/2026/20261010-common-field-access-control/API.md)
- [变更与验收记录](../../../changes/archive/2026/20261010-common-field-access-control/README.md)
- 公共实现：`packages/admin-common/src/models/iam/fieldControl.ts`、`useFieldContext.ts`、`BizIamMaskEditor.vue`
- 业务接入：platform、org、security 插件

接口真相与公共执行层基线位于后端 `ingot/specs/current/framework/field-access-control/`。标签组件样式由独立 `20261010-packages-unified-tags` change 管理。
