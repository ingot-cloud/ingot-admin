# 任务：管理台 UI 基础设施

> `[P]` 表示可与其他 `[P]` 任务并行执行。

## 准备

- [x] 用户确认将规格收敛到成员页内容工作区；change 延续既有 `implementing` 状态，本次只修订规格，不修改业务代码。
- [x] 阅读本 change 的 [API.md](./API.md)、[REQUIREMENTS.md](./REQUIREMENTS.md) 与 [DESIGN.md](./DESIGN.md)。
- [x] 阅读 [CONSTITUTION.md](../../../CONSTITUTION.md) 与 [ingot-coding-standards](../../../../.agents/skills/ingot-coding-standards/SKILL.md)。
- [x] 关闭或解决 DESIGN.md 中会影响实现路线的开放问题。
- [x] 建立现有公开组件属性、插槽、事件和视觉状态清单。

## 实现

- [x] 阶段 1：完成 [设计 Token 与主题映射](./phases/phase-01-design-tokens/TASKS.md)。
- [x] 阶段 2：完成 [框架与导航](./phases/phase-02-shell-navigation/TASKS.md)。
- [x] 阶段 3：完成 [共享组件](./phases/phase-03-shared-components/TASKS.md)。
- [x] 阶段 4：完成 [验证与文档](./phases/phase-04-validation/TASKS.md)。
- [x] 阶段 5：完成 [第二轮视觉复核补强](./phases/phase-05-visual-corrections/TASKS.md)。
- [x] 阶段 6：完成 [成员工作区与表格工具补强](./phases/phase-06-member-workspace/TASKS.md)。
- [x] 阶段 7：完成 [全局左侧导航补强](./phases/phase-07-sidebar-navigation/TASKS.md)。

## 验证

- [ ] 满足修订后 REQUIREMENTS.md 的全部验收标准。
- [x] 确认本 change 无后端接口、权限码、路由或 canonical viewPath 变化。
- [x] `pnpm build:packages` 通过。
- [x] `pnpm --filter @ingot/admin-core type-check` 通过。
- [x] `pnpm --filter @ingot/admin-core test:unit` 通过。
- [x] `pnpm --filter @ingot/admin-app build` 通过。
- [x] `pnpm check:boundaries` 与 `pnpm lint:check` 通过。
- [ ] 在 1440×900、1280×800、1024×768 和小于 1024px 窄窗口完成视觉与键盘检查。
- [ ] 使用至少 200 行数据验证页面头、筛选工具栏、表头和分页固定，只有数据区滚动。
- [ ] 验证 `InFilterContainer` 左栏 260/0px 手动收缩、容器窄宽度自动收起以及宽度恢复后的用户状态。
- [ ] 验证 `InTable` 无内置刷新、tools 按需组合、字段设置按钮和批量 action 组的原子收纳/恢复。
- [ ] 验证成员式 48px 表头、44px 数据行、固定操作列、数据区滚动和右下分页。
- [ ] 验证侧栏 236/52px、主内容偏移 244/60px、菜单层级、收缩态内容裁剪和 300ms 同步动效。
- [ ] 使用短视口滚动长菜单，验证“收起导航”控制高 44px、距底部 8px，且不随菜单滚动。
- [ ] 验证桌面导航偏好与窄屏 overlay 状态隔离，桌面无重复折叠入口。

## 收尾

- [ ] 新建并更新 `specs/current/packages/admin-ui-foundation/spec.md`，只记录已上线行为。
- [ ] 在 capability README 记录本 change ID，并链到归档后的 `API.md`。
- [ ] 确认 Phase 07 通过用户视觉验收，关联 rollout change 可依赖的组件契约已经稳定。
- [ ] README 状态改为 `completed`，将变更目录移至 `specs/changes/archive/2026/20260904-packages-admin-ui-foundation/`。
