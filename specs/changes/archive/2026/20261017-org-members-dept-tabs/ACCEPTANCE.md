# Acceptance

| ID | 条件 | 证据 |
|----|------|------|
| A1 | 页面为成员/部门两个子页面 | `members/IndexPage.test.ts` + `departments/IndexPage.test.ts` |
| A2 | 无部门读权限不出现部门菜单 | 菜单绑定 `iam-tenant:department:read`；成员页不再挂部门表 |
| A3 | 成员交互对齐 contacts/user | `MemberTab.test.ts` 已通过 |
| A4 | 部门交互对齐 contacts/dept | `DeptTab.test.ts` 已通过 |
| A5 | `memberCount` 缺失显示 `-` | `deptTable.test.ts` 已通过 |
| A6 | 导出三步与 purpose 不变 | `IndexPage.test.ts` 已通过 |
| A7 | 无 `size: 200` | `IndexPage.test.ts` 已通过 |
| A8 | 浏览器两个子页面与只读角色 | 2026-10-17 用户要求归档结项；未另做管理台浏览器核对 |
| A9 | 成员列表接受 `departmentId`/`status` | 后端 `TenantMemberFilter` 公开字段；`MemberQueryRepositoryTest` 覆盖直属部门与资格筛选 |
| A10 | 根部门 logo/首字，子部门组织图标 | `deptTree.test.ts` + `MemberTab.test.ts` |
| A11 | 成员表默认显隐列 | `memberTable.test.ts` |
| A12 | 成员页视觉对齐飞书（无新建部门） | `DeptTreePanel` / `MemberTab` 源码与单测 |
| A13 | 部门表默认列对齐飞书 | `deptTable.test.ts` |
| A14 | 部门表主部门顶格无详情、子部门缩进、行高 56 | `deptTree.test.ts` / `DeptTab.test.ts` |
| A15 | 成员/部门多选与飞书顺序批量工具栏 | `memberTable.test.ts` / `deptTable.test.ts` / Tab 源码 |

## 最终验收与归档决议（2026-10-17）

用户要求归档本 change 及对应后端 `20261017-iam-department-member-count` 并提交。据此关闭本增量，更新 `current/org/members-departments`。上文自动化证据保留；本次未重新运行测试或打开管理台浏览器核对。
