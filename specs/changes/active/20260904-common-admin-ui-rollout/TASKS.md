# 任务：管理台业务页面 UI 迁移

> `[P]` 表示可与其他 `[P]` 任务并行执行。

## 准备

- [ ] 确认本 change README 状态为 `approved`（开工后改为 `implementing`）。
- [ ] 确认依赖 change `20260904-packages-admin-ui-foundation` Phase 06 已通过“成员工作区”专项视觉验收并冻结契约；否则不得进入 implementing。
- [ ] 阅读本 change 的 [API.md](./API.md)、[REQUIREMENTS.md](./REQUIREMENTS.md) 与 [DESIGN.md](./DESIGN.md)。
- [ ] 阅读 [CONSTITUTION.md](../../../CONSTITUTION.md) 与 [ingot-coding-standards](../../../../.agents/skills/ingot-coding-standards/SKILL.md)。
- [ ] 盘点并在页面迁移时清理仅服务于旧 `InTable` 内置刷新按钮的 `@refresh` 监听。
- [ ] 确认页面矩阵、试点顺序、表格密度和发布方式等开放问题。
- [ ] 为每个页面确认 `InPageFrame` page/contained 模式、滚动所有者、稳定 `tableId` 和操作层级映射。
- [ ] 为 25 个页面建立迁移前行为与权限回归清单。

## 实现

- [ ] 阶段 1：完成 [四类试点页面](./phases/phase-01-pilots/TASKS.md)，并取得用户视觉确认。
- [ ] 阶段 2：完成 [platform 与 org 页面迁移](./phases/phase-02-platform-org/TASKS.md)。
- [ ] 阶段 3：完成 [member 与 security 页面迁移](./phases/phase-03-member-security/TASKS.md)。
- [ ] 阶段 4：完成 [全量回归与收口](./phases/phase-04-regression/TASKS.md)。

## 验证

- [ ] 满足 REQUIREMENTS.md 的全部验收标准。
- [ ] 25 个页面入口、路由、canonical viewPath、权限和 API 行为不变。
- [ ] `pnpm type-check:plugins` 与 `pnpm test:plugins` 通过。
- [ ] `pnpm build:packages` 后 `pnpm --filter @ingot/admin-app build` 通过。
- [ ] `pnpm check:boundaries`、`pnpm lint:check` 和相关 current capability 回归通过。
- [ ] 关键页面在 1440×900、1280×800、1024×768 和窄窗口完成视觉检查。
- [ ] 代表性 List/Split List 使用至少 200 行数据完成固定区域、独立滚动、双栏折叠、`…` 菜单和字段偏好检查。

## 收尾

- [ ] 新建 `specs/current/common/admin-ui-experience/spec.md`，记录已上线的跨页面体验规则。
- [ ] 仅当既有页面行为发生明确变化时，更新对应 current capability；不得把接口副本合并进 current。
- [ ] 在 capability README 记录本 change ID，并链到归档后的 `API.md`。
- [ ] README 状态改为 `completed`，将变更目录移至 `specs/changes/archive/2026/20260904-common-admin-ui-rollout/`。
