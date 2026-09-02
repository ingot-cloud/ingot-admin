# 任务：Admin 业务能力拆分

> `[P]` 表示可与其他 `[P]` 任务并行执行。具体任务见 `phases/`。

## 准备

- [x] 用户确认本 change，README 状态改为 `approved`
- [x] 开工时将 README 状态改为 `implementing`
- [x] 阅读本 change 的 [REQUIREMENTS.md](./REQUIREMENTS.md) 与 [DESIGN.md](./DESIGN.md)
- [x] 阅读 [CONSTITUTION.md](../../../CONSTITUTION.md) 与 [ingot-coding-standards](../../../../.agents/skills/ingot-coding-standards/SKILL.md)
- [x] 建立现有 `@base` 引用、全局组件和 models 使用方清单，确认与 DESIGN 归属一致

## 实现里程碑

- [x] Phase 01：完成 admin-core、admin-common 和 Vite 官方 App 基础设施
- [x] Phase 02：完成 platform、security、org、member 四个纵向切片迁移
- [x] Phase 03：完成 admin 全量宿主、target-project、create-app 和根脚本迁移
- [ ] Phase 04：完成边界检查、组合矩阵、回归验证和文档收尾

## 验证

- [ ] 满足 REQUIREMENTS.md 中 REQ-A001 至 REQ-A008
- [x] `pnpm build:packages` 通过
- [x] 四个业务 App 独立 type-check、unit test 和 build 通过
- [x] admin 全量组合及 target 选择性组合构建通过
- [ ] workspace type-check、lint check 和 unit tests 通过
- [ ] 手动验证完整 admin、security-only、默认 org target 的关键菜单和页面

## 收尾

- [ ] 状态改为 `validating` 并完成用户验收
- [ ] 更新 `specs/current/packages/app-plugins-shared-scaffold/` 为新的官方插件组合行为
- [ ] 更新相关 security current capability 的 canonical viewPath 和兼容说明
- [ ] README 状态改为 `completed`
- [ ] 将 change 移至 `specs/changes/archive/2026/20260902-packages-admin-feature-app-split/`
