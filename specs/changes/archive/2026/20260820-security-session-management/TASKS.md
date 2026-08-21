# 任务：在线会话与并发策略

> `[P]` 表示可与其他 `[P]` 任务并行执行。

## 准备

- [x] 确认本 change README 状态为 `approved`（开工后改为 `implementing`）
- [x] 阅读本 change 的 [API.md](./API.md) 与 [REQUIREMENTS.md](./REQUIREMENTS.md)
- [x] 阅读 [CONSTITUTION.md](../../../CONSTITUTION.md) 与 [ingot-coding-standards](../../../../.agents/skills/ingot-coding-standards/SKILL.md)
- [x] 确认 DESIGN.md 的页面路径与对接映射

## 实现

- [x] 新建 session / concurrencyPolicy API 与 models、枚举；删除旧 token 模块
- [x] [P] `ClientSelect` 支持 `valueField`；无客户端查询权限时手填
- [x] 改造在线会话 Tab：平铺表格、筛选校验、按 sid/用户下线、详情抽屉
- [x] 同页增加并发策略 Tab：无分页列表 + 全量编辑表单 + GLOBAL 不可删

## 验证

- [x] 满足 REQUIREMENTS.md 验收标准
- [x] 对接行为与 API.md 一致
- [x] 本地构建通过（`pnpm build:packages` + 相关 app build）
- [x] 手动测试关键场景

## 收尾

- [x] 更新 `current/<domain>/<capability>/spec.md`（页面行为，不要合并整份 API.md）
- [x] 在 capability README 记录变更 ID，并链到归档后的 `API.md`
- [x] README 状态改为 `completed`，将变更目录移至 `changes/archive/<year>/<change-id>/`
