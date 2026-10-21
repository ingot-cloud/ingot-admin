# 设计：组织用户组左右栏

## 技术方案

组织用户组页改为平台人员组 Tab 同款 `in-split-layout`。组件只放 `plugins/org`，不引用 platform。创建和编辑使用 `BizIamGroupWizard` 全屏分步（基本信息、成员与部门来源、检查并保存）；详情仍是只读抽屉，抽屉里的编辑进入同一向导。详情只展示名称、说明、来源：部门 ID 用部门树换成名称，直接成员显示「直接添加」；删除是危险色文字按钮加图标。租户向导打开 `allow-departments` 与组织选人。

工作区加人/移出：先取组详情完整 `selection`，在原 `members` 上应用选人差量，原样带回 `departments`，直接 PUT，不 preview。向导里编辑名称、成员或部门范围仍须预览通过后才能完成。

## 对接映射

| 接口（见 API.md） | 前端 | 说明 |
|-------------------|------|------|
| GET `/v1/tenant/groups/{id}/effective-members` | `directory.ts` `TenantGroupEffectiveMembersAPI`；`GroupWorkspace` | 右侧表 |
| GET `/v1/tenant/groups/{id}/members` | 已有 `TenantGroupBoundMembersLoad` | 选人已选栏 |
| GET/POST/PUT/DELETE/preview `/v1/tenant/groups*` | 已有 TenantGroup*API | 左栏与抽屉 |

## 数据模型

`packages/admin-common` 增加 `GroupMembership`、`GroupMembershipDepartment`、`GroupEffectiveMemberRecord`。

## 组件与页面影响

- [`plugins/org/src/pages/iam/groups/IndexPage.vue`](../../../../plugins/org/src/pages/iam/groups/IndexPage.vue)
- `useOps.ts`：组分页 + 有效成员分页 + 选中联动
- `table.ts`：右侧表头
- `components/GroupWorkspace.vue`、`GroupList.vue`、`GroupDetailDrawer.vue`、`GroupWizard.vue`
- `membership.ts`：来源文案与可否移出

## 与 CONSTITUTION 符合性

| 原则 | 符合 | 说明 |
|------|------|------|
| 插件不互依 | ✅ | 不引用 platform |
| 页面四件套 | ✅ | IndexPage + table + useOps + components |
| API 命名 | ✅ | `TenantGroupEffectiveMembersAPI` |
| 关联列表不 ids 回查 | ✅ | 有效成员与直接成员各走独立接口 |
| 类型安全 | ✅ | 无 any |
| 实施不改 current | ✅ | 验收后再归档 |

## 备选方案

复用 platform `GroupWorkspace`：官方插件不得互依，否决。
