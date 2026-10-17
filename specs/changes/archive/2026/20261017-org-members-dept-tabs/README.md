# 成员与部门拆为两个子页面

> 状态：completed（已验收，已更新 current，已归档）

## 完成与归档（2026-10-17）

- 验收依据：用户明确要求“归档当前修改的这个内容对应的spec，并且提交”。
- 完成与归档日期：2026-10-17。此前 implementing、待浏览器核对描述为历史阶段记录，以本次确认结项。
- 关联实现提交：`60d262a`；关联后端 `be1cfad0`。验收、基线及归档由独立 docs 提交记录。
- 当前能力：[org/members-departments](../../../../current/org/members-departments/README.md)，有效规则见 [spec.md](../../../../current/org/members-departments/spec.md)。
- 另一仓库对应归档：`ingot/specs/changes/archive/2026/20261017-iam-department-member-count/`。
- 最终实现与设计差异：同页 Tab 方案改为独立路由；「成员与部门」目录 `view_path=layout.simple`。成员导出、字段可见性、capabilities 与部门 CRUD 仍由主 IAM 前端变更维护。

本归档只关闭成员/部门子页面增量。既有 IAM 总体变更保持 implementing，其余任务与验收状态不受本次确认影响。本次未重新执行真实管理台浏览器验收。

## 协作模式

一人全栈（前后端并行 change）

## 背景与动机

租户「组织管理 - 成员与部门」把部门维护按钮堆在左树、成员表挤在右侧，不符合管理后台页面约定。通讯录 `contacts/user` 与 `contacts/dept` 已是成员/部门分页面的交互样板。

## 目标

组织管理下「成员与部门」目录再拆「成员」「部门」两个子页面：成员对齐 contacts/user（左树 + 表），部门对齐 contacts/dept（树形表 + 创建/详情抽屉）。部门人数读后端 `memberCount`。菜单由 IAM 种子生成，已有库走 `023_tenant_members_departments_menus.sql`。

## 范围

### In Scope

- `plugins/org/src/pages/iam/members` 只承载成员页
- `plugins/org/src/pages/iam/departments` 独立部门页
- `admin-common` 的 `DepartmentRecord.memberCount` 与 `buildDepartmentTree` 透传
- 无部门读权限时侧栏不出现部门菜单
- 单测与 IAM-INTEGRATION I091–I095 路径
- IAM 菜单种子：目录 `org.iam.members.root` 下挂 `org.iam.members` / `org.iam.departments`

### Out of Scope

- 用户组、设置、角色与授权等其他租户页
- 部门主管、部门状态、独立导入接口（入口先挂上）
- 提前改 `specs/current/`

## 输入来源

- 接口文档：本目录 [API.md](./API.md)（复制后端 change）
- 后端来源：`ingot/specs/changes/archive/2026/20261017-iam-department-member-count`
- 交互参考：`plugins/org/src/pages/contacts/user`、`contacts/dept`、`plugins/platform/src/pages/iam/personnel`

## 工件

- [接口](./API.md)
- [需求](./REQUIREMENTS.md)
- [设计](./DESIGN.md)
- [任务](./TASKS.md)
- [验收](./ACCEPTANCE.md)

## 风险与依赖

依赖后端列表返回 `memberCount`。后端未就绪时人数列显示 `-`。

## 相关链接

- 主 IAM 前端变更 UI03：[20260913-base-iam-admin](../../../active/20260913-base-iam-admin/README.md)
- 后端：`ingot/specs/changes/archive/2026/20261017-iam-department-member-count/`

## 完成记录

- 完成日期：2026-10-17
- 关联提交或 PR：实现 `60d262a`；无 PR
- 更新的 current capability：`specs/current/org/members-departments`
- 与原设计的差异：同页 Tab 改为独立路由；目录使用 `layout.simple`
- 取消原因：
