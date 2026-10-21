# Tasks

## 实施任务

- [x] T1：写入 change spec
- [x] T2：主题变量（含 `IN_THEME_TOKEN_NAMES` 与默认明暗 Token）
- [x] T3：`InSelectionTag`
- [x] T4：`InSelectionField`、`selectionOverflow`、注册导出
- [x] T5：迁移成员 / 部门 / 授权接收人
- [x] T6：迁移选项、chip 选择、委派候选、委派角色、授权角色、平台成员角色、开通自选应用

## 验证任务

- [x] V1：admin-core 单测与 dev-portal 演示
- [x] V2：回归测试与类型检查（packages / plugins / apps type-check 通过；admin-common、org、platform 测试全绿；admin-core 仅既有 `visual-contract` 顶栏用例失败，与本变更无关）
- [ ] V3：明暗主题目测——演示页已在明暗主题下目测；业务页面（用户组向导、成员部门、部门负责人、授权接收人、平台成员角色）待登录会话下补走

## 完成检查

- [x] 实现与 DESIGN 一致
- [ ] REQUIREMENTS 验收标准全部满足
- [ ] Current 待验收后更新
