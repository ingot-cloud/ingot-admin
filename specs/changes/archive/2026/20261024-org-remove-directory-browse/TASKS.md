# 任务：收掉租户通讯录

> `[P]` 表示可与其他 `[P]` 任务并行执行。

## 准备

- [x] 确认本 change README 状态为 `approved`（开工后改为 `implementing`）
- [x] 阅读本 change 的 [API.md](./API.md) 与 [REQUIREMENTS.md](./REQUIREMENTS.md)
- [x] 阅读 [CONSTITUTION.md](../../../../CONSTITUTION.md) 与 [in-coding-standards](../../../../../.agents/skills/in-coding-standards/SKILL.md)
- [x] 确认 DESIGN.md 的页面路径与对接映射

## 实现

- [x] 删除通讯录页面与浏览接口封装
- [x] 成员访问策略只保留后台管理字段权限
- [x] 删除对应枚举、动作常量和测试夹具

## 验证

- [x] 满足 REQUIREMENTS.md 验收标准
- [x] 按现行接口验收下线行为，字段策略的场景契约由后续按资源方案接管
- [x] 构建与手测按本次用户确认的产品范围结项

## 收尾

- [x] 更新 `current/org/field-policy/spec.md` 和 `current/base/platform-capabilities/spec.md`（页面行为，不要合并整份 API.md）
- [x] 在 capability README 记录变更 ID，并链到归档后的 `API.md`
- [x] README 状态改为 `completed`，将变更目录移至 `changes/archive/<year>/<change-id>/`

## 归档验收

2026-11-06 用户确认本次产品范围验收通过。实现和自动化证据沿用各阶段记录，验收确认来源为本次人工确认。
