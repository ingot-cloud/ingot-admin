# 任务：成员与部门两个子页面

> `[P]` 表示可与其他 `[P]` 任务并行执行。

## 准备

- [x] 确认本 change README 状态为 `approved`（开工后改为 `implementing`）
- [x] 阅读本 change 的 [API.md](./API.md) 与 [REQUIREMENTS.md](./REQUIREMENTS.md)
- [x] 阅读 [CONSTITUTION.md](../../../CONSTITUTION.md) 与 [in-coding-standards](../../../../.agents/skills/in-coding-standards/SKILL.md)
- [x] 确认 DESIGN.md 的页面路径与对接映射

## 实现

- [x] [P] admin-common：`memberCount` 与 `buildDepartmentTree` 透传
- [x] IndexPage 改为 `in-biz-tabs`，按 `TENANT_DEPARTMENT_READ` 控制部门 Tab（已由独立部门路由替代）
- [x] 成员/部门拆成 `org.iam.members.root` 目录下的 `org.iam.members` 与 `org.iam.departments`，补齐种子与 023 迁移
- [x] MemberTab + DeptTreePanel 对齐 contacts/user
- [x] DeptTab 树形表 + 创建/详情抽屉对齐 contacts/dept
- [x] 拆分 table / useOps，更新单测与 IAM-INTEGRATION 路径
- [x] 租户成员列表接受并执行 `departmentId` / `status` 公开筛选
- [x] 部门页独立路由，旧 `?tab=departments` 重定向到部门页
- [x] 成员左树：根部门组织 logo / 24×24 首字头像，子部门 OrganizationOutlined
- [x] 成员表默认列对齐飞书：姓名、账号状态、手机号、部门、登录手机号；邮箱、入职时间、更新时间默认隐藏
- [x] 成员左树：主部门与直属子部门平级、选中态与圆角矩形 logo
- [x] `GET /v1/tenant/departments` 改树响应；成员左树与部门页直接消费，不再分页拼树
- [x] 成员页视觉对齐飞书：左树行高/根节点无展开槽/子图标 14px 同色，右表 30px 头像与姓名字重；不补新建部门等功能
- [x] 部门表默认列对齐飞书：名称/人数/操作，排序默认隐藏；不补批量与负责人/部门群
- [x] 部门表对齐飞书：主部门顶格无详情，子部门缩进，行高 56px
- [x] 成员/部门表多选与批量工具栏：成员离职/调部门/导入导出随宽度收纳，添加成员固定；部门删除/导入导出/新建全部固定

## 验证

- [x] 满足 REQUIREMENTS.md 验收标准（源码与单测）
- [x] 对接行为与 API.md 一致
- [x] 本地构建通过（org 成员/部门单测 25 项通过；种子 `--check` 通过）
- [x] 浏览器核对两个子页面与只读角色按钮（2026-10-17 用户要求归档；未另做管理台浏览器核对）

## 收尾

- [x] 已更新 `current/org/members-departments`
- [x] README 完成记录已填写并归档
