# 任务：<feature>

<!-- 变更的功能名称 -->

> `[P]` 表示可与其他 `[P]` 任务并行执行。

## 准备

- [ ] 确认本 change README 状态为 `approved`（开工后改为 `implementing`）
- [ ] 阅读本 change 的 [API.md](./API.md) 与 [REQUIREMENTS.md](./REQUIREMENTS.md)
- [ ] 阅读 [CONSTITUTION.md](../../../CONSTITUTION.md) 与 [ingot-coding-standards](../../../../.agents/skills/ingot-coding-standards/SKILL.md)
- [ ] 确认 DESIGN.md 的页面路径与对接映射

## 实现

<!-- 按依赖顺序列出任务；复杂变更可拆到 phases/ -->

- [ ] 任务 1：...
- [ ] [P] 任务 2：...
- [ ] 任务 3：...

## 验证

- [ ] 满足 REQUIREMENTS.md 验收标准
- [ ] 对接行为与 API.md 一致
- [ ] 本地构建通过（`pnpm build:packages` + 相关 app build）
- [ ] 手动测试关键场景

## 收尾

- [ ] 更新 `current/<domain>/<capability>/spec.md`（页面行为，不要合并整份 API.md）
- [ ] 在 capability README 记录变更 ID，并链到归档后的 `API.md`
- [ ] README 状态改为 `completed`，将变更目录移至 `changes/archive/<year>/<change-id>/`
