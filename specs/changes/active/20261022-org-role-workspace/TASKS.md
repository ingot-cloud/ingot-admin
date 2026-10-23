# Tasks

## 实施任务

- [x] T1：写入 change spec
- [x] T2：角色成员、用户组和来源 API
- [x] T3：左角色右主体工作区，去掉版本和编码展示
- [x] T4：创建向导、详情抽屉、权限与范围步骤
- [x] T6：字段步骤接入创建和编辑，提交当前字段快照
- [x] T7：「授权记录」改名「角色分配」，按钮「分配角色」，诊断降为次要入口
- [x] T8：`tenantAssignment.ts` 模型与单测，平台租户共用有效期校验
- [x] T9：`BizIamTenantAssignmentDrawer` 四步向导与 `BizIamTenantAssignmentScopeStep`
- [x] T10：`BizIamDiagnoseDrawer` 改为候选选择器，平台诊断抽屉并入；接入租户诊断候选 API
- [x] T11：角色工作区成员、用户组名称打开只读详情，来源数单独成列
- [x] T12：成员点来源数打开来源；权限诊断只留在角色分配
- [x] T13：成员列改为名称、部门、来源数；用户组列只留名称

## 验证任务

- [x] V1：`grants.test.ts` 通过
- [ ] V2：浏览器走通角色选择、来源、创建和权限编辑
- [x] V3：admin-common 与 org、platform 插件测试、eslint、vue-tsc
- [ ] V4：浏览器走通多接收对象 × 多角色分配、修改、诊断

## 完成检查

- [ ] 实现与 DESIGN 一致
- [ ] REQUIREMENTS 验收标准全部满足
- [ ] Current 待验收后更新
