# 任务：收掉租户通讯录

> `[P]` 表示可与其他 `[P]` 任务并行执行。

## 准备

- [x] 确认本 change README 状态为 `approved`（开工后改为 `implementing`）
- [x] 阅读本 change 的 [API.md](./API.md) 与 [REQUIREMENTS.md](./REQUIREMENTS.md)
- [x] 阅读 [CONSTITUTION.md](../../../CONSTITUTION.md) 与 [in-coding-standards](../../../../.agents/skills/in-coding-standards/SKILL.md)
- [x] 确认 DESIGN.md 的页面路径与对接映射

## 实现

- [x] 删除通讯录页面与浏览接口封装
- [x] 成员访问策略只保留后台管理字段权限
- [x] 删除对应枚举、动作常量和测试夹具

## 验证

- [ ] 满足 REQUIREMENTS.md 验收标准
- [ ] 对接行为与 API.md 一致
- [ ] 本地构建通过（`pnpm build:packages` + 相关 app build）
- [ ] 手动测试关键场景

## 收尾

- [ ] 更新 `current/<domain>/<capability>/spec.md`（页面行为，不要合并整份 API.md）
- [ ] 在 capability README 记录变更 ID，并链到归档后的 `API.md`
- [ ] README 状态改为 `completed`，将变更目录移至 `changes/archive/<year>/<change-id>/`
