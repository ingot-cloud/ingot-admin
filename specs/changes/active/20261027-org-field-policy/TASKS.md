# 任务：字段策略按资源接入

> `[P]` 表示可与其他 `[P]` 任务并行执行。

## 准备

- [x] 确认本 change README 状态为 `approved`（开工后改为 `implementing`）
- [x] 阅读本 change 的 [API.md](./API.md) 与 [REQUIREMENTS.md](./REQUIREMENTS.md)
- [x] 阅读 [CONSTITUTION.md](../../../CONSTITUTION.md) 与 [in-coding-standards](../../../../.agents/skills/in-coding-standards/SKILL.md)
- [x] 确认 DESIGN.md 的页面路径与对接映射

## 实现

- [x] 任务 1：策略类型、接口和枚举去掉场景，改为按资源读写
- [x] 任务 2：字段策略页改为 `field-policies`，候选项来自已接入资源
- [x] 任务 4：字段策略改为左侧资源、右侧规则表和添加对话框；部门改用部门树对话框
- [x] 任务 5：规则确认后直接保存；目标范围改为单选，管理部门和指定成员使用选择对话框
- [x] [P] 任务 3：平台资源编辑提交并回显接入开关

## 验证

- [x] 满足 REQUIREMENTS.md 验收标准
- [x] 对接行为与 API.md 一致
- [x] 相关包的类型检查和页面测试通过
- [ ] 手动核对字段候选项来自成员资源

## 收尾

- [ ] 更新 `current/<domain>/<capability>/spec.md`（页面行为，不要合并整份 API.md）
- [ ] 在 capability README 记录变更 ID，并链到归档后的 `API.md`
- [ ] README 状态改为 `completed`，将变更目录移至 `changes/archive/<year>/<change-id>/`
