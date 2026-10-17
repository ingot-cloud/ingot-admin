# 设计：成员与部门两个子页面

## 技术方案

组织管理下「成员与部门」是 DIRECTORY，下面再挂「成员」「部门」两个 PAGE。`pages/iam/members/IndexPage.vue` 只编排成员页；`pages/iam/departments/IndexPage.vue` 只编排部门页。各自四件套逻辑仍放 `MemberTab` / `DeptTab` + `useMemberOps` / `useDeptOps` + `memberTable` / `deptTable`。旧 `?tab=departments` 深链重定向到部门路由。成员页默认 `active`，进入即拉 context / 成员列表。

左树与部门页直接消费 `GET /v1/tenant/departments` 返回的树：主部门与直属一级部门已在接口中平级。根部门用 `TenantSettingsAPI` 的组织 `avatar`，缺失时 24px 首字、圆角 2px，且不占展开箭头槽；子部门固定 14px `OrganizationOutlined`，未选中与正文同色。树行高 40px。左栏白底铺满；左右间距只留在 `in-split-layout__left-scroll`，`dept-filter` 不再加一层 padding，搜索框与部门树左右对齐；行内左右 8px，展开箭头前 8px，箭头与图标再隔 8px；根 logo 到名称 12px，子图标到名称 8px。选中行背景 `rgb(240, 244, 255)`，文字与图标用主题色。成员左树不放「新建部门」。组织设置不可读时只回退首字，不阻断左树。选择器仍走 `TenantDepartmentPageAPI` 适配层，把树拍平为一页，不再向接口传 `page`/`pageSize`。

成员表 `hide: true` 控制默认显隐：姓名锁定，账号状态/手机号/部门/登录手机号默认开，邮箱/入职时间/更新时间默认关。姓名列 30px 圆形头像 + 字重 500 的正文色姓名。部门名来自 `record.departments`（主部门优先）。登录手机号、入职/更新时间当前租户列表尚未投影，列预留，空值显示 `-`。不补邀请成员、展示全部成员等飞书功能，只对齐视觉。

部门表把接口拍平的一级部门挂回主部门，按飞书缩进展示并默认展开主部门。主部门顶格、无展开槽、无详情/删除、勾选 `off`；子部门缩进后带展开箭头与多选。行高 56px。默认显示部门名称、部门人数、操作；排序默认隐藏。不补负责人、部门群和批量编辑。子部门名称用正文色，可点进详情。

成员表用 `type: selection` 多选。第一列（姓名 / 部门名称）表头走 `InTable` 的 `#*-header` 插槽，选中后显示「列名 · 已选 N 条」，与角色分配页一致。工具栏走 `InTableActions`：批量操作离职 / 批量变更部门 / 批量导入导出 `overflow: auto` 且 `overflowGroup: batch`，添加成员 `overflow: never`。部门工具栏三项全部 `overflow: never`，顺序为批量删除 → 批量导入/导出 → 新建部门。未选中时批量按钮禁用并提示「请先选择…」。成员导出走既有三步抽屉；批量离职逐条 `TenantMemberRemoveAPI`；批量变更部门用抽屉覆盖任职后逐条 `TenantMemberDepartmentsAPI`；部门批量删除逐条 `TenantDepartmentDeleteAPI`。导入与部门导出暂无独立接口，入口先挂上。

## 对接映射

| 接口（见 API.md） | 前端 | 说明 |
|-------------------|------|------|
| `GET /v1/tenant/members` | `TenantMemberPageAPI`；`useMemberOps` | 支持 `departmentId` / `status` / 字段筛选 |
| `GET /v1/tenant/departments` | `TenantDepartmentTreeAPI`；左树与部门页 | purpose=`MANAGED_DEPARTMENT`；树；读 `memberCount` |
| 成员写/导出 | 既有 `directory.ts` | 抽屉与行操作 |
| 部门 CRUD | `DeptCreateDrawer` / `DeptDetailDrawer` | 替换 `DepartmentEditDrawer` |

## 数据模型

`DepartmentRecord.memberCount?: number`。`DepartmentTreeNode` 透传记录字段，供树形表使用。部门表行是带 `children` 的 `ResourceDetail<DepartmentRecord>`。

## 组件与页面影响

```text
pages/iam/members/
  IndexPage.vue
  memberTable.ts / useMemberOps.ts
  deptTree.ts
  components/MemberTab.vue
  components/DeptTreePanel.vue
pages/iam/departments/
  IndexPage.vue
  （复用 members 下 deptTable / useDeptOps / DeptTab / 抽屉）
```

删除 `DepartmentEditDrawer.vue`、`table.ts`、`useOps.ts`。

菜单种子（勿手改 `006_bootstrap.sql` / `ingot_iam.sql`）：

| 名称 | route_name | path | view_path | 绑定 ACTION |
|------|------------|------|-----------|-------------|
| 成员与部门 | `org.iam.members.root` | `/org/iam/members/root` | `layout.simple` | `iam-tenant:member:read`、`iam-tenant:department:read` |
| 成员 | `org.iam.members` | `/org/iam/members` | `org.iam.members` | `iam-tenant:member:read` |
| 部门 | `org.iam.departments` | `/org/iam/departments` | `org.iam.departments` | `iam-tenant:department:read` |

目录挂在 `org.iam.organization` 下，子页挂在目录下；组织管理排序为成员与部门、用户组、组织设置。新库由 `python3 tools/iam/generate_database.py` 写入种子；已有库执行 `023_tenant_members_departments_menus.sql`。

部门页变更只刷新本页树。成员左树在进入成员页时重新加载。

## 与 CONSTITUTION 符合性

| 原则 | 符合 | 说明 |
|------|------|------|
| Monorepo 边界 | ✅ | 模型在 admin-common，页面在 org 插件 |
| 页面四件套 | ✅ | 成员/部门各有 IndexPage，table / useOps / components 复用 |
| API 层 | ✅ | 不改函数命名，复用 directory.ts |
| 类型安全 | ✅ | 无 any |
| 施工门禁 | ✅ | 本 change implementing |
| 树取数 | ✅ | 消费 `GET /v1/tenant/departments` 树响应 |

## 备选方案

保留同一路由双 Tab：与飞书侧栏「成员 / 部门」不一致，且无法按 ACTION 分别隐藏菜单。
