# 任务：Admin App / Plugin / Package 三层架构

> `[P]` 表示可与其他 `[P]` 任务并行执行。具体任务见 `phases/`。

## 准备

- [ ] 确认前置 change `20260902-packages-admin-feature-app-split` 已 completed 并归档
- [ ] 用户确认本 change，README 状态改为 `approved`
- [ ] 开工时将 README 状态改为 `implementing`
- [ ] 阅读本 change 的 [REQUIREMENTS.md](./REQUIREMENTS.md) 与 [DESIGN.md](./DESIGN.md)
- [ ] 阅读 [CONSTITUTION.md](../../../CONSTITUTION.md) 与 [ingot-coding-standards](../../../../.agents/skills/ingot-coding-standards/SKILL.md)
- [ ] 记录前置 change 最终 App/package/plugin 清单和构建基线

## 实现里程碑

- [ ] Phase 01：完成 plugins 层、官方源码插件和 Vite/TS 基础设施迁移
- [ ] Phase 02：完成默认 admin 收敛、target 移除和 create-app 更新
- [ ] Phase 03：完成示例与完整开发文档体系
- [ ] Phase 04：完成边界、组合、CI、规范和归档验证

## 验证

- [ ] 满足 REQUIREMENTS.md 中 REQ-A001 至 REQ-A008
- [ ] packages build、plugins type-check/test、apps type-check 和 lint 通过
- [ ] 默认 admin 全插件 dev/build 通过
- [ ] 单插件、部分插件和全插件临时组合验证通过
- [ ] create-app 生成结果、示例和文档检查通过
- [ ] 现有菜单和业务页面核心行为无回归

## 收尾

- [ ] 状态改为 `validating` 并完成用户验收
- [ ] 更新 `specs/current/packages/app-plugins-shared-scaffold/`
- [ ] 更新 AGENTS、coding standards 和 CONSTITUTION 的三层架构规则
- [ ] README 状态改为 `completed`
- [ ] 将 change 移至 `specs/changes/archive/2026/20260902-packages-admin-plugin-layering/`
